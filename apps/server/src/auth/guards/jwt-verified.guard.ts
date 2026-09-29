import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

/**
 * Guard that checks if user has completed 2FA verification if 2FA is enabled.
 * This ensures that endpoints protected with this guard require full authentication
 * including 2FA verification when 2FA is enabled for the user.
 */
@Injectable()
export class JwtVerifiedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Fetch user's 2FA status
    const dbUser = await this.usersService.findById(user.id);

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    // If 2FA is not enabled, allow access
    if (!dbUser.two_factor_enabled) {
      return true;
    }

    // If 2FA is enabled, the JWT must carry the tfa_verified claim
    // (only minted by /auth/2fa/verify after a successful TOTP check).
    if (user.tfa_verified !== true) {
      throw new UnauthorizedException('Two-factor verification required');
    }

    return true;
  }
}
