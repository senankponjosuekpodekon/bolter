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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AccountsService = class AccountsService {
    constructor(supabase) {
        this.supabase = supabase;
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
    async getBalance(accountId) {
        const account = await this.findById(accountId);
        return parseFloat(account.balance);
    }
    async update(adminId, accountId, updateDto) {
        const account = await this.findById(accountId);
        const updateData = {};
        if (updateDto.accountNumber) {
            updateData.account_number = updateDto.accountNumber;
        }
        const { data, error } = await this.supabase.getAdminClient()
            .from('accounts')
            .update(updateData)
            .eq('id', accountId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update account: ${error.message}`);
        await this.supabase.getAdminClient().from('audit_logs').insert({
            user_id: account.user_id,
            action: 'ACCOUNT_UPDATED',
            entity_type: 'account',
            entity_id: accountId,
            performed_by: adminId,
            changes: updateData,
        });
        return data;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map