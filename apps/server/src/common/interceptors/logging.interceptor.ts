import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { tap } from 'rxjs/operators';
import { Logger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    // req.user may vary depending on auth strategy; safely extract id
    const rawUser = req.user as unknown;
    let userId = 'anonymous';
    if (rawUser && typeof rawUser === 'object') {
      const maybeId = (rawUser as Record<string, unknown>)['id'];
      if (typeof maybeId === 'string' && maybeId.length) {
        userId = maybeId;
      }
    }

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${responseTime}ms - User: ${userId}`,
          'HTTP',
        );
      }),
    );
  }
}