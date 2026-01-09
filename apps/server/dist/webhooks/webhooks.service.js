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
    getAdminDb() {
        return typeof this.supabase.getAdminClient === 'function'
            ? this.supabase.getAdminClient()
            : this.supabase.supabaseClient;
    }
    async createWebhook(userId, dto) {
        const secret = this.generateSecret();
        try {
            const adminDb = this.getAdminDb();
            if (!adminDb) {
                throw new Error('Admin database client not initialized');
            }
            const { data, error } = await adminDb
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
                throw new Error(error.message || 'Failed to create webhook');
            }
            return data;
        }
        catch (err) {
            const message = err?.message || 'Unknown error';
            this.logger.error(`createWebhook error: ${message}`, undefined, WebhooksService_1.name);
            throw err;
        }
    }
    async getUserWebhooks(userId) {
        const { data, error } = await this.getAdminDb()
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
        const { data, error } = await this.getAdminDb()
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
    async getWebhook(webhookId) {
        const baseQuery = this.getAdminDb()
            .from('webhooks')
            .select('*')
            .eq('id', webhookId);
        const response = typeof baseQuery.maybeSingle === 'function'
            ? await baseQuery.maybeSingle()
            : typeof baseQuery.single === 'function'
                ? await baseQuery.single()
                : typeof baseQuery.then === 'function'
                    ? await baseQuery.then()
                    : await baseQuery;
        const { data, error } = response;
        if (error) {
            this.logger.error(`Failed to fetch webhook: ${error.message}`, undefined, WebhooksService_1.name);
            return null;
        }
        return data;
    }
    async updateWebhook(userId, webhookId, dto) {
        const { data, error } = await this.getAdminDb()
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
        const { error } = await this.getAdminDb()
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
        const { data, error } = await this.getAdminDb()
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
        const { data: delivery, error: fetchError } = await this.getAdminDb()
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
        const { data, error } = await this.getAdminDb()
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
            const { data: newDelivery } = await this.getAdminDb()
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
            await this.getAdminDb().from('webhook_deliveries').update({
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
            await this.getAdminDb().from('webhook_deliveries').update({
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
    async testWebhook(webhookId) {
        const webhook = await this.getWebhook(webhookId);
        if (!webhook) {
            throw new Error('Webhook not found');
        }
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            webhookId: webhook.id,
            test: true,
        };
        const signature = this.generateSignature(webhook.secret, testPayload);
        const startTime = Date.now();
        try {
            const response = await axios_1.default.post(webhook.url, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': 'webhook.test',
                    'X-Webhook-ID': webhook.id,
                },
                timeout: 5000,
            });
            const responseTime = Date.now() - startTime;
            this.logger.log(`Webhook test successful for ${webhookId} (${responseTime}ms)`, WebhooksService_1.name);
            return {
                success: response.status >= 200 && response.status < 300,
                message: `Webhook responded with status ${response.status}`,
                responseTime,
            };
        }
        catch (err) {
            const axiosError = err;
            const responseTime = Date.now() - startTime;
            this.logger.error(`Webhook test failed for ${webhookId}: ${axiosError.message}`, WebhooksService_1.name);
            return {
                success: false,
                message: axiosError.message || 'Webhook delivery failed',
                responseTime,
            };
        }
    }
    async retryDelivery(deliveryId) {
        const { data: delivery, error: getError } = await this.supabase.supabaseClient
            .from('webhook_deliveries')
            .select('*, webhooks(*)')
            .eq('id', deliveryId)
            .single();
        if (getError || !delivery) {
            this.logger.error(`Delivery not found: ${deliveryId}`, WebhooksService_1.name);
            return null;
        }
        const webhook = delivery.webhooks;
        const maxAttempts = 5;
        if (delivery.attempts >= maxAttempts) {
            this.logger.warn(`Max retry attempts reached for delivery ${deliveryId}`, WebhooksService_1.name);
            return null;
        }
        try {
            const signature = this.generateSignature(webhook.secret, delivery.payload);
            const response = await axios_1.default.post(webhook.url, delivery.payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': delivery.event_type,
                    'X-Webhook-ID': webhook.id,
                },
                timeout: 5000,
            });
            const { data: updated } = await this.supabase.supabaseClient
                .from('webhook_deliveries')
                .update({
                status: 'success',
                response_code: response.status,
                attempts: delivery.attempts + 1,
                delivered_at: new Date().toISOString(),
            })
                .eq('id', deliveryId)
                .select()
                .single();
            return updated;
        }
        catch (err) {
            const axiosError = err;
            const { data: updated } = await this.supabase.supabaseClient
                .from('webhook_deliveries')
                .update({
                status: 'failed',
                error_message: axiosError.message,
                attempts: delivery.attempts + 1,
            })
                .eq('id', deliveryId)
                .select()
                .single();
            return updated;
        }
    }
    async getWebhookStats(webhookId) {
        const client = this.getAdminDb();
        const builder = client
            .from('webhook_deliveries')
            .select('status, created_at')
            .eq('webhook_id', webhookId);
        const response = typeof builder.then === 'function' ? await builder.then() : await builder;
        const deliveries = response?.data;
        if (!deliveries) {
            return {
                totalDeliveries: 0,
                successCount: 0,
                failureCount: 0,
                pendingCount: 0,
                successRate: 0,
                avgResponseTime: 0,
            };
        }
        const successCount = deliveries.filter((d) => d.status === 'success').length;
        const failureCount = deliveries.filter((d) => d.status === 'failed').length;
        const pendingCount = deliveries.filter((d) => d.status === 'pending').length;
        const total = deliveries.length;
        return {
            totalDeliveries: total,
            successCount,
            failureCount,
            pendingCount,
            successRate: total > 0 ? (successCount / total) * 100 : 0,
            last7days: deliveries.filter((d) => {
                const created = new Date(d.created_at);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                return created >= sevenDaysAgo;
            }).length,
        };
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