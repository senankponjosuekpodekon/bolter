import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import NotificationPreferences from "../components/admin/NotificationPreferences";
import { Settings as SettingsIcon, Bell } from "lucide-react";

interface User {
  id: string;
  email?: string;
  role?: string;
}

type SettingsTab = "notifications" | "account" | "security";

/**
 * AdminSettings page - User and system settings
 */
const AdminSettings: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage or session storage
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }
  }, []);

  if (!user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {t("common.loading", "Loading...")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          {t("settings.title", "Settings")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t(
            "settings.subtitle",
            "Manage your preferences and account settings"
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === "notifications"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Bell className="w-5 h-5" />
          {t("settings.notifications", "Notifications")}
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === "account"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          {t("settings.account", "Account")}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "notifications" && (
          <NotificationPreferences userId={user.id} />
        )}

        {activeTab === "account" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("settings.accountInfo", "Account Information")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("common.email", "Email")}
                </label>
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg">
                  {user.email || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("common.userId", "User ID")}
                </label>
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-mono text-sm">
                  {user.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("common.role", "Role")}
                </label>
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg">
                  {user.role || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
