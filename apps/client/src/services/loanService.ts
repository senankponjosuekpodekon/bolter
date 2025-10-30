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

const camelCaseLoan = (loan: any): Loan => ({
  id: loan.id,
  userId: loan.user_id,
  amount: loan.amount,
  durationMonths: loan.duration_months,
  purpose: loan.purpose,
  monthlyIncome: loan.monthly_income,
  employer: loan.employer,
  notes: loan.notes,
  status: loan.status,
  interestRate: loan.interest_rate,
  monthlyPayment: loan.monthly_payment,
  totalInterest: loan.total_interest,
  totalCost: loan.total_cost,
  amortizationSchedule: loan.amortization_schedule,
  supportingDocuments: loan.supporting_documents,
  riskScore: loan.risk_score,
  approvedBy: loan.approved_by,
  approvedAt: loan.approved_at,
  approvedAmount: loan.approved_amount,
  approvalNotes: loan.approval_notes,
  rejectionReason: loan.rejection_reason,
  disbursedAccountId: loan.disbursed_account_id,
  disbursedAt: loan.disbursed_at,
  nextPaymentDueAt: loan.next_payment_due_at,
  outstandingBalance: loan.outstanding_balance,
  createdAt: loan.created_at,
  updatedAt: loan.updated_at,
  simulation: loan.simulation,
})

const camelCaseRepayment = (repayment: any): LoanRepayment => ({
  id: repayment.id,
  loanId: repayment.loan_id,
  amount: repayment.amount,
  penaltyFee: repayment.penalty_fee,
  paidAt: repayment.paid_at,
  dueDate: repayment.due_date,
  reference: repayment.reference,
  status: repayment.status,
  createdAt: repayment.created_at,
  updatedAt: repayment.updated_at,
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
