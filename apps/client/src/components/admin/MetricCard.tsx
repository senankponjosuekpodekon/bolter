import React, { ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon, Loader } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  icon?: ReactNode;
  loading?: boolean;
  error?: boolean;
  formatter?: (value: number) => string;
  className?: string;
}

/**
 * MetricCard component - displays a single metric with optional trend
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "",
  trend,
  icon,
  loading = false,
  error = false,
  formatter,
  className = "",
}) => {
  const formattedValue =
    typeof value === "number" && formatter ? formatter(value) : String(value);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
            {title}
          </p>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading data</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formattedValue}
              </p>
              {unit && <span className="text-gray-500 text-sm">{unit}</span>}
            </div>
          )}
        </div>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>

      {trend && !loading && !error && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend.direction === "up"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {trend.direction === "up" ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
          <span>{trend.percentage}%</span>
          <span className="text-gray-500 dark:text-gray-400">
            vs last period
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
