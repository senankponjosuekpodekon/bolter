import { AuthController } from './auth.controller';
import { REFRESH_TOKEN_COOKIE, refreshCookieOptions } from './auth.constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;
}

function makeController(config: Record<string, unknown> = {}) {
  const authService = {
    register: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r1', user: {}, requires2FA: false }),
    login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r1', user: {}, requires2FA: false }),
    refreshToken: jest.fn().mockResolvedValue({ accessToken: 'a2' }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    verifyTwoFactor: jest.fn().mockResolvedValue({ valid: true, accessToken: 'a3', refreshToken: 'r3', user: {} }),
  };
  const configService = { get: jest.fn((k: string) => config[k]) };
  const controller = new AuthController(authService as any, configService as any);
  return { controller, authService };
}

describe('AuthController — refresh-token cookie', () => {
  it('sets the httpOnly refresh cookie on login', async () => {
    const { controller, authService } = makeController({ 'jwt.refreshExpiresIn': 604800 });
    const res = makeRes();

    await controller.login({} as any, { user: { id: 'u1' } } as any, res);

    expect(authService.login).toHaveBeenCalledWith({ id: 'u1' });
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'r1',
      expect.objectContaining({ httpOnly: true, path: '/api/auth', maxAge: 604800_000 }),
    );
  });

  it('sets the cookie on register', async () => {
    const { controller } = makeController({});
    const res = makeRes();

    await controller.register({ tenant: null } as any, {} as any, res);
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'r1', expect.objectContaining({ httpOnly: true }));
  });

  it('prefers the cookie token carried by the refresh strategy over the body', async () => {
    const { controller, authService } = makeController();
    await controller.refresh({ refreshToken: 'body-token' } as any, {
      user: { id: 'u1', refreshToken: 'cookie-token', tfa_verified: true },
    } as any);
    expect(authService.refreshToken).toHaveBeenCalledWith('u1', 'cookie-token', true);
  });

  it('clears the cookie on logout', async () => {
    const { controller } = makeController({});
    const res = makeRes();
    await controller.logout({ user: { id: 'u1' } } as any, res);
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, expect.objectContaining({ path: '/api/auth' }));
  });

  it('sets the rotated cookie after 2FA verification', async () => {
    const { controller } = makeController({});
    const res = makeRes();
    await controller.verifyTwoFactor({ user: { id: 'u1' } } as any, { token: '123456' }, res);
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'r3', expect.anything());
  });
});

describe('refreshCookieOptions', () => {
  it('requires SameSite=None + Secure in production (cross-site Vercel→Render)', () => {
    const opts = refreshCookieOptions(true, 604800);
    expect(opts.sameSite).toBe('none');
    expect(opts.secure).toBe(true);
    expect(opts.httpOnly).toBe(true);
  });

  it('uses Lax without Secure in development (same-origin Vite proxy)', () => {
    const opts = refreshCookieOptions(false, 604800);
    expect(opts.sameSite).toBe('lax');
    expect(opts.secure).toBe(false);
  });
});
