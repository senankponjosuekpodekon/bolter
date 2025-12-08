import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import TransferForm from "../components/transactions/forms/TransferForm";
import DepositForm from "../components/transactions/forms/DepositForm";
import WithdrawForm from "../components/transactions/forms/WithdrawForm";
import { useTransactionMutations } from "../hooks/useTransactionMutations";
import { useToast } from "../components/ui/ToastProvider";
import { useFormatting } from "../hooks";

type TransactionType = "transfer" | "deposit" | "withdraw";

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("transfer");
  const { createTransfer, createDeposit, createWithdraw } =
    useTransactionMutations();
  const toast = useToast();

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

  // useTransactionMutations provides the mutations; on success we'll close form + toast

  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { currency: currencyFormatter, date: dateFormatter } = useFormatting({
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

  const handleTransferSubmit = (payload: Record<string, unknown>) => {
    createTransfer.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        toast.push({
          title: t("transactions.success_transfer_title"),
          message: t("transactions.success_transfer_message"),
          type: "success",
        });
      },
      onError: () =>
        toast.push({
          title: t("common.error"),
          message: t("transactions.error_create_transfer"),
          type: "error",
        }),
    });
  };

  const handleDepositSubmit = (payload: Record<string, unknown>) => {
    createDeposit.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        toast.push({
          title: t("transactions.success_deposit_title"),
          message: t("transactions.success_deposit_message"),
          type: "success",
        });
      },
      onError: () =>
        toast.push({
          title: t("common.error"),
          message: t("transactions.error_create_deposit"),
          type: "error",
        }),
    });
  };

  const handleWithdrawSubmit = (payload: Record<string, unknown>) => {
    const { accountId, amount, iban, bic, accountHolderName, description } =
      payload;
    createWithdraw.mutate(
      {
        accountId,
        amount,
        bankDetails: { iban, bic: bic || undefined, accountHolderName },
        description,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          toast.push({
            title: t("transactions.success_withdraw_title"),
            message: t("transactions.success_withdraw_message"),
            type: "success",
          });
        },
        onError: () =>
          toast.push({
            title: t("common.error"),
            message: t("transactions.error_create_withdraw"),
            type: "error",
          }),
      }
    );
  };

  // helper moved into forms; keep transactions page minimal

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("transactions.title")}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? t("transactions.close") : t("transactions.new")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setTransactionType("transfer")}
              className={`pb-2 px-4 ${transactionType === "transfer" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              {t("transactions.types.transfer")}
            </button>
            <button
              onClick={() => setTransactionType("deposit")}
              className={`pb-2 px-4 ${transactionType === "deposit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              {t("transactions.types.deposit")}
            </button>
            <button
              onClick={() => setTransactionType("withdraw")}
              className={`pb-2 px-4 ${transactionType === "withdraw" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              {t("transactions.types.withdraw")}
            </button>
          </div>

          {transactionType === "transfer" && (
            <div className="space-y-4">
              <TransferForm
                accounts={accounts}
                onSubmit={handleTransferSubmit}
                submitting={createTransfer.isPending}
              />
              <p className="text-sm text-gray-500">
                {t("transactions.helper.transfer")}
              </p>
            </div>
          )}

          {transactionType === "deposit" && (
            <div className="space-y-4">
              <DepositForm
                accounts={accounts}
                onSubmit={handleDepositSubmit}
                submitting={createDeposit.isPending}
              />
              <p className="text-sm text-gray-500">
                {t("transactions.helper.deposit")}
              </p>
            </div>
          )}

          {transactionType === "withdraw" && (
            <div className="space-y-4">
              <WithdrawForm
                accounts={accounts}
                onSubmit={handleWithdrawSubmit}
                submitting={createWithdraw.isPending}
              />
              <p className="text-sm text-gray-500">
                {t("transactions.helper.withdraw")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">
            {t("transactions.history_title")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions?.map((tx: import("../types").Transaction) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dateFormatter.format(new Date(tx.created_at), "short")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        tx.type === "DEPOSIT"
                          ? "bg-green-100 text-green-800"
                          : tx.type === "WITHDRAWAL"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {currencyFormatter.format(
                      Number(tx.amount),
                      tx.currency ?? "EUR"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : tx.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
