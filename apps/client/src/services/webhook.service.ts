import { API_BASE_URL } from '../config/api.config';

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
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async createWebhook(payload: CreateWebhookPayload): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserWebhooks(): Promise<{ success: boolean; webhooks: Webhook[] }> {
    return this.request('/webhooks');
  }

  async getWebhook(webhookId: string): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request(`/webhooks/${webhookId}`);
  }

  async updateWebhook(webhookId: string, payload: UpdateWebhookPayload): Promise<{ success: boolean; webhook: Webhook }> {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async getWebhookDeliveries(webhookId: string): Promise<{ success: boolean; deliveries: WebhookDelivery[] }> {
    return this.request(`/webhooks/${webhookId}/deliveries`);
  }

  async retryDelivery(deliveryId: string): Promise<{ success: boolean }> {
    return this.request(`/webhooks/deliveries/${deliveryId}/retry`, {
      method: 'POST',
    });
  }
}

export const webhookService = new WebhookService();
