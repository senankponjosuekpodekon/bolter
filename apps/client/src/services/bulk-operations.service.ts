import api from './api';

export interface BulkActionPayload {
  ids: string[];
  reason?: string;
  updates?: Record<string, unknown>;
}

class BulkOperationsService {
  async bulkApprove(type: string, ids: string[]) {
    if (!ids.length) return;
    const response = await api.post(`/admin/bulk/approve/${type}`, { ids });
    return response.data;
  }

  async bulkReject(type: string, ids: string[], reason?: string) {
    if (!ids.length) return;
    const response = await api.post(`/admin/bulk/reject/${type}`, {
      ids,
      reason,
    });
    return response.data;
  }

  async bulkDelete(type: string, ids: string[]) {
    if (!ids.length) return;
    const response = await api.post(`/admin/bulk/delete/${type}`, { ids });
    return response.data;
  }

  async bulkUpdate(
    type: string,
    ids: string[],
    updates: Record<string, unknown>
  ) {
    if (!ids.length) return;
    const response = await api.post(`/admin/bulk/update/${type}`, {
      ids,
      updates,
    });
    return response.data;
  }

  async getBulkOperationStats(): Promise<Record<string, unknown>> {
    const response = await api.get('/admin/bulk/stats');
    return response.data;
  }

  async validateBulkOperation(
    action: string,
    type: string,
    ids: string[]
  ) {
    const response = await api.post('/admin/bulk/validate', {
      action,
      type,
      ids,
    });
    return response.data;
  }
}

export default new BulkOperationsService();
