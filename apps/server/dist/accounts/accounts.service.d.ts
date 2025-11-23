import { SupabaseService } from '../supabase/supabase.service';
export interface Account {
    id: string;
    user_id: string;
    account_number: string;
    account_type: AccountType;
    balance: number;
    status: string;
    created_at?: string;
    user?: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
    };
}
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountType } from './dto/create-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AccountsService {
    private supabase;
    private readonly auditLogsService;
    private readonly notificationsService;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogsService: AuditLogsService, notificationsService: NotificationsService);
    findByUserId(userId: string): Promise<Account[]>;
    findById(id: string): Promise<Account>;
    findAll(query: QueryAccountsDto): Promise<{
        data: Account[];
        total: number;
    }>;
    findByIds(ids: string[]): Promise<Account[]>;
    create(userId: string, dto: CreateAccountDto): Promise<Account>;
    getBalance(accountId: string): Promise<number>;
    update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<Account>;
}
