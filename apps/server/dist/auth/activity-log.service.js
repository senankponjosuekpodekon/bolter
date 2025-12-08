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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ActivityLogService = class ActivityLogService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async logActivity(entry) {
        try {
            await this.supabase.getAdminClient().from('activity_logs').insert({
                user_id: entry.userId,
                action: entry.action,
                resource_id: entry.resourceId,
                resource_type: entry.resourceType,
                changes: entry.changes,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                created_at: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    async getActivityLogs(userId, limit = 100) {
        try {
            let query = this.supabase.getAdminClient().from('activity_logs').select('*');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Failed to fetch activity logs:', error);
            return [];
        }
    }
};
exports.ActivityLogService = ActivityLogService;
exports.ActivityLogService = ActivityLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ActivityLogService);
//# sourceMappingURL=activity-log.service.js.map