import { Injectable } from '@nestjs/common';
import { randomInt, createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../notifications/email.service';
import { Logger } from '../common/logger/logger.service';

export interface OtpCode {
  id: string;
  user_id: string;
  code_hash: string;
  delivery_method: 'sms' | 'email';
  phone_number: string | null;
  email: string | null;
  attempts: number;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

@Injectable()
export class OtpService {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) { }

  async sendOtpEmail(userId: string, email: string): Promise<boolean> {
    const code = this.generateCode();
    const hash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MS);

    // Invalidate previous unused OTP codes
    await this.invalidatePreviousCodes(userId, 'email');

    // Store new OTP
    const { error } = await this.supabase.getAdminClient().from('otp_codes').insert({
      user_id: userId,
      code_hash: hash,
      delivery_method: 'email',
      email,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      this.logger.error(`Failed to store OTP code: ${error.message}`, undefined, OtpService.name);
      return false;
    }

    // Send email
    try {
      await this.emailService.send({
        to: email,
        subject: 'Your One-Time Password',
        html: this.renderOtpEmail(code),
        text: `Your one-time password is: ${code}. This code expires in 10 minutes.`,
      });

      this.logger.log(`OTP email sent to user ${userId}`, OtpService.name);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email: ${(error as Error).message}`, undefined, OtpService.name);
      return false;
    }
  }

  async sendOtpSms(userId: string, phoneNumber: string): Promise<boolean> {
    const code = this.generateCode();
    const hash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MS);

    // Invalidate previous unused OTP codes
    await this.invalidatePreviousCodes(userId, 'sms');

    // Store new OTP
    const { error } = await this.supabase.getAdminClient().from('otp_codes').insert({
      user_id: userId,
      code_hash: hash,
      delivery_method: 'sms',
      phone_number: phoneNumber,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      this.logger.error(`Failed to store OTP code: ${error.message}`, undefined, OtpService.name);
      return false;
    }

    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    this.logger.log(`OTP SMS would be sent to ${phoneNumber}: ${code} (not implemented)`, OtpService.name);

    // For now, log the code (REMOVE IN PRODUCTION)
    this.logger.warn(`SMS OTP for user ${userId}: ${code}`, OtpService.name);

    return true;
  }

  async verifyOtp(userId: string, code: string, method: 'sms' | 'email'): Promise<{ verified: boolean; attemptsRemaining?: number }> {
    const hash = this.hashCode(code);
    const now = new Date();

    // Find active OTP
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
      // Check if there's any active OTP to increment attempts
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
        const otp = activeOtp as OtpCode;
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

    const otp = otpData as OtpCode;

    // Check attempts
    if (otp.attempts >= this.MAX_ATTEMPTS) {
      this.logger.warn(`OTP max attempts exceeded for user ${userId}`, OtpService.name);
      return { verified: false, attemptsRemaining: 0 };
    }

    // Mark as verified
    const { error: updateError } = await this.supabase
      .getAdminClient()
      .from('otp_codes')
      .update({ verified_at: now.toISOString() })
      .eq('id', otp.id);

    if (updateError) {
      this.logger.error(`Failed to mark OTP as verified: ${updateError.message}`, undefined, OtpService.name);
      return { verified: false };
    }

    this.logger.log(`OTP verified for user ${userId} via ${method}`, OtpService.name);
    return { verified: true };
  }

  private async invalidatePreviousCodes(userId: string, method: 'sms' | 'email'): Promise<void> {
    await this.supabase
      .getAdminClient()
      .from('otp_codes')
      .delete()
      .eq('user_id', userId)
      .eq('delivery_method', method)
      .is('verified_at', null);
  }

  private generateCode(): string {
    // Generate 6-digit numeric code
    return randomInt(0, 1000000).toString().padStart(this.CODE_LENGTH, '0');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private renderOtpEmail(code: string): string {
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
}
