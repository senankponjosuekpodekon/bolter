import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // 1. Check explicit header (API clients, mobile apps)
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) {
      try {
        const tenant = await this.tenantsService.findById(headerTenantId);
        if (tenant?.is_active) {
          req['tenant'] = tenant;
          req['tenantSource'] = 'header';
          return next();
        }
      } catch {
        // fall through to subdomain resolution
      }
    }

    // 2. Resolve from subdomain (e.g. creditafrique.bolter.app → slug = "creditafrique")
    const host = req.hostname || '';
    const rootDomain = this.config.get<string>('app.url')
      ? new URL(this.config.get<string>('app.url')).hostname
      : 'localhost';

    const isSubdomain = host !== rootDomain && host !== 'localhost' && host !== '127.0.0.1';
    if (isSubdomain) {
      const slug = host.split('.')[0];
      const tenant = await this.tenantsService.findBySlug(slug);
      if (tenant) {
        req['tenant'] = tenant;
        req['tenantSource'] = 'subdomain';
        return next();
      }
    }

    // 3. Fallback to default tenant (single-tenant mode / dev)
    try {
      const defaultTenant = await this.tenantsService.findById(DEFAULT_TENANT_ID);
      req['tenant'] = defaultTenant;
    } catch {
      req['tenant'] = { id: DEFAULT_TENANT_ID, name: 'Default', slug: 'default', is_active: true, plan: 'FREE' };
    }
    req['tenantSource'] = 'default';

    next();
  }
}
