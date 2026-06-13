import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';
import { ConfigService } from '@nestjs/config';
export declare class TenantMiddleware implements NestMiddleware {
    private readonly tenantsService;
    private readonly config;
    constructor(tenantsService: TenantsService, config: ConfigService);
    use(req: Request, _res: Response, next: NextFunction): Promise<void>;
}
