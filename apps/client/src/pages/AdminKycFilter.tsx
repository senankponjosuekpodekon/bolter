import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormatting } from "../hooks/useFormatting";
import FilterPanel from "../components/admin/FilterPanel";
import FilteredResults from "../components/admin/FilteredResults";
import BulkActionsPanel from "../components/admin/BulkActionsPanel";
import BulkOperationResults from "../components/admin/BulkOperationResults";
import FilterService from "../services/filter.service";
import { BulkOperationResult } from "../services/bulk-operations.service";

interface KycFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  documentType?: string;
  search?: string;
}

/**
 * AdminKycFilter page - KYC filtering with advanced search
 */
const AdminKycFilter: React.FC = () => {
  const { t } = useTranslation("admin");
  const { date } = useFormatting();

  const [filters, setFilters] = useState<KycFilter>({});
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
   * Fetch filtered KYC results from API
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

      const response = await FilterService.filterKyc(params);
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
  const handleApplyFilters = (newFilters: KycFilter) => {
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
      label: t("kyc.id", "ID"),
      render: (value: string) => value.substring(0, 8) + "...",
    },
    {
      key: "user_id",
      label: t("kyc.userId", "User ID"),
      render: (value: string) => value.substring(0, 8) + "...",
    },
    {
      key: "document_type",
      label: t("kyc.documentType", "Document Type"),
      render: (value: string) =>
        t(`kyc.documentTypes.${value.toLowerCase()}`, value),
    },
    {
      key: "status",
      label: t("kyc.status", "Status"),
      render: (value: string) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === "APPROVED"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : value === "PENDING"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : value === "REJECTED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {t(`kyc.status.${value.toLowerCase()}`, value)}
        </span>
      ),
    },
    {
      key: "submitted_at",
      label: t("common.submitted", "Submitted"),
      render: (value: string) =>
        value ? date.format(new Date(value), "short") : "-",
    },
    {
      key: "reviewed_at",
      label: t("common.reviewed", "Reviewed"),
      render: (value: string) =>
        value ? date.format(new Date(value), "short") : "-",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("filters.title", "Advanced KYC Filter")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search and filter KYC applications with advanced criteria
        </p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        filterType="kyc"
        loading={loading}
      />

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <BulkActionsPanel
          selectedIds={selectedIds}
          resourceType="kyc"
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
          "No KYC applications found matching your filters"
        )}
      />
    </div>
  );
};

export default AdminKycFilter;
