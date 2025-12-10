import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCardDto, CardType, CardStatus } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface Card {
    id: string;
    account_id: string;
    card_number: string;
    type: CardType;
    status: CardStatus;
    cvv: string;
    expiry_date: string;
    cardholder_name?: string;
    created_at?: string;
    updated_at?: string;
}

@Injectable()
export class CardsService {
    private readonly logger = new Logger(CardsService.name);

    constructor(
        private supabase: SupabaseService,
        private readonly auditLogsService: AuditLogsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findByAccountId(accountId: string): Promise<Card[]> {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('account_id', accountId);

        if (error) throw new Error(`Failed to fetch cards: ${error.message}`);
        return (data ?? []) as Card[];
    }

    async findByUserId(userId: string): Promise<Card[]> {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select(`
                *,
                accounts!inner(user_id)
            `)
            .eq('accounts.user_id', userId);

        if (error) throw new Error(`Failed to fetch user cards: ${error.message}`);
        return (data ?? []) as Card[];
    }

    async findById(id: string): Promise<Card> {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new Error(`Failed to fetch card: ${error.message}`);
        if (!data) throw new NotFoundException(`Card with ID ${id} not found`);
        return data as Card;
    }

    async findByCardNumber(cardNumber: string): Promise<Card | null> {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .select('*')
            .eq('card_number', cardNumber)
            .maybeSingle();

        if (error) throw new Error(`Failed to fetch card: ${error.message}`);
        return (data ?? null) as Card | null;
    }

    async create(userId: string, accountId: string, dto: CreateCardDto, bypassLimits: boolean = false): Promise<Card> {
        // Verify account exists and belongs to user
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('id, user_id')
            .eq('id', accountId)
            .maybeSingle();

        if (accountError || !account) {
            throw new BadRequestException(`Account with ID ${accountId} not found`);
        }

        if (account.user_id !== userId) {
            throw new BadRequestException('Account does not belong to this user');
        }

        const type = dto.type || 'VIRTUAL';

        // Check virtual card limit: max 6 virtual cards per user (unless bypassed by admin)
        if (type === 'VIRTUAL' && !bypassLimits) {
            // First, get all accounts for this user
            const { data: userAccounts, error: accountsError } = await this.supabase
                .getAdminClient()
                .from('accounts')
                .select('id')
                .eq('user_id', userId);

            if (accountsError) {
                throw new BadRequestException(`Failed to check card limits: ${accountsError.message}`);
            }

            const accountIds = userAccounts?.map((a: { id: string }) => a.id) ?? [];

            // Then count virtual cards across all accounts
            const { data: userCards, error: cardsError } = await this.supabase
                .getAdminClient()
                .from('cards')
                .select('id')
                .eq('type', 'VIRTUAL')
                .in('account_id', accountIds);

            if (cardsError) {
                throw new BadRequestException(`Failed to check card limits: ${cardsError.message}`);
            }

            const virtualCardCount = userCards?.length ?? 0;
            if (virtualCardCount >= 6) {
                throw new BadRequestException(
                    'You have reached the maximum limit of 6 virtual cards. Please delete unused cards before creating new ones.'
                );
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
            })
            .select()
            .single();

        if (error) throw new BadRequestException(`Failed to create card: ${error.message}`);

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

        return data as Card;
    }

    async update(userId: string, cardId: string, updateDto: UpdateCardDto): Promise<Card> {
        const card = await this.findById(cardId);

        // Verify card belongs to user (via account)
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('user_id')
            .eq('id', card.account_id)
            .maybeSingle();

        if (accountError || !account || account.user_id !== userId) {
            throw new BadRequestException('Unauthorized to update this card');
        }

        const updateData: Partial<Card> = {};

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

        if (error) throw new BadRequestException(`Failed to update card: ${error.message}`);

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

        return data as Card;
    }

    async delete(userId: string, cardId: string): Promise<void> {
        const card = await this.findById(cardId);

        // Verify card belongs to user
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('user_id')
            .eq('id', card.account_id)
            .maybeSingle();

        if (accountError || !account || account.user_id !== userId) {
            throw new BadRequestException('Unauthorized to delete this card');
        }

        const { error } = await this.supabase
            .getAdminClient()
            .from('cards')
            .delete()
            .eq('id', cardId);

        if (error) throw new BadRequestException(`Failed to delete card: ${error.message}`);

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private generateCardNumber(_cardType: CardType): string {
        // Visa card numbers are 16 digits, start with 4
        const bin = '4';
        const randomDigits = Math.floor(Math.random() * 10000000000000).toString().padStart(15, '0');
        return `${bin}${randomDigits}`;
    }

    private generateCVV(): string {
        return Math.floor(100 + Math.random() * 900).toString();
    }

    private generateExpiryDate(): string {
        const now = new Date();
        const expiryYear = now.getFullYear() + 5; // 5 years from now
        const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
        return `${expiryMonth}/${expiryYear}`;
    }
}
