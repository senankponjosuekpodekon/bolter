import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getUserAccounts(req: any): Promise<any[]>;
    getAccount(id: string): Promise<any>;
    getBalance(id: string): Promise<number>;
    updateAccount(req: any, id: string, updateAccountDto: UpdateAccountDto): Promise<any>;
}
