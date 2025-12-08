import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormatting } from "../hooks/useFormatting";
import FilterPanel from "../components/admin/FilterPanel";
import FilteredResults from "../components/admin/FilteredResults";
import BulkActionsPanel from "../components/admin/BulkActionsPanel";
import BulkOperationResults from "../components/admin/BulkOperationResults";
import FilterService from "../services/filter.service";
import { BulkOperationResult } from "../services/bulk-operations.service";

interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: string;
  type?: string;
  currency?: string;
  search?: string;
}

/**
 * AdminTransactionFilter page - Transaction filtering with advanced search
 */
const AdminTransactionFilter: React.FC = () => {
  const { t } = useTranslation("admin");
  const { currency, date } = useFormatting();

  const [filters, setFilters] = useState<TransactionFilter>({});
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkOperationResult | null>(
    null
  );

  const pageSize = 25;
  const offset = (currentPage - 1) * pageSize;

  /**
   * Fetch filtered results from API
   */
  const fetchFilteredResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        limit: pageSize,
        offset,
      };

      const response = await FilterService.filterTransactions(params);
      setResults(response.results || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  /**
   * Fetch results when filters or page changes
   */
  useEffect(() => {
    setCurrentPage(1);
    fetchFilteredResults();
  }, [filters]);

  useEffect(() => {
    if (currentPage !== 1) {
      fetchFilteredResults();
    }
  }, [currentPage, fetchFilteredResults]);

  /**
   * Handle filter application
   */
  const handleApplyFilters = (newFilters: TransactionFilter) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  /**
   * Handle filter clearing
   */
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  /**
   * Define table columns
   */
  const columns = [
    {
      key: "id",
      label: t("transactions.id", "ID"),
      render: (value: string) => value.substring(0, 8) + "...",
    },
    {
      key: "from_user_id",
      label: t("transactions.from", "From"),
      render: (value: string) => value.substring(0, 8) + "...",
    },
    {
      key: "to_user_id",
      label: t("transactions.to", "To"),
      render: (value: string) => value.substring(0, 8) + "...",
    },
    {
      key: "amount",
      label: t("transactions.amount", "Amount"),
      render: (value: number, row: any) =>
        currency.format(value, row.currency || "USD"),
    },
    {
      key: "currency",
      label: t("transactions.currency", "Currency"),
    },
    {
      key: "status",
      label: t("transactions.status", "Status"),
      render: (value: string) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === "COMPLETED"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : value === "PENDING"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {t(`transactions.status.${value.toLowerCase()}`, value)}
        </span>
      ),
    },
    {
      key: "created_at",
      label: t("common.date", "Date"),
      render: (value: string) => date.format(new Date(value), "short"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("filters.title", "Advanced Transaction Filter")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search and filter transactions with advanced criteria
        </p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        filterType="transactions"
        loading={loading}
      />

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <BulkActionsPanel
          selectedIds={selectedIds}
          resourceType="transactions"
          onSuccess={setBulkResult}
          onError={(err) => setError(err)}
          onComplete={() => {
            setSelectedIds([]);
            fetchFilteredResults();
          }}
        />
      )}

      {/* Bulk Operation Results */}
      {bulkResult && (
        <BulkOperationResults
          result={bulkResult}
          onClose={() => setBulkResult(null)}
        />
      )}

      {/* Results */}
      <FilteredResults
        data={results}
        total={total}
        columns={columns}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onSelectionChange={setSelectedIds}
        enableSelection={true}
        loading={loading}
        error={error || undefined}
        emptyMessage={t(
          "filters.noResults",
          "No transactions found matching your filters"
        )}
      />
    </div>
  );
};

export default AdminTransactionFilter;
