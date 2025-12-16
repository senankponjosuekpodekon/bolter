import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';
export interface BackupCode {
    id: string;
    user_id: string;
    code_hash: string;
    used_at: string | null;
    created_at: string;
}
export declare class BackupCodesService {
    private readonly supabase;
    private readonly logger;
    private readonly CODE_LENGTH;
    private readonly CODE_COUNT;
    constructor(supabase: SupabaseService, logger: Logger);
    generateBackupCodes(userId: string): Promise<string[]>;
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    getRemainingCodesCount(userId: string): Promise<number>;
    hasBackupCodes(userId: string): Promise<boolean>;
    private generateCode;
    private hashCode;
}
