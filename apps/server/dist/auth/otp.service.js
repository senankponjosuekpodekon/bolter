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
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const email_service_1 = require("../notifications/email.service");
const logger_service_1 = require("../common/logger/logger.service");
let OtpService = OtpService_1 = class OtpService {
    constructor(supabase, emailService, logger) {
        this.supabase = supabase;
        this.emailService = emailService;
        this.logger = logger;
        this.CODE_LENGTH = 6;
        this.CODE_EXPIRY_MS = 10 * 60 * 1000;
        this.MAX_ATTEMPTS = 3;
    }
    async sendOtpEmail(userId, email) {
        const code = this.generateCode();
        const hash = this.hashCode(code);
        const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MS);
        await this.invalidatePreviousCodes(userId, 'email');
        const { error } = await this.supabase.getAdminClient().from('otp_codes').insert({
            user_id: userId,
            code_hash: hash,
            delivery_method: 'email',
            email,
            expires_at: expiresAt.toISOString(),
        });
        if (error) {
            this.logger.error(`Failed to store OTP code: ${error.message}`, undefined, OtpService_1.name);
            return false;
        }
        try {
            await this.emailService.send({
                to: email,
                subject: 'Your One-Time Password',
                html: this.renderOtpEmail(code),
                text: `Your one-time password is: ${code}. This code expires in 10 minutes.`,
            });
            this.logger.log(`OTP email sent to user ${userId}`, OtpService_1.name);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send OTP email: ${error.message}`, undefined, OtpService_1.name);
            return false;
        }
    }
    async sendOtpSms(userId, phoneNumber) {
        const code = this.generateCode();
        const hash = this.hashCode(code);
        const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MS);
        await this.invalidatePreviousCodes(userId, 'sms');
        const { error } = await this.supabase.getAdminClient().from('otp_codes').insert({
            user_id: userId,
            code_hash: hash,
            delivery_method: 'sms',
            phone_number: phoneNumber,
            expires_at: expiresAt.toISOString(),
        });
        if (error) {
            this.logger.error(`Failed to store OTP code: ${error.message}`, undefined, OtpService_1.name);
            return false;
        }
        this.logger.log(`OTP SMS would be sent to ${phoneNumber}: ${code} (not implemented)`, OtpService_1.name);
        this.logger.warn(`SMS OTP for user ${userId}: ${code}`, OtpService_1.name);
        return true;
    }
    async verifyOtp(userId, code, method) {
        const hash = this.hashCode(code);
        const now = new Date();
        const { data: otpData, error } = await this.supabase
            .getAdminClient()
            .from('otp_codes')
            .select('*')
            .eq('user_id', userId)
            .eq('delivery_method', method)
            .eq('code_hash', hash)
            .is('verified_at', null)
            .gt('expires_at', now.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !otpData) {
            const { data: activeOtp } = await this.supabase
                .getAdminClient()
                .from('otp_codes')
                .select('*')
                .eq('user_id', userId)
                .eq('delivery_method', method)
                .is('verified_at', null)
                .gt('expires_at', now.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (activeOtp) {
                const otp = activeOtp;
                const newAttempts = otp.attempts + 1;
                await this.supabase
                    .getAdminClient()
                    .from('otp_codes')
                    .update({ attempts: newAttempts })
                    .eq('id', otp.id);
                const remaining = this.MAX_ATTEMPTS - newAttempts;
                return { verified: false, attemptsRemaining: Math.max(0, remaining) };
            }
            return { verified: false };
        }
        const otp = otpData;
        if (otp.attempts >= this.MAX_ATTEMPTS) {
            this.logger.warn(`OTP max attempts exceeded for user ${userId}`, OtpService_1.name);
            return { verified: false, attemptsRemaining: 0 };
        }
        const { error: updateError } = await this.supabase
            .getAdminClient()
            .from('otp_codes')
            .update({ verified_at: now.toISOString() })
            .eq('id', otp.id);
        if (updateError) {
            this.logger.error(`Failed to mark OTP as verified: ${updateError.message}`, undefined, OtpService_1.name);
            return { verified: false };
        }
        this.logger.log(`OTP verified for user ${userId} via ${method}`, OtpService_1.name);
        return { verified: true };
    }
    async invalidatePreviousCodes(userId, method) {
        await this.supabase
            .getAdminClient()
            .from('otp_codes')
            .delete()
            .eq('user_id', userId)
            .eq('delivery_method', method)
            .is('verified_at', null);
    }
    generateCode() {
        return (0, crypto_1.randomInt)(0, 1000000).toString().padStart(this.CODE_LENGTH, '0');
    }
    hashCode(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
    renderOtpEmail(code) {
        return `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Your One-Time Password</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Use the following code to complete your authentication:
        </p>
        <div style="background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          This code will expire in <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          If you didn't request this code, please ignore this email or contact support if you have concerns.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #9ca3af;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        email_service_1.EmailService,
        logger_service_1.Logger])
], OtpService);
//# sourceMappingURL=otp.service.js.map