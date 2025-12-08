import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, User } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Logger } from '../common/logger/logger.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly auditLogsService;
    private readonly auditLogger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, logger: Logger, auditLogsService: AuditLogsService);
    validateUser(email: string, password: string): Promise<Omit<User, 'password' | 'refreshToken'>>;
    login(user: User | Omit<User, 'password' | 'refreshToken'>): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Omit<User, "password" | "refreshToken">;
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Omit<User, "password" | "refreshToken">;
    }>;
    refreshToken(userId: string, refreshToken: string): Promise<{
        accessToken: string;
    }>;
    validateOAuthUser(profile: {
        emails?: Array<{
            value: string;
        }>;
        id: string;
        displayName?: string;
    }): Promise<Omit<User, 'password' | 'refreshToken'>>;
    private generateRefreshToken;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    private stripSensitiveFields;
    setupTwoFactor(userId: string): Promise<{
        secret: string;
        qrCodeUrl: any;
    }>;
    enableTwoFactor(userId: string, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    disableTwoFactor(userId: string, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyTwoFactor(userId: string, token: string): Promise<boolean>;
}
