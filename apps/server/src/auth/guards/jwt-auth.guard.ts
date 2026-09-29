import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // match the IAuthGuard signature including optional info/context/status
  // conforms to the IAuthGuard signature; some params are unused by our logic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  handleRequest<TUser = any>(err: any, user: TUser, _info: any, _context: ExecutionContext, _status?: any): TUser {
    if (err || !user) {
      // ensure we throw an Error-like object
      throw err ?? new UnauthorizedException('Authentication required');
    }

    // Tenant consistency: when a tenant was EXPLICITLY requested (X-Tenant-ID
    // header or subdomain), it must match the authenticated user's tenant.
    // The 'default' fallback resolution never blocks — users of non-default
    // tenants legitimately hit the bare API host.
    const request = _context?.switchToHttp().getRequest();
    const tenant = request?.tenant as { id?: string } | undefined;
    const tenantSource = request?.tenantSource as string | undefined;
    const userWithTenant = user as { tenant_id?: string | null; role?: string };

    if (
      tenant?.id &&
      tenantSource !== 'default' &&
      userWithTenant.role !== 'SUPER_ADMIN' &&
      userWithTenant.tenant_id &&
      userWithTenant.tenant_id !== tenant.id
    ) {
      throw new ForbiddenException('Tenant mismatch');
    }

    return user;
  }
}