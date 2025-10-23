import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
export declare class TransactionsService {
    private supabase;
    private accountsService;
    constructor(supabase: SupabaseService, accountsService: AccountsService);
    createTransfer(userId: string, dto: CreateTransferDto): Promise<any>;
    findByUserId(userId: string): Promise<any[]>;
    findPending(): Promise<any[]>;
    validateTransaction(adminId: string, transactionId: string, dto: ValidateTransactionDto): Promise<any>;
}
