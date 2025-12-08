import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  webhookService,
  Webhook,
  WebhookDelivery,
} from "../services/webhook.service";
import { toast } from "../stores/toastStore";

const AVAILABLE_EVENTS = [
  "transaction.created",
  "transaction.updated",
  "kyc.document.reviewed",
  "kyc.status.changed",
  "account.created",
  "loan.created",
  "loan.approved",
  "loan.rejected",
];

export const AdminWebhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);

  useEffect(() => {
    loadWebhooks();
  }, []);

  useEffect(() => {
    if (selectedWebhook) {
      loadDeliveries(selectedWebhook);
    }
  }, [selectedWebhook]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhookService.getUserWebhooks();
      setWebhooks(response.webhooks);
    } catch (error) {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    try {
      const response = await webhookService.getWebhookDeliveries(webhookId);
      setDeliveries(response.deliveries);
    } catch (error) {
      toast.error("Failed to load deliveries");
    }
  };

  const handleCreateWebhook = async () => {
    if (!formUrl || formEvents.length === 0) {
      toast.error("URL and at least one event are required");
      return;
    }

    try {
      await webhookService.createWebhook({ url: formUrl, events: formEvents });
      toast.success("Webhook created successfully");
      setShowCreateModal(false);
      setFormUrl("");
      setFormEvents([]);
      loadWebhooks();
    } catch (error) {
      toast.error("Failed to create webhook");
    }
  };

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      await webhookService.updateWebhook(webhookId, { is_active: !isActive });
      toast.success(isActive ? "Webhook disabled" : "Webhook enabled");
      loadWebhooks();
    } catch (error) {
      toast.error("Failed to update webhook");
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      await webhookService.deleteWebhook(webhookId);
      toast.success("Webhook deleted");
      loadWebhooks();
      if (selectedWebhook === webhookId) {
        setSelectedWebhook(null);
      }
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      await webhookService.retryDelivery(deliveryId);
      toast.success("Delivery retried");
      if (selectedWebhook) {
        loadDeliveries(selectedWebhook);
      }
    } catch (error) {
      toast.error("Failed to retry delivery");
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Webhooks
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Webhook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhooks List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Your Webhooks
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No webhooks configured
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedWebhook === webhook.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedWebhook(webhook.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm font-mono truncate text-gray-900 dark:text-white">
                          {webhook.url}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {webhook.events.length} event
                        {webhook.events.length !== 1 && "s"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWebhook(webhook.id, webhook.is_active);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          webhook.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {webhook.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWebhook(webhook.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {webhook.events.slice(0, 3).map((event) => (
                      <span
                        key={event}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {event}
                      </span>
                    ))}
                    {webhook.events.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">
                        +{webhook.events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Delivery History
          </h2>
          {!selectedWebhook ? (
            <div className="text-center py-8 text-gray-500">
              Select a webhook to view deliveries
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No deliveries yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {delivery.status === "success" && (
                        <Check size={16} className="text-green-600" />
                      )}
                      {delivery.status === "failed" && (
                        <X size={16} className="text-red-600" />
                      )}
                      {delivery.status === "pending" && (
                        <Clock size={16} className="text-yellow-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {delivery.event_type}
                      </span>
                    </div>
                    {delivery.status === "failed" && (
                      <button
                        onClick={() => handleRetryDelivery(delivery.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{new Date(delivery.created_at).toLocaleString()}</div>
                    {delivery.response_code && (
                      <div>Status: HTTP {delivery.response_code}</div>
                    )}
                    {delivery.error_message && (
                      <div className="flex items-start gap-1 text-red-600 dark:text-red-400">
                        <AlertCircle
                          size={14}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <span>{delivery.error_message}</span>
                      </div>
                    )}
                    <div>Attempts: {delivery.attempts}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Create Webhook
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Events to Subscribe
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {event}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateWebhook}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormUrl("");
                    setFormEvents([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
