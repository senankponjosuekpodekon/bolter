import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

type TransactionType = "transfer" | "deposit" | "withdraw";

type TransferPayload = {
  fromAccountId: string;
  toAccountId?: string;
  ibanExternal?: string;
  amount: number;
  description?: string;
};

type DepositPayload = {
  accountId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  description?: string;
};

type WithdrawPayload = {
  accountId: string;
  amount: number;
  bankDetails: {
    iban: string;
    bic?: string;
    accountHolderName: string;
  };
  description?: string;
};

export default function Transactions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("transfer");

  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
    ibanExternal: "",
  });

  const [depositData, setDepositData] = useState({
    accountId: "",
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    reference: "",
    description: "",
  });

  const [withdrawData, setWithdrawData] = useState({
    accountId: "",
    amount: "",
    iban: "",
    bic: "",
    accountHolderName: "",
    description: "",
  });

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

  const createTransfer = useMutation({
    mutationFn: async (data: TransferPayload) => {
      const response = await api.post("/transactions/transfer", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      resetForms();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create transfer";
      alert(message);
    },
  });

  const createDeposit = useMutation({
    mutationFn: async (data: DepositPayload) => {
      const response = await api.post("/transactions/deposit", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      resetForms();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create deposit";
      alert(message);
    },
  });

  const createWithdraw = useMutation({
    mutationFn: async (data: WithdrawPayload) => {
      const response = await api.post("/transactions/withdraw", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      resetForms();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create withdrawal";
      alert(message);
    },
  });

  const resetForms = () => {
    setTransferData({
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      description: "",
      ibanExternal: "",
    });
    setDepositData({
      accountId: "",
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      reference: "",
      description: "",
    });
    setWithdrawData({
      accountId: "",
      amount: "",
      iban: "",
      bic: "",
      accountHolderName: "",
      description: "",
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferData.amount);
    if (!transferData.fromAccountId || Number.isNaN(amount) || amount <= 0) {
      alert("Account and amount > 0 are required");
      return;
    }

    const toAccountId = transferData.toAccountId || undefined;
    const ibanExternal = transferData.ibanExternal?.trim() || undefined;

    if (toAccountId && toAccountId === transferData.fromAccountId) {
      alert("Source and destination accounts must differ");
      return;
    }

    if (!toAccountId && !ibanExternal) {
      alert("Select an internal account or provide an external IBAN");
      return;
    }

    createTransfer.mutate({
      fromAccountId: transferData.fromAccountId,
      toAccountId,
      amount,
      description: transferData.description?.trim() || undefined,
      ibanExternal,
    });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositData.amount);
    if (!depositData.accountId || Number.isNaN(amount) || amount <= 0) {
      alert("Account and amount > 0 are required");
      return;
    }
    console.log("Deposit payload:", {
      accountId: depositData.accountId,
      amount,
      paymentMethod: depositData.paymentMethod,
      reference: depositData.reference,
      description: depositData.description,
    });
    createDeposit.mutate({
      accountId: depositData.accountId,
      amount,
      paymentMethod: depositData.paymentMethod,
      reference: depositData.reference?.trim() || undefined,
      description: depositData.description?.trim() || undefined,
    });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawData.amount);
    const iban = withdrawData.iban.trim();
    const accountHolderName = withdrawData.accountHolderName.trim();
    if (
      !withdrawData.accountId ||
      Number.isNaN(amount) ||
      amount <= 0 ||
      !iban ||
      !accountHolderName
    ) {
      alert("Account, amount > 0, IBAN and account holder name are required");
      return;
    }

    console.log("Withdraw payload:", {
      accountId: withdrawData.accountId,
      amount,
      bankDetails: {
        iban,
        bic: withdrawData.bic?.trim() || undefined,
        accountHolderName,
      },
      description: withdrawData.description?.trim() || undefined,
    });

    createWithdraw.mutate({
      accountId: withdrawData.accountId,
      amount,
      bankDetails: {
        iban,
        bic: withdrawData.bic?.trim() || undefined,
        accountHolderName,
      },
      description: withdrawData.description?.trim() || undefined,
    });
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts?.find((acc: any) => acc.id === accountId);
    return account ? parseFloat(account.balance) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? "Close" : "New Transaction"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setTransactionType("transfer")}
              className={`pb-2 px-4 ${transactionType === "transfer" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Transfer
            </button>
            <button
              onClick={() => setTransactionType("deposit")}
              className={`pb-2 px-4 ${transactionType === "deposit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setTransactionType("withdraw")}
              className={`pb-2 px-4 ${transactionType === "withdraw" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Withdraw
            </button>
          </div>

          {transactionType === "transfer" && (
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <h2 className="text-lg font-medium">Create Transfer</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Account
                </label>
                <select
                  required
                  value={transferData.fromAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      fromAccountId: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select account</option>
                  {accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - Balance: €
                      {parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
                {transferData.fromAccountId && (
                  <p className="mt-1 text-sm text-gray-600">
                    Available: €
                    {getAccountBalance(transferData.fromAccountId).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  To Account (Internal) or External IBAN
                </label>
                <select
                  value={transferData.toAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      toAccountId: e.target.value,
                      ibanExternal: "",
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Internal account or use IBAN below</option>
                  {accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Or External IBAN
                </label>
                <input
                  type="text"
                  value={transferData.ibanExternal}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      ibanExternal: e.target.value,
                      toAccountId: "",
                    })
                  }
                  placeholder="FR7612345678901234567890123"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (EUR)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={transferData.description}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={createTransfer.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createTransfer.isPending ? "Creating..." : "Create Transfer"}
              </button>

              <p className="text-sm text-gray-500">
                Transfer will be pending until admin approval
              </p>
            </form>
          )}

          {transactionType === "deposit" && (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <h2 className="text-lg font-medium">Create Deposit</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  To Account
                </label>
                <select
                  required
                  value={depositData.accountId}
                  onChange={(e) =>
                    setDepositData({
                      ...depositData,
                      accountId: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select account</option>
                  {accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - Balance: €
                      {parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (EUR)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositData.amount}
                  onChange={(e) =>
                    setDepositData({ ...depositData, amount: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  required
                  value={depositData.paymentMethod}
                  onChange={(e) =>
                    setDepositData({
                      ...depositData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reference
                </label>
                <input
                  type="text"
                  value={depositData.reference}
                  onChange={(e) =>
                    setDepositData({
                      ...depositData,
                      reference: e.target.value,
                    })
                  }
                  placeholder="Payment reference"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={depositData.description}
                  onChange={(e) =>
                    setDepositData({
                      ...depositData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={createDeposit.isPending}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {createDeposit.isPending ? "Creating..." : "Create Deposit"}
              </button>

              <p className="text-sm text-gray-500">
                Deposit will be pending until admin approval
              </p>
            </form>
          )}

          {transactionType === "withdraw" && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <h2 className="text-lg font-medium">Create Withdrawal</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Account
                </label>
                <select
                  required
                  value={withdrawData.accountId}
                  onChange={(e) =>
                    setWithdrawData({
                      ...withdrawData,
                      accountId: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select account</option>
                  {accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - Balance: €
                      {parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
                {withdrawData.accountId && (
                  <p className="mt-1 text-sm text-gray-600">
                    Available: €
                    {getAccountBalance(withdrawData.accountId).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (EUR)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawData.amount}
                  onChange={(e) =>
                    setWithdrawData({ ...withdrawData, amount: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  IBAN
                </label>
                <input
                  required
                  type="text"
                  value={withdrawData.iban}
                  onChange={(e) =>
                    setWithdrawData({ ...withdrawData, iban: e.target.value })
                  }
                  placeholder="FR7612345678901234567890123"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  BIC/SWIFT (Optional)
                </label>
                <input
                  type="text"
                  value={withdrawData.bic}
                  onChange={(e) =>
                    setWithdrawData({ ...withdrawData, bic: e.target.value })
                  }
                  placeholder="BNPAFRPP"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Holder Name
                </label>
                <input
                  required
                  type="text"
                  value={withdrawData.accountHolderName}
                  onChange={(e) =>
                    setWithdrawData({
                      ...withdrawData,
                      accountHolderName: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={withdrawData.description}
                  onChange={(e) =>
                    setWithdrawData({
                      ...withdrawData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={createWithdraw.isPending}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {createWithdraw.isPending ? "Creating..." : "Create Withdrawal"}
              </button>

              <p className="text-sm text-gray-500">
                Withdrawal will be pending until admin approval
              </p>
            </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Transaction History</h2>
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
              {transactions?.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(tx.created_at).toLocaleDateString()}
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
                    €{parseFloat(tx.amount).toFixed(2)}
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
