import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, LoginResponse } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Req() req, @Body() registerDto: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(registerDto, req.tenant?.id ?? null);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Req() req): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req) {
    return this.authService.refreshToken(req.user.id, refreshTokenDto.refreshToken, req.user.tfa_verified);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req) {
    return this.authService.logout(req.user.id);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {
    // This route initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'User successfully logged in with Google' })
  async googleAuthCallback(@Req() req): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA' })
  @ApiResponse({ status: 200, description: '2FA setup data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setupTwoFactor(@Req() req) {
    return this.authService.setupTwoFactor(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA already enabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enableTwoFactor(@Req() req, @Body() body: { token: string }) {
    return this.authService.enableTwoFactor(req.user.id, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA not enabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async disableTwoFactor(@Req() req, @Body() body: { token: string }) {
    return this.authService.disableTwoFactor(req.user.id, body.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify 2FA token' })
  @ApiResponse({ status: 200, description: 'Token verified, new authorized tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyTwoFactor(@Req() req, @Body() body: { token: string }) {
    const result = await this.authService.verifyTwoFactor(req.user.id, body.token);
    if (!result.valid) {
      throw new BadRequestException('Invalid 2FA token');
    }
    return result;
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}