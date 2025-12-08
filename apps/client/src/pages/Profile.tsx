import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import {
  updateProfile as svcUpdateProfile,
  updatePreferences as svcUpdatePreferences,
} from "../services/profileService";
import { useLocalization, useFormatting } from "../hooks";
import KYC from "./KYC";
import TwoFactorSettings from "./TwoFactorSettings";

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

  const { t } = useTranslation();
  const { changeLanguage } = useLocalization();
  const { currency: currencyFormatter } = useFormatting({
    locale: locale,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("profile.title")}
        </h1>
        {activeTab === "profile" && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t("profile.editProfile")}
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-b">
          <nav
            className="-mb-px flex gap-4 px-2"
            aria-label="Profile tabs"
            role="tablist"
          >
            <button
              id="tab-profile"
              role="tab"
              aria-selected={activeTab === "profile"}
              aria-controls="panel-profile"
              onClick={() => switchTab("profile")}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${activeTab === "profile" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            >
              {t("profile.tabs.profile")}
            </button>
            <button
              id="tab-kyc"
              role="tab"
              aria-selected={activeTab === "kyc"}
              aria-controls="panel-kyc"
              onClick={() => switchTab("kyc")}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${activeTab === "kyc" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            >
              {t("profile.tabs.kyc")}
            </button>
            <button
              id="tab-2fa"
              role="tab"
              aria-selected={activeTab === "2fa"}
              aria-controls="panel-2fa"
              onClick={() => switchTab("2fa")}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${activeTab === "2fa" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            >
              {t("profile.tabs.2fa")}
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "profile" && !isEditing && (
            <section
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.email")}
                  </label>
                  <p className="mt-1 text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.first_name")}
                  </label>
                  <p className="mt-1 text-gray-900">{user?.firstName || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.last_name")}
                  </label>
                  <p className="mt-1 text-gray-900">{user?.lastName || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.phone")}
                  </label>
                  <p className="mt-1 text-gray-900">{user?.phone || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.address")}
                  </label>
                  <p className="mt-1 text-gray-900">{user?.address || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.role")}
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user?.role === "ADMIN" ? "bg-red-100 text-red-800" : user?.role === "COMPLIANCE" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}
                    >
                      {user?.role}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.account_status")}
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user?.status === "ACTIVE" ? "bg-green-100 text-green-800" : user?.status === "SUSPENDED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {user?.status}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("profile.labels.kyc_status")}
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user?.kyc_status === "APPROVED" ? "bg-green-100 text-green-800" : user?.kyc_status === "REJECTED" ? "bg-red-100 text-red-800" : user?.kyc_status === "SUBMITTED" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {user?.kyc_status}
                    </span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "profile" && isEditing && (
            <section
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("profile.labels.email")}
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("profile.labels.email_locked")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("profile.labels.first_name")}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("profile.labels.last_name")}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("profile.labels.phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("profile.labels.address")}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    placeholder="123 Rue Example, 75001 Paris, France"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateProfile.isPending
                      ? t("profile.labels.saving")
                      : t("profile.labels.save_changes")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t("profile.labels.cancel")}
                  </button>
                </div>

                {updateProfile.isError && (
                  <p className="text-sm text-red-600">
                    Failed to update profile. Please try again.
                  </p>
                )}
              </form>
            </section>
          )}

          {activeTab === "kyc" && (
            <section id="panel-kyc" role="tabpanel" aria-labelledby="tab-kyc">
              <div className="bg-white p-6 rounded-lg shadow">
                <KYC />
              </div>
            </section>
          )}

          {activeTab === "2fa" && (
            <section id="panel-2fa" role="tabpanel" aria-labelledby="tab-2fa">
              <div className="bg-white p-6 rounded-lg shadow max-w-3xl">
                <TwoFactorSettings />
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-2">
            {t("profile.labels.personalization_title")}
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium">
              {t("profile.labels.theme_label")}
            </label>
            <select
              value={theme}
              onChange={handleThemeChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="light">{t("profile.labels.light")}</option>
              <option value="dark">{t("profile.labels.dark")}</option>
              <option value="auto">{t("profile.labels.auto")}</option>
            </select>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">
                {t("profile.labels.locale_label")}
              </label>
              <select
                value={locale}
                onChange={(e) => {
                  const newLocale = e.target.value;
                  setLocale(newLocale);
                  changeLanguage(newLocale);
                }}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="fr-FR">Français (FR)</option>
                <option value="fr-CA">Français (CA)</option>
                <option value="ar-AE">العربية (UAE)</option>
                <option value="pt-PT">Português (PT)</option>
                <option value="sw-KE">Kiswahili (KE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">
                {t("profile.labels.currency_label")}
              </label>
              <select
                value={currencyPref}
                onChange={(e) => setCurrencyPref(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="EUR">{`EUR - ${currencyFormatter.format(100, "EUR")}`}</option>
                <option value="USD">{`USD - ${currencyFormatter.format(100, "USD")}`}</option>
                <option value="CAD">{`CAD - ${currencyFormatter.format(100, "CAD")}`}</option>
                <option value="AED">{`AED - ${currencyFormatter.format(100, "AED")}`}</option>
                <option value="NGN">{`NGN - ${currencyFormatter.format(100, "NGN")}`}</option>
                <option value="GHS">{`GHS - ${currencyFormatter.format(100, "GHS")}`}</option>
                <option value="ZAR">{`ZAR - ${currencyFormatter.format(100, "ZAR")}`}</option>
                <option value="XOF">{`XOF - ${currencyFormatter.format(100, "XOF")}`}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">
                {t("profile.labels.timezone_label")}
              </label>
              <select
                value={timeZonePref}
                onChange={(e) => setTimeZonePref(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
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

          <div className="mb-4">
            <button
              onClick={() =>
                updateLocaleCurrency.mutate({
                  locale,
                  currency: currencyPref,
                  timezone: timeZonePref,
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {t("profile.labels.save_prefs")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("profile.labels.widgets_label")}
            </label>
            <div className="flex gap-4">
              {["dashboard", "transactions", "accounts", "loans", "kyc"].map(
                (widget) => (
                  <label key={widget} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={widgets.includes(widget)}
                      onChange={() => handleWidgetToggle(widget)}
                      className="mr-2"
                    />
                    {t(`widgets.${widget}`)}
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
