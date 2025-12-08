import { API_BASE_URL } from '../config/api.config';

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalTransactionVolume: number;
    averageTransactionAmount: number;
    pendingKycApplications: number;
    approvedKycApplications: number;
    rejectedKycApplications: number;
    totalLoans: number;
    activeLoanAccounts: number;
    todaysTransactionCount: number;
    todaysTransactionVolume: number;
  };
  recentMetrics: {
    lastUpdated: string;
    period: '7d' | '30d' | '90d';
    userGrowthRate: number;
    transactionGrowthRate: number;
    kycApprovalRate: number;
    averageKycProcessingTime: number;
  };
  topMetrics: {
    topTransactionDate: {
      date: string;
      volume: number;
      count: number;
    };
    topUser: {
      userId: string;
      email: string;
      transactionCount: number;
      totalVolume: number;
    };
    topCurrency: {
      code: string;
      count: number;
      volume: number;
    };
  };
}

export interface TransactionStats {
  totalVolume: number;
  transactionCount: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  timeline: Array<{
    date: string;
    volume: number;
    count: number;
    average: number;
  }>;
  byCurrency: Array<{
    currency: string;
    count: number;
    volume: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byCountry: Array<{
    country: string;
    code: string;
    count: number;
    percentage: number;
  }>;
  growth: Array<{
    date: string;
    count: number;
    newUsers: number;
  }>;
}

export interface KycStats {
  pending: number;
  approved: number;
  rejected: number;
  averageProcessingTime: number;
  approvalRate: number;
  rejectionRate: number;
  byDocumentType: Array<{
    documentType: string;
    pending: number;
    approved: number;
    rejected: number;
  }>;
  timeline: Array<{
    date: string;
    submitted: number;
    approved: number;
    rejected: number;
  }>;
}

export interface TimeSeriesData {
  period: '7d' | '30d' | '90d';
  data: Array<{
    date: string;
    transactions: number;
    users: number;
    kycSubmissions: number;
    revenue: number;
  }>;
}

/**
 * Admin API Service
 * Handles all dashboard and admin-related API calls
 */
export class AdminService {
  private baseUrl = `${API_BASE_URL}/admin`;

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard metrics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(period: '7d' | '30d' | '90d' = '7d'): Promise<TransactionStats> {
    const response = await fetch(`${this.baseUrl}/stats/transactions?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${this.baseUrl}/stats/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get KYC statistics
   */
  async getKycStats(): Promise<KycStats> {
    const response = await fetch(`${this.baseUrl}/stats/kyc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch KYC stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(period: '7d' | '30d' | '90d' = '7d'): Promise<TimeSeriesData> {
    const response = await fetch(`${this.baseUrl}/stats/timeline?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch timeline data: ${response.statusText}`);
    }

    return response.json();
  }
}

export default new AdminService();
