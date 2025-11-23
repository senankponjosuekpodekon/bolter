import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../services/api";

export default function Dashboard() {
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const { data: transactions } = useQuery({
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

  // Recommandations (exemple statique)
  const recommendations = useMemo(() => {
    const recs = [];
    if (monthlyExpenses > 1000)
      recs.push("Attention : vos dépenses ce mois dépassent 1000 €");
    if (monthlyIncome > monthlyExpenses)
      recs.push("Bravo ! Vos revenus dépassent vos dépenses ce mois-ci");
    if (topCategory) recs.push(`Catégorie la plus utilisée : ${topCategory}`);
    return recs;
  }, [monthlyExpenses, monthlyIncome, topCategory]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalBalance.toFixed(2)} €
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {accounts?.length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {transactions?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Dépenses ce mois
          </h3>
          <p className="mt-2 text-xl text-red-600">
            {monthlyExpenses.toFixed(2)} €
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Revenus ce mois</h3>
          <p className="mt-2 text-xl text-green-600">
            {monthlyIncome.toFixed(2)} €
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Catégorie principale
          </h3>
          <p className="mt-2 text-xl">{topCategory || "N/A"}</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-blue-700">
          Recommandations personnalisées
        </h3>
        <ul className="mt-2 list-disc pl-6">
          {recommendations.map((rec: string, idx: number) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Transactions
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
                    {tx.description || "Transaction"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}
                  >
                    {tx.type === "DEPOSIT" ? "+" : "-"}
                    {tx.amount} {tx.currency}
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
