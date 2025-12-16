import { SupabaseService } from '../../supabase/supabase.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
export declare class DataCleanupService {
    private supabase;
    private auditLogsService;
    private readonly logger;
    private readonly RETENTION_DAYS;
    constructor(supabase: SupabaseService, auditLogsService: AuditLogsService);
    deleteUserFiles(userId: string): Promise<number>;
    private deleteAvatars;
    private deleteKycDocuments;
    purgeSoftDeletedRecords(): Promise<{
        accountsPurged: number;
        usersPurged: number;
    }>;
}
