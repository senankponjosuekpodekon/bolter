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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
let TransactionsService = class TransactionsService {
    constructor(supabase, accountsService) {
        this.supabase = supabase;
        this.accountsService = accountsService;
    }
    async createTransfer(userId, dto) {
        const fromAccount = await this.accountsService.findById(dto.fromAccountId);
        if (fromAccount.user_id !== userId)
            throw new common_1.BadRequestException('You can only transfer from your own accounts');
        if (parseFloat(fromAccount.balance) < dto.amount)
            throw new common_1.BadRequestException('Insufficient balance');
        const { data, error } = await this.supabase.getAdminClient().from('transactions').insert({
            from_account_id: dto.fromAccountId, to_account_id: dto.toAccountId || null, amount: dto.amount,
            currency: 'EUR', type: 'TRANSFER', status: 'PENDING', description: dto.description, iban_external: dto.ibanExternal || null,
        }).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create transfer: ${error.message}`);
        return data;
    }
    async findByUserId(userId) {
        const accounts = await this.accountsService.findByUserId(userId);
        const accountIds = accounts.map(a => a.id);
        const { data, error } = await this.supabase.getAdminClient().from('transactions').select('*')
            .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`).order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch transactions: ${error.message}`);
        return data;
    }
    async findPending() {
        const { data, error } = await this.supabase.getAdminClient().from('transactions').select('*').eq('status', 'PENDING').order('created_at', { ascending: true });
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch pending transactions: ${error.message}`);
        return data;
    }
    async validateTransaction(adminId, transactionId, dto) {
        const { data: transaction, error: fetchError } = await this.supabase.getAdminClient().from('transactions').select('*').eq('id', transactionId).maybeSingle();
        if (fetchError || !transaction)
            throw new common_1.NotFoundException('Transaction not found');
        if (transaction.status !== 'PENDING')
            throw new common_1.BadRequestException('Transaction has already been processed');
        const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
        if (dto.approved) {
            const fromAccount = await this.accountsService.findById(transaction.from_account_id);
            const currentBalance = parseFloat(fromAccount.balance);
            if (currentBalance < parseFloat(transaction.amount))
                throw new common_1.BadRequestException('Insufficient balance');
            await this.supabase.getAdminClient().from('accounts').update({ balance: currentBalance - parseFloat(transaction.amount) }).eq('id', transaction.from_account_id);
            if (transaction.to_account_id) {
                const toAccount = await this.accountsService.findById(transaction.to_account_id);
                const toBalance = parseFloat(toAccount.balance);
                await this.supabase.getAdminClient().from('accounts').update({ balance: toBalance + parseFloat(transaction.amount) }).eq('id', transaction.to_account_id);
            }
        }
        const { data, error } = await this.supabase.getAdminClient().from('transactions').update({
            status: newStatus, validated_by: adminId, validated_at: new Date().toISOString(), rejection_reason: dto.rejectionReason || null,
        }).eq('id', transactionId).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to validate transaction: ${error.message}`);
        return data;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService, accounts_service_1.AccountsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map