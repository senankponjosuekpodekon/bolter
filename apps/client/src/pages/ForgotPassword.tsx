import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useRateLimitedSubmit } from "../hooks/useRateLimitedSubmit";

interface ForgotPasswordResponse {
  message: string;
}

export default function ForgotPassword(): JSX.Element {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isSubmitting, cooldownRemaining, wrap } = useRateLimitedSubmit({ cooldownMs: 60_000 });

  const forgotPassword = useMutation({
    mutationFn: async (emailAddress: string) => {
      const response = await api.post("/auth/forgot-password", {
        email: emailAddress,
      });
      return response.data as ForgotPasswordResponse;
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    wrap(() => forgotPassword.mutateAsync(email));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("auth.reset_email_sent")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.reset_email_description")} <strong>{email}</strong>
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("auth.reset_email_validity")}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition"
            >
              {t("auth.back_to_login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-8 space-y-6">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.back_to_login")}
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.reset_password")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("auth.reset_password_description")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.labels.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0 || !email}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {isSubmitting
                ? t("auth.sending")
                : cooldownRemaining > 0
                ? `${t("auth.send_reset_link")} (${cooldownRemaining}s)`
                : t("auth.send_reset_link")}
            </button>

            {forgotPassword.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {t("auth.reset_error")}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
