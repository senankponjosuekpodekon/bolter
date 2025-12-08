import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import axios, { AxiosError } from 'axios';
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

  async createWebhook(userId: string, dto: CreateWebhookDto): Promise<Webhook> {
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
      this.logger.error(`Failed to create webhook: ${error.message}`, undefined, WebhooksService.name);
      throw new Error('Failed to create webhook');
    }

    return data as Webhook;
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
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
    const { data, error } = await this.supabase
      .getAdminClient()
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

  async updateWebhook(userId: string, webhookId: string, dto: UpdateWebhookDto): Promise<Webhook | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
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
    const { error } = await this.supabase
      .getAdminClient()
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

    const { data, error } = await this.supabase
      .getAdminClient()
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
    const { data: delivery, error: fetchError } = await this.supabase
      .getAdminClient()
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
    const { data, error } = await this.supabase
      .getAdminClient()
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

      await this.supabase.getAdminClient().from('webhook_deliveries').update({
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
      await this.supabase.getAdminClient().from('webhook_deliveries').update({
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
}
