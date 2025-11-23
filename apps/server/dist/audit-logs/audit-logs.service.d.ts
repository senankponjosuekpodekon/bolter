import { SupabaseService } from '../supabase/supabase.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
export interface AuditLogContext {
    ip?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
}
export interface CreateAuditLogOptions {
    action: string;
    resourceType: string;
    resourceId?: string | null;
    userId?: string | null;
    performedBy?: string | null;
    metadata?: Record<string, unknown>;
    context?: AuditLogContext;
}
export declare class AuditLogsService {
    private readonly supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    log(options: CreateAuditLogOptions): Promise<boolean>;
    findAll(query: QueryAuditLogsDto): Promise<{
        data: any[];
        total: number;
    }>;
}
