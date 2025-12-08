import { FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useFormatting } from "../hooks";

export default function Accounts() {
  type Account = {
    id: string;
    account_type: "CHECKING" | "SAVINGS";
    account_number: string;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    balance: number | string;
    currency: "EUR" | "USD" | "GBP";
    limit: number;
    created_at?: string;
  };
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { currency: currencyFormatter } = useFormatting({
    locale: user?.locale ?? "en-US",
  });

  useEffect(() => {
    const l =
      user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US");
    loadLocale(l);
  }, [user?.locale]);
  const [accountType, setAccountType] = useState<"CHECKING" | "SAVINGS">(
    "SAVINGS"
  );
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");
  const [limit, setLimit] = useState<number>(1000);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardType, setCardType] = useState<"VIRTUAL" | "PHYSICAL">("VIRTUAL");
  const [cardAccountId, setCardAccountId] = useState<string>("");
  const [cardSuccess, setCardSuccess] = useState("");
  const [cardError, setCardError] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const createAccount = useMutation({
    mutationFn: async (payload: {
      accountType?: "CHECKING" | "SAVINGS";
      currency?: "EUR" | "USD" | "GBP";
      limit?: number;
    }) => {
      const response = await api.post("/accounts", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setAccountType("SAVINGS");
      setCurrency("EUR");
      setLimit(1000);
      setErrorMessage("");
      if (data?.account_number) {
        setSuccessMessage(
          t("accounts.success_created_with_number", {
            type: data.account_type,
            number: data.account_number,
          })
        );
      } else {
        setSuccessMessage(t("accounts.success_created"));
      }
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      let accountErrorMessage1 = "Failed to create account";
      type ErrorResponse = {
        response?: { data?: { message?: string | string[] } };
      };
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as ErrorResponse).response === "object" &&
        (error as ErrorResponse).response?.data?.message
      ) {
        const msg = (error as ErrorResponse).response!.data!.message;
        accountErrorMessage1 = Array.isArray(msg)
          ? msg.join(", ")
          : msg || accountErrorMessage1;
      }
      setSuccessMessage("");
      setErrorMessage(
        Array.isArray(accountErrorMessage1)
          ? accountErrorMessage1.join(", ")
          : accountErrorMessage1
      );
    },
  });

  const createCard = useMutation({
    mutationFn: async (payload: {
      accountId: string;
      type: "VIRTUAL" | "PHYSICAL";
    }) => {
      const response = await api.post("/cards", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setCardSuccess(
        t("accounts.card_created", {
          type: data.type,
          number: data.card_number,
        })
      );
      setCardError("");
      setShowCardForm(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      let cardErrorMessage1 = "Erreur création carte";
      type CardErrorResponse = {
        response?: { data?: { message?: string | string[] } };
      };
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as CardErrorResponse).response === "object" &&
        (error as CardErrorResponse).response?.data?.message
      ) {
        const msg = (error as CardErrorResponse).response!.data!.message;
        cardErrorMessage1 = Array.isArray(msg)
          ? msg.join(", ")
          : msg || cardErrorMessage1;
      }
      setCardSuccess("");
      setCardError(cardErrorMessage1);
    },
  });

  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    createAccount.mutate({ accountType, currency, limit });
  };

  const handleCreateCard = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCard.mutate({ accountId: cardAccountId, type: cardType });
  };

  if (isLoading) return <div>{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t("accounts.title")}
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {t("accounts.open_account_title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("accounts.open_account_description")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("accounts.account_type")}
            </label>
            <select
              value={accountType}
              onChange={(event) =>
                setAccountType(event.target.value as "CHECKING" | "SAVINGS")
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={createAccount.isPending}
            >
              <option value="SAVINGS">{t("accounts.types.savings")}</option>
              <option value="CHECKING">{t("accounts.types.checking")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("accounts.currency")}
            </label>
            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as "EUR" | "USD" | "GBP")
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={createAccount.isPending}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("accounts.limit_label")}
            </label>
            <input
              type="number"
              value={limit}
              min={100}
              max={10000}
              step={100}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={createAccount.isPending}
            />
          </div>

          {errorMessage && (
            <div className="text-sm text-red-600">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="text-sm text-green-600">{successMessage}</div>
          )}

          <button
            type="submit"
            disabled={createAccount.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createAccount.isPending
              ? t("accounts.creating")
              : t("accounts.create_account")}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.map((account: Account) => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {t(`accounts.types.${account.account_type.toLowerCase()}`)}
                </h3>
                <p className="text-sm text-gray-500">
                  {account.account_number}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${account.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {account.status}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {t("accounts.balance_label")}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {currencyFormatter.format(
                  Number(account.balance),
                  account.currency ?? "EUR"
                )}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">
                {t("accounts.limit_text", {
                  limit: account.limit,
                  currency: account.currency,
                })}
              </p>
              <p className="text-xs text-gray-400">
                Created:{" "}
                {account.created_at
                  ? new Date(account.created_at).toLocaleDateString(
                      user?.locale ?? "en-US"
                    )
                  : t("common.na")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-lg font-medium mb-2">
          {t("accounts.manage_cards")}
        </h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          onClick={() => setShowCardForm((v) => !v)}
        >
          {showCardForm ? t("accounts.card.cancel") : t("accounts.card.create")}
        </button>
        {showCardForm && (
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                {t("accounts.card.account_label")}
              </label>
              <select
                value={cardAccountId}
                onChange={(e) => setCardAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">{t("accounts.card.choose_account")}</option>
                {accounts?.map((acc: Account) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} - {acc.account_number} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                {t("accounts.card.card_type_label")}
              </label>
              <select
                value={cardType}
                onChange={(e) =>
                  setCardType(e.target.value as "VIRTUAL" | "PHYSICAL")
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="VIRTUAL">
                  {t("accounts.card.types.virtual")}
                </option>
                <option value="PHYSICAL">
                  {t("accounts.card.types.physical")}
                </option>
              </select>
            </div>
            {cardError && (
              <div className="text-sm text-red-600">{cardError}</div>
            )}
            {cardSuccess && (
              <div className="text-sm text-green-600">{cardSuccess}</div>
            )}
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {t("accounts.card.create")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
