import { FormEvent, useState } from 'react'
import { Loan, LoanRepayment, LoanRepaymentPayload } from '../../services/loanService'
import { formatCurrency, formatDate } from '../../lib/format.ts'
import { LoanStatusBadge } from './LoanStatusBadge'

interface LoanDetailsPanelProps {
  loan: Loan
  repayments: LoanRepayment[]
  onRecordRepayment: (payload: LoanRepaymentPayload) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
}

const canRepay = (status: string) => ['IN_PROGRESS', 'LATE_PAYMENT'].includes(status)

export const LoanDetailsPanel: React.FC<LoanDetailsPanelProps> = ({
  loan,
  repayments,
  onRecordRepayment,
  isSubmitting,
  errorMessage,
}) => {
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [reference, setReference] = useState('')
  const [penaltyFee, setPenaltyFee] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!amount) {
      return
    }
    await onRecordRepayment({
      amount: Number(amount),
      paidAt: paidAt || undefined,
      reference: reference || undefined,
      penaltyFee: penaltyFee ? Number(penaltyFee) : undefined,
    })
    setAmount('')
    setPaidAt('')
    setReference('')
    setPenaltyFee('')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Loan overview</h2>
            <p className="text-sm text-slate-500">Requested on {formatDate(loan.createdAt)}</p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-medium text-slate-500">Principal</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.amount)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Monthly payment</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.monthlyPayment ?? loan.simulation?.monthlyPayment)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Outstanding balance</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(loan.outstandingBalance ?? loan.totalCost)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Next payment due</p>
            <p className="text-lg font-semibold text-slate-900">{formatDate(loan.nextPaymentDueAt)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Duration</p>
            <p className="text-lg font-semibold text-slate-900">{loan.durationMonths} months</p>
          </div>
          <div>
            <p className="font-medium text-slate-500">Interest rate</p>
            <p className="text-lg font-semibold text-slate-900">{loan.interestRate ? `${(loan.interestRate * 100).toFixed(2)} %` : '—'}</p>
          </div>
        </div>

        {loan.notes ? (
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-500">Notes</p>
            <p className="mt-1 whitespace-pre-line">{loan.notes}</p>
          </div>
        ) : null}

        {loan.rejectionReason ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            <p className="font-semibold">Rejection reason</p>
            <p className="mt-1 whitespace-pre-line">{loan.rejectionReason}</p>
          </div>
        ) : null}
      </div>

      {canRepay(loan.status) ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Record a repayment</h3>
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600">Payment date</label>
              <input
                type="datetime-local"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600">Penalty fee (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={penaltyFee}
                onChange={(event) => setPenaltyFee(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-600">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Transfer reference"
              />
            </div>
            {errorMessage ? (
              <div className="sm:col-span-2 text-sm text-rose-600">{errorMessage}</div>
            ) : null}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Record repayment'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Repayment history</h3>
        {repayments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No repayments recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Penalty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                {repayments.map((repayment) => (
                  <tr key={repayment.id}>
                    <td className="px-4 py-3">{formatDate(repayment.paidAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(repayment.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(repayment.penaltyFee)}</td>
                    <td className="px-4 py-3">{repayment.reference ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
