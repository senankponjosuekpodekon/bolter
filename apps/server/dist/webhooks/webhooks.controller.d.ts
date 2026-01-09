import { WebhooksService, CreateWebhookDto, UpdateWebhookDto } from './webhooks.service';
import { Request } from 'express';
interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        role?: string;
    };
}
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    createWebhook(req: AuthRequest, dto: CreateWebhookDto): Promise<{
        success: boolean;
        webhook: import("./webhooks.service").Webhook;
    }>;
    getUserWebhooks(req: AuthRequest): Promise<{
        success: boolean;
        webhooks: import("./webhooks.service").Webhook[];
    }>;
    getWebhook(req: AuthRequest, webhookId: string): Promise<{
        success: boolean;
        webhook: import("./webhooks.service").Webhook;
    }>;
    updateWebhook(req: AuthRequest, webhookId: string, dto: UpdateWebhookDto): Promise<{
        success: boolean;
        webhook: import("./webhooks.service").Webhook;
    }>;
    deleteWebhook(req: AuthRequest, webhookId: string): Promise<{
        success: boolean;
    }>;
    getWebhookDeliveries(req: AuthRequest, webhookId: string): Promise<{
        success: boolean;
        deliveries: import("./webhooks.service").WebhookDelivery[];
    }>;
    testWebhook(req: AuthRequest, webhookId: string): Promise<{
        success: boolean;
        message: string;
        responseTime: number;
    }>;
    retryDelivery(req: AuthRequest, deliveryId: string): Promise<{
        success: boolean;
    }>;
}
export {};
