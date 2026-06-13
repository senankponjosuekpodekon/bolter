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
var CardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let CardsService = CardsService_1 = class CardsService {
    constructor(supabase, auditLogsService, notificationsService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(CardsService_1.name);
    }
    async findByAccountId(accountId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('account_id', accountId);
        if (error)
            throw new Error(`Failed to fetch cards: ${error.message}`);
        return (data ?? []);
    }
    async findByUserId(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select(`
                *,
                accounts!inner(user_id)
            `)
            .eq('accounts.user_id', userId);
        if (error)
            throw new Error(`Failed to fetch user cards: ${error.message}`);
        return (data ?? []);
    }
    async findById(id) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Failed to fetch card: ${error.message}`);
        if (!data)
            throw new common_1.NotFoundException(`Card with ID ${id} not found`);
        return data;
    }
    async findByCardNumber(cardNumber) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('card_number', cardNumber)
            .maybeSingle();
        if (error)
            throw new Error(`Failed to fetch card: ${error.message}`);
        return (data ?? null);
    }
    async create(userId, accountId, dto, bypassLimits = false, tenantId) {
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('id, user_id')
            .eq('id', accountId)
            .maybeSingle();
        if (accountError || !account) {
            throw new common_1.BadRequestException(`Account with ID ${accountId} not found`);
        }
        if (account.user_id !== userId) {
            throw new common_1.BadRequestException('Account does not belong to this user');
        }
        const type = dto.type || 'VIRTUAL';
        if (type === 'VIRTUAL' && !bypassLimits) {
            const { data: userAccounts, error: accountsError } = await this.supabase
                .getAdminClient()
                .from('accounts')
                .select('id')
                .eq('user_id', userId);
            if (accountsError) {
                throw new common_1.BadRequestException(`Failed to check card limits: ${accountsError.message}`);
            }
            const accountIds = userAccounts?.map((a) => a.id) ?? [];
            const { data: userCards, error: cardsError } = await this.supabase
                .getAdminClient()
                .from('cards')
                .select('id')
                .eq('type', 'VIRTUAL')
                .in('account_id', accountIds);
            if (cardsError) {
                throw new common_1.BadRequestException(`Failed to check card limits: ${cardsError.message}`);
            }
            const virtualCardCount = userCards?.length ?? 0;
            if (virtualCardCount >= 6) {
                throw new common_1.BadRequestException('You have reached the maximum limit of 6 virtual cards. Please delete unused cards before creating new ones.');
            }
        }
        const cardNumber = this.generateCardNumber(type);
        const cvv = this.generateCVV();
        const expiryDate = this.generateExpiryDate();
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .insert({
            account_id: accountId,
            card_number: cardNumber,
            type: type,
            cvv: cvv,
            expiry_date: expiryDate,
            status: 'ACTIVE',
            tenant_id: tenantId ?? null,
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create card: ${error.message}`);
        const success = await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'CARD_CREATED',
            resourceType: 'card',
            resourceId: data.id,
            metadata: {
                changes: {
                    cardType: type,
                    accountId,
                },
            },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for card creation (${data.id})`);
        }
        await this.notificationsService.notifyCardCreated(userId, cardNumber, type);
        return data;
    }
    async update(userId, cardId, updateDto) {
        const card = await this.findById(cardId);
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('user_id')
            .eq('id', card.account_id)
            .maybeSingle();
        if (accountError || !account || account.user_id !== userId) {
            throw new common_1.BadRequestException('Unauthorized to update this card');
        }
        const updateData = {};
        if (updateDto.status !== undefined) {
            updateData.status = updateDto.status;
        }
        if (!Object.keys(updateData).length) {
            return card;
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .update(updateData)
            .eq('id', cardId)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update card: ${error.message}`);
        const success = await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'CARD_UPDATED',
            resourceType: 'card',
            resourceId: cardId,
            metadata: { changes: updateData },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for card update (${cardId})`);
        }
        return data;
    }
    async delete(userId, cardId) {
        const card = await this.findById(cardId);
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('user_id')
            .eq('id', card.account_id)
            .maybeSingle();
        if (accountError || !account || account.user_id !== userId) {
            throw new common_1.BadRequestException('Unauthorized to delete this card');
        }
        const { error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .delete()
            .eq('id', cardId);
        if (error)
            throw new common_1.BadRequestException(`Failed to delete card: ${error.message}`);
        const success = await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'CARD_DELETED',
            resourceType: 'card',
            resourceId: cardId,
            metadata: { changes: { cardNumber: card.card_number } },
        });
        if (!success) {
            this.logger.warn(`Failed to persist audit log for card deletion (${cardId})`);
        }
    }
    generateCardNumber(_cardType) {
        const bin = '4';
        const randomDigits = Math.floor(Math.random() * 10000000000000).toString().padStart(15, '0');
        return `${bin}${randomDigits}`;
    }
    generateCVV() {
        return Math.floor(100 + Math.random() * 900).toString();
    }
    generateExpiryDate() {
        const now = new Date();
        const expiryYear = now.getFullYear() + 5;
        const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
        return `${expiryMonth}/${expiryYear}`;
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = CardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], CardsService);
//# sourceMappingURL=cards.service.js.map