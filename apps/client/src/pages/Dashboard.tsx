import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import { createLoan } from "../services/loanService";
import NewTransactionModal from "../components/transactions/NewTransactionModal";
import { useFormatting, useEnabledWidgets } from "../hooks";
import { useToast } from "../hooks/useToast";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    "transfer" | "deposit" | "withdraw" | null
  >(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanFormData, setLoanFormData] = useState({
    amount: "500000",
    durationMonths: "12",
    purpose: "",
    monthlyIncome: "1500000",
    employer: "",
    notes: "",
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<
    import("../types").Account[]
  >({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<
    import("../types").Transaction[]
  >({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

  // Fetch approved loans to include them in activity
  const { data: approvedLoans = [] } = useQuery({
    queryKey: ["loans", "approved"],
    queryFn: async () => {
      try {
        // Fetch loans that are IN_PROGRESS (recently approved loans)
        const response = await api.get("/loans?status=IN_PROGRESS");
        const loansData = Array.isArray(response.data)
          ? response.data
          : (response.data?.data ?? []);
        return loansData;
      } catch (error) {
        console.error("Failed to fetch approved loans:", error);
        return [];
      }
    },
    staleTime: 5000,
  });

  // Get auth store user and setter early
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Fetch profile to keep auth store in sync with backend
  // This ensures 2FA status, KYC status, etc. are always current
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("/auth/profile");
      return response.data;
    },
  });

  // Update auth store when profile data changes, but only if there are actual changes
  useEffect(() => {
    if (!profileData || !user) return;

    // Check if any profile data differs from current user state
    const hasChanges = Object.entries(profileData).some(
      ([key, value]) => user[key as keyof typeof user] !== value
    );

    if (hasChanges) {
      setUser({
        ...user,
        ...profileData,
      });
    }
  }, [profileData]);

  const [activeAccountIndex, setActiveAccountIndex] = useState(0);

  const activeAccount = accounts?.[activeAccountIndex];
  const hasAccounts = (accounts?.length ?? 0) > 0;
  const hasMultipleAccounts = (accounts?.length ?? 0) > 1;

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!activeAccount?.id) return transactions;
    const scoped = transactions.filter((tx) =>
      tx.account_id ? tx.account_id === activeAccount.id : true
    );
    // If no transaction carries account_id, fall back to all to avoid empty UI
    return scoped.length ? scoped : transactions;
  }, [transactions, activeAccount?.id]);

  const { t } = useTranslation();
  const toast = useToast();
  const { currency: currencyFormatter, date: dateFormatter } = useFormatting({
    locale: user?.locale ?? "en-US",
  });

  // Widget display preferences from enabled widgets hook
  const enabledWidgets = useEnabledWidgets();

  const handleOpenTransaction = useCallback(
    (type: "transfer" | "deposit" | "withdraw") => {
      setSelectedTransactionType(type);
      setTransactionModalOpen(true);
    },
    []
  );

  const handleCloseTransaction = useCallback(() => {
    setTransactionModalOpen(false);
    setSelectedTransactionType(null);
  }, []);

  const handleOpenLoanModal = useCallback(() => {
    if (user?.kyc_status !== "APPROVED") {
      // KYC not approved, show warning toast
      toast.warning(
        t("dashboard.kyc_required_for_loan"),
        t("dashboard.kyc_required_title")
      );
      return;
    }
    setLoanModalOpen(true);
  }, [user?.kyc_status, t, toast]);

  const handleCloseLoanModal = useCallback(() => {
    setLoanModalOpen(false);
    setLoanFormData({
      amount: "500000",
      durationMonths: "12",
      purpose: "",
      monthlyIncome: "1500000",
      employer: "",
      notes: "",
    });
  }, []);

  const handleSubmitLoan = useCallback(async () => {
    try {
      const payload = {
        amount: parseFloat(loanFormData.amount),
        durationMonths: parseInt(loanFormData.durationMonths),
        purpose: loanFormData.purpose,
        monthlyIncome: parseFloat(loanFormData.monthlyIncome),
        employer: loanFormData.employer,
        notes: loanFormData.notes,
      };

      const response = await createLoan(payload);
      if (response) {
        // Close modal first
        setLoanModalOpen(false);

        // Reset form
        setLoanFormData({
          amount: "500000",
          durationMonths: "12",
          purpose: "",
          monthlyIncome: "1500000",
          employer: "",
          notes: "",
        });

        // Note: Success notification will come from server via WebSocket
        // No need to show a duplicate toast here
      }
    } catch (error) {
      console.error("Error submitting loan:", error);
      // Show error toast only on failure
      toast.error(
        t("dashboard.loan_request_error"),
        t("dashboard.loan_request_error_title")
      );
    }
  }, [loanFormData, t, toast]);

  useEffect(() => {
    if (accounts && activeAccountIndex >= accounts.length) {
      setActiveAccountIndex(0);
    }
  }, [accounts, activeAccountIndex]);

  useEffect(() => {
    const l =
      user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US");
    loadLocale(l);
  }, [user?.locale]);

  const { monthlyExpenses, monthlyIncome, topCategory, approvedLoansCount } =
    useMemo(() => {
      const now = new Date();
      const month = now.getMonth();
      const categories: Record<string, number> = {};
      let expenses = 0;
      let income = 0;

      // Calculate expenses and income from filtered transactions
      if (filteredTransactions && filteredTransactions.length > 0) {
        filteredTransactions.forEach((tx: import("../types").Transaction) => {
          const createdMonth = new Date(tx.created_at).getMonth();
          if (createdMonth === month) {
            if (tx.type === "WITHDRAWAL") expenses += parseFloat(tx.amount);
            if (tx.type === "DEPOSIT") income += parseFloat(tx.amount);
          }
          if (tx.category) {
            categories[tx.category] = (categories[tx.category] || 0) + 1;
          }
        });
      }
      const topCategoryEntry = Object.entries(categories).sort(
        (a, b) => b[1] - a[1]
      )[0];

      // Count approved loans from this month
      const monthlyApprovedLoans = Array.isArray(approvedLoans)
        ? approvedLoans.filter((loan: { approved_at?: string }) => {
            const approvalMonth = loan.approved_at
              ? new Date(loan.approved_at).getMonth()
              : -1;
            return approvalMonth === month;
          }).length
        : 0;

      return {
        monthlyExpenses: expenses,
        monthlyIncome: income,
        topCategory: topCategoryEntry?.[0] || "",
        approvedLoansCount: monthlyApprovedLoans,
      };
    }, [filteredTransactions, approvedLoans]);

  const handlePrevAccount = useCallback(() => {
    if (!accounts || accounts.length === 0) return;
    setActiveAccountIndex((prev) =>
      prev === 0 ? accounts.length - 1 : prev - 1
    );
  }, [accounts]);

  const handleNextAccount = useCallback(() => {
    if (!accounts || accounts.length === 0) return;
    setActiveAccountIndex((prev) => (prev + 1) % accounts.length);
  }, [accounts]);

  useEffect(() => {
    if (!hasMultipleAccounts || !accounts?.length) return;
    const autoRotate = window.setInterval(() => {
      setActiveAccountIndex((prev) => (prev + 1) % accounts.length);
    }, 8000);
    return () => window.clearInterval(autoRotate);
  }, [accounts?.length, hasMultipleAccounts]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!hasMultipleAccounts) return;
      if (e.key === "ArrowLeft") handlePrevAccount();
      if (e.key === "ArrowRight") handleNextAccount();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNextAccount, handlePrevAccount, hasMultipleAccounts]);

  // Recommendations (sample)
  const recommendations = useMemo(() => {
    const recs: { key: string; vars?: Record<string, unknown> }[] = [];
    if (monthlyExpenses > 1000)
      recs.push({
        key: "dashboard.recommend.high_expense",
        vars: { amount: 1000 },
      });
    if (monthlyIncome > monthlyExpenses)
      recs.push({ key: "dashboard.recommend.positive_savings" });
    if (topCategory)
      recs.push({
        key: "dashboard.recommend.top_category",
        vars: { category: topCategory },
      });
    // Add recommendation for approved loans
    if (approvedLoansCount > 0 && Array.isArray(approvedLoans)) {
      const now = new Date();
      const month = now.getMonth();
      const approvedAmount = approvedLoans
        .filter((loan: { approved_at?: string; amount?: number }) => {
          const approvalMonth = loan.approved_at
            ? new Date(loan.approved_at).getMonth()
            : -1;
          return approvalMonth === month;
        })
        .reduce(
          (sum: number, loan: { amount?: number }) => sum + (loan.amount || 0),
          0
        );
      if (approvedAmount > 0) {
        recs.push({
          key: "dashboard.recommend.loans_approved",
          vars: { count: approvedLoansCount, amount: approvedAmount },
        });
      }
    }
    return recs;
  }, [
    monthlyExpenses,
    monthlyIncome,
    topCategory,
    approvedLoansCount,
    approvedLoans,
  ]);

  const loading = accountsLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white p-4">
        {t("dashboard.title")}
      </h1>

      {/* Accounts Carousel - only show if enabled */}
      {enabledWidgets.accounts && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white rounded-2xl shadow-xl p-6 md:p-7 relative overflow-hidden">
          {accountsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div className="h-8 bg-white/10 rounded w-2/3" />
              <div className="h-6 bg-white/10 rounded w-1/3" />
              <div className="h-20 bg-white/10 rounded" />
            </div>
          ) : !hasAccounts ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-200">
                {t("dashboard.accounts")}
              </p>
              <p className="text-2xl font-semibold">--</p>
              <p className="text-sm text-slate-300">{t("common.na")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    {t("dashboard.accounts")}
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    {activeAccount?.account_number ||
                      activeAccount?.id ||
                      t("common.na")}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                      {activeAccount?.account_type || t("common.na")}
                    </span>
                    {activeAccount?.status ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">
                        {activeAccount.status}
                      </span>
                    ) : null}
                  </div>
                </div>

                {hasMultipleAccounts && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevAccount}
                      className="h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/20"
                      aria-label="Previous account"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextAccount}
                      className="h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/20"
                      aria-label="Next account"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-300">Balance</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {currencyFormatter.format(
                      parseFloat(activeAccount?.balance ?? "0"),
                      activeAccount?.currency ?? user?.currency ?? "EUR"
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">Currency</p>
                    <p className="font-medium">
                      {activeAccount?.currency || user?.currency || "EUR"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Limit</p>
                    <p className="font-medium">
                      {typeof activeAccount?.limit === "number"
                        ? currencyFormatter.format(
                            activeAccount.limit,
                            activeAccount.currency ?? user?.currency ?? "EUR"
                          )
                        : t("common.na")}
                    </p>
                  </div>
                </div>
              </div>

              {hasMultipleAccounts && (
                <div className="mt-6 flex items-center gap-2">
                  {accounts?.map((_, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveAccountIndex(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        idx === activeAccountIndex ? "bg-white" : "bg-white/30"
                      }`}
                      aria-label={`Switch to account ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard amount={totalBalance} loading={accountsLoading} />
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("dashboard.accounts")}
          </h3>
          {loading ? (
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mt-2 animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {accounts?.length || 0}
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("dashboard.transactions")}
          </h3>
          {loading ? (
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mt-2 animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {transactions?.length || 0}
            </p>
          )}
        </div>
      </div> */}

      {/* <QuickActions /> */}

      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-1">
            {t("dashboard.quick_actions")}
          </h2>
          <p className="text-white/80 text-xs mb-4">
            {t("dashboard.manage_money")}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {/* Deposit Button */}
            <button
              onClick={() => handleOpenTransaction("deposit")}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                  <svg
                    className="w-5 h-5 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-semibold text-xs">
                    {t("dashboard.deposit")}
                  </h3>
                  <p className="text-white/60 text-xs hidden">
                    {t("dashboard.add_funds")}
                  </p>
                </div>
              </div>
            </button>

            {/* Withdraw Button */}
            <button
              onClick={() => handleOpenTransaction("withdraw")}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 flex items-center justify-center transition-colors">
                  <svg
                    className="w-5 h-5 text-amber-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-semibold text-xs">
                    {t("dashboard.withdraw")}
                  </h3>
                  <p className="text-white/60 text-xs hidden">
                    {t("dashboard.withdraw_funds")}
                  </p>
                </div>
              </div>
            </button>

            {/* Transfer Button */}
            <button
              onClick={() => handleOpenTransaction("transfer")}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg p-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                  <svg
                    className="w-5 h-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-semibold text-xs">
                    {t("dashboard.transfer")}
                  </h3>
                  <p className="text-white/60 text-xs hidden">
                    {t("dashboard.send_money")}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <div className="inline-block bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎁 {t("dashboard.special_offer")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("dashboard.get_loan_title")}
            </h2>
            <p className="text-white/90 text-sm md:text-base mb-6">
              {t("dashboard.get_loan_description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleOpenLoanModal}
                className="inline-flex items-center justify-center bg-white text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("dashboard.request_loan")}
              </button>
              <button className="inline-flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg backdrop-blur border border-white/30 transition-all duration-300">
                {t("dashboard.learn_more")}
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 rounded-2xl blur-xl" />
              <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-white/90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-center text-sm font-medium text-white/80">
                  {t("dashboard.loan_benefits")}
                </p>
                <div className="mt-4 space-y-2 text-xs text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    <span>{t("dashboard.quick_approval")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    <span>{t("dashboard.competitive_rates")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    <span>{t("dashboard.flexible_terms")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Security Alert Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {t("dashboard.secure_profile")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("dashboard.secure_profile_desc")}
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            {t("dashboard.security")}
          </div>
        </div>

        <div className="space-y-3">
          {/* KYC Status Alert */}
          <div
            className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
              user?.kyc_status === "APPROVED"
                ? "bg-emerald-50 border-emerald-200"
                : user?.kyc_status === "SUBMITTED" ||
                    user?.kyc_status === "PENDING"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                user?.kyc_status === "APPROVED"
                  ? "bg-emerald-100"
                  : user?.kyc_status === "SUBMITTED" ||
                      user?.kyc_status === "PENDING"
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              {user?.kyc_status === "APPROVED" ? (
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : user?.kyc_status === "REJECTED" ? (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {t(
                  `dashboard.kyc_status_${user?.kyc_status?.toLowerCase() || "pending"}`
                )}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {user?.kyc_status === "APPROVED"
                  ? t("dashboard.kyc_approved_msg")
                  : user?.kyc_status === "REJECTED"
                    ? t("dashboard.kyc_rejected_msg")
                    : user?.kyc_status === "SUBMITTED"
                      ? t("dashboard.kyc_submitted_msg")
                      : t("dashboard.kyc_pending_msg")}
              </p>
              {user?.kyc_status !== "APPROVED" && (
                <a
                  href="/profile#profile-kyc"
                  className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t("dashboard.complete_kyc")} →
                </a>
              )}
            </div>
          </div>

          {/* 2FA Status Alert */}
          <div
            className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
              user?.two_factor_enabled
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                user?.two_factor_enabled ? "bg-emerald-100" : "bg-red-100"
              }`}
            >
              {user?.two_factor_enabled ? (
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13 7H7v6h6V7zM7 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H7zm0-2a4 4 0 00-4 4v6a4 4 0 004 4h6a4 4 0 004-4V7a4 4 0 00-4-4H7z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {user?.two_factor_enabled
                  ? t("dashboard.2fa_enabled")
                  : t("dashboard.2fa_disabled")}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {user?.two_factor_enabled
                  ? t("dashboard.2fa_enabled_msg")
                  : t("dashboard.2fa_disabled_msg")}
              </p>
              {!user?.two_factor_enabled && (
                <a
                  href="/profile#profile-2fa"
                  className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t("dashboard.enable_2fa")} →
                </a>
              )}
            </div>
          </div>

          {/* Profile Completion Alert */}
          {(!user?.phone || !user?.address) && (
            <div className="flex items-start gap-4 p-4 rounded-lg border-2 bg-orange-50 border-orange-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13 7H7v6h6V7zM7 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H7zm0-2a4 4 0 00-4 4v6a4 4 0 004 4h6a4 4 0 004-4V7a4 4 0 00-4-4H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {t("dashboard.complete_profile")}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {t("dashboard.complete_profile_msg")}
                </p>
                <a
                  href="/profile"
                  className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t("dashboard.update_profile")} →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600 font-medium mb-2">
            {t("dashboard.security_benefits")}:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>{t("dashboard.fraud_protection")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>{t("dashboard.higher_limits")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>{t("dashboard.loan_eligible")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary & Dashboard Widget - only show if enabled */}
      {enabledWidgets.dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t("dashboard.monthly_summary")}
              </h2>
              <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                {new Date().toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expenses Card */}
              <div className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4m0 0L3 5m0 0v8m0-8l8 8"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("dashboard.monthly_expenses")}
                    </p>
                    <p className="text-sm text-gray-400">Outflows</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {currencyFormatter.format(
                    monthlyExpenses,
                    user?.currency ?? "EUR"
                  )}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {loading
                    ? "..."
                    : `${
                        filteredTransactions?.filter(
                          (tx: import("../types").Transaction) => {
                            const createdMonth = new Date(
                              tx.created_at
                            ).getMonth();
                            return (
                              createdMonth === new Date().getMonth() &&
                              tx.type === "WITHDRAWAL"
                            );
                          }
                        ).length || 0
                      } transactions`}
                </div>
              </div>

              {/* Income Card */}
              <div className="bg-white rounded-xl p-4 border border-green-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4m0 0L3 19m0 0v-8m0 8l8-8"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("dashboard.monthly_income")}
                    </p>
                    <p className="text-sm text-gray-400">Inflows</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(
                    monthlyIncome,
                    user?.currency ?? "EUR"
                  )}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {loading
                    ? "..."
                    : `${
                        filteredTransactions?.filter(
                          (tx: import("../types").Transaction) => {
                            const createdMonth = new Date(
                              tx.created_at
                            ).getMonth();
                            return (
                              createdMonth === new Date().getMonth() &&
                              tx.type === "DEPOSIT"
                            );
                          }
                        ).length || 0
                      } transactions`}
                </div>
              </div>
            </div>

            {/* Net Flow */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p
                  className={`text-lg font-bold ${monthlyIncome - monthlyExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {currencyFormatter.format(
                    monthlyIncome - monthlyExpenses,
                    user?.currency ?? "EUR"
                  )}
                </p>
              </div>
            </div>

            {/* Approved Loans This Month */}
            {approvedLoansCount > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Approved Loans
                      </p>
                      <p className="text-sm text-gray-400">
                        {approvedLoansCount} loan(s) approved
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {currencyFormatter.format(
                      Array.isArray(approvedLoans)
                        ? approvedLoans
                            .filter((loan: { approved_at?: string }) => {
                              const approvalMonth = loan.approved_at
                                ? new Date(loan.approved_at).getMonth()
                                : -1;
                              return approvalMonth === new Date().getMonth();
                            })
                            .reduce(
                              (sum: number, loan: { amount?: number }) =>
                                sum + (loan.amount || 0),
                              0
                            )
                        : 0,
                      user?.currency ?? "EUR"
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.top_category")}
          </h3>
          <p className="mt-2 text-xl">{topCategory || t("common.na")}</p>
        </div> */}
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-blue-700">
          {t("dashboard.recommendations_title")}
        </h3>
        <ul className="mt-2 list-disc pl-6">
          {recommendations.map((rec, idx: number) => (
            <li key={idx}>{rec.vars ? t(rec.key, rec.vars) : t(rec.key)}</li>
          ))}
        </ul>
      </div>

      {/* Transactions Widget - only show if enabled */}
      {enabledWidgets.transactions && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {t("dashboard.recent_transactions")}
            </h2>
            <a
              href="/transactions"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
            >
              {t("dashboard.view_all", { defaultValue: "View All" })} →
            </a>
          </div>
          <div className="divide-y divide-gray-200">
            {/* Approved Loans (shown first) */}
            {Array.isArray(approvedLoans) &&
              approvedLoans.length > 0 &&
              approvedLoans
                .slice(0, 5)
                .map(
                  (loan: {
                    id: string;
                    approved_at?: string;
                    amount?: number;
                  }) => (
                    <div
                      key={`loan-${loan.id}`}
                      className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Loan Approved
                        </p>
                        <p className="text-sm text-gray-500">
                          {loan.approved_at
                            ? dateFormatter.format(
                                new Date(loan.approved_at),
                                "long"
                              )
                            : "Recently approved"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          +
                          {currencyFormatter.format(
                            loan.amount || 0,
                            user?.currency ?? "EUR"
                          )}
                        </p>
                        <p className="text-xs text-gray-500">APPROVED</p>
                      </div>
                    </div>
                  )
                )}

            {/* Recent Transactions */}
            {filteredTransactions && filteredTransactions.length > 0 ? (
              filteredTransactions
                .slice(0, 5)
                .map((tx: import("../types").Transaction) => (
                  <div
                    key={tx.id}
                    className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description || t("dashboard.transaction")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {dateFormatter.format(new Date(tx.created_at), "long")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}
                      >
                        {tx.type === "DEPOSIT" ? "+" : "-"}
                        {currencyFormatter.format(
                          Number(tx.amount),
                          tx.currency ?? "EUR"
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{tx.status}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <p className="text-sm">
                  {t("dashboard.no_transactions", {
                    defaultValue: "No recent transactions",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* View All Button */}
          {filteredTransactions && filteredTransactions.length > 5 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <a
                href="/transactions"
                className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                {t("dashboard.view_all_transactions", {
                  defaultValue: "View All Transactions",
                })}{" "}
                ({filteredTransactions.length})
              </a>
            </div>
          )}
        </div>
      )}

      <NewTransactionModal
        open={transactionModalOpen}
        onClose={handleCloseTransaction}
        initialType={selectedTransactionType || undefined}
      />

      {/* Loan Request Modal */}
      {loanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {t("dashboard.loan_request_title")}
              </h2>
              <button
                onClick={handleCloseLoanModal}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_amount")}
                </label>
                <input
                  type="number"
                  value={loanFormData.amount}
                  onChange={(e) =>
                    setLoanFormData({ ...loanFormData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_duration")}
                </label>
                <input
                  type="number"
                  value={loanFormData.durationMonths}
                  onChange={(e) =>
                    setLoanFormData({
                      ...loanFormData,
                      durationMonths: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="12"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_purpose")}
                </label>
                <input
                  type="text"
                  value={loanFormData.purpose}
                  onChange={(e) =>
                    setLoanFormData({
                      ...loanFormData,
                      purpose: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={t("dashboard.loan_purpose_placeholder")}
                />
              </div>

              {/* Monthly Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_monthly_income")}
                </label>
                <input
                  type="number"
                  value={loanFormData.monthlyIncome}
                  onChange={(e) =>
                    setLoanFormData({
                      ...loanFormData,
                      monthlyIncome: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="1500000"
                />
              </div>

              {/* Employer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_employer")}
                </label>
                <input
                  type="text"
                  value={loanFormData.employer}
                  onChange={(e) =>
                    setLoanFormData({
                      ...loanFormData,
                      employer: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={t("dashboard.loan_employer_placeholder")}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("dashboard.loan_notes")}
                </label>
                <textarea
                  value={loanFormData.notes}
                  onChange={(e) =>
                    setLoanFormData({ ...loanFormData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder={t("dashboard.loan_notes_placeholder")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t">
              <button
                onClick={handleCloseLoanModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                {t("dashboard.cancel")}
              </button>
              <button
                onClick={handleSubmitLoan}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                {t("dashboard.submit_loan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
