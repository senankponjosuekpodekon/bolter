import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateLoanPayload,
  Loan,
  LoanRepayment,
  LoanRepaymentPayload,
  createLoan,
  fetchLoan,
  fetchLoanRepayments,
  fetchUserLoans,
  recordLoanRepayment,
} from "../services/loanService";
import { LoanSummaryCard } from "../components/loans/LoanSummaryCard";
import { LoanDetailsPanel } from "../components/loans/LoanDetailsPanel";
import { LoanStatistics } from "../components/loans/LoanStatistics";
import { simulateAmortizedLoan } from "../lib/loanCalculator.ts";
import { useFormatting } from "../hooks";

const DEFAULT_INTEREST_RATE = 0.07;

interface LoanFormState {
  amount: string;
  durationMonths: string;
  purpose: string;
  monthlyIncome: string;
  employer: string;
  notes: string;
}

const initialForm: LoanFormState = {
  amount: "500000",
  durationMonths: "12",
  purpose: "",
  monthlyIncome: "1500000",
  employer: "",
  notes: "",
};

const sanitizeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  }
  return null;
};

export default function Loans() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LoanFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  const { t } = useTranslation();

  const {
    data: loans = [],
    isLoading: isLoadingLoans,
    isFetching: isFetchingLoans,
    isError: isLoansError,
    error: loansError,
  } = useQuery({
    queryKey: ["loans"],
    queryFn: fetchUserLoans,
  });

  useEffect(() => {
    try {
      const localeToLoad =
        currentUser?.locale ??
        (typeof navigator !== "undefined"
          ? navigator.language || "en-US"
          : "en-US");
      loadLocale(localeToLoad);
    } catch {
      // ignore parsing errors for the hash — no op
    }
  }, [loans, selectedLoanId]);

  const { data: selectedLoan, isLoading: isLoadingLoan } = useQuery<
    Loan | undefined
  >({
    queryKey: ["loan", selectedLoanId],
    queryFn: () => fetchLoan(selectedLoanId as string),
    enabled: Boolean(selectedLoanId),
  });

  const { data: repayments = [], isLoading: isLoadingRepayments } = useQuery({
    queryKey: ["loan", selectedLoanId, "repayments"],
    queryFn: () => fetchLoanRepayments(selectedLoanId as string),
    enabled: Boolean(selectedLoanId),
  });

  const createLoanMutation = useMutation({
    mutationFn: (payload: CreateLoanPayload) => createLoan(payload),
    onSuccess: (loan) => {
      setForm(initialForm);
      setFormError(null);
      setFormSuccess(t("loans.request_submitted"));
      setLoanModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setSelectedLoanId(loan.id);
    },
    onError: (error) => {
      const normalized = extractErrorMessage(error);
      setFormError(normalized ?? t("loans.unable_submit"));
      setFormSuccess(null);
    },
  });

  const repaymentMutation = useMutation({
    mutationFn: (payload: LoanRepaymentPayload) =>
      recordLoanRepayment(selectedLoanId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", selectedLoanId] });
      queryClient.invalidateQueries({
        queryKey: ["loan", selectedLoanId, "repayments"],
      });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const parsedAmount = sanitizeNumber(form.amount);
  const parsedDuration = sanitizeNumber(form.durationMonths);
  const simulation = useMemo(() => {
    if (parsedAmount <= 0 || parsedDuration <= 0) {
      return null;
    }
    return simulateAmortizedLoan({
      amount: parsedAmount,
      durationMonths: parsedDuration,
      annualInterestRate: DEFAULT_INTEREST_RATE,
    });
  }, [parsedAmount, parsedDuration]);

  const handleInputChange =
    (field: keyof LoanFormState) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
  };

  const currentUser = useAuthStore((s) => s.user);
  const { currency: currencyFormatter } = useFormatting({
    locale: currentUser?.locale ?? "en-US",
  });

  const loansErrorMessage = isLoansError
    ? extractErrorMessage(loansError)
    : null;
  // Block loan requests if the user's KYC status is not approved
  const isBlockedByKyc = Boolean(currentUser?.kyc_status !== "APPROVED");
  const isUnauthorized = Boolean(
    typeof loansError === "object" &&
      loansError !== null &&
      "response" in loansError &&
      (loansError as { response?: { status?: number } }).response?.status ===
        401
  );

  // Check active loans count (max 3)
  const activeLoans = useMemo(() => {
    const activeStatuses = [
      "PENDING_REVIEW",
      "APPROVED",
      "IN_PROGRESS",
      "LATE_PAYMENT",
    ];
    return loans.filter((loan) => activeStatuses.includes(loan.status));
  }, [loans]);

  const hasReachedMaxLoans = activeLoans.length >= 3;

  const handleOpenLoanModal = () => {
    if (isBlockedByKyc) {
      setFormError(t("loans.kyc_required_for_loan"));
      return;
    }
    if (hasReachedMaxLoans) {
      setFormError(t("loans.max_loans_reached"));
      return;
    }
    setLoanModalOpen(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCloseLoanModal = () => {
    setLoanModalOpen(false);
    setForm(initialForm);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (parsedAmount <= 0 || parsedDuration <= 0) {
      setFormError(t("loans.form_error_invalid"));
      return;
    }

    // The backend only accepts specific duration options (3,6,12,18,24)
    const allowedDurations = [3, 6, 12, 18, 24];
    if (!allowedDurations.includes(parsedDuration)) {
      setFormError(
        t("loans.form_error_duration", {
          durations: allowedDurations.join(", "),
        })
      );
      return;
    }

    createLoanMutation.mutate({
      amount: parsedAmount,
      durationMonths: parsedDuration,
      purpose: form.purpose,
      monthlyIncome: sanitizeNumber(form.monthlyIncome),
      employer: form.employer || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("loans.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("loans.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active Loans Counter */}
          {activeLoans.length > 0 && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                hasReachedMaxLoans
                  ? "bg-rose-100 text-rose-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {activeLoans.length} / 3 Active
            </span>
          )}

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {isFetchingLoans
              ? t("loans.refreshing")
              : `${loans.length} ${t("loans.title").toLowerCase()}`}
          </span>
        </div>
      </div>

      {/* Marketing Card */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-lg p-6 md:p-8 text-white overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Content */}
          <div>
            <span className="inline-block mb-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
              {t("loans.special_offer")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("loans.marketing_title")}
            </h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              {t("loans.marketing_description")}
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xl">⚡</span>
                <div>
                  <p className="font-semibold">{t("loans.benefit_speed")}</p>
                  <p className="text-sm text-white/80">
                    {t("loans.benefit_speed_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xl">💰</span>
                <div>
                  <p className="font-semibold">{t("loans.benefit_rates")}</p>
                  <p className="text-sm text-white/80">
                    {t("loans.benefit_rates_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xl">🎯</span>
                <div>
                  <p className="font-semibold">{t("loans.benefit_flexible")}</p>
                  <p className="text-sm text-white/80">
                    {t("loans.benefit_flexible_desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleOpenLoanModal}
              aria-label="Submit loan request"
              disabled={isBlockedByKyc}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition shadow-lg dark:bg-white/90 dark:text-orange-700 dark:hover:bg-white disabled:opacity-50"
            >
              {t("loans.start_application")} →
            </button>
          </div>

          {/* Right side - Visual */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl" />
              <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {t("loans.marketing_amount")}
                  </p>
                  <p className="text-white/80 text-sm">
                    {t("loans.marketing_terms")}
                  </p>
                  <div className="mt-6 space-y-2">
                    <p className="text-xs text-white/70">
                      ✓ {t("loans.marketing_approval")}
                    </p>
                    <p className="text-xs text-white/70">
                      ✓ {t("loans.marketing_no_fees")}
                    </p>
                    <p className="text-xs text-white/70">
                      ✓ {t("loans.marketing_24_support")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoansError ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            isUnauthorized
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {loansErrorMessage ?? t("loans.unable_load")}
          {isUnauthorized ? (
            <span className="ml-1 font-semibold">
              {t("loans.please_login")}
            </span>
          ) : null}
          {isBlockedByKyc ? (
            <span className="ml-1 font-semibold">
              {t("loans.complete_kyc")}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Loan Request Modal */}
      {loanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          {isBlockedByKyc ? (
            // KYC Required Message
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border border-gray-200 dark:border-slate-700">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-amber-600 dark:text-amber-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V9a2 2 0 01-2 2h-.586a1 1 0 00-.707.293m0 0A1 1 0 0012 11m0 0a1 1 0 01-.707-.293m0 0l-2.414-2.414a1 1 0 00-.707-.293H9a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2.586a1 1 0 00-.707.293"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("loans.kyc_required_title")}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t("loans.kyc_required_message")}
                </p>
                <div className="space-y-3">
                  <a
                    href="/profile#profile-kyc"
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition text-center"
                  >
                    {t("loans.complete_kyc")} →
                  </a>
                  <button
                    onClick={handleCloseLoanModal}
                    className="w-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                  >
                    {t("loans.cancel")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Loan Request Form
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {t("loans.request_title")}
                </h2>
                <button
                  onClick={handleCloseLoanModal}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  {t("loans.request_description")} jkjk
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.amount")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={form.amount}
                      onChange={handleInputChange("amount")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.duration")}
                    </label>
                    <div className="relative">
                      <select
                        value={form.durationMonths}
                        onChange={handleInputChange("durationMonths")}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer"
                        required
                      >
                        <option value="3">3 {t("loans.months")}</option>
                        <option value="6">6 {t("loans.months")}</option>
                        <option value="12">12 {t("loans.months")}</option>
                        <option value="18">18 {t("loans.months")}</option>
                        <option value="24">24 {t("loans.months")}</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.purpose")}
                    </label>
                    <input
                      type="text"
                      value={form.purpose}
                      onChange={handleInputChange("purpose")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("loans.purpose_placeholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.monthly_income")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.monthlyIncome}
                      onChange={handleInputChange("monthlyIncome")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.employer")}
                    </label>
                    <input
                      type="text"
                      value={form.employer}
                      onChange={handleInputChange("employer")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("loans.employer_placeholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("loans.additional_details")}
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={handleInputChange("notes")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder={t("loans.notes_placeholder")}
                    />
                  </div>

                  {simulation ? (
                    <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-200">
                      <p className="font-medium">
                        {t("loans.estimated_monthly_payment")}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {currencyFormatter.format(
                          simulation.monthlyPayment,
                          currentUser?.currency ?? "EUR"
                        )}
                      </p>
                    </div>
                  ) : null}

                  {formError ? (
                    <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 p-3 text-sm text-rose-700 dark:text-rose-200">
                      {formError}
                    </div>
                  ) : null}

                  {formSuccess ? (
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-700 dark:text-emerald-200">
                      {formSuccess}
                    </div>
                  ) : null}

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-gray-50 -mx-6 -mb-6 px-6 py-4 flex gap-3 border-t">
                    <button
                      type="button"
                      onClick={handleCloseLoanModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
                    >
                      {t("loans.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={createLoanMutation.isPending}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                    >
                      {createLoanMutation.isPending
                        ? t("loans.submitting")
                        : t("loans.submit")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 p-4">
            {t("loans.my_requests")}
          </h2>
          {isLoadingLoans && loans.length === 0 ? (
            <p className="text-sm text-slate-500">{t("loans.loading")}</p>
          ) : null}
          {loans.length === 0 && !isLoadingLoans ? (
            <p className="text-sm text-slate-500">{t("loans.no_loans")}</p>
          ) : null}
          <div className="space-y-3">
            {loans.map((loan: Loan) => (
              <LoanSummaryCard
                key={loan.id}
                loan={loan}
                isActive={loan.id === selectedLoanId}
                onSelect={handleSelectLoan}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          {selectedLoanId && !isLoansError ? (
            isLoadingLoan || isLoadingRepayments ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                {t("loans.loading_details")}
              </div>
            ) : selectedLoan ? (
              <div className="space-y-6">
                {/* Loan Statistics - Only show for approved/in-progress/late/paid loans */}
                {["APPROVED", "IN_PROGRESS", "LATE_PAYMENT", "PAID"].includes(
                  selectedLoan.status
                ) && <LoanStatistics loanId={selectedLoanId} />}

                {/* Loan Details Panel */}
                <LoanDetailsPanel
                  loan={selectedLoan as Loan}
                  repayments={repayments as LoanRepayment[]}
                  onRecordRepayment={async (payload) => {
                    try {
                      await repaymentMutation.mutateAsync(payload);
                    } catch (error) {
                      console.error("Unable to record repayment", error);
                    }
                  }}
                  isSubmitting={repaymentMutation.isPending}
                  errorMessage={extractErrorMessage(repaymentMutation.error)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-rose-600">
                {t("loans.unable_load_details")}
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              {t("loans.select_loan_prompt")}
            </div>
          )}
          {isLoansError && !selectedLoanId ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {t("loans.failed_load_details")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
