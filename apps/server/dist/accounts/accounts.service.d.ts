import { SupabaseService } from '../supabase/supabase.service';
import { UpdateAccountDto } from './dto/update-account.dto';
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
    findByUserId(userId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    findAll(query: QueryAccountsDto): Promise<{
        data: any[];
        total: number;
    }>;
    findByIds(ids: string[]): Promise<any[]>;
    create(userId: string, dto: CreateAccountDto): Promise<any>;
    getBalance(accountId: string): Promise<number>;
    update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<any>;
}
