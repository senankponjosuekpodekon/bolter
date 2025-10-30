"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = require("nodemailer");
const logger_service_1 = require("../common/logger/logger.service");
let EmailService = EmailService_1 = class EmailService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.transporter = null;
        const host = this.config.get('email.host') || 'smtp.sendgrid.net';
        const port = this.config.get('email.port') || 587;
        const user = this.config.get('email.user');
        const password = this.config.get('email.password');
        this.fromAddress = this.config.get('email.from') || 'no-reply@banking-platform.test';
        if (host && user && password) {
            this.transporter = (0, nodemailer_1.createTransport)({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass: password,
                },
            });
        }
        else {
            this.logger.warn('Email transport disabled: missing SMTP configuration', EmailService_1.name);
        }
    }
    async send(options) {
        if (!this.transporter) {
            this.logger.debug(`Skipping email send to ${options.to}. Transport not configured.`, EmailService_1.name);
            return;
        }
        const message = {
            from: this.fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };
        try {
            await this.transporter.sendMail(message);
            this.logger.debug(`Email sent to ${options.to}`, EmailService_1.name);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, undefined, EmailService_1.name);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, logger_service_1.Logger])
], EmailService);
//# sourceMappingURL=email.service.js.map