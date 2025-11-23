import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class Logger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    // Make sure logs directory exists so file transports will be able to write in dev
    if (!existsSync('logs')) {
      try {
        mkdirSync('logs', { recursive: true });
      } catch (err) {
        // fallback: continue without file logging if the directory cannot be created
        /* eslint-disable no-console */
        // eslint-disable-next-line no-console
        console.warn('Could not create logs directory, file logging will be skipped.', err);
        /* eslint-enable no-console */
      }
    }

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'financial-platform' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        // Always include file logging locally so developers can inspect logs under ./logs
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        // separate file for notification-driven events (makes it easy to open in VS Code)
        new winston.transports.File({ filename: 'logs/notifications.log', level: 'info' }),
        // separate file for outgoing email content / events
        new winston.transports.File({ filename: 'logs/emails.log', level: 'info' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}