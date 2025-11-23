import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
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

    return user;
  }
}