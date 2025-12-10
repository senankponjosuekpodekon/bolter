import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import TransferForm from "./forms/TransferForm";
import DepositForm from "./forms/DepositForm";
import WithdrawForm from "./forms/WithdrawForm";
import { useTransactionMutations } from "../../hooks/useTransactionMutations";
import { useToast } from "../ui/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  initialType?: "transfer" | "deposit" | "withdraw";
};

type TransactionType = "transfer" | "deposit" | "withdraw";

export default function NewTransactionModal({
  open,
  onClose,
  initialType = "transfer",
}: Props) {
  const [type, setType] = useState<TransactionType>(initialType);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // fetch accounts to show on selects
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get("/accounts")).data,
    enabled: open,
  });

  useEffect(() => {
    if (open) setType(initialType);
  }, [open, initialType]);

  const { createTransfer, createDeposit, createWithdraw } =
    useTransactionMutations();
  const toast = useToast();

  // small helpers
  const submitTransfer = async (payload: Record<string, unknown>) => {
    createTransfer.mutate(payload, {
      onSuccess: () => {
        toast.push({
          title: "Virement créé",
          message: "Le virement a été ajouté et est en attente.",
          type: "success",
        });
        onClose();
      },
      onError: () =>
        toast.push({
          title: "Erreur",
          message: "Impossible de créer le virement",
          type: "error",
        }),
    });
  };

  const submitDeposit = (payload: Record<string, unknown>) => {
    createDeposit.mutate(payload, {
      onSuccess: () => {
        toast.push({
          title: "Dépôt créé",
          message: "Le dépôt a été ajouté avec succès",
          type: "success",
        });
        onClose();
      },
      onError: () =>
        toast.push({
          title: "Erreur",
          message: "Impossible de créer le dépôt",
          type: "error",
        }),
    });
  };

  const submitWithdraw = (payload: Record<string, unknown>) => {
    // adapt to API shape
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
          toast.push({
            title: "Retrait créé",
            message: "Le retrait a été demandé",
            type: "success",
          });
          onClose();
        },
        onError: () =>
          toast.push({
            title: "Erreur",
            message: "Impossible de créer le retrait",
            type: "error",
          }),
      }
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-transaction-title"
      onClick={(e) => {
        // close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3
              id="new-transaction-title"
              className="text-lg font-semibold text-gray-900"
            >
              Nouvelle transaction
            </h3>
            <p className="text-sm text-gray-500">
              Ctreate transfer, deposit or withdrawal quickly
            </p>
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 border-b pb-3">
            <button
              onClick={() => setType("transfer")}
              className={`px-3 py-1 ${type === "transfer" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Transfer
            </button>
            <button
              onClick={() => setType("deposit")}
              className={`px-3 py-1 ${type === "deposit" ? "border-b-2 border-green-600 text-green-600" : "text-gray-500"}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setType("withdraw")}
              className={`px-3 py-1 ${type === "withdraw" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500"}`}
            >
              Withdraw
            </button>
          </div>

          {type === "transfer" && (
            <div className="space-y-4">
              <TransferForm
                accounts={accounts}
                onSubmit={submitTransfer}
                submitting={createTransfer.isPending}
              />
              <p className="text-sm text-gray-500">
                Le virement sera traité et mis en attente pour approbation.
              </p>
            </div>
          )}

          {type === "deposit" && (
            <div className="space-y-4">
              <DepositForm
                accounts={accounts}
                onSubmit={submitDeposit}
                submitting={createDeposit.isPending}
              />
              <p className="text-sm text-gray-500">
                Le dépôt sera traité et mis en attente pour approbation.
              </p>
            </div>
          )}

          {type === "withdraw" && (
            <div className="space-y-4">
              <WithdrawForm
                accounts={accounts}
                onSubmit={submitWithdraw}
                submitting={createWithdraw.isPending}
              />
              <p className="text-sm text-gray-500">
                Le retrait sera traité et mis en attente pour approbation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
