import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  TrendingUp,
  CreditCard,
  FileCheck,
  BarChart3,
  Calendar,
  AlertCircle,
} from "lucide-react";
import MetricCard from "../components/admin/MetricCard";
import ChartComponent from "../components/admin/ChartComponent";
import adminService, {
  DashboardMetrics,
  TransactionStats,
  KycStats,
  TimeSeriesData,
} from "../services/admin.service";
import { useFormatting } from "../hooks/useFormatting";

type Period = "7d" | "30d" | "90d";

/**
 * Admin Dashboard Page
 * Displays comprehensive metrics, charts, and KPIs
 */
export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation("admin");
  const { currency, number } = useFormatting();

  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactionStats, setTransactionStats] =
    useState<TransactionStats | null>(null);
  const [kycStats, setKycStats] = useState<KycStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(
    null
  );
  const [period, setPeriod] = useState<Period>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metrics, txStats, kycStats, timeData] = await Promise.all([
          adminService.getDashboardMetrics(),
          adminService.getTransactionStats(period),
          adminService.getKycStats(),
          adminService.getTimeSeriesData(period),
        ]);

        setMetrics(metrics);
        setTransactionStats(txStats);
        setKycStats(kycStats);
        setTimeSeriesData(timeData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [period]);

  // Prepare chart data for transaction timeline
  const transactionTimelineChartData = transactionStats
    ? {
        labels: transactionStats.timeline.map((p: { date: string }) => p.date),
        datasets: [
          {
            label: t("dashboard.charts.transactionVolume"),
            data: transactionStats.timeline.map(
              (p: { volume: number }) => p.volume
            ),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      }
    : null;

  // Prepare chart data for KYC status
  const kycStatusChartData = kycStats
    ? {
        labels: [
          t("dashboard.kyc.pending"),
          t("dashboard.kyc.approved"),
          t("dashboard.kyc.rejected"),
        ],
        datasets: [
          {
            data: [kycStats.pending, kycStats.approved, kycStats.rejected],
            backgroundColor: ["#fbbf24", "#10b981", "#ef4444"],
            borderColor: ["#f59e0b", "#059669", "#dc2626"],
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Prepare chart data for currency distribution
  const currencyChartData = transactionStats
    ? {
        labels: transactionStats.byCurrency.map(
          (c: { currency: string }) => c.currency
        ),
        datasets: [
          {
            data: transactionStats.byCurrency.map(
              (c: { count: number }) => c.count
            ),
            backgroundColor: [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
              "#f97316",
            ],
            borderColor: [
              "#1e40af",
              "#059669",
              "#d97706",
              "#dc2626",
              "#6d28d9",
              "#be185d",
              "#0d9488",
              "#ea580c",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Prepare chart data for time series
  const timeSeriesChartData = timeSeriesData
    ? {
        labels: timeSeriesData.data.map((p: { date: string }) => p.date),
        datasets: [
          {
            label: t("dashboard.charts.transactions"),
            data: timeSeriesData.data.map(
              (p: { transactions: number }) => p.transactions
            ),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: false,
            yAxisID: "y",
          },
          {
            label: t("dashboard.charts.revenue"),
            data: timeSeriesData.data.map(
              (p: { revenue: number }) => p.revenue
            ),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 2,
            fill: false,
            yAxisID: "y1",
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t(`dashboard.periods.${p}`)}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title={t("dashboard.metrics.totalUsers")}
            value={metrics?.overview.totalUsers || 0}
            icon={<Users className="w-6 h-6" />}
            loading={loading}
            trend={{
              direction: "up",
              percentage: metrics?.recentMetrics.userGrowthRate || 0,
            }}
          />
          <MetricCard
            title={t("dashboard.metrics.totalTransactions")}
            value={metrics?.overview.totalTransactions || 0}
            icon={<CreditCard className="w-6 h-6" />}
            loading={loading}
            trend={{
              direction: "up",
              percentage: metrics?.recentMetrics.transactionGrowthRate || 0,
            }}
          />
          <MetricCard
            title={t("dashboard.metrics.pendingKyc")}
            value={metrics?.overview.pendingKycApplications || 0}
            icon={<FileCheck className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title={t("dashboard.metrics.totalVolume")}
            value={metrics?.overview.totalTransactionVolume || 0}
            formatter={(val: number) => currency.format(val, "USD")}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={loading}
          />
        </div>

        {/* Revenue & KYC Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title={t("dashboard.metrics.avgTransaction")}
            value={metrics?.overview.averageTransactionAmount || 0}
            formatter={(val: number) => currency.format(val, "USD")}
            loading={loading}
          />
          <MetricCard
            title={t("dashboard.metrics.todaysVolume")}
            value={metrics?.overview.todaysTransactionVolume || 0}
            formatter={(val: number) => currency.format(val, "USD")}
            loading={loading}
          />
          <MetricCard
            title={t("dashboard.metrics.kycApprovalRate")}
            value={metrics?.recentMetrics.kycApprovalRate || 0}
            unit="%"
            loading={loading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Transaction Timeline Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t("dashboard.charts.transactionTimeline")}
            </h2>
            {transactionTimelineChartData && (
              <ChartComponent
                type="line"
                data={transactionTimelineChartData}
                loading={loading}
                height={300}
              />
            )}
          </div>

          {/* KYC Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              {t("dashboard.charts.kycDistribution")}
            </h2>
            {kycStatusChartData && (
              <ChartComponent
                type="pie"
                data={kycStatusChartData}
                loading={loading}
                height={300}
              />
            )}
          </div>
        </div>

        {/* Currency & Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Currency Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t("dashboard.charts.currencyDistribution")}
            </h2>
            {currencyChartData && (
              <ChartComponent
                type="doughnut"
                data={currencyChartData}
                loading={loading}
                height={300}
              />
            )}
          </div>

          {/* Time Series (Transactions + Revenue) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t("dashboard.charts.transactionsAndRevenue")}
            </h2>
            {timeSeriesChartData && (
              <ChartComponent
                type="line"
                data={timeSeriesChartData}
                loading={loading}
                height={300}
                options={{
                  scales: {
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: {
                        display: true,
                        text: t("dashboard.charts.transactionCount"),
                      },
                    },
                    y1: {
                      type: "linear",
                      display: true,
                      position: "right",
                      title: {
                        display: true,
                        text: t("dashboard.charts.revenue"),
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Statistics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("dashboard.tables.topCurrencies")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">
                      {t("dashboard.tables.currency")}
                    </th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">
                      {t("dashboard.tables.count")}
                    </th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">
                      {t("dashboard.tables.volume")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionStats?.byCurrency
                    .slice(0, 5)
                    .map((currencyItem) => (
                      <tr
                        key={currencyItem.currency}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                          {currencyItem.currency}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">
                          {number.format(currencyItem.count)}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">
                          {currency.format(
                            currencyItem.volume,
                            currencyItem.currency
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* KYC Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("dashboard.tables.kycStatistics")}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("dashboard.kyc.pending")}
                </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {kycStats?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("dashboard.kyc.approved")}
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {kycStats?.approved || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("dashboard.kyc.rejected")}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {kycStats?.rejected || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("dashboard.kyc.approvalRate")}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {kycStats?.approvalRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
