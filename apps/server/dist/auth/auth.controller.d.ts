import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Omit<import("../users/users.service").User, "password" | "refreshToken">;
    }>;
    login(loginDto: LoginDto, req: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Omit<import("../users/users.service").User, "password" | "refreshToken">;
    }>;
    refresh(refreshTokenDto: RefreshTokenDto, req: any): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        success: boolean;
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Omit<import("../users/users.service").User, "password" | "refreshToken">;
    }>;
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
}
