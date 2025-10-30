import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getAccounts(req: any, query: QueryAccountsDto): Promise<any[]> | Promise<{
        data: any[];
        total: number;
    }>;
    getAccount(id: string): Promise<any>;
    getBalance(id: string): Promise<number>;
    createAccount(req: any, createAccountDto: CreateAccountDto): Promise<any>;
    updateAccount(req: any, id: string, updateAccountDto: UpdateAccountDto): Promise<any>;
    private ensureAdminRole;
}
