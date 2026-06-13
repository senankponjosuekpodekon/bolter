import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
export declare class MaintenanceMiddleware implements NestMiddleware {
    private readonly supabase;
    private readonly config;
    private enabled;
    private lastChecked;
    private readonly TTL_MS;
    constructor(supabase: SupabaseService, config: ConfigService);
    use(req: Request & {
        user?: {
            role?: string;
        };
    }, _res: Response, next: NextFunction): Promise<void>;
}
