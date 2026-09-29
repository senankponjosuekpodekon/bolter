import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useLocalization, useFormatting } from "../hooks";
import { useRateLimitedSubmit } from "../hooks/useRateLimitedSubmit";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    locale:
      typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US",
    currency: undefined as string | undefined,
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
  });
  const [error, setError] = useState("");
  const { isSubmitting: loading, cooldownRemaining, wrap } = useRateLimitedSubmit();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { changeLanguage } = useLocalization();
  const { currency: currencyFormatter } = useFormatting({
    locale: formData.locale,
  });

  useEffect(() => {
    loadLocale(formData.locale);
    changeLanguage(formData.locale);
  }, [formData.locale, changeLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    await wrap(async () => {
      type RegisterPayload = {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        locale: string;
        currency?: string;
        timezone: string;
      };
      const payload = { ...formData } as RegisterPayload;
      if (!payload.currency) {
        const defaultCurrency: Record<string, string> = {
          "en-US": "USD",
          "fr-FR": "EUR",
          "fr-CA": "CAD",
          "ar-AE": "AED",
          "pt-PT": "EUR",
          "sw-KE": "KES",
        };
        payload.currency = defaultCurrency[payload.locale] || "EUR";
      }
      await api.post("/auth/register", payload);
      navigate("/login");
    }).catch((err) => {
      let message = "Registration failed";
      if (typeof err === "object" && err !== null && "response" in err) {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (typeof msg === "string") message = msg;
      }
      if (cooldownRemaining > 0) message = `Too many attempts. Please wait ${cooldownRemaining}s.`;
      setError(message);
    });
  };

  return (
    <div
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
      className="flex items-center justify-center bg-gray-50 py-12 px-4"
    >
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {t("register.title")}
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              required
              aria-label={t("register.firstName")}
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t("register.firstName")}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">
                  {t("register.language_label")}
                </label>
                <select
                  value={formData.locale}
                  onChange={(e) =>
                    setFormData({ ...formData, locale: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="en-GB">🇬🇧 English (UK)</option>
                  <option value="fr-FR">🇫🇷 Français (France)</option>
                  <option value="fr-CA">🇨🇦 Français (Canada)</option>
                  <option value="ar-AE">🇦🇪 العربية (UAE)</option>
                  <option value="pt-PT">🇵🇹 Português (PT)</option>
                  <option value="sw-KE">🇰🇪 Kiswahili (KE)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">
                  {t("register.currency_label")}
                </label>
                <select
                  value={formData.currency || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Auto</option>
                  <option value="EUR">
                    EUR - {currencyFormatter.format(100, "EUR")}
                  </option>
                  <option value="USD">
                    USD - {currencyFormatter.format(100, "USD")}
                  </option>
                  <option value="GBP">
                    GBP - {currencyFormatter.format(100, "GBP")}
                  </option>
                  <option value="CAD">
                    CAD - {currencyFormatter.format(100, "CAD")}
                  </option>
                  <option value="AED">
                    AED - {currencyFormatter.format(100, "AED")}
                  </option>
                  <option value="NGN">
                    NGN - {currencyFormatter.format(100, "NGN")}
                  </option>
                  <option value="GHS">
                    GHS - {currencyFormatter.format(100, "GHS")}
                  </option>
                  <option value="ZAR">
                    ZAR - {currencyFormatter.format(100, "ZAR")}
                  </option>
                  <option value="XOF">
                    XOF - {currencyFormatter.format(100, "XOF")}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">
                {t("register.timezone_label")}
              </label>
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Toronto">America/Toronto</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Africa/Accra">Africa/Accra</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg</option>
              </select>
            </div>
            <input
              type="text"
              required
              aria-label={t("register.lastName")}
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t("register.lastName")}
            />
            <input
              type="email"
              required
              aria-label={t("register.email")}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t("register.email")}
            />
            <input
              type="password"
              required
              aria-label={t("register.password")}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t("register.password")}
            />
          </div>
          <button
            type="submit"
            disabled={loading || cooldownRemaining > 0}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? t("register.creating")
              : cooldownRemaining > 0
              ? `${t("register.register")} (${cooldownRemaining}s)`
              : t("register.register")}
          </button>
          <div className="text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              {t("register.already_have")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
