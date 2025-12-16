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
var AccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const data_cleanup_service_1 = require("../common/services/data-cleanup.service");
const account_number_util_1 = require("../common/utils/account-number.util");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AccountsService = AccountsService_1 = class AccountsService {
    constructor(supabase, auditLogsService, notificationsService, dataCleanupService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.dataCleanupService = dataCleanupService;
        this.logger = new common_1.Logger(AccountsService_1.name);
    }
    async findByUserId(userId) {
        const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('user_id', userId);
        if (error)
            throw new Error(`Failed to fetch accounts: ${error.message}`);
        return (data ?? []);
    }
    async findById(id) {
        const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('id', id).maybeSingle();
        if (error)
            throw new Error(`Failed to fetch account: ${error.message}`);
        if (!data)
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        return data;
    }
    async findAll(query) {
        const { skip = 0, take = 25, status, userId, search } = query;
        const client = this.supabase.getAdminClient();
        let request = client
            .from('accounts')
            .select('*, user:users(id, email, first_name, last_name, phone)', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (userId) {
            request = request.eq('user_id', userId);
        }
        if (status) {
            request = request.eq('status', status);
        }
        if (search) {
            const pattern = `%${search}%`;
            request = request.ilike('account_number', pattern);
        }
        const to = take ? skip + take - 1 : skip + 24;
        const { data, error, count } = await request.range(skip, to);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch accounts: ${error.message}`);
        }
        const items = (data ?? []);
        return {
            data: items,
            total: typeof count === 'number' ? count : items.length,
        };
    }
    async findByIds(ids) {
        if (!ids.length) {
            return [];
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('*, user:users(id, email, first_name, last_name, phone)')
            .in('id', ids);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch accounts: ${error.message}`);
        }
        return (data ?? []);
    }
    async create(userId, dto, bypassLimits = false) {
        const accountType = dto.accountType || 'SAVINGS';
        const currency = dto.currency || 'EUR';
        const limit = dto.limit || 1000;
        const accountNumber = (0, account_number_util_1.generateFrenchIban)();
        if (!bypassLimits) {
            const { data: existingAccounts, error: fetchError } = await this.supabase
                .getAdminClient()
                .from('accounts')
                .select('account_type')
                .eq('user_id', userId);
            if (fetchError) {
                throw new common_1.BadRequestException(`Failed to verify account limits: ${fetchError.message}`);
            }
            const accountTypeCounts = existingAccounts?.reduce((acc, acc_item) => {
                acc[acc_item.account_type] = (acc[acc_item.account_type] || 0) + 1;
                return acc;
            }, {}) ?? {};
            if ((accountTypeCounts[accountType] ?? 0) >= 2) {
                throw new common_1.BadRequestException(`You already have ${accountTypeCounts[accountType]} ${accountType} account(s). Maximum 2 ${accountType} accounts allowed per user.`);
            }
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .insert({
            user_id: userId,
            account_number: accountNumber,
            account_type: accountType,
            currency: currency,
            limit: limit,
            balance: 0,
            status: 'ACTIVE',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create account: ${error.message}`);
        const success = await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'ACCOUNT_CREATED',
            resourceType: 'account',
            resourceId: data.id,
            metadata: {
                changes: {
                    accountType,
                    currency,
                    limit,
                    accountNumber,
                },
            },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for account creation (${data.id})`);
        }
        await this.notificationsService.notifyAccountCreated(userId, accountNumber);
        return data;
    }
    async getBalance(accountId) {
        const account = await this.findById(accountId);
        return account.balance;
    }
    async update(adminId, accountId, updateDto) {
        const account = await this.findById(accountId);
        const updateData = {};
        if (updateDto.accountNumber !== undefined) {
            updateData.account_number = updateDto.accountNumber;
        }
        if (updateDto.accountType !== undefined) {
            updateData.account_type = updateDto.accountType;
        }
        if (updateDto.status !== undefined) {
            updateData.status = updateDto.status;
        }
        if (updateDto.balance !== undefined) {
            const roundedBalance = Math.round(updateDto.balance * 100) / 100;
            updateData.balance = roundedBalance;
        }
        if (updateDto.currency !== undefined) {
            updateData.currency = updateDto.currency;
        }
        if (updateDto.limit !== undefined) {
            updateData.limit = updateDto.limit;
        }
        if (!Object.keys(updateData).length) {
            return account;
        }
        const { data: updatedAccount, error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .update(updateData)
            .eq('id', accountId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update account: ${error.message}`);
        const success = await this.auditLogsService.log({
            userId: account.user_id,
            performedBy: adminId,
            action: 'ACCOUNT_UPDATED',
            resourceType: 'account',
            resourceId: accountId,
            metadata: { changes: updateData },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for account update (${accountId})`);
        }
        return updatedAccount;
    }
    async delete(userId, accountId, deleteDto) {
        const account = await this.findById(accountId);
        if (account.user_id !== userId) {
            throw new common_1.BadRequestException('You can only delete your own accounts');
        }
        const deletedAt = new Date().toISOString();
        const updateData = {
            deleted_at: deletedAt,
            deletion_reason: deleteDto.reason || 'User-initiated account deletion',
            status: 'DELETED',
        };
        const { error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .update(updateData)
            .eq('id', accountId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to delete account: ${error.message}`);
        if (deleteDto.permanent) {
            try {
                await this.dataCleanupService.deleteUserFiles(userId);
                this.logger.log(`Permanently deleted all files for user ${userId}`);
            }
            catch (cleanupError) {
                this.logger.error(`Failed to permanently delete user files: ${cleanupError}`, cleanupError);
            }
        }
        const success = await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'ACCOUNT_DELETED',
            resourceType: 'account',
            resourceId: accountId,
            metadata: {
                reason: deleteDto.reason,
                permanent: deleteDto.permanent || false,
                retentionDays: deleteDto.permanent ? 0 : 90,
            },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for account deletion (${accountId})`);
        }
        await this.notificationsService.notifyAccountDeleted(userId, account.account_number);
        return {
            message: `Account marked for deletion. Data will be retained for 90 days before permanent removal (RGPD compliance).`,
            deletedAt,
        };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService,
        data_cleanup_service_1.DataCleanupService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map