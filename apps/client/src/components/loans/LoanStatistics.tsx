import { useQuery } from "@tanstack/react-query";
import { fetchLoanStatistics } from "../../services/loanService";
import { formatCurrency, formatDate } from "../../lib/format";

interface LoanStatisticsProps {
  loanId: string;
}

export const LoanStatistics: React.FC<LoanStatisticsProps> = ({ loanId }) => {
  const {
    data: statistics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loan", loanId, "statistics"],
    queryFn: () => fetchLoanStatistics(loanId),
    enabled: Boolean(loanId),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-slate-200 rounded"></div>
            <div className="h-16 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load statistics";
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-rose-900">
              Unable to load statistics
            </h3>
            <p className="text-sm text-rose-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const progressWidth = Math.min(
    100,
    Math.max(0, statistics.progressPercentage)
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Repayment Progress
        </h3>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span className="font-semibold text-slate-900">
              {statistics.progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                statistics.onSchedule
                  ? "bg-gradient-to-r from-emerald-500 to-green-600"
                  : "bg-gradient-to-r from-amber-500 to-orange-600"
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-500 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(statistics.totalPaid)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-500 mb-1">Outstanding</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(statistics.outstandingBalance)}
            </p>
          </div>
        </div>

        {/* Schedule Status */}
        {!statistics.onSchedule && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-amber-900">
                Payment Overdue
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Statistics */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Payment Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Payments Made</p>
            <p className="text-lg font-semibold text-slate-900">
              {statistics.paymentsMade} / {statistics.expectedPayments}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Monthly Payment</p>
            <p className="text-lg font-semibold text-slate-900">
              {statistics.monthlyPayment
                ? formatCurrency(statistics.monthlyPayment)
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Next Payment Due</p>
            <p className="text-lg font-semibold text-slate-900">
              {statistics.nextPaymentDue
                ? formatDate(statistics.nextPaymentDue)
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Total Penalties</p>
            <p className="text-lg font-semibold text-rose-600">
              {formatCurrency(statistics.totalPenalties)}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Original Amount</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(statistics.amount)}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Total Cost</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(statistics.totalCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Cost Breakdown
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Principal</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(statistics.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total Interest</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(statistics.totalCost - statistics.amount)}
            </span>
          </div>

          {statistics.totalPenalties > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Penalties</span>
              <span className="font-semibold text-rose-600">
                {formatCurrency(statistics.totalPenalties)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-900">Total Amount</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(statistics.totalCost + statistics.totalPenalties)}
            </span>
          </div>
        </div>

        {/* Visual Chart */}
        <div className="mt-6">
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div
              className="bg-emerald-500"
              style={{
                width: `${(statistics.totalPaid / (statistics.totalCost + statistics.totalPenalties)) * 100}%`,
              }}
              title={`Paid: ${formatCurrency(statistics.totalPaid)}`}
            />
            <div
              className="bg-slate-300"
              style={{
                width: `${(statistics.outstandingBalance / (statistics.totalCost + statistics.totalPenalties)) * 100}%`,
              }}
              title={`Outstanding: ${formatCurrency(statistics.outstandingBalance)}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Paid</span>
            <span>Outstanding</span>
          </div>
        </div>
      </div>
    </div>
  );
};
