import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
    metadata?: Record<string, any>;
    context?: AuditLogContext;
}

@Injectable()
export class AuditLogsService {
    private readonly logger = new Logger(AuditLogsService.name);

    constructor(private readonly supabase: SupabaseService) { }

    async log(options: CreateAuditLogOptions): Promise<boolean> {
        const {
            action,
            resourceType,
            resourceId = null,
            userId = null,
            performedBy = null,
            metadata = {},
            context,
        } = options;

        const metadataPayload: Record<string, any> = {
            ...metadata,
        };

        if (performedBy) {
            metadataPayload.performed_by = performedBy;
        }
        if (context?.ip) {
            metadataPayload.ip = context.ip;
        }
        if (context?.userAgent) {
            metadataPayload.user_agent = context.userAgent;
        }
        if (context?.requestId) {
            metadataPayload.request_id = context.requestId;
        }

        const { error } = await this.supabase.getAdminClient().from('audit_logs').insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            metadata: Object.keys(metadataPayload).length ? metadataPayload : null,
        });

        if (error) {
            this.logger.error(`Failed to persist audit log (${action}): ${error.message}`);
            return false;
        }

        return true;
    }

    async findAll(query: QueryAuditLogsDto) {
        const { skip = 0, take = 25, action, entityType, entityId, userId, performedBy } = query;
        const client = this.supabase.getAdminClient();

        let request = client
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (action) {
            request = request.eq('action', action);
        }
        if (entityType) {
            request = request.eq('resource_type', entityType);
        }
        if (entityId) {
            request = request.eq('resource_id', entityId);
        }
        if (userId) {
            request = request.eq('user_id', userId);
        }
        if (performedBy) {
            request = request.contains('metadata', { performed_by: performedBy });
        }

        const to = take ? skip + take - 1 : skip + 24;
        const { data, error, count } = await request.range(skip, to);
        if (error) {
            throw new BadRequestException(`Failed to fetch audit logs: ${error.message}`);
        }

        const items = (data ?? []).map((item) => ({
            ...item,
            performedBy: item?.metadata?.performed_by ?? null,
            changes: item?.metadata?.changes ?? null,
        }));

        return {
            data: items,
            total: typeof count === 'number' ? count : items.length,
        };
    }
}
