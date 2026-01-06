import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../tenants/tenants.service';

/**
 * Extended Request interface with tenant information
 */
interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

/**
 * Middleware to detect and extract tenant from request
 * Supports multiple methods:
 * 1. Subdomain: api.tenant-slug.platform.com
 * 2. Header: X-Tenant-ID: {tenant_id}
 * 3. Header: X-Tenant-Slug: {tenant_slug}
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | undefined;
    let tenantSlug: string | undefined;

    try {
      // Method 1: Extract from subdomain
      const host = req.headers.host || '';
      const parts = host.split('.');
      
      if (parts.length > 2) {
        // api.tenant-slug.platform.com -> tenant-slug
        const potentialSubdomain = parts[0];
        if (potentialSubdomain !== 'api' && potentialSubdomain !== 'www') {
          tenantSlug = potentialSubdomain;
        }
      }

      // Method 2: Extract from X-Tenant-ID header
      const tenantIdHeader = req.headers['x-tenant-id'] as string;
      if (tenantIdHeader) {
        tenantId = tenantIdHeader;
      }

      // Method 3: Extract from X-Tenant-Slug header
      const tenantSlugHeader = req.headers['x-tenant-slug'] as string;
      if (tenantSlugHeader && !tenantSlug) {
        tenantSlug = tenantSlugHeader;
      }

      // Method 4: Extract from JWT custom claims (if present)
      // This is handled in the auth guard

      // Resolve tenant slug to ID if needed
      if (tenantSlug && !tenantId) {
        try {
          const tenant = await this.tenantsService.getBySlug(tenantSlug);
          tenantId = tenant.id;
        } catch {
          this.logger.warn(`Failed to resolve tenant slug: ${tenantSlug}`);
        }
      }

      // Attach to request
      (req as TenantRequest).tenantId = tenantId;
      (req as TenantRequest).tenantSlug = tenantSlug;

      this.logger.debug(`Tenant detected: ID=${tenantId}, Slug=${tenantSlug}`);
    } catch (error) {
      this.logger.error(`Error in tenant middleware: ${error}`);
    }

    next();
  }
}
