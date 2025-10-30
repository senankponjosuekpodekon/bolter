import { formatCurrency, formatDate } from '../../lib/format.ts'
import type { Loan } from '../../services/loanService'
import { LoanStatusBadge } from './LoanStatusBadge'

interface LoanSummaryCardProps {
  loan: Loan
  isActive?: boolean
  onSelect?: (loanId: string) => void
}

export const LoanSummaryCard = ({ loan, onSelect, isActive = false }: LoanSummaryCardProps) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(loan.id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full flex-col gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition ${
        isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Amount</p>
          <p className="text-xl font-semibold text-slate-900">{formatCurrency(loan.amount)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <p className="font-medium text-slate-500">Duration</p>
          <p>{loan.durationMonths} months</p>
        </div>
        <div>
          <p className="font-medium text-slate-500">Monthly payment</p>
          <p>{formatCurrency(loan.monthlyPayment ?? loan.simulation?.monthlyPayment)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-500">Requested</p>
          <p>{loan.createdAt ? formatDate(loan.createdAt) : '—'}</p>
        </div>
        <div>
          <p className="font-medium text-slate-500">Outstanding</p>
          <p>{formatCurrency(loan.outstandingBalance ?? loan.amount)}</p>
        </div>
      </div>
    </button>
  )
}
