// No default React import needed with the new JSX runtime

import { useAuthStore } from "../../stores/authStore";
import { formatCurrency } from "../../lib/format";

export default function BalanceCard({
  amount,
  loading,
}: {
  amount?: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/5 mb-4" />
        <div className="h-10 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {formatCurrency(
          amount ?? 0,
          useAuthStore.getState().user?.currency ?? "EUR",
          useAuthStore.getState().user?.locale ?? "en-US"
        )}
      </p>
    </div>
  );
}
