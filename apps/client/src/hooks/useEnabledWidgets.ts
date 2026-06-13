import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useEnabledWidgets() {
  const { user } = useAuthStore();

  return useMemo(() => {
    const widgets = user?.preferences?.widgets;
    // If undefined/null, use defaults (all enabled)
    // If array (even empty), use it as-is
    const effectiveWidgets = widgets === undefined || widgets === null
      ? ["dashboard", "transactions", "accounts", "loans", "kyc"]
      : widgets;
    return {
      dashboard: effectiveWidgets.includes("dashboard"),
      transactions: effectiveWidgets.includes("transactions"),
      accounts: effectiveWidgets.includes("accounts"),
      loans: effectiveWidgets.includes("loans"),
      kyc: effectiveWidgets.includes("kyc"),
      tontines: effectiveWidgets.includes("tontines"),
    };
  }, [user?.preferences?.widgets]);
}
