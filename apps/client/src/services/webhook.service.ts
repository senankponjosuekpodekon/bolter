import { API_BASE_URL } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

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

export interface CreateWebhookPayload {
  url: string;
  events: string[];
}

export interface UpdateWebhookPayload {
  url?: string;
  events?: string[];
  is_active?: boolean;
}

class WebhookService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = useAuthStore.getState().accessToken;
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let message = 'Request failed';
      try {
        const json = JSON.parse(text);
        message = json.message || message;
      } catch {
        message = text || message;
      }
      throw new Error(`${response.status} ${response.statusText} — ${message}`);
    }

    return response.json();
  }

  async createWebhook(payload: CreateWebhookPayload): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserWebhooks(): Promise<{ success: boolean; webhooks: Webhook[] }> {
    return this.request('/api/webhooks');
  }

  async getWebhook(webhookId: string): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request(`/api/webhooks/${webhookId}`);
  }

  async updateWebhook(webhookId: string, payload: UpdateWebhookPayload): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request(`/api/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.request(`/api/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async getWebhookDeliveries(webhookId: string): Promise<{ success: boolean; deliveries: WebhookDelivery[] }> {
    return this.request(`/api/webhooks/${webhookId}/deliveries`);
  }

  async retryDelivery(deliveryId: string): Promise<{ success: boolean }> {
    return this.request(`/api/webhooks/deliveries/${deliveryId}/retry`, {
      method: 'POST',
    });
  }

  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    return this.request(`/api/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  }
}

export const webhookService = new WebhookService();
