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
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {isFetchingLoans
            ? t("loans.refreshing")
            : `${loans.length} ${t("loans.title").toLowerCase()}`}
        </span>
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {t("loans.request_title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("loans.request_description")}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.amount")}
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={form.amount}
              onChange={handleInputChange("amount")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.duration")}
            </label>
            <select
              value={form.durationMonths}
              onChange={handleInputChange("durationMonths")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
            >
              <option value="3">3</option>
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="18">18</option>
              <option value="24">24</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.monthly_income")}
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.monthlyIncome}
              onChange={handleInputChange("monthlyIncome")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.employer")}
            </label>
            <input
              type="text"
              value={form.employer}
              onChange={handleInputChange("employer")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder={t("loans.employer_placeholder")}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.purpose")}
            </label>
            <input
              type="text"
              value={form.purpose}
              onChange={handleInputChange("purpose")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder={t("loans.purpose_placeholder")}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600">
              {t("loans.additional_details")}
            </label>
            <textarea
              value={form.notes}
              onChange={handleInputChange("notes")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              rows={3}
              placeholder={t("loans.notes_placeholder")}
            />
          </div>

          {simulation ? (
            <div className="md:col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium">
                {t("loans.estimated_monthly_payment")}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {currencyFormatter.format(
                  simulation.monthlyPayment,
                  currentUser?.currency ?? "EUR"
                )}
              </p>
              <p className="mt-2 text-xs text-blue-600">
                {t("loans.based_on_rate", {
                  rate: (DEFAULT_INTEREST_RATE * 100).toFixed(2),
                })}
              </p>
            </div>
          ) : null}

          {formError ? (
            <div className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          {formSuccess ? (
            <div className="md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {formSuccess}
            </div>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={
                createLoanMutation.isPending || isBlockedByKyc || isUnauthorized
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createLoanMutation.isPending
                ? "Submitting…"
                : "Submit loan request"}
            </button>
          </div>
        </form>
      </div>

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
