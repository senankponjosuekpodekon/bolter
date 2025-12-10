import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { useToast } from "../components/ui/ToastProvider";
import { useFormatting } from "../hooks";
import {
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Transactions() {
  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 20;

  const toast = useToast();

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

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

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tx: import("../types").Transaction) =>
          tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter(
        (tx: import("../types").Transaction) => tx.type === typeFilter
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (tx: import("../types").Transaction) => tx.status === statusFilter
      );
    }

    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Export CSV function
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast.push({
        title: t("common.error"),
        message: t("transactions.no_data_export", {
          defaultValue: "No data to export",
        }),
        type: "error",
      });
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Description",
      "Amount",
      "Currency",
      "Status",
    ];
    const csvData = filteredTransactions.map(
      (tx: import("../types").Transaction) => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.type,
        tx.description || "",
        tx.amount,
        tx.currency || "EUR",
        tx.status,
      ]
    );

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.push({
      title: t("common.success"),
      message: t("transactions.export_success", {
        defaultValue: "Transactions exported successfully",
      }),
      type: "success",
    });
  };

  // helper moved into forms; keep transactions page minimal

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
          {t("transactions.title")}
        </h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition"
        >
          <Download className="w-4 h-4" />
          {t("transactions.export", { defaultValue: "Export CSV" })}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t("transactions.search_placeholder", {
                defaultValue: "Search by description or ID...",
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Filter className="w-4 h-4" />
            {t("transactions.filters", { defaultValue: "Filters" })}
            {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("transactions.filter_by_type", {
                  defaultValue: "Transaction Type",
                })}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">
                  {t("common.all", { defaultValue: "All" })}
                </option>
                <option value="DEPOSIT">
                  {t("transactions.types.deposit", { defaultValue: "Deposit" })}
                </option>
                <option value="WITHDRAWAL">
                  {t("transactions.types.withdrawal", {
                    defaultValue: "Withdrawal",
                  })}
                </option>
                <option value="TRANSFER">
                  {t("transactions.types.transfer", {
                    defaultValue: "Transfer",
                  })}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("transactions.filter_by_status", { defaultValue: "Status" })}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">
                  {t("common.all", { defaultValue: "All" })}
                </option>
                <option value="APPROVED">
                  {t("transactions.status.approved", {
                    defaultValue: "Approved",
                  })}
                </option>
                <option value="PENDING">
                  {t("transactions.status.pending", {
                    defaultValue: "Pending",
                  })}
                </option>
                <option value="REJECTED">
                  {t("transactions.status.rejected", {
                    defaultValue: "Rejected",
                  })}
                </option>
              </select>
            </div>

            {/* Reset Filters */}
            {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
              <div className="md:col-span-2">
                <button
                  onClick={() => {
                    setTypeFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("transactions.reset_filters", {
                    defaultValue: "Reset all filters",
                  })}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          {t("transactions.showing_results", {
            defaultValue: `Showing ${currentTransactions.length} of ${filteredTransactions.length} transactions`,
            count: currentTransactions.length,
            total: filteredTransactions.length,
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">
            {t("transactions.history_title")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactions.length > 0 ? (
                currentTransactions.map(
                  (tx: import("../types").Transaction) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dateFormatter.format(new Date(tx.created_at), "short")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === "DEPOSIT"
                              ? "bg-green-100 text-green-800"
                              : tx.type === "WITHDRAWAL"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {currencyFormatter.format(
                          Number(tx.amount),
                          tx.currency ?? "EUR"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : tx.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <p className="text-sm">
                      {t("transactions.no_results", {
                        defaultValue: "No transactions found",
                      })}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {t("transactions.pagination_info", {
                defaultValue: `Page ${currentPage} of ${totalPages}`,
                current: currentPage,
                total: totalPages,
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
