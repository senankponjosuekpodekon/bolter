import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { TwoFactorThrottleGuard } from './guards/two-factor-throttle.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EnableTwoFactorDto, VerifyTwoFactorDto, TwoFactorResponseDto } from './dto/two-factor.dto';
import { SessionsService } from './sessions.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivityLogService } from './activity-log.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Req() req, @Body('twoFactorToken') twoFactorToken?: string) {
    return this.authService.login(req.user, twoFactorToken);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req) {
    return this.authService.refreshToken(req.user.id, refreshTokenDto.refreshToken);
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
  async googleAuthCallback(@Req() req) {
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
  @Get('profile/activity')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiResponse({ status: 200, description: 'User activity history' })
  async getProfileActivity(@Req() req) {
    return this.activityLogService.getUserActivity(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA' })
  @ApiResponse({ status: 200, description: '2FA setup data', type: TwoFactorResponseDto })
  async setupTwoFactor(@Req() req): Promise<TwoFactorResponseDto> {
    return this.authService.setupTwoFactor(req.user.id);
  }

  @UseGuards(JwtAuthGuard, TwoFactorThrottleGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 429, description: 'Too many attempts. Try again later.' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA already enabled' })
  async enableTwoFactor(@Req() req, @Body() enableTwoFactorDto: EnableTwoFactorDto) {
    return this.authService.enableTwoFactor(req.user.id, enableTwoFactorDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA not enabled' })
  async disableTwoFactor(@Req() req, @Body() verifyTwoFactorDto: VerifyTwoFactorDto) {
    return this.authService.disableTwoFactor(req.user.id, verifyTwoFactorDto.token);
  }

  @UseGuards(JwtAuthGuard, TwoFactorThrottleGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 attempts per hour (3600000ms)
  @Post('2fa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify 2FA token' })
  @ApiResponse({ status: 200, description: 'Token verified' })
  @ApiResponse({ status: 429, description: 'Too many attempts. Try again later.' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verifyTwoFactor(@Req() req, @Body() verifyTwoFactorDto: VerifyTwoFactorDto) {
    const isValid = await this.authService.verifyTwoFactor(req.user.id, verifyTwoFactorDto.token);
    return { valid: isValid };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@Req() req) {
    return this.sessionsService.getUserSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a session by sessionId' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(@Req() req, @Body('sessionId') sessionId: string) {
    await this.sessionsService.invalidateSession(sessionId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked' })
  async revokeAllSessions(@Req() req, @Body('exceptSessionId') exceptSessionId?: string) {
    await this.sessionsService.invalidateAllUserSessions(req.user.id, exceptSessionId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updatePreferences(@Req() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
    return this.authService.updatePreferences(req.user.id, updatePreferencesDto);
  }
}