import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

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
          `New ${data.account_type} account ${data.account_number} created. Pending transactions can now target it.`
        );
      } else {
        setSuccessMessage("Account created successfully.");
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
      setCardSuccess(`Carte ${data.type} créée : ${data.card_number}`);
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Open a New Account
            </h2>
            <p className="text-sm text-gray-500">
              Create additional accounts to separate budgets or savings before
              initiating internal transfers.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(event) =>
                setAccountType(event.target.value as "CHECKING" | "SAVINGS")
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={createAccount.isPending}
            >
              <option value="SAVINGS">Savings</option>
              <option value="CHECKING">Checking</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Currency
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
              Limit (per transaction)
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
            {createAccount.isPending ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.map((account: Account) => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {account.account_type}
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
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {parseFloat(String(account.balance)).toFixed(2)}{" "}
                {account.currency}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">
                Limit: {account.limit} {account.currency} / transaction
              </p>
              <p className="text-xs text-gray-400">
                Created:{" "}
                {account.created_at
                  ? new Date(account.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-lg font-medium mb-2">Gérer mes cartes</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          onClick={() => setShowCardForm((v) => !v)}
        >
          {showCardForm ? "Annuler" : "Créer une carte"}
        </button>
        {showCardForm && (
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Compte associé
              </label>
              <select
                value={cardAccountId}
                onChange={(e) => setCardAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Choisir un compte</option>
                {accounts?.map((acc: Account) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} - {acc.account_number} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Type de carte</label>
              <select
                value={cardType}
                onChange={(e) =>
                  setCardType(e.target.value as "VIRTUAL" | "PHYSICAL")
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="VIRTUAL">Virtuelle</option>
                <option value="PHYSICAL">Physique</option>
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
              Créer la carte
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
