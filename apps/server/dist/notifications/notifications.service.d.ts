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
    LOAN_REPAYMENT_POSTED = "loan.repayment.posted"
}
export declare class NotificationsService {
    private readonly emailService;
    private readonly gateway;
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(emailService: EmailService, gateway: NotificationsGateway, supabase: SupabaseService, logger: Logger, config: ConfigService);
    notifyAccountCreated(userId: string, accountNumber: string): Promise<void>;
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
    notifyAdmins(message: string, data?: Record<string, any>): Promise<void>;
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
    private buildPayload;
    private getUserContact;
    private safeSendEmail;
    private renderHtmlTemplate;
    private formatAmount;
    private formatName;
}
