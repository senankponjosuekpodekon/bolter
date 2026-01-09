import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';
export declare enum NotificationEvent {
    TRANSACTION_CREATED = "transaction.created",
    TRANSACTION_UPDATED = "transaction.updated",
    KYC_DOCUMENT_REVIEWED = "kyc.document.reviewed",
    KYC_STATUS_CHANGED = "kyc.status.changed",
    ACCOUNT_CREATED = "account.created",
    ADMIN_MESSAGE = "admin.message",
    LOAN_CREATED = "loan.created",
    LOAN_APPROVED = "loan.approved",
    LOAN_REJECTED = "loan.rejected",
    LOAN_REPAYMENT_POSTED = "loan.repayment.posted",
    PASSWORD_RESET_REQUESTED = "password.reset.requested"
}
export declare class NotificationsService {
    private readonly emailService;
    private readonly gateway;
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(emailService: EmailService, gateway: NotificationsGateway, supabase: SupabaseService, logger: Logger, config: ConfigService);
    notifyAccountCreated(userId: string, accountNumber: string): Promise<void>;
    notifyAccountDeleted(userId: string, accountNumber: string): Promise<void>;
    notifyCardCreated(userId: string, cardNumber: string, cardType: string): Promise<void>;
    notifyTransactionCreated(options: {
        transactionId: string;
        userId: string;
        amount: number;
        type: string;
        currency?: string | null;
        description?: string | null;
    }): Promise<void>;
    notifyTransactionUpdated(options: {
        transactionId: string;
        userId: string;
        status: 'APPROVED' | 'REJECTED';
        amount: number;
        type: string;
        currency?: string | null;
        rejectionReason?: string | null;
    }): Promise<void>;
    notifyKycDocumentReviewed(options: {
        userId: string;
        documentType: string;
        approved: boolean;
        rejectionReason?: string | null;
    }): Promise<void>;
    notifyKycStatusChanged(options: {
        userId: string;
        previousStatus: string | null;
        newStatus: string;
    }): Promise<void>;
    notifyAdmins(message: string, data?: Record<string, unknown>): Promise<void>;
    notifyLoanCreated(options: {
        loanId: string;
        userId: string;
        amount: number;
        durationMonths: number;
        monthlyPayment: number;
    }): Promise<void>;
    notifyLoanApproved(options: {
        loanId: string;
        userId: string;
        amount: number;
        durationMonths: number;
        monthlyPayment: number;
        interestRate: number;
    }): Promise<void>;
    notifyLoanRejected(options: {
        loanId: string;
        userId: string;
        reason: string;
    }): Promise<void>;
    notifyLoanRepaymentPosted(options: {
        loanId: string;
        userId: string;
        amount: number;
        remainingBalance: number;
        nextDueDate: string | null;
    }): Promise<void>;
    notifyPasswordReset(options: {
        userId: string;
        resetUrl: string;
    }): Promise<void>;
    private buildPayload;
    private getUserContact;
    private safeSendEmail;
    private renderHtmlTemplate;
    private formatAmount;
    private formatName;
    getNotificationPreferences(userId: string, tenantId: string): Promise<Record<string, unknown>>;
    updateNotificationPreferences(userId: string, tenantId: string, preferences: Record<string, unknown>): Promise<Record<string, unknown>>;
    private getDefaultPreferences;
    getUserNotifications(userId: string, tenantId: string, limit?: number, offset?: number): Promise<Record<string, unknown>[]>;
    getUnreadCount(userId: string, tenantId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string, tenantId: string): Promise<boolean>;
    deleteNotification(notificationId: string, userId: string, tenantId: string): Promise<boolean>;
}
