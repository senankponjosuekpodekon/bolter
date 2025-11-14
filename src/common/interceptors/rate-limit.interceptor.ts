import { Injectable, ExecutionContext, CallHandler, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const RATE_LIMITS = [
  { route: '/auth/login', limit: 5, ttl: 60 }, // 5 tentatives par minute
  { route: '/auth/register', limit: 3, ttl: 300 }, // 3 inscriptions par 5 min
  { route: '/auth/refresh', limit: 10, ttl: 60 }, // 10 refresh par minute
];

const memoryStore: Record<string, { count: number; expires: number }> = {};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const route = req.route?.path || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const limitConfig = RATE_LIMITS.find(r => route.startsWith(r.route));
    if (!limitConfig) return next.handle();
    const key = `${route}:${ip}`;
    const now = Date.now();
    if (!memoryStore[key] || memoryStore[key].expires < now) {
      memoryStore[key] = { count: 1, expires: now + limitConfig.ttl * 1000 };
    } else {
      memoryStore[key].count++;
      if (memoryStore[key].count > limitConfig.limit) {
        throw new BadRequestException(`Rate limit exceeded for ${route}`);
      }
    }
    return next.handle().pipe(
      tap(() => {})
    );
  }
}
