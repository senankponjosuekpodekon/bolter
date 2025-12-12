import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { BulkOperationResult } from "../../services/bulk-operations.service";

interface BulkOperationResultsProps {
  result: BulkOperationResult;
  onClose: () => void;
}

/**
 * BulkOperationResults component - Displays results of a bulk operation
 */
export const BulkOperationResults: React.FC<BulkOperationResultsProps> = ({
  result,
  onClose,
}) => {
  const { t } = useTranslation("admin");
  const successRate = Math.round(
    (result.success / (result.success + result.failed)) * 100
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("bulkResults.title", "Bulk Operation Complete")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("bulkResults.successRate", `Success Rate: ${successRate}%`)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {t("bulkResults.successful", "Successful")}
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {result.success}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            {t("bulkResults.failed", "Failed")}
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {result.failed}
          </p>
        </div>
      </div>

      {/* Details */}
      {result.details && result.details.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t("bulkResults.details", "Operation Details")}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {result.details.map((detail: string, index: number) => {
              const isSuccess =
                detail.includes("APPROVED") ||
                detail.includes("REJECTED") ||
                detail.includes("COMPLETED") ||
                false;
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    isSuccess
                      ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          {t("bulkResults.close", "Close")}
        </button>
      </div>
    </div>
  );
};

export default BulkOperationResults;
