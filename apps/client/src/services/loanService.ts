import api from './api'

export interface LoanDocumentPayload {
  filename: string
  mimeType: string
  size: number
  base64?: string
  url?: string | null
}

export interface LoanSimulationInstallment {
  installment: number
  amount: number
  interestPortion: number
  principalPortion: number
  remainingBalance: number
  dueDate: string
}

export interface LoanSimulationResult {
  amount: number
  durationMonths: number
  interestRate: number
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  schedule: LoanSimulationInstallment[]
}

export interface Loan {
  id: string
  userId: string
  amount: number
  durationMonths: number
  purpose?: string | null
  monthlyIncome?: number
  employer?: string | null
  notes?: string | null
  status: string
  interestRate?: number | null
  monthlyPayment?: number | null
  totalInterest?: number | null
  totalCost?: number | null
  amortizationSchedule?: LoanSimulationInstallment[] | null
  supportingDocuments?: LoanDocumentPayload[] | null
  riskScore?: number | null
  approvedBy?: string | null
  approvedAt?: string | null
  approvedAmount?: number | null
  approvalNotes?: string | null
  rejectionReason?: string | null
  disbursedAccountId?: string | null
  disbursedAt?: string | null
  nextPaymentDueAt?: string | null
  outstandingBalance?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  simulation?: LoanSimulationResult
}

export interface LoanRepayment {
  id: string
  loanId: string
  amount: number
  penaltyFee?: number | null
  paidAt: string
  dueDate?: string | null
  reference?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateLoanPayload {
  amount: number
  durationMonths: number
  purpose: string
  monthlyIncome: number
  employer?: string
  notes?: string
  documents?: LoanDocumentPayload[]
}

export interface LoanRepaymentPayload {
  amount: number
  paidAt?: string
  dueDate?: string
  penaltyFee?: number
  reference?: string
}

const camelCaseLoan = (loan: Record<string, unknown>): Loan => ({
  id: loan.id as string,
  userId: loan.user_id as string,
  amount: loan.amount as number,
  durationMonths: loan.duration_months as number,
  purpose: loan.purpose as string | null | undefined,
  monthlyIncome: loan.monthly_income as number | undefined,
  employer: loan.employer as string | null | undefined,
  notes: loan.notes as string | null | undefined,
  status: loan.status as string,
  interestRate: loan.interest_rate as number | null | undefined,
  monthlyPayment: loan.monthly_payment as number | null | undefined,
  totalInterest: loan.total_interest as number | null | undefined,
  totalCost: loan.total_cost as number | null | undefined,
  amortizationSchedule: loan.amortization_schedule as LoanSimulationInstallment[] | null | undefined,
  supportingDocuments: loan.supporting_documents as LoanDocumentPayload[] | null | undefined,
  riskScore: loan.risk_score as number | null | undefined,
  approvedBy: loan.approved_by as string | null | undefined,
  approvedAt: loan.approved_at as string | null | undefined,
  approvedAmount: loan.approved_amount as number | null | undefined,
  approvalNotes: loan.approval_notes as string | null | undefined,
  rejectionReason: loan.rejection_reason as string | null | undefined,
  disbursedAccountId: loan.disbursed_account_id as string | null | undefined,
  disbursedAt: loan.disbursed_at as string | null | undefined,
  nextPaymentDueAt: loan.next_payment_due_at as string | null | undefined,
  outstandingBalance: loan.outstanding_balance as number | null | undefined,
  createdAt: loan.created_at as string | null | undefined,
  updatedAt: loan.updated_at as string | null | undefined,
  simulation: loan.simulation as LoanSimulationResult | undefined,
})

const camelCaseRepayment = (repayment: Record<string, unknown>): LoanRepayment => ({
  id: repayment.id as string,
  loanId: repayment.loan_id as string,
  amount: repayment.amount as number,
  penaltyFee: repayment.penalty_fee as number | null | undefined,
  paidAt: repayment.paid_at as string,
  dueDate: repayment.due_date as string | null | undefined,
  reference: repayment.reference as string | null | undefined,
  status: repayment.status as string | null | undefined,
  createdAt: repayment.created_at as string | null | undefined,
  updatedAt: repayment.updated_at as string | null | undefined,
})

export const fetchUserLoans = async (): Promise<Loan[]> => {
  const { data } = await api.get('/loans')
  const collection = Array.isArray(data?.data) ? data.data : data
  return (collection ?? []).map(camelCaseLoan)
}

export const createLoan = async (payload: CreateLoanPayload): Promise<Loan> => {
  const { data } = await api.post('/loans', payload)
  return camelCaseLoan(data)
}

export const fetchLoan = async (loanId: string): Promise<Loan> => {
  const { data } = await api.get(`/loans/${loanId}`)
  return camelCaseLoan(data)
}

export const fetchLoanRepayments = async (loanId: string): Promise<LoanRepayment[]> => {
  const { data } = await api.get(`/loans/${loanId}/repayments`)
  return (data ?? []).map(camelCaseRepayment)
}

export const recordLoanRepayment = async (loanId: string, payload: LoanRepaymentPayload) => {
  const { data } = await api.post(`/loans/${loanId}/repayments`, payload)
  return {
    loan: camelCaseLoan(data.loan),
    repayment: camelCaseRepayment(data.repayment),
  }
}
