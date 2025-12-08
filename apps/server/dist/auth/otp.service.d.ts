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
export declare class OtpService {
    private readonly supabase;
    private readonly emailService;
    private readonly logger;
    private readonly CODE_LENGTH;
    private readonly CODE_EXPIRY_MS;
    private readonly MAX_ATTEMPTS;
    constructor(supabase: SupabaseService, emailService: EmailService, logger: Logger);
    sendOtpEmail(userId: string, email: string): Promise<boolean>;
    sendOtpSms(userId: string, phoneNumber: string): Promise<boolean>;
    verifyOtp(userId: string, code: string, method: 'sms' | 'email'): Promise<{
        verified: boolean;
        attemptsRemaining?: number;
    }>;
    private invalidatePreviousCodes;
    private generateCode;
    private hashCode;
    private renderOtpEmail;
}
