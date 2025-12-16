export declare const LOAN_STATUSES: {
    readonly PENDING_REVIEW: "PENDING_REVIEW";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly LATE_PAYMENT: "LATE_PAYMENT";
    readonly PAID: "PAID";
};
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
export declare const DEFAULT_INTEREST_RATE = 0.07;
export declare const MAX_INTEREST_RATE = 0.18;
export declare const MIN_INTEREST_RATE = 0.03;
export declare const PENALTY_RATE_PER_DAY = 0.0008;
