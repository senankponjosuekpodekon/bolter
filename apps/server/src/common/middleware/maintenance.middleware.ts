import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

const BYPASS_PATHS = ['/api/health', '/api/auth/login', '/api/auth/refresh'];
const BYPASS_ROLES = ['SUPER_ADMIN', 'ADMIN'];

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private enabled = false;
  private lastChecked = 0;
  private readonly TTL_MS = 30_000; // re-check every 30s

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request & { user?: { role?: string } }, _res: Response, next: NextFunction) {
    const now = Date.now();
    if (now - this.lastChecked > this.TTL_MS) {
      this.lastChecked = now;
      const { data } = await this.supabase
        .getAdminClient()
        .from('system_config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      this.enabled = data?.value?.value === true;
    }

    if (!this.enabled) return next();

    const path = req.path;
    if (BYPASS_PATHS.some((p) => path.startsWith(p))) return next();

    // Middleware runs before guards → req.user is not set yet.
    // Decode JWT manually to extract role for bypass check.
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const secret = this.config.get<string>('jwt.secret');
        const decoded = jwt.verify(token, secret) as { role?: string };
        if (decoded?.role && BYPASS_ROLES.includes(decoded.role)) return next();
      } catch {
        // Invalid token — fall through to maintenance block
      }
    }

    throw new ServiceUnavailableException('Platform is under maintenance. Please try again later.');
  }
}
