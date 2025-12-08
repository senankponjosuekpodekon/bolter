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
exports.BulkOperationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const activity_log_service_1 = require("../auth/activity-log.service");
let BulkOperationsService = class BulkOperationsService {
    constructor(supabase, activityLog) {
        this.supabase = supabase;
        this.activityLog = activityLog;
    }
    async bulkReviewKYCDocuments(userId, payload) {
        const { ids, action, reason } = payload;
        if (!ids || ids.length === 0) {
            throw new common_1.BadRequestException('No document IDs provided');
        }
        if (!['approve', 'reject'].includes(action)) {
            throw new common_1.BadRequestException('Invalid action. Must be "approve" or "reject"');
        }
        const results = { success: 0, failed: 0, details: [] };
        for (const docId of ids) {
            try {
                const { data: doc } = await this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('*')
                    .eq('id', docId)
                    .maybeSingle();
                if (!doc) {
                    results.failed++;
                    results.details.push(`Document ${docId}: Not found`);
                    continue;
                }
                const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
                const { error } = await this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .update({
                    status: newStatus,
                    reviewed_by: userId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: reason || null,
                })
                    .eq('id', docId);
                if (error) {
                    results.failed++;
                    results.details.push(`Document ${docId}: ${error.message}`);
                }
                else {
                    results.success++;
                    results.details.push(`Document ${docId}: ${newStatus}`);
                    await this.activityLog.logActivity({
                        userId,
                        action: `kyc_document_${newStatus.toLowerCase()}`,
                        resourceId: docId,
                        resourceType: 'kyc_document',
                        changes: { status: newStatus, notes: reason },
                    });
                }
            }
            catch (err) {
                results.failed++;
                results.details.push(`Document ${docId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    async bulkReviewTransactions(userId, payload) {
        const { ids, action, reason } = payload;
        if (!ids || ids.length === 0) {
            throw new common_1.BadRequestException('No transaction IDs provided');
        }
        if (!['approve', 'reject'].includes(action)) {
            throw new common_1.BadRequestException('Invalid action. Must be "approve" or "reject"');
        }
        const results = { success: 0, failed: 0, details: [] };
        for (const txId of ids) {
            try {
                const { data: tx } = await this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .select('*')
                    .eq('id', txId)
                    .maybeSingle();
                if (!tx) {
                    results.failed++;
                    results.details.push(`Transaction ${txId}: Not found`);
                    continue;
                }
                if (tx.status !== 'PENDING') {
                    results.failed++;
                    results.details.push(`Transaction ${txId}: Cannot modify non-pending transaction (current status: ${tx.status})`);
                    continue;
                }
                const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
                const { error } = await this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .update({
                    status: newStatus,
                    reviewed_by: userId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: reason || null,
                })
                    .eq('id', txId);
                if (error) {
                    results.failed++;
                    results.details.push(`Transaction ${txId}: ${error.message}`);
                }
                else {
                    results.success++;
                    results.details.push(`Transaction ${txId}: ${newStatus}`);
                    await this.activityLog.logActivity({
                        userId,
                        action: `transaction_${newStatus.toLowerCase()}`,
                        resourceId: txId,
                        resourceType: 'transaction',
                        changes: { status: newStatus, notes: reason },
                    });
                }
            }
            catch (err) {
                results.failed++;
                results.details.push(`Transaction ${txId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    async bulkFlagItems(userId, resourceType, payload) {
        const { ids, reason } = payload;
        if (!ids || ids.length === 0) {
            throw new common_1.BadRequestException('No IDs provided');
        }
        const results = { success: 0, failed: 0, details: [] };
        for (const id of ids) {
            try {
                const { error } = await this.supabase
                    .getAdminClient()
                    .from(resourceType)
                    .update({
                    flagged_for_review: true,
                    flagged_at: new Date().toISOString(),
                    flagged_by: userId,
                    flag_reason: reason || null,
                })
                    .eq('id', id);
                if (error) {
                    results.failed++;
                    results.details.push(`${id}: ${error.message}`);
                }
                else {
                    results.success++;
                    results.details.push(`${id}: Flagged for review`);
                    await this.activityLog.logActivity({
                        userId,
                        action: `${resourceType}_flagged`,
                        resourceId: id,
                        resourceType,
                        changes: { flagged: true, reason },
                    });
                }
            }
            catch (err) {
                results.failed++;
                results.details.push(`${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    async bulkDeleteItems(userId, resourceType, payload) {
        const { ids } = payload;
        if (!ids || ids.length === 0) {
            throw new common_1.BadRequestException('No IDs provided');
        }
        const results = { success: 0, failed: 0, details: [] };
        for (const id of ids) {
            try {
                const { error } = await this.supabase
                    .getAdminClient()
                    .from(resourceType)
                    .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: userId,
                })
                    .eq('id', id);
                if (error) {
                    results.failed++;
                    results.details.push(`${id}: ${error.message}`);
                }
                else {
                    results.success++;
                    results.details.push(`${id}: Deleted`);
                    await this.activityLog.logActivity({
                        userId,
                        action: `${resourceType}_deleted`,
                        resourceId: id,
                        resourceType,
                        changes: { deleted: true },
                    });
                }
            }
            catch (err) {
                results.failed++;
                results.details.push(`${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    async getBulkOperationStats(userId) {
        try {
            const [kycResult, txResult, flaggedResult] = await Promise.all([
                this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
                this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
                this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('flagged_for_review', true),
            ]);
            return {
                pendingKyc: kycResult.count || 0,
                pendingTransactions: txResult.count || 0,
                flaggedItems: flaggedResult.count || 0,
                recentBulkActions: 0,
            };
        }
        catch (err) {
            return {
                pendingKyc: 0,
                pendingTransactions: 0,
                flaggedItems: 0,
                recentBulkActions: 0,
            };
        }
    }
};
exports.BulkOperationsService = BulkOperationsService;
exports.BulkOperationsService = BulkOperationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        activity_log_service_1.ActivityLogService])
], BulkOperationsService);
//# sourceMappingURL=bulk-operations.service.js.map