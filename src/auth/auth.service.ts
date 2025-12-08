import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Logger } from '../common/logger/logger.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivityLogService, ActivityType } from './activity-log.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    // request the user including secrets for authentication
    const user = await this.usersService.findByEmail(email, true);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // return a sanitized user object (no secrets)
    const { password: _, refreshToken: __, twoFactorSecret: ___, ...result } = user;
    return result;
  }

  async login(user: any, twoFactorToken?: string) {
    return this.loginWithTwoFactor(user, twoFactorToken);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.usersService.create({
      ...registerDto,
      role: 'CLIENT',
    });

    this.logger.log(`New user registered: ${user.email}`, 'AuthService');

    return this.login(user);
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };

    this.logger.log(`Token refresh for user: ${userId}`, 'AuthService');

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateOAuthUser(profile: any): Promise<any> {
    const { emails, id: googleId, displayName } = profile;
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
      });

      this.logger.log(`New user registered via Google: ${email}`, 'AuthService');
    }

    return user;
  }

  private generateRefreshToken(payload: any): string {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: `${this.configService.get<number>('jwt.refreshExpiresIn')}s`,
    });

    return refreshToken;
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    await this.activityLogService.log(userId, 'LOGOUT');
    // Blacklist access token (if available)
    // Note: You may need to pass the token from controller
    this.logger.log(`User logout: ${userId}`, 'AuthService');
    return { success: true };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklistService.isTokenBlacklisted(token);
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
      window: 2
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.usersService.enableTwoFactor(userId, tempSecret);
    await this.usersService.clearTempTwoFactorSecret(userId);
    await this.activityLogService.log(userId, '2FA_ENABLE');

    this.logger.log(`2FA enabled for user: ${userId}`, 'AuthService');

    return { success: true };
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
      window: 2
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.usersService.disableTwoFactor(userId);
    await this.activityLogService.log(userId, '2FA_DISABLE');

    this.logger.log(`2FA disabled for user: ${userId}`, 'AuthService');

    return { success: true };
  }

  async verifyTwoFactor(userId: string, token: string, logFailure = true): Promise<boolean> {
    const secret = await this.usersService.getTwoFactorSecret(userId);
    if (!secret) {
      return true; // If 2FA not enabled, consider verified
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    // Log failed 2FA verification attempts for security audit
    if (!isValid && logFailure) {
      await this.activityLogService.log(
        userId,
        '2FA_VERIFY_FAILED' as any,
        `Invalid TOTP code provided`
      );
    }

    return isValid;
  }

  async loginWithTwoFactor(user: any, twoFactorToken?: string) {
    const isTwoFactorEnabled = await this.usersService.isTwoFactorEnabled(user.id);

    if (isTwoFactorEnabled) {
      if (!twoFactorToken) {
        return {
          requiresTwoFactor: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        };
      }

      const isValidToken = await this.verifyTwoFactor(user.id, twoFactorToken);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid 2FA token');
      }
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const refreshToken = this.generateRefreshToken(payload);

    await this.usersService.setRefreshToken(user.id, refreshToken);
    await this.activityLogService.log(user.id, 'LOGIN');

    this.logger.log(`User login: ${user.email} (2FA: ${isTwoFactorEnabled ? 'enabled' : 'disabled'})`, 'AuthService');

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Validation email unique
    if (updateProfileDto.email) {
      const existing = await this.usersService.findByEmail(updateProfileDto.email);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }
    // Mise à jour des champs
    const updated = await this.usersService.update(userId, updateProfileDto);
    await this.activityLogService.log(userId, 'PROFILE_UPDATE');
    this.logger.log(`Profile updated for user: ${userId}`, 'AuthService');
    return updated;
  }

  async updatePreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto) {
    const updated = await this.usersService.update(userId, updatePreferencesDto);
    this.logger.log(`Preferences updated for user: ${userId}`, 'AuthService');
    await this.activityLogService.log(userId, 'PROFILE_UPDATE', 'Preferences updated');
    return updated;
  }
}
