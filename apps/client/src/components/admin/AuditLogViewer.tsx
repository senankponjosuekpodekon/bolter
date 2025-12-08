import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFormatting } from "../../hooks/useFormatting";
import { Loader } from "lucide-react";
import AuditExportService, {
  AuditLog,
} from "../../services/audit-export.service";

interface AuditLogViewerProps {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
}

/**
 * AuditLogViewer component - Displays audit logs in a table with export options
 */
export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  dateFrom,
  dateTo,
  userId,
  action,
  resourceType,
}) => {
  const { t } = useTranslation("admin");
  const { date } = useFormatting();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  /**
   * Fetch audit logs
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const logs = await AuditExportService.getAuditLogs({
        dateFrom,
        dateTo,
        userId,
        action,
        resourceType,
      });

      setLogs(logs || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch audit logs"
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, userId, action, resourceType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Handle export
   */
  const handleExport = async (format: "csv" | "json" | "html") => {
    try {
      setExporting(format);

      if (format === "csv") {
        await AuditExportService.exportAsCSV({
          dateFrom,
          dateTo,
          userId,
          action,
          resourceType,
        });
      } else if (format === "json") {
        await AuditExportService.exportAsJSON({
          dateFrom,
          dateTo,
          userId,
          action,
          resourceType,
        });
      } else {
        await AuditExportService.exportAsHTML({
          dateFrom,
          dateTo,
          userId,
          action,
          resourceType,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export logs");
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {t("audit.noLogs", "No audit logs found")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("audit.showing", `Showing ${logs.length} audit log(s)`)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {exporting === "csv" && <Loader className="w-4 h-4 animate-spin" />}
            {t("audit.exportCSV", "Export CSV")}
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {exporting === "json" && (
              <Loader className="w-4 h-4 animate-spin" />
            )}
            {t("audit.exportJSON", "Export JSON")}
          </button>
          <button
            onClick={() => handleExport("html")}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {exporting === "html" && (
              <Loader className="w-4 h-4 animate-spin" />
            )}
            {t("audit.exportPDF", "Export PDF")}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {t("audit.date", "Date")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {t("audit.action", "Action")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {t("audit.resourceType", "Resource Type")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {t("audit.userId", "User")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {t("audit.details", "Details")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {date.format(new Date(log.created_at), "short")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {log.resource_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {log.user_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() =>
                          setExpandedLogId(
                            expandedLogId === log.id ? null : log.id
                          )
                        }
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {expandedLogId === log.id ? "Hide" : "Show"}
                      </button>
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr className="bg-blue-50 dark:bg-blue-900 border-b border-gray-100 dark:border-gray-700">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              {t("audit.resourceId", "Resource ID")}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                              {log.resource_id}
                            </p>
                          </div>
                          {log.changes &&
                            Object.keys(log.changes).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                  {t("audit.changes", "Changes")}
                                </p>
                                <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 overflow-auto max-h-40">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          {log.ip_address && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                {t("audit.ipAddress", "IP Address")}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {log.ip_address}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
