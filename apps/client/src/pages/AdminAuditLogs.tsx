import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AuditLogViewer from "../components/admin/AuditLogViewer";

/**
 * AdminAuditLogs page - View and export audit logs
 */
const AdminAuditLogs: React.FC = () => {
  const { t } = useTranslation("admin");

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    userId: "",
    action: "",
    resourceType: "",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("audit.title", "Audit Logs")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t(
            "audit.subtitle",
            "View and export system activity logs and audit trail"
          )}
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t("audit.filters", "Filter Logs")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("filters.dateFrom", "Date From")}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("filters.dateTo", "Date To")}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("audit.userId", "User ID")}
            </label>
            <input
              type="text"
              placeholder="Enter user ID"
              value={filters.userId}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("audit.action", "Action")}
            </label>
            <input
              type="text"
              placeholder="e.g., kyc_approved, user_created"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("audit.resourceType", "Resource Type")}
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) =>
                setFilters({ ...filters, resourceType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="kyc_document">KYC Document</option>
              <option value="transaction">Transaction</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  dateFrom: "",
                  dateTo: "",
                  userId: "",
                  action: "",
                  resourceType: "",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {t("filters.clearFilters", "Clear Filters")}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Viewer */}
      <AuditLogViewer
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        userId={filters.userId}
        action={filters.action}
        resourceType={filters.resourceType}
      />
    </div>
  );
};

export default AdminAuditLogs;
