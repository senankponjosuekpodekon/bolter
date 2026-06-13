import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const GoogleStrategy_base: new (...args: any[]) => Strategy;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(req: {
        tenant?: {
            id?: string;
        };
    }, _accessToken: string, _refreshToken: string, profile: {
        emails?: Array<{
            value: string;
        }>;
        id: string;
        displayName?: string;
    }, done: VerifyCallback): Promise<void>;
}
export {};
