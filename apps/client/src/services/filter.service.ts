import { API_BASE_URL } from '../config/api.config';

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
  filters: Record<string, any>;
}

/**
 * Filter API Service
 * Handles filtering for transactions and KYC
 */
export class FilterService {
  private baseUrl = `${API_BASE_URL}`;

  /**
   * Filter transactions
   */
  async filterTransactions(params: TransactionFilterParams): Promise<FilterResult<any>> {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseUrl}/transactions/filter?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to filter transactions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Filter KYC applications
   */
  async filterKyc(params: KycFilterParams): Promise<FilterResult<any>> {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseUrl}/kyc/applications/filter?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to filter KYC applications: ${response.statusText}`);
    }

    return response.json();
  }
}

export default new FilterService();
