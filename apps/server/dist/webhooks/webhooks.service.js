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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const axios_1 = __importDefault(require("axios"));
const supabase_service_1 = require("../supabase/supabase.service");
const logger_service_1 = require("../common/logger/logger.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(supabase, config, logger) {
        this.supabase = supabase;
        this.config = config;
        this.logger = logger;
    }
    async createWebhook(userId, dto) {
        const secret = this.generateSecret();
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .insert({
            user_id: userId,
            url: dto.url,
            secret,
            events: dto.events,
            is_active: true,
        })
            .select()
            .single();
        if (error) {
            this.logger.error(`Failed to create webhook: ${error.message}`, undefined, WebhooksService_1.name);
            throw new Error('Failed to create webhook');
        }
        return data;
    }
    async getUserWebhooks(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            this.logger.error(`Failed to fetch webhooks: ${error.message}`, undefined, WebhooksService_1.name);
            return [];
        }
        return data || [];
    }
    async getWebhookById(userId, webhookId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .select('*')
            .eq('id', webhookId)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Failed to fetch webhook: ${error.message}`, undefined, WebhooksService_1.name);
            return null;
        }
        return data;
    }
    async updateWebhook(userId, webhookId, dto) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .update(dto)
            .eq('id', webhookId)
            .eq('user_id', userId)
            .select()
            .maybeSingle();
        if (error) {
            this.logger.error(`Failed to update webhook: ${error.message}`, undefined, WebhooksService_1.name);
            return null;
        }
        return data;
    }
    async deleteWebhook(userId, webhookId) {
        const { error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .delete()
            .eq('id', webhookId)
            .eq('user_id', userId);
        if (error) {
            this.logger.error(`Failed to delete webhook: ${error.message}`, undefined, WebhooksService_1.name);
            return false;
        }
        return true;
    }
    async deliverWebhook(userId, eventType, payload) {
        const webhooks = await this.getActiveWebhooksForEvent(userId, eventType);
        for (const webhook of webhooks) {
            await this.sendWebhook(webhook, eventType, payload);
        }
    }
    async getWebhookDeliveries(userId, webhookId, limit = 50) {
        const webhook = await this.getWebhookById(userId, webhookId);
        if (!webhook) {
            return [];
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhook_deliveries')
            .select('*')
            .eq('webhook_id', webhookId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            this.logger.error(`Failed to fetch webhook deliveries: ${error.message}`, undefined, WebhooksService_1.name);
            return [];
        }
        return data || [];
    }
    async retryWebhookDelivery(userId, deliveryId) {
        const { data: delivery, error: fetchError } = await this.supabase
            .getAdminClient()
            .from('webhook_deliveries')
            .select('*, webhooks!inner(user_id, url, secret, is_active)')
            .eq('id', deliveryId)
            .maybeSingle();
        if (fetchError || !delivery) {
            this.logger.error(`Failed to fetch delivery for retry: ${fetchError?.message}`, undefined, WebhooksService_1.name);
            return false;
        }
        const webhook = delivery.webhooks;
        if (webhook.user_id !== userId || !webhook.is_active) {
            return false;
        }
        await this.sendWebhook(webhook, delivery.event_type, delivery.payload, deliveryId);
        return true;
    }
    async getActiveWebhooksForEvent(userId, eventType) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('webhooks')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .contains('events', [eventType]);
        if (error) {
            this.logger.error(`Failed to fetch active webhooks: ${error.message}`, undefined, WebhooksService_1.name);
            return [];
        }
        return data || [];
    }
    async sendWebhook(webhook, eventType, payload, retryDeliveryId) {
        const deliveryPayload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload,
        };
        const signature = this.generateSignature(webhook.secret, deliveryPayload);
        let deliveryId = retryDeliveryId;
        if (!deliveryId) {
            const { data: newDelivery } = await this.supabase
                .getAdminClient()
                .from('webhook_deliveries')
                .insert({
                webhook_id: webhook.id,
                event_type: eventType,
                payload: deliveryPayload,
                status: 'pending',
                attempts: 0,
            })
                .select('id')
                .single();
            deliveryId = newDelivery?.id;
        }
        try {
            const response = await axios_1.default.post(webhook.url, deliveryPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': eventType,
                },
                timeout: 10000,
                validateStatus: () => true,
            });
            const isSuccess = response.status >= 200 && response.status < 300;
            await this.supabase.getAdminClient().from('webhook_deliveries').update({
                status: isSuccess ? 'success' : 'failed',
                response_code: response.status,
                response_body: JSON.stringify(response.data).substring(0, 1000),
                delivered_at: new Date().toISOString(),
                attempts: retryDeliveryId ? undefined : 1,
            }).eq('id', deliveryId);
            if (!isSuccess) {
                this.logger.warn(`Webhook delivery failed (${webhook.id}): HTTP ${response.status}`, WebhooksService_1.name);
            }
        }
        catch (error) {
            const axiosError = error;
            await this.supabase.getAdminClient().from('webhook_deliveries').update({
                status: 'failed',
                error_message: axiosError.message,
                attempts: retryDeliveryId ? undefined : 1,
            }).eq('id', deliveryId);
            this.logger.error(`Webhook delivery error (${webhook.id}): ${axiosError.message}`, undefined, WebhooksService_1.name);
        }
    }
    generateSecret() {
        return `whsec_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    }
    generateSignature(secret, payload) {
        const hmac = (0, crypto_1.createHmac)('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService,
        logger_service_1.Logger])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map