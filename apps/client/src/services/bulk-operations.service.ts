import api from './api';

export interface BulkActionPayload {
  ids: string[];
  reason?: string;
  updates?: Record<string, unknown>;
}

export interface BulkOperationResult {
  success: number; // Number of successful operations
  failed: number; // Number of failed operations
  processed: number; // Total processed
  errors?: Array<{ id: string; error: string }>;
  details?: string[]; // Operation details
  message?: string;
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

  // KYC-specific methods
  async bulkReviewKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/approve/kyc', payload);
    return response.data;
  }

  async bulkFlagKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/reject/kyc', payload);
    return response.data;
  }

  async bulkDeleteKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/delete/kyc', payload);
    return response.data;
  }

  // Transaction-specific methods
  async bulkReviewTransactions(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/approve/transactions', payload);
    return response.data;
  }

  async bulkFlagTransactions(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/reject/transactions', payload);
    return response.data;
  }

  async bulkDeleteTransactions(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await api.post('/admin/bulk/delete/transactions', payload);
    return response.data;
  }
}

export default new BulkOperationsService();
