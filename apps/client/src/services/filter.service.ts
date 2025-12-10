import api from './api';

export interface TransactionFilterParams {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: string;
  type?: string;
  currency?: string;
  userId?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'status' | 'currency';
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export interface KycFilterParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  documentType?: string;
  userId?: string;
  search?: string;
  sortBy?: 'date' | 'status' | 'documentType';
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export interface FilterResult<T> {
  total: number;
  results: T[];
  filters: Record<string, unknown>;
}

/**
 * Filter API Service
 * Handles filtering for transactions and KYC
 */
export class FilterService {
  async filterTransactions(
    params: TransactionFilterParams
  ): Promise<FilterResult<Record<string, unknown>>> {
    const response = await api.get('/admin/filter/transactions', { params });
    return response.data;
  }

  async filterKyc(
    params: KycFilterParams
  ): Promise<FilterResult<Record<string, unknown>>> {
    const response = await api.get('/admin/filter/kyc', { params });
    return response.data;
  }

  async filterUsers(params: Record<string, unknown>) {
    const response = await api.get('/admin/filter/users', { params });
    return response.data;
  }

  async exportFilteredData(params: Record<string, unknown>) {
    const response = await api.get('/admin/filter/export', {
      params,
      responseType: params?.format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  }
}

export default new FilterService();
