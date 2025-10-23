import { AccountsService } from './accounts.service';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getUserAccounts(req: any): Promise<any[]>;
    getAccount(id: string): Promise<any>;
    getBalance(id: string): Promise<number>;
}
