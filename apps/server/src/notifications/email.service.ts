import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Logger } from '../common/logger/logger.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly fromAddress: string | undefined;

  constructor(private readonly config: ConfigService, private readonly logger: Logger) {
    const host = this.config.get<string>('email.host') || 'smtp.sendgrid.net';
    const port = this.config.get<number>('email.port') || 587;
    const user = this.config.get<string>('email.user');
    const password = this.config.get<string>('email.password');
    this.fromAddress = this.config.get<string>('email.from') || 'no-reply@banking-platform.test';

    if (host && user && password) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass: password,
        },
      });
    } else {
      this.logger.warn('Email transport disabled: missing SMTP configuration', EmailService.name);
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`Skipping email send to ${options.to}. Transport not configured.`, EmailService.name);
      return;
    }

    const message: Mail.Options = {
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    try {
      await this.transporter.sendMail(message);
      this.logger.debug(`Email sent to ${options.to}`, EmailService.name);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`, undefined, EmailService.name);
    }
  }
}
