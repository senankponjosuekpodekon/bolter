/**
 * Tontine (ROSCA) types and interfaces
 */

export enum TontineStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TontineMemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  WITHDREW = 'WITHDREW',
  INACTIVE = 'INACTIVE',
}

export enum DistributionMethod {
  MANUAL_ORDER = 'MANUAL_ORDER',
  RANDOM = 'RANDOM',
  SENIORITY = 'SENIORITY',
  LOTTERY = 'LOTTERY',
}

export enum CycleStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ContributionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LATE = 'LATE',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  WALLET = 'WALLET',
}

export interface Tontine {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  contribution_amount: number;
  currency: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  total_cycles: number;
  cycle_duration_days: number;
  distribution_method: DistributionMethod;
  distribution_order?: string[];
  status: TontineStatus;
  current_cycle: number;
  late_payment_penalty_percent: number;
  withdrawal_allowed: boolean;
  withdrawal_penalty_percent: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface TontineMember {
  id: string;
  tontine_id: string;
  user_id: string;
  status: TontineMemberStatus;
  joined_at: string;
  left_at?: string;
  distribution_order?: number;
  distribution_date?: string;
  has_received_distribution: boolean;
  total_contributed: number;
  total_expected: number;
  phone_number?: string;
  email_notification: boolean;
  sms_notification: boolean;
  created_at: string;
  updated_at: string;
}

export interface TontineCycle {
  id: string;
  tontine_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  distribution_date?: string;
  recipient_id?: string;
  total_amount: number;
  status: CycleStatus;
  created_at: string;
  updated_at: string;
}

export interface TontineContribution {
  id: string;
  tontine_id: string;
  member_id: string;
  cycle_id: string;
  amount: number;
  currency: string;
  status: ContributionStatus;
  paid_at?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  is_late: boolean;
  late_payment_penalty: number;
  created_at: string;
  updated_at: string;
}

// Exported for future use - currently used in database but not in API responses
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TontineDistribution {
  id: string;
  tontine_id: string;
  cycle_id: string;
  recipient_id: string;
  total_amount: number;
  currency: string;
  member_count: number;
  contributions_collected: number;
  penalties_collected: number;
  status: 'PENDING' | 'PROCESSED' | 'CANCELLED';
  processed_at?: string;
  payout_method?: string;
  payout_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface TontineAuditLog {
  id: string;
  tontine_id?: string;
  action: string;
  actor_id?: string;
  resource_type?: string;
  resource_id?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// DTOs for API requests
export interface CreateTontineDto {
  name: string;
  description?: string;
  contribution_amount: number;
  currency?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  total_cycles: number;
  cycle_duration_days: number;
  distribution_method?: DistributionMethod;
  late_payment_penalty_percent?: number;
  withdrawal_allowed?: boolean;
  withdrawal_penalty_percent?: number;
  metadata?: Record<string, unknown>;
  // Optionnel: ajouter des membres lors de la création
  initial_members?: Array<{
    user_id: string;
    distribution_order?: number;
    phone_number?: string;
    email_notification?: boolean;
    sms_notification?: boolean;
  }>;
}

export interface UpdateTontineDto {
  name?: string;
  description?: string;
  distribution_method?: DistributionMethod;
  distribution_order?: string[];
  late_payment_penalty_percent?: number;
  withdrawal_allowed?: boolean;
  withdrawal_penalty_percent?: number;
  metadata?: Record<string, unknown>;
}

export interface AddMemberDto {
  user_id: string;
  distribution_order?: number;
  phone_number?: string;
  email_notification?: boolean;
  sms_notification?: boolean;
}

export interface RecordContributionDto {
  member_id: string;
  cycle_id: string;
  amount: number;
  payment_method?: PaymentMethod;
  payment_reference?: string;
}

// Exported for future use - currently used in database statistics
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TontineStatistics {
  total_tontines: number;
  active_tontines: number;
  total_members: number;
  total_contributions_collected: number;
  total_distributions: number;
  average_contribution_rate: number;
}

export interface MemberStatistics {
  total_contributed: number;
  total_expected: number;
  contribution_rate: number;
  cycles_participated: number;
  times_received_distribution: number;
  pending_contributions: number;
  late_contributions: number;
}

export interface TontineInvitation {
  id: string;
  tontine_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
  revoked_at?: string;
  max_uses?: number;
  use_count: number;
}

export interface TontineApplication {
  id: string;
  tontine_id: string;
  invitation_id?: string;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface CreateInvitationDto {
  expires_in_days?: number;
  max_uses?: number;
}

export interface ApplyToTontineDto {
  message?: string;
}

export interface ReviewApplicationDto {
  action: 'approve' | 'reject';
}
