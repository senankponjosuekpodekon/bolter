const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: 'Pending review',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  LATE_PAYMENT: {
    label: 'Late payment',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export interface LoanStatusBadgeProps {
  status: string
}

export const LoanStatusBadge = ({ status }: LoanStatusBadgeProps) => {
  const fallback = {
    label: status?.toLowerCase?.().replace(/_/g, ' ') ?? 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  const config = STATUS_STYLES[status] ?? fallback
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'

  return (
    <span
      className={`${baseClasses} ${config.className}`}
    >
      {config.label}
    </span>
  )
}
