import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, ChevronDown } from "lucide-react";

interface FilterPanelProps {
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  filterType: "transactions" | "kyc";
  loading?: boolean;
}

/**
 * FilterPanel component - Advanced filtering interface
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  onApplyFilters,
  onClearFilters,
  filterType,
  loading = false,
}) => {
  const { t } = useTranslation("admin");
  const [expanded, setExpanded] = useState(false);

  // Transaction filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [currency, setCurrency] = useState("");
  const [search, setSearch] = useState("");

  // KYC filters
  const [documentType, setDocumentType] = useState("");
  const [kycStatus, setKycStatus] = useState("");

  const handleApply = () => {
    const filters: Record<string, any> = {};

    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (amountMin) filters.amountMin = parseFloat(amountMin);
    if (amountMax) filters.amountMax = parseFloat(amountMax);
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (currency) filters.currency = currency;
    if (documentType) filters.documentType = documentType;
    if (kycStatus) filters.status = kycStatus;
    if (search) filters.search = search;

    filters.offset = 0;
    filters.limit = 25;

    onApplyFilters(filters);
  };

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setStatus("");
    setType("");
    setCurrency("");
    setDocumentType("");
    setKycStatus("");
    setSearch("");
    onClearFilters();
  };

  const hasActiveFilters =
    dateFrom ||
    dateTo ||
    amountMin ||
    amountMax ||
    status ||
    type ||
    currency ||
    documentType ||
    kycStatus ||
    search;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <Search className="w-5 h-5" />
          {t("filters.title")}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Content */}
      {expanded && (
        <div className="space-y-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("filters.search")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.dateFrom")}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.dateTo")}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Transaction-specific filters */}
          {filterType === "transactions" && (
            <>
              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("filters.amountMin")}
                  </label>
                  <input
                    type="number"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("filters.amountMax")}
                  </label>
                  <input
                    type="number"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    placeholder="999999"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filters.type")}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filters.status")}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filters.currency")}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Currencies</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </>
          )}

          {/* KYC-specific filters */}
          {filterType === "kyc" && (
            <>
              {/* KYC Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filters.kycStatus")}
                </label>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("filters.documentType")}
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="ID_CARD">ID Card</option>
                  <option value="DRIVER_LICENSE">Driver License</option>
                  <option value="UTILITY_BILL">Utility Bill</option>
                  <option value="SELFIE">Selfie</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? "Filtering..." : "Apply Filters"}
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
