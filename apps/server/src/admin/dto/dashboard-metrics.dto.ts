export interface DashboardMetricsDto {
  overview: OverviewMetrics;
  recentMetrics: RecentMetrics;
  topMetrics: TopMetrics;
}

export interface OverviewMetrics {
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
}

export interface RecentMetrics {
  lastUpdated: Date;
  period: '7d' | '30d' | '90d';
  userGrowthRate: number; // percentage
  transactionGrowthRate: number; // percentage
  kycApprovalRate: number; // percentage
  averageKycProcessingTime: number; // in hours
}

export interface TopMetrics {
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
}

export interface TransactionStatsDto {
  totalVolume: number;
  transactionCount: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  timeline: TimelinePoint[];
  byCurrency: CurrencyStats[];
  byStatus: StatusStats[];
}

export interface TimelinePoint {
  date: string;
  volume: number;
  count: number;
  average: number;
}

export interface CurrencyStats {
  currency: string;
  count: number;
  volume: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  byStatus: UserStatusStats[];
  byCountry: CountryStats[];
  growth: GrowthStats[];
}

export interface UserStatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface CountryStats {
  country: string;
  code: string;
  count: number;
  percentage: number;
}

export interface GrowthStats {
  date: string;
  count: number;
  newUsers: number;
}

export interface KycStatsDto {
  pending: number;
  approved: number;
  rejected: number;
  averageProcessingTime: number; // in hours
  approvalRate: number; // percentage
  rejectionRate: number; // percentage
  byDocumentType: DocumentTypeStats[];
  timeline: KycTimelinePoint[];
}

export interface DocumentTypeStats {
  documentType: string;
  pending: number;
  approved: number;
  rejected: number;
}

export interface KycTimelinePoint {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface TimeSeriesDataDto {
  period: '7d' | '30d' | '90d';
  data: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  date: string;
  transactions: number;
  users: number;
  kycSubmissions: number;
  revenue: number;
}
