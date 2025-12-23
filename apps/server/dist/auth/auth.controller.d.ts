import { AuthService, LoginResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<LoginResponse>;
    login(loginDto: LoginDto, req: any): Promise<LoginResponse>;
    refresh(refreshTokenDto: RefreshTokenDto, req: any): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        success: boolean;
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any): Promise<LoginResponse>;
    getProfile(req: any): any;
    setupTwoFactor(req: any): Promise<{
        secret: string;
        qrCodeUrl: any;
    }>;
    enableTwoFactor(req: any, body: {
        token: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    disableTwoFactor(req: any, body: {
        token: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyTwoFactor(req: any, body: {
        token: string;
    }): Promise<{
        valid: boolean;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
