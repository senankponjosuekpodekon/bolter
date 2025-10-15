import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Logger } from '../common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const refreshToken = this.generateRefreshToken(payload);

    await this.usersService.setRefreshToken(user.id, refreshToken);

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
    return { success: true };
  }
}
