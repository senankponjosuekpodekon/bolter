import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    // req.user can be any shape depending on auth strategy; extract id safely
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