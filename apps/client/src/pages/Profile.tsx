import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import {
  updateProfile as svcUpdateProfile,
  updatePreferences as svcUpdatePreferences,
} from "../services/profileService";
import { useLocalization } from "../hooks";
import KYC from "./KYC";
import ProfileAvatar from "../components/ProfileAvatar";
import TwoFactorSettings from "./TwoFactorSettings";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Globe,
  DollarSign,
  Edit2,
  Check,
  X,
  Settings,
} from "lucide-react";

type Tab = "profile" | "kyc" | "2fa";

export default function Profile(): JSX.Element {
  const { user, setUser, updatePreferences } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [theme, setTheme] = useState(user?.preferences?.theme || "light");
  const [widgets, setWidgets] = useState<string[]>(
    user?.preferences?.widgets || ["dashboard", "transactions"]
  );
  const [locale, setLocale] = useState<string>(
    user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US")
  );
  const [currencyPref, setCurrencyPref] = useState<string>(
    user?.currency ?? "EUR"
  );
  const [timeZonePref, setTimeZonePref] = useState<string>(
    user?.timezone ??
      (typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC")
  );

  useEffect(() => {
    // Ensure profile's selected locale translations are loaded
    loadLocale(locale);
    try {
      const raw =
        typeof window !== "undefined"
          ? window.location.hash.replace("#", "")
          : "";
      if (raw === "profile-kyc" || raw === "kyc") setActiveTab("kyc");
      else if (raw === "profile-2fa" || raw === "2fa") setActiveTab("2fa");
      else setActiveTab("profile");
    } catch {
      setActiveTab("profile");
    }
  }, []);

  const switchTab = (t: Tab) => {
    setActiveTab(t);
    try {
      const hash =
        t === "profile" ? "" : t === "kyc" ? "#profile-kyc" : "#profile-2fa";
      if (typeof window !== "undefined")
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${hash}`
        );
    } catch {
      // ignore
    }
  };

  const updateProfile = useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
    }) => {
      const res = await svcUpdateProfile(payload);
      return res;
    },
    onSuccess: (data) => {
      setUser(data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const updateLocaleCurrency = useMutation({
    mutationFn: async (payload: {
      locale?: string;
      currency?: string;
      timezone?: string;
    }) => {
      const res = await svcUpdatePreferences(payload);
      return res;
    },
    onSuccess: (data) => {
      // update local store to keep UI consistent
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as "light" | "dark" | "auto";
    setTheme(v);
    // update local store
    updatePreferences({ theme: v });
    // persist to server
    svcUpdatePreferences({ theme: v })
      .then((data) => setUser(data))
      .catch(() => {});
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setCurrencyPref(newCurrency);
    // update local store
    updatePreferences({ currency: newCurrency });
    // persist to server
    svcUpdatePreferences({ currency: newCurrency })
      .then((data) => setUser(data))
      .catch(() => {});
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setTimeZonePref(newTimezone);
    // update local store
    updatePreferences({ timezone: newTimezone });
    // persist to server
    svcUpdatePreferences({ timezone: newTimezone })
      .then((data) => setUser(data))
      .catch(() => {});
  };

  const handleWidgetToggle = (widget: string) => {
    const newWidgets = widgets.includes(widget)
      ? widgets.filter((w) => w !== widget)
      : [...widgets, widget];
    setWidgets(newWidgets);
    updatePreferences({ widgets: newWidgets });
    svcUpdatePreferences({ widgets: newWidgets })
      .then((data) => setUser(data))
      .catch(() => {});
  };

  const { t } = useTranslation(["common"]);
  const { changeLanguage } = useLocalization();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("profile.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <div
          className="flex border-b border-gray-200 dark:border-slate-700"
          role="tablist"
          aria-label="Profile navigation"
        >
          <button
            onClick={() => switchTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === "profile"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t("profile.tabs.profile")}
          </button>
          <button
            onClick={() => switchTab("kyc")}
            role="tab"
            aria-selected={activeTab === "kyc"}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === "kyc"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t("profile.tabs.kyc")}
          </button>
          <button
            onClick={() => switchTab("2fa")}
            role="tab"
            aria-selected={activeTab === "2fa"}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === "2fa"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t("profile.tabs.2fa")}
          </button>
        </div>

        <div className="p-6">
          {/* Profile Tab - View Mode */}
          {activeTab === "profile" && !isEditing && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-blue-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    {t("profile.labels.personal_info")}
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title={t("profile.editProfile")}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t("profile.labels.email")}
                      </label>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.email}
                    </p>
                  </div>

                  {/* First Name */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t("profile.labels.first_name")}
                      </label>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.firstName || "-"}
                    </p>
                  </div>

                  {/* Last Name */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t("profile.labels.last_name")}
                      </label>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.lastName || "-"}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t("profile.labels.phone")}
                      </label>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.phone || "-"}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t("profile.labels.address")}
                      </label>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-green-200 dark:border-slate-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  {t("profile.labels.account_status")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Role */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                      Role
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user?.role === "ADMIN"
                          ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                          : user?.role === "COMPLIANCE"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                      Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user?.status === "ACTIVE"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : user?.status === "SUSPENDED"
                            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                      }`}
                    >
                      {user?.status}
                    </span>
                  </div>

                  {/* KYC Status */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                      KYC Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user?.kyc_status === "APPROVED"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : user?.kyc_status === "REJECTED"
                            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            : user?.kyc_status === "SUBMITTED"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {user?.kyc_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Management */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("profile.labels.avatar")}
                </h3>
                <ProfileAvatar />
              </div>
            </div>
          )}

          {/* Profile Tab - Edit Mode */}
          {activeTab === "profile" && isEditing && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-blue-200 dark:border-slate-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Profile
                </h2>
                <div className="space-y-4">
                  {/* Email (disabled) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("profile.labels.email")}
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("profile.labels.email_locked")}
                    </p>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("profile.labels.first_name")}
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("profile.labels.last_name")}
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("profile.labels.phone")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("profile.labels.address")}
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      placeholder="123 Rue Example, 75001 Paris, France"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Check className="w-4 h-4" />
                      {updateProfile.isPending
                        ? t("profile.labels.saving")
                        : t("profile.labels.save_changes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                    >
                      <X className="w-4 h-4" />
                      {t("profile.labels.cancel")}
                    </button>
                  </div>

                  {updateProfile.isError && (
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 p-3 rounded-lg">
                      Failed to update profile. Please try again.
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* KYC Tab */}
          {activeTab === "kyc" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg">
              <KYC />
            </div>
          )}

          {/* 2FA Tab */}
          {activeTab === "2fa" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg">
              <TwoFactorSettings />
            </div>
          )}
        </div>
      </div>

      {/* Interface Personalization Section */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            {t("profile.labels.personalization_title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Theme */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-purple-200 dark:border-slate-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={handleThemeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="light">{t("profile.labels.light")}</option>
                <option value="dark">{t("profile.labels.dark")}</option>
                <option value="auto">{t("profile.labels.auto")}</option>
              </select>
            </div>

            {/* Locale */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-green-200 dark:border-slate-600">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                Language
              </label>
              <select
                value={locale}
                onChange={(e) => {
                  const newLocale = e.target.value;
                  setLocale(newLocale);
                  changeLanguage(newLocale);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="en-US">English (US)</option>
                <option value="fr-FR">Français (France)</option>
              </select>
            </div>
          </div>

          {/* Widgets Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t("profile.labels.widgets_label")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {["dashboard", "transactions", "accounts", "loans", "kyc"].map(
                (widget) => (
                  <label
                    key={widget}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                      widgets.includes(widget)
                        ? "bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-500"
                        : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={widgets.includes(widget)}
                      onChange={() => handleWidgetToggle(widget)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t(`widgets.${widget}`)}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Preferences Section */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Account Preferences
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-amber-200 dark:border-slate-600">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4" />
                Currency
              </label>
              <select
                value={currencyPref}
                onChange={handleCurrencyChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="AED">AED</option>
                <option value="NGN">NGN</option>
                <option value="GHS">GHS</option>
                <option value="ZAR">ZAR</option>
                <option value="XOF">XOF</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-orange-200 dark:border-slate-600">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4" />
                Timezone
              </label>
              <select
                value={timeZonePref}
                onChange={handleTimezoneChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Toronto">America/Toronto</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={() =>
              updateLocaleCurrency.mutate({
                locale,
                currency: currencyPref,
                timezone: timeZonePref,
              })
            }
            className="w-full px-4 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition shadow-md"
          >
            {t("profile.labels.save_prefs")}
          </button>
        </div>
      )}
    </div>
  );
}
