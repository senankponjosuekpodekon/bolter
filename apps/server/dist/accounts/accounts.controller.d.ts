import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getAccounts(req: any, query: QueryAccountsDto): Promise<import("./accounts.service").Account[]> | Promise<{
        data: import("./accounts.service").Account[];
        total: number;
    }>;
    getAccount(id: string): Promise<import("./accounts.service").Account>;
    getBalance(id: string): Promise<number>;
    createAccount(req: any, createAccountDto: CreateAccountDto): Promise<import("./accounts.service").Account>;
    createAccountAsAdmin(req: any, userId: string, createAccountDto: CreateAccountDto): Promise<import("./accounts.service").Account>;
    updateAccount(req: any, id: string, updateAccountDto: UpdateAccountDto): Promise<import("./accounts.service").Account>;
    deleteAccount(req: any, id: string, deleteAccountDto: DeleteAccountDto): Promise<{
        message: string;
        deletedAt: string;
    }>;
    private ensureAdminRole;
}
