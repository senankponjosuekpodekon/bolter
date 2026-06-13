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
export declare class CardsService {
    private supabase;
    private readonly auditLogsService;
    private readonly notificationsService;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogsService: AuditLogsService, notificationsService: NotificationsService);
    findByAccountId(accountId: string): Promise<Card[]>;
    findByUserId(userId: string): Promise<Card[]>;
    findById(id: string): Promise<Card>;
    findByCardNumber(cardNumber: string): Promise<Card | null>;
    create(userId: string, accountId: string, dto: CreateCardDto, bypassLimits?: boolean, tenantId?: string | null): Promise<Card>;
    update(userId: string, cardId: string, updateDto: UpdateCardDto): Promise<Card>;
    delete(userId: string, cardId: string): Promise<void>;
    private generateCardNumber;
    private generateCVV;
    private generateExpiryDate;
}
