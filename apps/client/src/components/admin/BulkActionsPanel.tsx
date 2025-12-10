import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  XCircle,
  Flag,
  Trash2,
  AlertCircle,
  Loader,
} from "lucide-react";
import BulkOperationsService, {
  BulkOperationResult,
} from "../../services/bulk-operations.service";

interface BulkActionsPanelProps {
  selectedIds: string[];
  resourceType: "transactions" | "kyc";
  onSuccess?: (result: BulkOperationResult) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

/**
 * BulkActionsPanel component - Provides bulk action buttons for selected items
 */
export const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedIds,
  resourceType,
  onSuccess,
  onError,
  onComplete,
}) => {
  const { t } = useTranslation("admin");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (selectedIds.length === 0) {
    return null;
  }

  const handleAction = async (action: string) => {
    if (!showConfirm || !reason) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ids: selectedIds,
        action: action as "approve" | "reject" | "flag" | "delete",
        reason,
      };

      let result: BulkOperationResult;

      if (resourceType === "kyc") {
        if (action === "approve" || action === "reject") {
          result = await BulkOperationsService.bulkReviewKyc(payload);
        } else if (action === "flag") {
          result = await BulkOperationsService.bulkFlagKyc(payload);
        } else {
          result = await BulkOperationsService.bulkDeleteKyc(payload);
        }
      } else {
        if (action === "approve" || action === "reject") {
          result = await BulkOperationsService.bulkReviewTransactions(payload);
        } else if (action === "flag") {
          result = await BulkOperationsService.bulkFlagTransactions(payload);
        } else {
          result = await BulkOperationsService.bulkDeleteTransactions(payload);
        }
      }

      onSuccess?.(result);
      setShowConfirm(null);
      setReason("");
      onComplete?.();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const ActionButton = ({
    action,
    icon: Icon,
    label,
    color,
  }: {
    action: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }) => (
    <button
      onClick={() => setShowConfirm(action)}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 ${color}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (showConfirm) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t("bulkActions.confirmTitle", "Confirm Bulk Action")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {t(
                "bulkActions.confirmMessage",
                `You are about to perform a bulk action on ${selectedIds.length} item(s). This action cannot be undone.`
              )}
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "bulkActions.reasonPlaceholder",
                "Enter reason for this action..."
              )}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm mb-4"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (showConfirm) {
                    await handleAction(showConfirm);
                  }
                }}
                disabled={!reason || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {t("bulkActions.confirm", "Confirm")}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setReason("");
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t("bulkActions.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("bulkActions.title", "Bulk Actions")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              "bulkActions.selected",
              `${selectedIds.length} item(s) selected`
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {resourceType === "kyc" ? (
          <>
            <ActionButton
              action="approve"
              icon={CheckCircle}
              label={t("bulkActions.approve", "Approve")}
              color="bg-green-600"
            />
            <ActionButton
              action="reject"
              icon={XCircle}
              label={t("bulkActions.reject", "Reject")}
              color="bg-red-600"
            />
            <ActionButton
              action="flag"
              icon={Flag}
              label={t("bulkActions.flag", "Flag")}
              color="bg-yellow-600"
            />
            <ActionButton
              action="delete"
              icon={Trash2}
              label={t("bulkActions.delete", "Delete")}
              color="bg-gray-600"
            />
          </>
        ) : (
          <>
            <ActionButton
              action="approve"
              icon={CheckCircle}
              label={t("bulkActions.approve", "Approve")}
              color="bg-green-600"
            />
            <ActionButton
              action="reject"
              icon={XCircle}
              label={t("bulkActions.reject", "Reject")}
              color="bg-red-600"
            />
            <ActionButton
              action="flag"
              icon={Flag}
              label={t("bulkActions.flag", "Flag")}
              color="bg-yellow-600"
            />
            <ActionButton
              action="delete"
              icon={Trash2}
              label={t("bulkActions.delete", "Delete")}
              color="bg-gray-600"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default BulkActionsPanel;
