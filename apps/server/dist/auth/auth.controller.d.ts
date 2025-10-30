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
        user: any;
    }>;
    login(loginDto: LoginDto, req: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
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
        user: any;
    }>;
    getProfile(req: any): any;
}
