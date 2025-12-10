import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { CreateCardTransactionDto } from './dto/create-card-transaction.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
type RawAccountRow = {
    id: string;
    user_id?: string | null;
    account_number?: string;
    balance?: string | number;
};
type RawUserRow = {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
};
export declare class TransactionsService {
    private readonly supabase;
    private readonly accountsService;
    private readonly auditLogsService;
    private readonly notificationsService;
    private readonly logger;
    constructor(supabase: SupabaseService, accountsService: AccountsService, auditLogsService: AuditLogsService, notificationsService: NotificationsService);
    createTransfer(userId: string, dto: CreateTransferDto): Promise<any>;
    createDeposit(userId: string, dto: CreateDepositDto): Promise<any>;
    createWithdraw(userId: string, dto: CreateWithdrawDto): Promise<any>;
    createCardTransaction(userId: string, dto: CreateCardTransactionDto): Promise<any>;
    findByUserId(userId: string): Promise<any[]>;
    findPending(): Promise<any[]>;
    findPendingById(id: string): Promise<any>;
    findAllForAdmin(query: QueryTransactionsDto): Promise<{
        data: {
            fromAccount: RawAccountRow;
            toAccount: RawAccountRow;
            validator: RawUserRow;
            id: string;
            from_account_id?: string | null;
            to_account_id?: string | null;
            amount?: string | number | null;
            validated_by?: string | null;
            type?: string;
            status?: string;
            currency?: string | null;
            description?: string | null;
            created_at?: string | null;
        }[];
        total: number;
    }>;
    createAdminTransaction(adminId: string, dto: AdminCreateTransactionDto): Promise<any>;
    validateTransaction(adminId: string, transactionId: string, dto: ValidateTransactionDto): Promise<any>;
    private buildDepositDescription;
    private createAdminTransfer;
    private createAdminDeposit;
    private createAdminWithdrawal;
    private updateAccountBalance;
    private logTransactionAction;
}
export {};
