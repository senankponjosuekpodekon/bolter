import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    createTransfer(req: any, createTransferDto: CreateTransferDto): Promise<any>;
    getUserTransactions(req: any): Promise<any[]>;
    getPendingTransactions(): Promise<any[]>;
    validateTransaction(req: any, id: string, validateDto: ValidateTransactionDto): Promise<any>;
}
