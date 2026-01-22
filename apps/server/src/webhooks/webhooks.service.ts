import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import axios, { AxiosError } from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';
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

@Injectable()
export class WebhooksService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) { }

  private getAdminDb(): SupabaseClient {
    return typeof (this.supabase as unknown as { getAdminClient?: () => SupabaseClient }).getAdminClient === 'function'
      ? this.supabase.getAdminClient()
      : (this.supabase as unknown as { supabaseClient?: SupabaseClient }).supabaseClient;
  }

  async createWebhook(userId: string, dto: CreateWebhookDto): Promise<Webhook> {
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
        this.logger.error(`Failed to create webhook: ${error.message}`, undefined, WebhooksService.name);
        throw new Error(error.message || 'Failed to create webhook');
      }

      return data as Webhook;
    } catch (err) {
      const message = (err as Error)?.message || 'Unknown error';
      this.logger.error(`createWebhook error: ${message}`, undefined, WebhooksService.name);
      throw err;
    }
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    const { data, error } = await this.getAdminDb()
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch webhooks: ${error.message}`, undefined, WebhooksService.name);
      return [];
    }

    return (data as Webhook[]) || [];
  }

  async getWebhookById(userId: string, webhookId: string): Promise<Webhook | null> {
    const { data, error } = await this.getAdminDb()
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to fetch webhook: ${error.message}`, undefined, WebhooksService.name);
      return null;
    }

    return data as Webhook | null;
  }

  /**
   * Fetch webhook by id using admin context (Sprint III helper)
   */
  async getWebhook(webhookId: string): Promise<Webhook | null> {
    const baseQuery = this.getAdminDb()
      .from('webhooks')
      .select('*')
      .eq('id', webhookId);

    const response = typeof (baseQuery as { maybeSingle?: unknown }).maybeSingle === 'function'
      ? await (baseQuery as typeof baseQuery & { maybeSingle: () => Promise<{ data: Webhook | null; error?: { message: string } }> }).maybeSingle()
      : typeof (baseQuery as { single?: unknown }).single === 'function'
        ? await (baseQuery as typeof baseQuery & { single: () => Promise<{ data: Webhook | null; error?: { message: string } }> }).single()
        : typeof (baseQuery as { then?: unknown }).then === 'function'
          ? await (baseQuery as typeof baseQuery & { then: () => Promise<{ data: Webhook | null; error?: { message: string } }> }).then()
          : await baseQuery;

    const { data, error } = response as { data: Webhook | null; error?: { message: string } };

    if (error) {
      this.logger.error(`Failed to fetch webhook: ${error.message}`, undefined, WebhooksService.name);
      return null;
    }

    return data as Webhook | null;
  }

  async updateWebhook(userId: string, webhookId: string, dto: UpdateWebhookDto): Promise<Webhook | null> {
    const { data, error } = await this.getAdminDb()
      .from('webhooks')
      .update(dto)
      .eq('id', webhookId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to update webhook: ${error.message}`, undefined, WebhooksService.name);
      return null;
    }

    return data as Webhook | null;
  }

  async deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
    const { error } = await this.getAdminDb()
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to delete webhook: ${error.message}`, undefined, WebhooksService.name);
      return false;
    }

    return true;
  }

  async deliverWebhook(userId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.getActiveWebhooksForEvent(userId, eventType);

    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, eventType, payload);
    }
  }

  async getWebhookDeliveries(userId: string, webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    // Verify webhook belongs to user
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
      this.logger.error(`Failed to fetch webhook deliveries: ${error.message}`, undefined, WebhooksService.name);
      return [];
    }

    return (data as WebhookDelivery[]) || [];
  }

  async retryWebhookDelivery(userId: string, deliveryId: string): Promise<boolean> {
    const { data: delivery, error: fetchError } = await this.getAdminDb()
      .from('webhook_deliveries')
      .select('*, webhooks!inner(user_id, url, secret, is_active)')
      .eq('id', deliveryId)
      .maybeSingle();

    if (fetchError || !delivery) {
      this.logger.error(`Failed to fetch delivery for retry: ${fetchError?.message}`, undefined, WebhooksService.name);
      return false;
    }

    const webhook = delivery.webhooks as unknown as Webhook;
    if (webhook.user_id !== userId || !webhook.is_active) {
      return false;
    }

    await this.sendWebhook(webhook, delivery.event_type, delivery.payload as Record<string, unknown>, deliveryId);
    return true;
  }

  private async getActiveWebhooksForEvent(userId: string, eventType: string): Promise<Webhook[]> {
    const { data, error } = await this.getAdminDb()
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error) {
      this.logger.error(`Failed to fetch active webhooks: ${error.message}`, undefined, WebhooksService.name);
      return [];
    }

    return (data as Webhook[]) || [];
  }

  private async sendWebhook(
    webhook: Webhook,
    eventType: string,
    payload: Record<string, unknown>,
    retryDeliveryId?: string,
  ): Promise<void> {
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
      const response = await axios.post(webhook.url, deliveryPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
        },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      });

      const isSuccess = response.status >= 200 && response.status < 300;

      await this.getAdminDb().from('webhook_deliveries').update({
        status: isSuccess ? 'success' : 'failed',
        response_code: response.status,
        response_body: JSON.stringify(response.data).substring(0, 1000),
        delivered_at: new Date().toISOString(),
        attempts: retryDeliveryId ? undefined : 1, // Only increment on first attempt
      }).eq('id', deliveryId);

      if (!isSuccess) {
        this.logger.warn(`Webhook delivery failed (${webhook.id}): HTTP ${response.status}`, WebhooksService.name);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      await this.getAdminDb().from('webhook_deliveries').update({
        status: 'failed',
        error_message: axiosError.message,
        attempts: retryDeliveryId ? undefined : 1,
      }).eq('id', deliveryId);

      this.logger.error(`Webhook delivery error (${webhook.id}): ${axiosError.message}`, undefined, WebhooksService.name);
    }
  }

  private generateSecret(): string {
    return `whsec_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  private generateSignature(secret: string, payload: Record<string, unknown>): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Test webhook delivery (Sprint III)
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
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
      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
          'X-Webhook-ID': webhook.id,
        },
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;
      this.logger.log(`Webhook test successful for ${webhookId} (${responseTime}ms)`, WebhooksService.name);
      return {
        success: response.status >= 200 && response.status < 300,
        message: `Webhook responded with status ${response.status}`,
        responseTime,
      };
    } catch (err) {
      const axiosError = err as AxiosError;
      const responseTime = Date.now() - startTime;
      this.logger.error(`Webhook test failed for ${webhookId}: ${axiosError.message}`, WebhooksService.name);
      return {
        success: false,
        message: axiosError.message || 'Webhook delivery failed',
        responseTime,
      };
    }
  }

  /**
   * Retry failed webhook delivery
   */
  async retryDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    const { data: delivery, error: getError } = await this.supabase.supabaseClient
      .from('webhook_deliveries')
      .select('*, webhooks(*)')
      .eq('id', deliveryId)
      .single();

    if (getError || !delivery) {
      this.logger.error(`Delivery not found: ${deliveryId}`, WebhooksService.name);
      return null;
    }

    const webhook = delivery.webhooks;
    const maxAttempts = 5;

    if (delivery.attempts >= maxAttempts) {
      this.logger.warn(`Max retry attempts reached for delivery ${deliveryId}`, WebhooksService.name);
      return null;
    }

    try {
      const signature = this.generateSignature(webhook.secret, delivery.payload);
      const response = await axios.post(webhook.url, delivery.payload, {
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
    } catch (err) {
      const axiosError = err as AxiosError;
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

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId: string): Promise<Record<string, unknown>> {
    const client = this.getAdminDb();
    const builder = client
      .from('webhook_deliveries')
      .select('status, created_at')
      .eq('webhook_id', webhookId);

    const response = typeof builder.then === 'function' ? await builder.then() : await builder;
    const deliveries = (response as { data?: WebhookDelivery[]; error?: { message: string } })?.data;

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
}
