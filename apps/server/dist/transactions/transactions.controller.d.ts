import { TransactionsService } from './transactions.service';
import { TransactionFilterService } from './transaction-filter.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly transactionFilterService;
    constructor(transactionsService: TransactionsService, transactionFilterService: TransactionFilterService);
    createTransfer(req: any, createTransferDto: CreateTransferDto): Promise<any>;
    createDeposit(req: any, createDepositDto: CreateDepositDto): Promise<any>;
    createWithdraw(req: any, createWithdrawDto: CreateWithdrawDto): Promise<any>;
    getTransactions(req: any, query: QueryTransactionsDto): Promise<any[]> | Promise<{
        data: {
            fromAccount: {
                id: string;
                user_id?: string | null;
                account_number?: string;
                balance?: string | number;
            };
            toAccount: {
                id: string;
                user_id?: string | null;
                account_number?: string;
                balance?: string | number;
            };
            validator: {
                id: string;
                email?: string;
                first_name?: string;
                last_name?: string;
            };
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
    getPendingTransactions(): Promise<any[]>;
    getPendingTransaction(id: string): Promise<any>;
    filterTransactions(query: TransactionFilterDto): Promise<import("./dto/transaction-filter.dto").FilterResultDto<any>>;
    createAdminTransaction(req: any, dto: AdminCreateTransactionDto): Promise<any>;
    validateTransaction(req: any, id: string, validateDto: ValidateTransactionDto): Promise<any>;
    private ensureAdminRole;
}
