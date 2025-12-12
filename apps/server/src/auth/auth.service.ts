import { Injectable, UnauthorizedException, BadRequestException, Logger as NestLogger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UsersService, User } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Logger } from '../common/logger/logger.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  private readonly auditLogger = new NestLogger('AuthAudit');

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // avoid creating unused temporary bindings ('_' / '__') that ESLint flags
    const copy: Partial<User> = { ...user };
    delete (copy as Partial<User>).password;
    delete (copy as Partial<User>).refreshToken;
    return copy as Omit<User, 'password' | 'refreshToken'>;
  }

  async login(user: User | Omit<User, 'password' | 'refreshToken'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const refreshToken = this.generateRefreshToken(payload);

    await this.usersService.setRefreshToken(user.id, refreshToken);

    const success = await this.auditLogsService.log({
      userId: user.id,
      performedBy: user.id,
      action: 'AUTH_LOGIN',
      resourceType: 'auth',
      resourceId: user.id,
      metadata: {
        method: 'PASSWORD',
      },
    });

    if (!success) {
      this.auditLogger.warn(`Failed to persist login audit log for ${user.email}`);
    }

    // Check if user has 2FA enabled - if so, require verification before granting full access
    const twoFactorEnabled = user.two_factor_enabled === true;

    const response: any = {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: this.stripSensitiveFields(user),
      requires2FA: twoFactorEnabled,
    };

    return response;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.usersService.create({
      ...registerDto,
      role: 'CLIENT',
    }, {
      metadata: {
        channel: 'EMAIL',
      },
    });

    this.logger.log(`New user registered: ${user.email}`, 'AuthService');

    return this.login(user);
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId, { includeSensitive: true });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };

    const response = {
      accessToken: this.jwtService.sign(payload),
    };

    const success = await this.auditLogsService.log({
      userId: user.id,
      performedBy: user.id,
      action: 'AUTH_REFRESH',
      resourceType: 'auth',
      resourceId: user.id,
    });

    if (!success) {
      this.auditLogger.warn(`Failed to persist token refresh audit log for ${user.email}`);
    }

    return response;
  }

  async validateOAuthUser(profile: { emails?: Array<{ value: string }>; id: string; displayName?: string }): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const { emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const names = displayName.split(' ');
      const firstName = names[0];
      const lastName = names.length > 1 ? names[names.length - 1] : '';

      user = await this.usersService.create({
        email,
        password: '',
        firstName,
        lastName,
        role: 'CLIENT',
      }, {
        metadata: {
          channel: 'GOOGLE',
        },
      });

      this.logger.log(`New user registered via Google: ${email}`, 'AuthService');
    }

    const success = await this.auditLogsService.log({
      userId: user.id,
      performedBy: user.id,
      action: 'AUTH_LOGIN',
      resourceType: 'auth',
      resourceId: user.id,
      metadata: {
        method: 'GOOGLE',
      },
    });

    if (!success) {
      this.auditLogger.warn(`Failed to persist Google login audit log for ${email}`);
    }

    return this.stripSensitiveFields(user) as Omit<User, 'password' | 'refreshToken'>;
  }

  private generateRefreshToken(payload: { email: string; sub: string; role: string }): string {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: `${this.configService.get<number>('jwt.refreshExpiresIn')}s`,
    });

    return refreshToken;
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    await this.auditLogsService.log({
      userId,
      performedBy: userId,
      action: 'AUTH_LOGOUT',
      resourceType: 'auth',
      resourceId: userId,
    });
    return { success: true };
  }

  private stripSensitiveFields(user: User | null) {
    if (!user) return null;
    const copy: Partial<User> = { ...user };
    delete (copy as Partial<User>).password;
    delete (copy as Partial<User>).refreshToken;
    return copy as Omit<User, 'password' | 'refreshToken'>;
  }

  async setupTwoFactor(userId: string) {
    const user = await this.usersService.findById(userId);
    const secret = speakeasy.generateSecret({
      name: `Bolter (${user?.email || 'user'})`,
      issuer: 'Bolter Banking'
    });

    // persist a temporary secret so enableTwoFactor can verify against the same value
    await this.usersService.setTempTwoFactorSecret(userId, secret.base32);

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl
    };
  }

  async enableTwoFactor(userId: string, token: string) {
    const already = await this.usersService.getTwoFactorSecret(userId);
    if (already) {
      throw new BadRequestException('2FA is already enabled');
    }

    const tempSecret = await this.usersService.getTempTwoFactorSecret(userId);
    if (!tempSecret) {
      throw new BadRequestException('No pending 2FA setup found. Please start setup first.');
    }

    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    // Save the secret permanently and clear temp
    await this.usersService.setTwoFactorSecret(userId, tempSecret);
    await this.usersService.clearTempTwoFactorSecret(userId);

    await this.auditLogsService.log({
      userId,
      performedBy: userId,
      action: '2FA_ENABLED',
      resourceType: 'auth',
      resourceId: userId,
    });

    return { success: true, message: '2FA enabled successfully' };
  }

  async disableTwoFactor(userId: string, token: string) {
    const secret = await this.usersService.getTwoFactorSecret(userId);
    if (!secret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    // Remove 2FA secret
    await this.usersService.clearTwoFactorSecret(userId);

    await this.auditLogsService.log({
      userId,
      performedBy: userId,
      action: '2FA_DISABLED',
      resourceType: 'auth',
      resourceId: userId,
    });

    return { success: true, message: '2FA disabled successfully' };
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    const secret = await this.usersService.getTwoFactorSecret(userId);
    if (!secret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      await this.auditLogsService.log({
        userId,
        performedBy: userId,
        action: '2FA_VERIFY_FAILED',
        resourceType: 'auth',
        resourceId: userId,
      });
      return false;
    }

    return true;
  }
}
