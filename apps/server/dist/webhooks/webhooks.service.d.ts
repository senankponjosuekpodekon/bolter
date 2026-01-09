import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';
export interface Webhook {
    id: string;
    user_id: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface WebhookDelivery {
    id: string;
    webhook_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    status: 'pending' | 'success' | 'failed';
    response_code: number | null;
    response_body: string | null;
    error_message: string | null;
    attempts: number;
    created_at: string;
    delivered_at: string | null;
}
export interface CreateWebhookDto {
    url: string;
    events: string[];
}
export interface UpdateWebhookDto {
    url?: string;
    events?: string[];
    is_active?: boolean;
}
export declare class WebhooksService {
    private readonly supabase;
    private readonly config;
    private readonly logger;
    constructor(supabase: SupabaseService, config: ConfigService, logger: Logger);
    private getAdminDb;
    createWebhook(userId: string, dto: CreateWebhookDto): Promise<Webhook>;
    getUserWebhooks(userId: string): Promise<Webhook[]>;
    getWebhookById(userId: string, webhookId: string): Promise<Webhook | null>;
    getWebhook(webhookId: string): Promise<Webhook | null>;
    updateWebhook(userId: string, webhookId: string, dto: UpdateWebhookDto): Promise<Webhook | null>;
    deleteWebhook(userId: string, webhookId: string): Promise<boolean>;
    deliverWebhook(userId: string, eventType: string, payload: Record<string, unknown>): Promise<void>;
    getWebhookDeliveries(userId: string, webhookId: string, limit?: number): Promise<WebhookDelivery[]>;
    retryWebhookDelivery(userId: string, deliveryId: string): Promise<boolean>;
    private getActiveWebhooksForEvent;
    private sendWebhook;
    private generateSecret;
    private generateSignature;
    testWebhook(webhookId: string): Promise<{
        success: boolean;
        message: string;
        responseTime: number;
    }>;
    retryDelivery(deliveryId: string): Promise<WebhookDelivery | null>;
    getWebhookStats(webhookId: string): Promise<Record<string, unknown>>;
}
