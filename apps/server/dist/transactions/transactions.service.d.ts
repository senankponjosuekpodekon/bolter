import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    findByUserId(userId: string): Promise<any[]>;
    findPending(): Promise<any[]>;
    findPendingById(id: string): Promise<any>;
    findAllForAdmin(query: QueryTransactionsDto): Promise<{
        data: any[];
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
