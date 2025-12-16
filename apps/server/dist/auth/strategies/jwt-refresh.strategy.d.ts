import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(req: Request, payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        refreshToken: string;
    }>;
}
export {};
