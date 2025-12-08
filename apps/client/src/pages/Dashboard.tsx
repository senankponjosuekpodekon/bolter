import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import BalanceCard from "../components/dashboard/BalanceCard";
import QuickActions from "../components/dashboard/QuickActions";
import { useFormatting } from "../hooks";

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

  const totalBalance =
    accounts?.reduce(
      (sum: number, acc: import("../types").Account) =>
        sum + parseFloat(acc.balance),
      0
    ) || 0;

  // Analytics
  const monthlyExpenses = useMemo(() => {
    if (!transactions) return 0;
    const now = new Date();
    return transactions
      .filter(
        (tx: import("../types").Transaction) =>
          tx.type === "WITHDRAWAL" &&
          new Date(tx.created_at).getMonth() === now.getMonth()
      )
      .reduce(
        (sum: number, tx: import("../types").Transaction) =>
          sum + parseFloat(tx.amount),
        0
      );
  }, [transactions]);

  const monthlyIncome = useMemo(() => {
    if (!transactions) return 0;
    const now = new Date();
    return transactions
      .filter(
        (tx: import("../types").Transaction) =>
          tx.type === "DEPOSIT" &&
          new Date(tx.created_at).getMonth() === now.getMonth()
      )
      .reduce(
        (sum: number, tx: import("../types").Transaction) =>
          sum + parseFloat(tx.amount),
        0
      );
  }, [transactions]);

  const topCategory = useMemo(() => {
    if (!transactions) return "";
    const categories: Record<string, number> = {};
    transactions.forEach((tx: import("../types").Transaction) => {
      if (tx.category) {
        categories[tx.category] = (categories[tx.category] || 0) + 1;
      }
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }, [transactions]);

  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { currency: currencyFormatter, date: dateFormatter } = useFormatting({
    locale: user?.locale ?? "en-US",
  });

  useEffect(() => {
    const l =
      user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US");
    loadLocale(l);
  }, [user?.locale]);

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
    return recs;
  }, [monthlyExpenses, monthlyIncome, topCategory]);

  const loading = accountsLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 p-4">
        {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard amount={totalBalance} loading={accountsLoading} />
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.accounts")}
          </h3>
          {loading ? (
            <div className="h-6 bg-gray-200 rounded w-1/3 mt-2 animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {accounts?.length || 0}
            </p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.transactions")}
          </h3>
          {loading ? (
            <div className="h-6 bg-gray-200 rounded w-1/3 mt-2 animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {transactions?.length || 0}
            </p>
          )}
        </div>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.monthly_expenses")}
          </h3>
          <p className="mt-2 text-xl text-red-600">
            {currencyFormatter.format(monthlyExpenses, user?.currency ?? "EUR")}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.monthly_income")}
          </h3>
          <p className="mt-2 text-xl text-green-600">
            {currencyFormatter.format(monthlyIncome, user?.currency ?? "EUR")}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            {t("dashboard.top_category")}
          </h3>
          <p className="mt-2 text-xl">{topCategory || t("common.na")}</p>
        </div>
      </div>

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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {t("dashboard.recent_transactions")}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions
            ?.slice(0, 5)
            .map((tx: import("../types").Transaction) => (
              <div
                key={tx.id}
                className="px-6 py-4 flex justify-between items-center"
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
            ))}
        </div>
      </div>
    </div>
  );
}
