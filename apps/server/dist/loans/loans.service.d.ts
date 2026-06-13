import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateLoanDto, LoanDocumentDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { LoanSimulationInstallment, LoanSimulationResult, LoanStatus } from './loan.constants';
interface LoanRecord {
    id: string;
    user_id: string;
    amount: number;
    duration_months: number;
    purpose: string;
    monthly_income: number;
    employer?: string | null;
    notes?: string | null;
    status: LoanStatus;
    interest_rate?: number | null;
    monthly_payment?: number | null;
    total_interest?: number | null;
    total_cost?: number | null;
    amortization_schedule?: LoanSimulationInstallment[] | null;
    supporting_documents?: LoanDocumentDto[] | null;
    risk_score?: number | null;
    approved_by?: string | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    disbursed_account_id?: string | null;
    disbursed_at?: string | null;
    next_payment_due_at?: string | null;
    outstanding_balance?: number | null;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: string;
        email?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        kyc_status?: string | null;
    } | null;
}
export declare class LoansService {
    private readonly supabase;
    private readonly auditLogsService;
    private readonly notificationsService;
    private readonly accountsService;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogsService: AuditLogsService, notificationsService: NotificationsService, accountsService: AccountsService);
    createLoan(userId: string, dto: CreateLoanDto, tenantId?: string | null): Promise<any>;
    findLoansForUser(userId: string): Promise<any[]>;
    findLoans(query: QueryLoansDto, currentUser: {
        id: string;
        role: string;
    }): Promise<{
        data: LoanRecord[];
        total: number;
    }>;
    findLoanById(loanId: string, currentUser: {
        id: string;
        role: string;
    }): Promise<LoanRecord>;
    approveLoan(adminId: string, loanId: string, dto: ApproveLoanDto): Promise<any>;
    rejectLoan(adminId: string, loanId: string, dto: RejectLoanDto): Promise<any>;
    recordRepayment(userId: string, loanId: string, dto: RecordRepaymentDto): Promise<{
        loan: any;
        repayment: any;
    }>;
    getRepayments(loanId: string, currentUser: {
        id: string;
        role: string;
    }): Promise<any[]>;
    getLoanStatistics(loanId: string, currentUser: {
        id: string;
        role: string;
    }): Promise<{
        loanId: string;
        amount: number;
        totalCost: number;
        totalPaid: any;
        totalPenalties: any;
        outstandingBalance: number;
        progressPercentage: number;
        paymentsMade: number;
        expectedPayments: number;
        monthlyPayment: number;
        nextPaymentDue: string;
        onSchedule: boolean;
        status: LoanStatus;
        repayments: {
            amount: any;
            penalty_fee: any;
            paid_at: any;
        }[];
    }>;
    calculateSimulation(amount: number, durationMonths: number, interestRate: number): LoanSimulationResult;
    private ensureUserEligible;
    private sanitizeDocuments;
    private getLoanOrThrow;
    private calculateRiskScore;
    private determineInterestRate;
    private normalizeInterestRate;
    private resolveDefaultAccount;
    private disburseLoan;
    private computeNextDueDate;
    private deriveStatusFromDueDate;
    private addMonthsToNow;
    private addMonthsToDate;
    private roundCurrency;
    private logSupabaseError;
}
export {};
