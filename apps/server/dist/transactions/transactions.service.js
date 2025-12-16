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
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    constructor(supabase, accountsService, auditLogsService, notificationsService) {
        this.supabase = supabase;
        this.accountsService = accountsService;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(TransactionsService_1.name);
    }
    async createTransfer(userId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        const fromAccount = await this.accountsService.findById(dto.fromAccountId.toString());
        if (fromAccount.user_id !== userId) {
            this.logger.warn(`User ${userId} attempted transfer from account ${dto.fromAccountId} owned by ${fromAccount.user_id}`);
            throw new common_1.ForbiddenException('You can only transfer from your own accounts');
        }
        if (dto.toAccountId) {
            const toAccount = await this.accountsService.findById(dto.toAccountId.toString());
            if (toAccount.user_id !== userId) {
                this.logger.warn(`User ${userId} attempted transfer to internal account ${dto.toAccountId} owned by ${toAccount.user_id}`);
                throw new common_1.ForbiddenException('You can only transfer to your own internal accounts');
            }
        }
        if (Number(fromAccount.balance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .insert({
            from_account_id: dto.fromAccountId,
            to_account_id: dto.toAccountId || null,
            amount: dto.amount,
            currency: 'EUR',
            type: 'TRANSFER',
            status: 'PENDING',
            description: dto.description,
            iban_external: dto.ibanExternal || null,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create transfer: ${error.message}`);
        }
        await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
            type: 'TRANSFER',
            amount: dto.amount,
            toAccountId: dto.toAccountId ?? null,
            ibanExternal: dto.ibanExternal ?? null,
        });
        await this.notificationsService.notifyTransactionCreated({
            transactionId: data.id,
            userId,
            amount: Number(data.amount ?? dto.amount),
            type: 'TRANSFER',
            currency: data.currency,
            description: dto.description ?? undefined,
        });
        return data;
    }
    async createDeposit(userId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        const account = await this.accountsService.findById(dto.accountId.toString());
        if (account.user_id !== userId) {
            this.logger.warn(`User ${userId} attempted deposit to account ${dto.accountId} owned by ${account.user_id}`);
            throw new common_1.ForbiddenException('You can only deposit to your own accounts');
        }
        const description = this.buildDepositDescription(dto.paymentMethod, dto.reference, dto.description);
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .insert({
            from_account_id: null,
            to_account_id: dto.accountId,
            amount: dto.amount,
            currency: 'EUR',
            type: 'DEPOSIT',
            status: 'PENDING',
            description,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create deposit: ${error.message}`);
        }
        await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
            type: 'DEPOSIT',
            amount: dto.amount,
            paymentMethod: dto.paymentMethod,
        });
        await this.notificationsService.notifyTransactionCreated({
            transactionId: data.id,
            userId,
            amount: Number(data.amount ?? dto.amount),
            type: 'DEPOSIT',
            currency: data.currency,
            description,
        });
        return data;
    }
    async createWithdraw(userId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        const account = await this.accountsService.findById(dto.accountId.toString());
        if (account.user_id !== userId) {
            this.logger.warn(`User ${userId} attempted withdraw from account ${dto.accountId} owned by ${account.user_id}`);
            throw new common_1.ForbiddenException('You can only withdraw from your own accounts');
        }
        if (Number(account.balance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const description = dto.description || `Withdrawal to ${dto.bankDetails.iban}`;
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .insert({
            from_account_id: dto.accountId,
            to_account_id: null,
            amount: dto.amount,
            currency: 'EUR',
            type: 'WITHDRAWAL',
            status: 'PENDING',
            description,
            iban_external: dto.bankDetails.iban,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create withdrawal: ${error.message}`);
        }
        await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
            type: 'WITHDRAWAL',
            amount: dto.amount,
            ibanExternal: dto.bankDetails.iban,
        });
        await this.notificationsService.notifyTransactionCreated({
            transactionId: data.id,
            userId,
            amount: Number(data.amount ?? dto.amount),
            type: 'WITHDRAWAL',
            currency: data.currency,
            description,
        });
        return data;
    }
    async createCardTransaction(userId, dto) {
        const card = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*, accounts(id, user_id, balance, currency)')
            .eq('id', dto.cardId)
            .single();
        if (card.error || !card.data) {
            throw new common_1.NotFoundException('Card not found');
        }
        const cardData = card.data;
        const account = cardData.accounts;
        if (account.user_id !== userId) {
            throw new common_1.ForbiddenException('Card does not belong to your account');
        }
        if (cardData.status !== 'ACTIVE') {
            throw new common_1.BadRequestException(`Cannot use a ${cardData.status} card`);
        }
        const amount = Number(dto.amount);
        const currentBalance = Number(account.balance || 0);
        if (currentBalance < amount) {
            throw new common_1.BadRequestException('Insufficient balance for this transaction');
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .insert({
            account_id: account.id,
            user_id: userId,
            type: 'CARD_PAYMENT',
            amount,
            balance: currentBalance - amount,
            currency: String(account.currency || 'EUR'),
            description: dto.description || `Card payment - ${dto.merchant}`,
            card_id: dto.cardId,
            card_number: cardData.card_number,
            merchant: dto.merchant,
            category: dto.category,
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error) {
            this.logger.error(`Error creating card transaction: ${error.message}`);
            throw new common_1.BadRequestException('Failed to create card transaction');
        }
        const updateResult = await this.supabase
            .getAdminClient()
            .from('accounts')
            .update({ balance: currentBalance - amount })
            .eq('id', account.id);
        if (updateResult.error) {
            this.logger.error(`Error updating account balance: ${updateResult.error.message}`);
            throw new common_1.BadRequestException('Failed to update account balance');
        }
        await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
            type: 'CARD_PAYMENT',
            amount,
            cardId: dto.cardId,
            cardNumber: cardData.card_number,
            merchant: dto.merchant,
            category: dto.category,
        });
        await this.notificationsService.notifyTransactionCreated({
            transactionId: data.id,
            userId,
            amount,
            type: 'CARD_PAYMENT',
            currency: String(account.currency || 'EUR'),
            description: `Card payment at ${dto.merchant}`,
        });
        return data;
    }
    async findByUserId(userId) {
        const accounts = await this.accountsService.findByUserId(userId);
        const accountIds = accounts.map((account) => account.id);
        if (accountIds.length === 0) {
            this.logger.debug(`User ${userId} has no accounts; returning empty transaction list`);
            return [];
        }
        const formattedIds = accountIds.map((id) => `"${id}"`).join(',');
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .select('*')
            .or(`from_account_id.in.(${formattedIds}),to_account_id.in.(${formattedIds})`)
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch transactions: ${error.message}`);
        }
        return data;
    }
    async findPending() {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch pending transactions: ${error.message}`);
        }
        return data;
    }
    async findPendingById(id) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('status', 'PENDING')
            .maybeSingle();
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch transaction: ${error.message}`);
        }
        if (!data) {
            throw new common_1.NotFoundException('Pending transaction not found');
        }
        return data;
    }
    async findAllForAdmin(query) {
        const { skip = 0, take = 25, status, type, accountId, userId, search, autoApproved } = query;
        const client = this.supabase.getAdminClient();
        let request = client
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (status) {
            request = request.eq('status', status);
        }
        if (type) {
            request = request.eq('type', type);
        }
        if (autoApproved === 'true') {
            request = request.not('validated_by', 'is', null);
        }
        else if (autoApproved === 'false') {
            request = request.is('validated_by', null);
        }
        const orFilters = [];
        if (accountId) {
            orFilters.push(`from_account_id.eq.${accountId}`);
            orFilters.push(`to_account_id.eq.${accountId}`);
        }
        if (userId) {
            const userAccounts = await this.accountsService.findByUserId(userId);
            const ids = userAccounts.map((account) => account.id);
            if (ids.length === 0) {
                return { data: [], total: 0 };
            }
            const formatted = ids.map((id) => `"${id}"`).join(',');
            orFilters.push(`from_account_id.in.(${formatted})`);
            orFilters.push(`to_account_id.in.(${formatted})`);
        }
        if (search) {
            const pattern = `%${search}%`;
            orFilters.push(`description.ilike.${pattern}`);
            orFilters.push(`iban_external.ilike.${pattern}`);
        }
        if (orFilters.length) {
            request = request.or(orFilters.join(','));
        }
        const to = take ? skip + take - 1 : skip + 24;
        const { data, error, count } = await request.range(skip, to);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch transactions: ${error.message}`);
        }
        const items = data ?? [];
        const accountIds = Array.from(new Set(items
            .flatMap((tx) => [tx.from_account_id, tx.to_account_id])
            .filter((value) => Boolean(value))));
        const accountsMap = new Map();
        if (accountIds.length) {
            const { data: accounts, error: accountsError } = await client
                .from('accounts')
                .select('*, user:users(id, email, first_name, last_name, phone)')
                .in('id', accountIds);
            if (accountsError) {
                throw new common_1.BadRequestException(`Failed to load transaction accounts: ${accountsError.message}`);
            }
            accounts?.forEach((account) => {
                accountsMap.set(account.id, account);
            });
        }
        const validatorIds = Array.from(new Set(items.map((tx) => tx.validated_by).filter((value) => Boolean(value))));
        const validatorsMap = new Map();
        if (validatorIds.length) {
            const { data: validators, error: validatorsError } = await client
                .from('users')
                .select('id, email, first_name, last_name')
                .in('id', validatorIds);
            if (validatorsError) {
                throw new common_1.BadRequestException(`Failed to load validator profiles: ${validatorsError.message}`);
            }
            validators?.forEach((user) => {
                validatorsMap.set(user.id, user);
            });
        }
        const enriched = items.map((transaction) => ({
            ...transaction,
            fromAccount: transaction.from_account_id ? accountsMap.get(transaction.from_account_id) ?? null : null,
            toAccount: transaction.to_account_id ? accountsMap.get(transaction.to_account_id) ?? null : null,
            validator: transaction.validated_by ? validatorsMap.get(transaction.validated_by) ?? null : null,
        }));
        return {
            data: enriched,
            total: typeof count === 'number' ? count : enriched.length,
        };
    }
    async createAdminTransaction(adminId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        const currency = dto.currency ?? 'EUR';
        const autoApprove = dto.autoApprove ?? true;
        switch (dto.type) {
            case 'TRANSFER':
                return this.createAdminTransfer(adminId, dto, currency, autoApprove);
            case 'DEPOSIT':
                return this.createAdminDeposit(adminId, dto, currency, autoApprove);
            case 'WITHDRAWAL':
                return this.createAdminWithdrawal(adminId, dto, currency, autoApprove);
            default:
                throw new common_1.BadRequestException(`Unsupported transaction type: ${dto.type}`);
        }
    }
    async validateTransaction(adminId, transactionId, dto) {
        const client = this.supabase.getAdminClient();
        const { data: transaction, error: fetchError } = await client
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .maybeSingle();
        if (fetchError || !transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.status !== 'PENDING') {
            throw new common_1.BadRequestException('Transaction has already been processed');
        }
        const amount = Number(transaction.amount);
        const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
        let fromAccount = null;
        let toAccount = null;
        if (dto.approved) {
            if ((transaction.type === 'TRANSFER' || transaction.type === 'WITHDRAWAL') && transaction.from_account_id) {
                fromAccount = await this.accountsService.findById(transaction.from_account_id.toString());
                const currentBalance = Number(fromAccount.balance);
                if (currentBalance < amount) {
                    throw new common_1.BadRequestException('Insufficient balance');
                }
                await this.updateAccountBalance(transaction.from_account_id, currentBalance - amount);
            }
            if ((transaction.type === 'TRANSFER' || transaction.type === 'DEPOSIT') && transaction.to_account_id) {
                toAccount = await this.accountsService.findById(transaction.to_account_id.toString());
                const currentBalance = Number(toAccount.balance);
                await this.updateAccountBalance(transaction.to_account_id, currentBalance + amount);
            }
        }
        if (!dto.approved) {
            if (!fromAccount && transaction.from_account_id) {
                fromAccount = await this.accountsService.findById(transaction.from_account_id.toString());
            }
            if (!toAccount && transaction.to_account_id) {
                toAccount = await this.accountsService.findById(transaction.to_account_id.toString());
            }
        }
        const { data, error } = await client
            .from('transactions')
            .update({
            status: newStatus,
            validated_by: adminId,
            validated_at: new Date().toISOString(),
            rejection_reason: dto.rejectionReason || null,
        })
            .eq('id', transactionId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to validate transaction: ${error.message}`);
        }
        const targetUserId = transaction.from_account_id
            ? fromAccount?.user_id ?? null
            : toAccount?.user_id ?? null;
        await this.logTransactionAction(targetUserId, adminId, dto.approved ? 'TRANSACTION_APPROVED' : 'TRANSACTION_REJECTED', transactionId, {
            type: transaction.type,
            amount: transaction.amount,
            rejectionReason: dto.rejectionReason ?? null,
        });
        if (targetUserId) {
            await this.notificationsService.notifyTransactionUpdated({
                transactionId,
                userId: targetUserId,
                status: dto.approved ? 'APPROVED' : 'REJECTED',
                amount: Number(transaction.amount ?? data.amount),
                type: transaction.type,
                currency: transaction.currency ?? data?.currency ?? 'EUR',
                rejectionReason: dto.rejectionReason ?? undefined,
            });
        }
        return data;
    }
    buildDepositDescription(paymentMethod, reference, description) {
        if (description) {
            return description;
        }
        return `Deposit via ${paymentMethod}${reference ? ` - Ref: ${reference}` : ''}`;
    }
    async createAdminTransfer(adminId, dto, currency, autoApprove) {
        if (!dto.fromAccountId) {
            throw new common_1.BadRequestException('fromAccountId is required for transfers');
        }
        if (!dto.toAccountId && !dto.ibanExternal) {
            throw new common_1.BadRequestException('Provide either toAccountId or ibanExternal for transfers');
        }
        if (dto.toAccountId && dto.toAccountId === dto.fromAccountId) {
            throw new common_1.BadRequestException('Cannot transfer to the same account');
        }
        const client = this.supabase.getAdminClient();
        const fromAccount = await this.accountsService.findById(dto.fromAccountId.toString());
        const toAccount = dto.toAccountId ? await this.accountsService.findById(dto.toAccountId.toString()) : null;
        if (autoApprove && Number(fromAccount.balance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const status = autoApprove ? 'APPROVED' : 'PENDING';
        const description = dto.description || (dto.toAccountId ? `Admin transfer to account ${dto.toAccountId}` : `Admin transfer to ${dto.ibanExternal}`);
        const { data, error } = await client
            .from('transactions')
            .insert({
            from_account_id: dto.fromAccountId,
            to_account_id: dto.toAccountId ?? null,
            amount: dto.amount,
            currency,
            type: 'TRANSFER',
            status,
            description,
            iban_external: dto.ibanExternal ?? null,
            validated_by: autoApprove ? adminId : null,
            validated_at: autoApprove ? new Date().toISOString() : null,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create transfer: ${error.message}`);
        }
        if (autoApprove) {
            const fromBalance = Number(fromAccount.balance) - dto.amount;
            await this.updateAccountBalance(fromAccount.id, fromBalance);
            if (toAccount) {
                const toBalance = Number(toAccount.balance) + dto.amount;
                await this.updateAccountBalance(toAccount.id, toBalance);
            }
        }
        await this.logTransactionAction(fromAccount.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
            type: 'TRANSFER',
            status,
            amount: data.amount,
            autoApprove,
            toAccountId: dto.toAccountId ?? null,
            ibanExternal: dto.ibanExternal ?? null,
        });
        if (autoApprove) {
            await this.logTransactionAction(fromAccount.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
                type: 'TRANSFER',
                amount: data.amount,
            });
        }
        const amountValue = Number(data.amount ?? dto.amount);
        if (!autoApprove) {
            await this.notificationsService.notifyTransactionCreated({
                transactionId: data.id,
                userId: fromAccount.user_id,
                amount: amountValue,
                type: 'TRANSFER',
                currency: data.currency,
                description,
            });
            if (toAccount && toAccount.user_id && toAccount.user_id !== fromAccount.user_id) {
                await this.notificationsService.notifyTransactionCreated({
                    transactionId: data.id,
                    userId: toAccount.user_id,
                    amount: amountValue,
                    type: 'TRANSFER',
                    currency: data.currency,
                    description,
                });
            }
        }
        else {
            await this.notificationsService.notifyTransactionUpdated({
                transactionId: data.id,
                userId: fromAccount.user_id,
                status: 'APPROVED',
                amount: amountValue,
                type: 'TRANSFER',
                currency,
            });
            if (toAccount && toAccount.user_id && toAccount.user_id !== fromAccount.user_id) {
                await this.notificationsService.notifyTransactionUpdated({
                    transactionId: data.id,
                    userId: toAccount.user_id,
                    status: 'APPROVED',
                    amount: amountValue,
                    type: 'TRANSFER',
                    currency,
                });
            }
        }
        return data;
    }
    async createAdminDeposit(adminId, dto, currency, autoApprove) {
        if (!dto.toAccountId) {
            throw new common_1.BadRequestException('toAccountId is required for deposits');
        }
        if (!dto.paymentMethod) {
            throw new common_1.BadRequestException('paymentMethod is required for deposits');
        }
        const client = this.supabase.getAdminClient();
        const account = await this.accountsService.findById(dto.toAccountId.toString());
        const status = autoApprove ? 'APPROVED' : 'PENDING';
        const description = this.buildDepositDescription(dto.paymentMethod, dto.reference, dto.description);
        const { data, error } = await client
            .from('transactions')
            .insert({
            from_account_id: null,
            to_account_id: dto.toAccountId,
            amount: dto.amount,
            currency,
            type: 'DEPOSIT',
            status,
            description,
            validated_by: autoApprove ? adminId : null,
            validated_at: autoApprove ? new Date().toISOString() : null,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create deposit: ${error.message}`);
        }
        if (autoApprove) {
            const newBalance = Number(account.balance) + dto.amount;
            await this.updateAccountBalance(account.id, newBalance);
        }
        await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
            type: 'DEPOSIT',
            status,
            amount: data.amount,
            autoApprove,
            paymentMethod: dto.paymentMethod,
        });
        if (autoApprove) {
            await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
                type: 'DEPOSIT',
                amount: data.amount,
            });
        }
        const amountValue = Number(data.amount ?? dto.amount);
        if (!autoApprove) {
            await this.notificationsService.notifyTransactionCreated({
                transactionId: data.id,
                userId: account.user_id,
                amount: amountValue,
                type: 'DEPOSIT',
                currency: data.currency,
                description,
            });
        }
        else {
            await this.notificationsService.notifyTransactionUpdated({
                transactionId: data.id,
                userId: account.user_id,
                status: 'APPROVED',
                amount: amountValue,
                type: 'DEPOSIT',
                currency,
            });
        }
        return data;
    }
    async createAdminWithdrawal(adminId, dto, currency, autoApprove) {
        if (!dto.fromAccountId) {
            throw new common_1.BadRequestException('fromAccountId is required for withdrawals');
        }
        if (!dto.bankDetails) {
            throw new common_1.BadRequestException('bankDetails are required for withdrawals');
        }
        const client = this.supabase.getAdminClient();
        const account = await this.accountsService.findById(dto.fromAccountId.toString());
        if (autoApprove && Number(account.balance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const status = autoApprove ? 'APPROVED' : 'PENDING';
        const description = dto.description || `Withdrawal to ${dto.bankDetails.iban}`;
        const { data, error } = await client
            .from('transactions')
            .insert({
            from_account_id: dto.fromAccountId,
            to_account_id: null,
            amount: dto.amount,
            currency,
            type: 'WITHDRAWAL',
            status,
            description,
            iban_external: dto.bankDetails.iban,
            validated_by: autoApprove ? adminId : null,
            validated_at: autoApprove ? new Date().toISOString() : null,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create withdrawal: ${error.message}`);
        }
        if (autoApprove) {
            const newBalance = Number(account.balance) - dto.amount;
            if (newBalance < 0) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            await this.updateAccountBalance(account.id, newBalance);
        }
        await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
            type: 'WITHDRAWAL',
            status,
            amount: data.amount,
            autoApprove,
            ibanExternal: dto.bankDetails.iban,
        });
        if (autoApprove) {
            await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
                type: 'WITHDRAWAL',
                amount: data.amount,
            });
        }
        const amountValue = Number(data.amount ?? dto.amount);
        if (!autoApprove) {
            await this.notificationsService.notifyTransactionCreated({
                transactionId: data.id,
                userId: account.user_id,
                amount: amountValue,
                type: 'WITHDRAWAL',
                currency: data.currency,
                description,
            });
        }
        else {
            await this.notificationsService.notifyTransactionUpdated({
                transactionId: data.id,
                userId: account.user_id,
                status: 'APPROVED',
                amount: amountValue,
                type: 'WITHDRAWAL',
                currency,
            });
        }
        return data;
    }
    async updateAccountBalance(accountId, newBalance) {
        const rounded = Number(newBalance.toFixed(2));
        const { error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .update({ balance: rounded })
            .eq('id', accountId);
        if (error) {
            throw new common_1.BadRequestException(`Failed to update account balance: ${error.message}`);
        }
    }
    async logTransactionAction(userId, performedBy, action, transactionId, changes) {
        const metadata = changes && Object.keys(changes).length ? { changes } : undefined;
        const success = await this.auditLogsService.log({
            userId,
            performedBy,
            action,
            resourceType: 'transaction',
            resourceId: transactionId,
            metadata,
        });
        if (!success) {
            this.logger.error(`Failed to write audit log for transaction ${transactionId}`);
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        accounts_service_1.AccountsService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map