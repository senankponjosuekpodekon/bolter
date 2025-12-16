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
var DataCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCleanupService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const audit_logs_service_1 = require("../../audit-logs/audit-logs.service");
let DataCleanupService = DataCleanupService_1 = class DataCleanupService {
    constructor(supabase, auditLogsService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.logger = new common_1.Logger(DataCleanupService_1.name);
        this.RETENTION_DAYS = 90;
    }
    async deleteUserFiles(userId) {
        let deletedCount = 0;
        try {
            const avatarCount = await this.deleteAvatars(userId);
            deletedCount += avatarCount;
            const kycCount = await this.deleteKycDocuments(userId);
            deletedCount += kycCount;
            this.logger.log(`Deleted ${deletedCount} files for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete user files for ${userId}:`, error);
            throw error;
        }
        return deletedCount;
    }
    async deleteAvatars(userId) {
        try {
            const client = this.supabase.getAdminClient();
            const { data: files, error: listError } = await client.storage
                .from('profile-avatars')
                .list(`${userId}`);
            if (listError) {
                this.logger.warn(`Failed to list avatar files for user ${userId}: ${listError.message}`);
                return 0;
            }
            if (!files || files.length === 0) {
                return 0;
            }
            for (const file of files) {
                const { error: deleteError } = await client.storage
                    .from('profile-avatars')
                    .remove([`${userId}/${file.name}`]);
                if (deleteError) {
                    this.logger.warn(`Failed to delete avatar ${userId}/${file.name}: ${deleteError.message}`);
                }
            }
            return files.length;
        }
        catch (error) {
            this.logger.warn(`Error deleting avatars for user ${userId}:`, error);
            return 0;
        }
    }
    async deleteKycDocuments(userId) {
        try {
            const client = this.supabase.getAdminClient();
            const { data: userFolders, error: listError } = await client.storage
                .from('kyc-documents')
                .list(`${userId}`);
            if (listError) {
                this.logger.warn(`Failed to list KYC folders for user ${userId}: ${listError.message}`);
                return 0;
            }
            if (!userFolders || userFolders.length === 0) {
                return 0;
            }
            let deletedCount = 0;
            for (const folder of userFolders) {
                if (folder.name && folder.id) {
                    const { data: documents, error: docListError } = await client.storage
                        .from('kyc-documents')
                        .list(`${userId}/${folder.name}`);
                    if (!docListError && documents) {
                        for (const doc of documents) {
                            const { error: deleteError } = await client.storage
                                .from('kyc-documents')
                                .remove([`${userId}/${folder.name}/${doc.name}`]);
                            if (!deleteError) {
                                deletedCount++;
                            }
                        }
                    }
                }
            }
            return deletedCount;
        }
        catch (error) {
            this.logger.warn(`Error deleting KYC documents for user ${userId}:`, error);
            return 0;
        }
    }
    async purgeSoftDeletedRecords() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
        const cutoffIso = cutoffDate.toISOString();
        let accountsPurged = 0;
        let usersPurged = 0;
        try {
            const { data: accountsToDelete, error: fetchAccountsError } = await this.supabase
                .getAdminClient()
                .from('accounts')
                .select('id, user_id')
                .lt('deleted_at', cutoffIso)
                .not('deleted_at', 'is', null);
            if (!fetchAccountsError && accountsToDelete) {
                for (const account of accountsToDelete) {
                    const { error: deleteError } = await this.supabase
                        .getAdminClient()
                        .from('accounts')
                        .delete()
                        .eq('id', account.id);
                    if (!deleteError) {
                        accountsPurged++;
                        await this.auditLogsService.log({
                            userId: account.user_id,
                            performedBy: 'system',
                            action: 'ACCOUNT_PERMANENTLY_DELETED',
                            resourceType: 'account',
                            resourceId: account.id,
                            metadata: {
                                reason: 'RGPD 90-day retention period expired',
                                purgedDate: new Date().toISOString(),
                            },
                        });
                    }
                }
            }
            const { data: usersToDelete, error: fetchUsersError } = await this.supabase
                .getAdminClient()
                .from('users')
                .select('id')
                .lt('deleted_at', cutoffIso)
                .not('deleted_at', 'is', null);
            if (!fetchUsersError && usersToDelete) {
                for (const user of usersToDelete) {
                    try {
                        await this.deleteUserFiles(user.id);
                        const { error: deleteError } = await this.supabase
                            .getAdminClient()
                            .from('users')
                            .delete()
                            .eq('id', user.id);
                        if (!deleteError) {
                            usersPurged++;
                            await this.auditLogsService.log({
                                userId: user.id,
                                performedBy: 'system',
                                action: 'USER_PERMANENTLY_DELETED',
                                resourceType: 'user',
                                resourceId: user.id,
                                metadata: {
                                    reason: 'RGPD 90-day retention period expired',
                                    purgedDate: new Date().toISOString(),
                                    cascadedDelete: true,
                                },
                            });
                        }
                    }
                    catch (error) {
                        this.logger.error(`Failed to purge user ${user.id}:`, error);
                    }
                }
            }
            this.logger.log(`Purge complete: ${accountsPurged} accounts, ${usersPurged} users deleted (90+ days old)`);
        }
        catch (error) {
            this.logger.error('Failed to purge soft-deleted records:', error);
            throw error;
        }
        return { accountsPurged, usersPurged };
    }
};
exports.DataCleanupService = DataCleanupService;
exports.DataCleanupService = DataCleanupService = DataCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService])
], DataCleanupService);
//# sourceMappingURL=data-cleanup.service.js.map