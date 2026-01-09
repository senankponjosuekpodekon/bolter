import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../tenants/tenants.service';
export declare class TenantMiddleware implements NestMiddleware {
    private tenantsService;
    private readonly logger;
    constructor(tenantsService: TenantsService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
