import { API_BASE_URL } from '../config/api.config';

export interface BulkActionPayload {
  ids: string[];
  action: 'approve' | 'reject' | 'delete' | 'flag';
  reason?: string;
  notes?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  details: string[];
}

class BulkOperationsService {
  /**
   * Bulk approve/reject KYC documents
   */
  async bulkReviewKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/kyc/review`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to perform bulk KYC review');
    }

    return response.json();
  }

  /**
   * Bulk approve/reject transactions
   */
  async bulkReviewTransactions(
    payload: BulkActionPayload
  ): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/transactions/review`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to perform bulk transaction review');
    }

    return response.json();
  }

  /**
   * Bulk flag KYC documents for review
   */
  async bulkFlagKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/kyc/flag`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to flag KYC documents');
    }

    return response.json();
  }

  /**
   * Bulk flag transactions for review
   */
  async bulkFlagTransactions(
    payload: BulkActionPayload
  ): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/transactions/flag`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to flag transactions');
    }

    return response.json();
  }

  /**
   * Bulk delete KYC documents
   */
  async bulkDeleteKyc(payload: BulkActionPayload): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/kyc/delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete KYC documents');
    }

    return response.json();
  }

  /**
   * Bulk delete transactions
   */
  async bulkDeleteTransactions(
    payload: BulkActionPayload
  ): Promise<BulkOperationResult> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/transactions/delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete transactions');
    }

    return response.json();
  }

  /**
   * Get bulk operation statistics
   */
  async getBulkOperationStats(): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bulk-operations/stats`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch bulk operation statistics');
    }

    return response.json();
  }
}

export default new BulkOperationsService();
