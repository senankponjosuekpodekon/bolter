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
const account_number_util_1 = require("../common/utils/account-number.util");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AccountsService = AccountsService_1 = class AccountsService {
    constructor(supabase, auditLogsService, notificationsService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AccountsService_1.name);
    }
    async findByUserId(userId) {
        const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('user_id', userId);
        if (error)
            throw new Error(`Failed to fetch accounts: ${error.message}`);
        return data;
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
        const items = data ?? [];
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
        return data ?? [];
    }
    async create(userId, dto) {
        const accountType = dto.accountType || 'SAVINGS';
        const accountNumber = (0, account_number_util_1.generateFrenchIban)();
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .insert({
            user_id: userId,
            account_number: accountNumber,
            account_type: accountType,
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
        return parseFloat(account.balance);
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
        if (!Object.keys(updateData).length) {
            return account;
        }
        const { data, error } = await this.supabase
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
        return data;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map