import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Wallet,
  Download,
  Calendar,
  BarChart3,
  Loader,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { ChartComponent } from "./ChartComponent";
import type { ChartData } from "chart.js";
import AnalyticsService, {
  ReportQuery,
  ReportResult,
  AnalyticsData,
  REPORT_COLUMNS,
} from "../../services/analytics.service.ts";
import { AnalyticsClientError, ClientAnalyticsErrorCode } from "../../services/analytics.errors";

const REPORT_TYPES = [
  { value: "transactions", label: "Transactions", icon: CreditCard },
  { value: "users", label: "Users", icon: Users },
  { value: "kyc", label: "KYC Documents", icon: FileText },
  { value: "loans", label: "Loans", icon: TrendingUp },
  { value: "accounts", label: "Accounts", icon: Wallet },
  { value: "tontines", label: "Tontines", icon: Users },
] as const;

const AGGREGATIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
] as const;

interface AnalyticsPanelProps {
  className?: string;
}

interface ErrorState {
  message: string;
  type: "validation" | "network" | "server" | "auth" | "unknown";
  code?: ClientAnalyticsErrorCode;
  details?: Record<string, unknown>;
}

/**
 * AnalyticsPanel component - Advanced analytics and reporting interface
 * Reuses existing admin components (MetricCard, ChartComponent) for consistency
 */
export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  className = "",
}) => {
  const { t } = useTranslation("admin");

  // Form state
  const [reportType, setReportType] =
    useState<ReportQuery["type"]>("transactions");
  const [aggregation, setAggregation] =
    useState<ReportQuery["aggregation"]>("count");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Report state
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  /**
   * Validate date range
   */
  const validateDateRange = (): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError({
        message: t("analytics.error.invalidDate", "Invalid date format"),
        type: "validation",
      });
      return false;
    }

    if (start > end) {
      setError({
        message: t(
          "analytics.error.startAfterEnd",
          "Start date must be before end date"
        ),
        type: "validation",
      });
      return false;
    }

    if (end > now) {
      setError({
        message: t(
          "analytics.error.futureDate",
          "End date cannot be in the future"
        ),
        type: "validation",
      });
      return false;
    }

    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      setError({
        message: t(
          "analytics.error.rangeTooLarge",
          "Date range cannot exceed 1 year"
        ),
        type: "validation",
      });
      return false;
    }

    return true;
  };

  /**
   * Generate analytics report with enhanced error handling
   */
  const handleGenerateReport = useCallback(async () => {
    setError(null);

    if (!validateDateRange()) {
      return;
    }

    try {
      setLoading(true);

      const query: ReportQuery = {
        type: reportType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        aggregation,
      };

      const result = await AnalyticsService.generateReport(query);

      if (!result || !result.data) {
        throw new Error("Invalid response from server");
      }

      if (result.data.length === 0) {
        setError({
          message: t(
            "analytics.error.noData",
            "No data available for the selected criteria"
          ),
          type: "server",
        });
      }

      setReport(result);
    } catch (err) {
      console.error("Report generation failed:", err);

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError({
          message: t(
            "analytics.error.network",
            "Network error. Please check your connection."
          ),
          type: "network",
        });
      } else if (err instanceof Error) {
        if (err.message.includes("401") || err.message.includes("403")) {
          setError({
            message: t(
              "analytics.error.unauthorized",
              "You don't have permission to generate reports"
            ),
            type: "server",
          });
        } else if (err.message.includes("500")) {
          setError({
            message: t(
              "analytics.error.serverError",
              "Server error. Please try again later."
            ),
            type: "server",
          });
        } else {
          setError({
            message: err.message || t("analytics.error.unknown", "Failed to generate report"),
            type: "unknown",
          });
        }
      } else {
        setError({
          message: t("analytics.error.unknown", "An unexpected error occurred"),
          type: "unknown",
        });
      }
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, aggregation, t]);

  /**
   * Handle error from service layer
   */
  const handleError = (err: unknown) => {
    if (err instanceof AnalyticsClientError) {
      const errorTypeMap: Record<ClientAnalyticsErrorCode, ErrorState["type"]> = {
        [ClientAnalyticsErrorCode.NETWORK_ERROR]: "network",
        [ClientAnalyticsErrorCode.REQUEST_TIMEOUT]: "network",
        [ClientAnalyticsErrorCode.UNAUTHORIZED]: "auth",
        [ClientAnalyticsErrorCode.FORBIDDEN]: "auth",
        [ClientAnalyticsErrorCode.SERVER_ERROR]: "server",
        [ClientAnalyticsErrorCode.VALIDATION_ERROR]: "validation",
        [ClientAnalyticsErrorCode.INVALID_PARAMETERS]: "validation",
        [ClientAnalyticsErrorCode.NO_DATA]: "unknown",
        [ClientAnalyticsErrorCode.PARSE_ERROR]: "server",
        [ClientAnalyticsErrorCode.EXPORT_FAILED]: "server",
      };

      setError({
        message: err.getDisplayMessage(),
        type: errorTypeMap[err.code] || "unknown",
        code: err.code,
        details: err.details,
      });
    } else if (err instanceof TypeError && err.message.includes("fetch")) {
      setError({
        message: t("analytics.error.network", "Network error. Please check your connection."),
        type: "network",
      });
    } else if (err instanceof Error) {
      setError({
        message: err.message || t("analytics.error.failed", "Failed to perform operation"),
        type: "unknown",
      });
    } else {
      setError({
        message: t("analytics.error.unknown", "An unexpected error occurred"),
        type: "unknown",
      });
    }
  };

  /**
   * Handle export with enhanced error handling
   */
  const handleExport = async (format: "csv" | "json") => {
    if (!report) return;

    try {
      setExportLoading(true);
      setError(null);

      await AnalyticsService.exportReport(report, format);
    } catch (err) {
      console.error("Export failed:", err);
      handleError(err);
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Dismiss error message
   */
  const dismissError = () => {
    setError(null);
  };

  /**
   * Convert analytics data to Chart.js format
   */
  const convertToChartData = (
    data: AnalyticsData[]
  ): ChartData<"bar" | "line"> => {
    return {
      labels: data.map((item) => item.segment),
      datasets: [
        {
          label: `${reportType} (${aggregation})`,
          data: data.map((item) => item.value),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  };

  /**
   * Calculate summary metrics
   */
  const getSummaryMetrics = () => {
    if (!report?.data.length) return null;

    const values = report.data.map((d: AnalyticsData) => d.value);
    const total = values.reduce((a: number, b: number) => a + b, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  };

  const metrics = getSummaryMetrics();
  const selectedType = REPORT_TYPES.find((t) => t.value === reportType);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("analytics.title", "Analytics Dashboard")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t(
                "analytics.subtitle",
                "Generate custom reports and visualize your data"
              )}
            </p>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("analytics.reportType", "Report Type")}
            </label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as ReportQuery["type"])
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("analytics.aggregation", "Aggregation")}
            </label>
            <select
              value={aggregation}
              onChange={(e) =>
                setAggregation(e.target.value as ReportQuery["aggregation"])
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {AGGREGATIONS.map((agg) => (
                <option key={agg.value} value={agg.value}>
                  {agg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t("analytics.startDate", "Start Date")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t("analytics.endDate", "End Date")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t("analytics.generating", "Generating...")}
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                {t("analytics.generate", "Generate Report")}
              </>
            )}
          </button>

          {report && (
            <>
              <button
                onClick={() => handleExport("csv")}
                disabled={exportLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("analytics.exportCsv", "Export CSV")}
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={exportLoading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("analytics.exportJson", "Export JSON")}
              </button>
            </>
          )}
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div
            className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${
              error.type === "validation"
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : error.type === "network"
                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            {error.type === "validation" ? (
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 ${
                  error.type === "validation"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            ) : (
              <XCircle
                className={`w-5 h-5 flex-shrink-0 ${
                  error.type === "network"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  error.type === "validation"
                    ? "text-amber-800 dark:text-amber-200"
                    : error.type === "network"
                    ? "text-orange-800 dark:text-orange-200"
                    : error.type === "auth"
                    ? "text-purple-800 dark:text-purple-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {error.type === "validation"
                  ? t("analytics.error.validation", "Validation Error")
                  : error.type === "network"
                  ? t("analytics.error.networkTitle", "Connection Error")
                  : error.type === "auth"
                  ? t("analytics.error.authTitle", "Authentication Error")
                  : t("analytics.error.title", "Error")}
              </p>
              <p
                className={`text-sm mt-1 ${
                  error.type === "validation"
                    ? "text-amber-700 dark:text-amber-300"
                    : error.type === "network"
                    ? "text-orange-700 dark:text-orange-300"
                    : error.type === "auth"
                    ? "text-purple-700 dark:text-purple-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {error.message}
              </p>
              {error.code && (
                <p className="text-xs mt-2 opacity-70">
                  {t("analytics.error.code", "Error code")}: {error.code}
                </p>
              )}
            </div>
            <button
              onClick={dismissError}
              className={`flex-shrink-0 p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition ${
                error.type === "validation"
                  ? "text-amber-600 dark:text-amber-400"
                  : error.type === "network"
                  ? "text-orange-600 dark:text-orange-400"
                  : error.type === "auth"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-red-600 dark:text-red-400"
              }`}
              aria-label={t("analytics.error.dismiss", "Dismiss")}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Summary Metrics */}
      {metrics && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("analytics.total", "Total")}
            value={metrics.total}
            icon={selectedType?.icon && <selectedType.icon className="w-6 h-6" />}
            formatter={(v) =>
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
              }).format(v)
            }
          />
          <MetricCard
            title={t("analytics.average", "Average")}
            value={metrics.average.toFixed(2)}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <MetricCard
            title={t("analytics.maximum", "Maximum")}
            value={metrics.max}
            icon={<BarChart3 className="w-6 h-6" />}
          />
          <MetricCard
            title={t("analytics.minimum", "Minimum")}
            value={metrics.min}
            icon={<BarChart3 className="w-6 h-6" />}
          />
        </div>
      )}

      {/* Chart Visualization */}
      {report && report.data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t("analytics.visualization", "Data Visualization")}
          </h2>
          <ChartComponent
            type="bar"
            data={convertToChartData(report.data)}
            height={400}
            title={`${selectedType?.label} ${t(
              "analytics.report",
              "Report"
            )}`}
          />
        </div>
      )}

      {/* Data Table */}
      {report && report.data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("analytics.dataTable", "Detailed Data")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {t("analytics.totalRecords", "Total records")}: {report.summary.totalRecords}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {REPORT_COLUMNS[reportType]?.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {report.data.map((item: AnalyticsData, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {REPORT_COLUMNS[reportType]?.map((col, colIdx) => {
                      const value = item[col.key as keyof AnalyticsData];
                      const formattedValue = col.format && typeof value === "number" ? col.format(value) : value;

                      // Special styling for trend column
                      if (col.key === "trend") {
                        return (
                          <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm">
                            {value !== undefined && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  Number(value) > 0
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : Number(value) < 0
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {formattedValue}
                              </span>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={colIdx}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                        >
                          {formattedValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !report && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("analytics.noData", "No Report Generated")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t(
              "analytics.noDataDescription",
              "Configure your report parameters and click Generate Report to view analytics"
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
