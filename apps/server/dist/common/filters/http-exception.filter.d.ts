import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Logger } from '../logger/logger.service';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: Logger);
    catch(exception: unknown, host: ArgumentsHost): void;
}
