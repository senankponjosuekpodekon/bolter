export const LOAN_STATUSES = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  LATE_PAYMENT: 'LATE_PAYMENT',
  PAID: 'PAID',
} as const;

export type LoanStatus = typeof LOAN_STATUSES[keyof typeof LOAN_STATUSES];

export interface LoanSimulationInstallment {
  installment: number;
  amount: number;
  interestPortion: number;
  principalPortion: number;
  remainingBalance: number;
  dueDate: string;
}

export interface LoanSimulationResult {
  amount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  schedule: LoanSimulationInstallment[];
}

export const DEFAULT_INTEREST_RATE = 0.07;
export const MAX_INTEREST_RATE = 0.18;
export const MIN_INTEREST_RATE = 0.03;
export const PENALTY_RATE_PER_DAY = 0.0008;
