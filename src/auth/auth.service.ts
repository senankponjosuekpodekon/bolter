import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole } from '@prisma/client';
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
    
    // Save refresh token to database
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
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Create new user
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.CLIENT, // Default role for new registrations
    });
    
    this.logger.log(`New user registered: ${user.email}`, 'AuthService');
    
    // Generate tokens
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

  async validateOAuthUser(profile: any): Promise<User> {
    const { emails, id: googleId, displayName } = profile;
    const email = emails[0].value;
    
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Create new user from Google profile
      const names = displayName.split(' ');
      const firstName = names[0];
      const lastName = names.length > 1 ? names[names.length - 1] : '';
      
      user = await this.usersService.create({
        email,
        googleId,
        firstName,
        lastName,
        role: UserRole.CLIENT,
      });
      
      this.logger.log(`New user registered via Google: ${email}`, 'AuthService');
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await this.usersService.update(user.id, { googleId });
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