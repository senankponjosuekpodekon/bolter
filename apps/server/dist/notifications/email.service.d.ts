import { ConfigService } from '@nestjs/config';
import { Logger } from '../common/logger/logger.service';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private readonly config;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    constructor(config: ConfigService, logger: Logger);
    send(options: SendEmailOptions): Promise<void>;
}
