import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    createTransfer(req: any, createTransferDto: CreateTransferDto): Promise<any>;
    createDeposit(req: any, createDepositDto: CreateDepositDto): Promise<any>;
    createWithdraw(req: any, createWithdrawDto: CreateWithdrawDto): Promise<any>;
    getTransactions(req: any, query: QueryTransactionsDto): Promise<any[]> | Promise<{
        data: any[];
        total: number;
    }>;
    getPendingTransactions(): Promise<any[]>;
    getPendingTransaction(id: string): Promise<any>;
    createAdminTransaction(req: any, dto: AdminCreateTransactionDto): Promise<any>;
    validateTransaction(req: any, id: string, validateDto: ValidateTransactionDto): Promise<any>;
    private ensureAdminRole;
}
