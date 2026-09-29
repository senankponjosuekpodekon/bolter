import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtVerifiedGuard } from '../auth/guards/jwt-verified.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// --- helpers ---------------------------------------------------------------

function makeSupabase(overrides: { rpc?: jest.Mock; from?: jest.Mock }) {
  const client = {
    rpc: overrides.rpc ?? jest.fn(),
    from: overrides.from ?? jest.fn(),
  };
  return {
    client,
    service: { getAdminClient: jest.fn().mockReturnValue(client) },
  };
}

function ctxWith(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as any;
}

// --- JwtVerifiedGuard (P1.2) ------------------------------------------------

describe('JwtVerifiedGuard — 2FA enforcement', () => {
  const makeGuard = (dbUser: any) =>
    new JwtVerifiedGuard({ findById: jest.fn().mockResolvedValue(dbUser) } as any);

  it('rejects unauthenticated requests', async () => {
    const guard = makeGuard({ id: 'u1', two_factor_enabled: false });
    await expect(guard.canActivate(ctxWith({ user: null }))).rejects.toThrow(UnauthorizedException);
  });

  it('allows users without 2FA', async () => {
    const guard = makeGuard({ id: 'u1', two_factor_enabled: false });
    await expect(
      guard.canActivate(ctxWith({ user: { id: 'u1' } })),
    ).resolves.toBe(true);
  });

  it('blocks a 2FA user whose token lacks tfa_verified', async () => {
    const guard = makeGuard({ id: 'u1', two_factor_enabled: true });
    await expect(
      guard.canActivate(ctxWith({ user: { id: 'u1', tfa_verified: false } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('allows a 2FA user whose token carries tfa_verified', async () => {
    const guard = makeGuard({ id: 'u1', two_factor_enabled: true });
    await expect(
      guard.canActivate(ctxWith({ user: { id: 'u1', tfa_verified: true } })),
    ).resolves.toBe(true);
  });
});

// --- JwtAuthGuard tenant consistency (P1.3) ---------------------------------

describe('JwtAuthGuard — tenant consistency', () => {
  const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as any);
  const call = (request: Record<string, unknown>, user: any) =>
    guard.handleRequest(null, user, null, ctxWith(request) as any);

  it('rejects an explicit X-Tenant-ID that differs from the user tenant', () => {
    const req = { tenant: { id: 'tenant-b' }, tenantSource: 'header' };
    expect(() => call(req, { id: 'u1', tenant_id: 'tenant-a', role: 'CLIENT' }))
      .toThrow(ForbiddenException);
  });

  it('accepts a matching explicit tenant', () => {
    const req = { tenant: { id: 'tenant-a' }, tenantSource: 'header' };
    expect(call(req, { id: 'u1', tenant_id: 'tenant-a', role: 'CLIENT' })).toBeTruthy();
  });

  it('never blocks on the default tenant fallback', () => {
    const req = { tenant: { id: 'tenant-default' }, tenantSource: 'default' };
    expect(call(req, { id: 'u1', tenant_id: 'tenant-b', role: 'CLIENT' })).toBeTruthy();
  });

  it('lets SUPER_ADMIN cross tenants', () => {
    const req = { tenant: { id: 'tenant-b' }, tenantSource: 'header' };
    expect(call(req, { id: 'u1', tenant_id: 'tenant-a', role: 'SUPER_ADMIN' })).toBeTruthy();
  });

  it('rejects a subdomain tenant mismatch', () => {
    const req = { tenant: { id: 'tenant-b' }, tenantSource: 'subdomain' };
    expect(() => call(req, { id: 'u1', tenant_id: 'tenant-a', role: 'CLIENT' }))
      .toThrow(ForbiddenException);
  });
});

// --- TransactionsService hardening (P1.1 / P1.5) -----------------------------

describe('TransactionsService — atomic RPC + idempotency', () => {
  const accountsService = { findById: jest.fn(), findByUserId: jest.fn() };
  const auditLogs = { log: jest.fn().mockResolvedValue(true) };
  const notifications = {
    notifyTransactionCreated: jest.fn().mockResolvedValue(undefined),
    notifyTransactionUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const makeService = (client: any) =>
    new TransactionsService(
      { getAdminClient: jest.fn().mockReturnValue(client) } as any,
      accountsService as any,
      auditLogs as any,
      notifications as any,
    );

  describe('throwRpcError', () => {
    const service = makeService({});

    it('maps INSUFFICIENT_FUNDS to 400', () => {
      expect(() => (service as any).throwRpcError({ message: 'INSUFFICIENT_FUNDS' }, 'x'))
        .toThrow(BadRequestException);
    });

    it('maps TRANSACTION_NOT_FOUND to 404', () => {
      expect(() => (service as any).throwRpcError({ message: 'TRANSACTION_NOT_FOUND' }, 'x'))
        .toThrow(NotFoundException);
    });

    it('maps TRANSACTION_ALREADY_PROCESSED to 400', () => {
      expect(() => (service as any).throwRpcError({ message: 'TRANSACTION_ALREADY_PROCESSED' }, 'x'))
        .toThrow(BadRequestException);
    });

    it('falls back to a generic 400 for unknown errors', () => {
      expect(() => (service as any).throwRpcError({ message: 'weird db error' }, 'fallback'))
        .toThrow(BadRequestException);
    });
  });

  describe('idempotent insert', () => {
    it('returns the original row when the key was already used', async () => {
      const existing = { id: 'tx-1', idempotency_key: 'u1:key-1' };
      const maybeSingle = jest.fn().mockResolvedValue({ data: existing, error: null });
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      const from = jest.fn().mockReturnValue({ select });
      const service = makeService({ from });

      const result = await (service as any).insertTransaction('u1', { amount: 10 }, 'key-1');

      expect(result.replayed).toBe(true);
      expect(result.data.id).toBe('tx-1');
      expect(eq).toHaveBeenCalledWith('idempotency_key', 'u1:key-1');
    });

    it('scopes the key to the user to prevent cross-user collisions', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const single = jest.fn().mockResolvedValue({ data: { id: 'tx-2' }, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select: insertSelect });
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      const from = jest.fn().mockReturnValue({ select, insert });
      const service = makeService({ from });

      await (service as any).insertTransaction('u42', { amount: 5 }, 'retry-9');

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ idempotency_key: 'u42:retry-9' }),
      );
    });

    it('recovers the winner row on a 23505 unique-violation race', async () => {
      const existing = { id: 'tx-won' };
      const maybeSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: null, error: null }) // pre-check: absent
        .mockResolvedValueOnce({ data: existing, error: null }); // post-race: present
      const single = jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } });
      const insertSelect = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select: insertSelect });
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      const from = jest.fn().mockReturnValue({ select, insert });
      const service = makeService({ from });

      const result = await (service as any).insertTransaction('u1', { amount: 10 }, 'k');

      expect(result.replayed).toBe(true);
      expect(result.data.id).toBe('tx-won');
    });
  });

  describe('validateTransaction', () => {
    it('delegates to post_transaction_decision RPC atomically', async () => {
      const rpc = jest.fn().mockResolvedValue({
        data: { id: 'tx-1', status: 'APPROVED', type: 'DEPOSIT', amount: 100 },
        error: null,
      });
      const service = makeService({ rpc });
      const dto = { approved: true } as any;

      const result = await service.validateTransaction('admin-1', 'tx-1', dto);

      expect(rpc).toHaveBeenCalledWith('post_transaction_decision', {
        p_transaction_id: 'tx-1',
        p_admin_id: 'admin-1',
        p_approve: true,
        p_rejection_reason: null,
      });
      expect(result.status).toBe('APPROVED');
    });

    it('maps a concurrent-approval loss to a friendly 400', async () => {
      const rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'TRANSACTION_ALREADY_PROCESSED' },
      });
      const service = makeService({ rpc });

      await expect(
        service.validateTransaction('admin-1', 'tx-1', { approved: true } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks a tenant-scoped admin on a foreign-tenant transaction', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({ data: { tenant_id: 'tenant-x' }, error: null });
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      const from = jest.fn().mockReturnValue({ select });
      const rpc = jest.fn();
      const service = makeService({ from, rpc });

      await expect(
        service.validateTransaction('admin-1', 'tx-1', { approved: true } as any, 'tenant-y'),
      ).rejects.toThrow(ForbiddenException);
      expect(rpc).not.toHaveBeenCalled();
    });
  });

  describe('findPending tenant scoping', () => {
    it('filters by tenant_id when the actor is scoped', async () => {
      const range = jest.fn().mockResolvedValue({ data: [], error: null });
      const order = jest.fn().mockReturnValue({ range });
      const eqTenant = jest.fn().mockReturnValue({ order });
      const eqStatus = jest.fn().mockReturnValue({ eq: eqTenant, order });
      const select = jest.fn().mockReturnValue({ eq: eqStatus });
      const from = jest.fn().mockReturnValue({ select });
      const service = makeService({ from });

      await service.findPending('tenant-a');

      expect(eqStatus).toHaveBeenCalledWith('status', 'PENDING');
      expect(eqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-a');
    });
  });
});
