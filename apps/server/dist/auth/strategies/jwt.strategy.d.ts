import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
        tenant_id?: string | null;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        address?: string | null;
        locale?: string | null;
        currency?: string | null;
        timezone?: string | null;
        role: string;
        status?: string;
        kyc_status?: string;
        hasPassword: boolean;
        two_factor_enabled?: boolean;
        preferences?: Record<string, unknown> | null;
        createdAt?: string;
        updatedAt?: string;
        password?: string;
        refreshToken?: string;
        tenant_id: string | null;
    }>;
}
export {};
