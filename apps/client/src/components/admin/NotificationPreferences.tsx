import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Mail, CheckCircle, Save, Loader } from "lucide-react";

interface NotificationPreference {
  transactionCreated: boolean;
  transactionUpdated: boolean;
  kycDocumentReviewed: boolean;
  kycStatusChanged: boolean;
  loanCreated: boolean;
  loanApproved: boolean;
  loanRejected: boolean;
  accountCreated: boolean;
  adminMessages: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: NotificationPreference) => void;
}

/**
 * NotificationPreferences component - Manage user notification preferences
 */
export const NotificationPreferences: React.FC<
  NotificationPreferencesProps
> = ({ userId, onSave }) => {
  const { t } = useTranslation("common");
  const [preferences, setPreferences] = useState<NotificationPreference>({
    transactionCreated: true,
    transactionUpdated: true,
    kycDocumentReviewed: true,
    kycStatusChanged: true,
    loanCreated: true,
    loanApproved: true,
    loanRejected: true,
    accountCreated: true,
    adminMessages: true,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * Handle preference change
   */
  const handleToggle = (key: keyof NotificationPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      // Save to localStorage for demo purposes
      localStorage.setItem(
        `notification-preferences-${userId}`,
        JSON.stringify(preferences)
      );
      onSave?.(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setLoading(false);
    }
  };

  const PreferenceItem = ({
    key,
    label,
    description,
  }: {
    key: keyof NotificationPreference;
    label: string;
    description: string;
  }) => (
    <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
      <button
        onClick={() => handleToggle(key)}
        className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          preferences[key] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            preferences[key] ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("notifications.preferences.title", "Notification Preferences")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t(
                "notifications.preferences.subtitle",
                "Choose how you want to be notified about important events"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Transaction Notifications */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t(
              "notifications.section.transactions",
              "Transaction Notifications"
            )}
          </h4>
        </div>

        <PreferenceItem
          key="transactionCreated"
          label={t("notifications.transactionCreated", "Transaction Created")}
          description={t(
            "notifications.desc.transactionCreated",
            "Notify me when I create a new transaction"
          )}
        />

        <PreferenceItem
          key="transactionUpdated"
          label={t("notifications.transactionUpdated", "Transaction Updated")}
          description={t(
            "notifications.desc.transactionUpdated",
            "Notify me when a transaction status changes"
          )}
        />

        {/* KYC Notifications */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 border-t">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t("notifications.section.kyc", "KYC Notifications")}
          </h4>
        </div>

        <PreferenceItem
          key="kycDocumentReviewed"
          label={t(
            "notifications.kycDocumentReviewed",
            "KYC Document Reviewed"
          )}
          description={t(
            "notifications.desc.kycDocumentReviewed",
            "Notify me when my KYC document has been reviewed"
          )}
        />

        <PreferenceItem
          key="kycStatusChanged"
          label={t("notifications.kycStatusChanged", "KYC Status Changed")}
          description={t(
            "notifications.desc.kycStatusChanged",
            "Notify me when my KYC verification status changes"
          )}
        />

        {/* Loan Notifications */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 border-t">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t("notifications.section.loans", "Loan Notifications")}
          </h4>
        </div>

        <PreferenceItem
          key="loanCreated"
          label={t("notifications.loanCreated", "Loan Created")}
          description={t(
            "notifications.desc.loanCreated",
            "Notify me when I create a new loan"
          )}
        />

        <PreferenceItem
          key="loanApproved"
          label={t("notifications.loanApproved", "Loan Approved")}
          description={t(
            "notifications.desc.loanApproved",
            "Notify me when my loan is approved"
          )}
        />

        <PreferenceItem
          key="loanRejected"
          label={t("notifications.loanRejected", "Loan Rejected")}
          description={t(
            "notifications.desc.loanRejected",
            "Notify me when my loan is rejected"
          )}
        />

        {/* Account & Admin Notifications */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 border-t">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t("notifications.section.account", "Account & Admin")}
          </h4>
        </div>

        <PreferenceItem
          key="accountCreated"
          label={t("notifications.accountCreated", "Account Created")}
          description={t(
            "notifications.desc.accountCreated",
            "Notify me when a new account is created"
          )}
        />

        <PreferenceItem
          key="adminMessages"
          label={t("notifications.adminMessages", "Admin Messages")}
          description={t(
            "notifications.desc.adminMessages",
            "Notify me when I receive messages from administrators"
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {t("notifications.saved", "Preferences saved successfully")}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          {t("common.save", "Save Changes")}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
