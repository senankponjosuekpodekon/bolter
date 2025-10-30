"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLogsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuditLogsService = AuditLogsService_1 = class AuditLogsService {
    constructor(supabase) {
        this.supabase = supabase;
        this.logger = new common_1.Logger(AuditLogsService_1.name);
    }
    async log(options) {
        const { action, resourceType, resourceId = null, userId = null, performedBy = null, metadata = {}, context, } = options;
        const metadataPayload = {
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
    async findAll(query) {
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
            throw new common_1.BadRequestException(`Failed to fetch audit logs: ${error.message}`);
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
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = AuditLogsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map