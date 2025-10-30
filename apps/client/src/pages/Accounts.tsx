import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export default function Accounts() {
  const queryClient = useQueryClient();
  const [accountType, setAccountType] = useState<"CHECKING" | "SAVINGS">(
    "SAVINGS"
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const createAccount = useMutation({
    mutationFn: async (payload: { accountType?: "CHECKING" | "SAVINGS" }) => {
      const response = await api.post("/accounts", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setAccountType("SAVINGS");
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
    onError: (error: any) => {
      setSuccessMessage("");
      const message = error?.response?.data?.message;
      setErrorMessage(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to create account"
      );
    },
  });

  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    createAccount.mutate({ accountType });
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
        {accounts?.map((account: any) => (
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
                {parseFloat(account.balance).toFixed(2)} €
              </p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">
                Created: {new Date(account.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
