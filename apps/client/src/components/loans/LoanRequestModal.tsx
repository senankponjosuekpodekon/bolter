// modal parent for loan form
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import LoanForm from "./LoanForm";
import { useToast } from "../ui/ToastProvider";
import type { CreateLoanPayload } from "../../services/loanService";

type Props = { open: boolean; onClose: () => void };

export default function LoanRequestModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const createLoan = useMutation({
    mutationFn: async (payload: CreateLoanPayload) =>
      (await api.post("/loans", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: () => alert("Failed to request loan"),
  });

  if (!open) return null;

  const handleSubmit = (payload?: CreateLoanPayload) => {
    if (!payload) return;
    createLoan.mutate(payload, {
      onSuccess: () => {
        toast.push({
          title: "Demande envoyée",
          message: "Votre demande de prêt a été envoyée.",
          type: "success",
        });
        onClose();
      },
      onError: () =>
        toast.push({
          title: "Erreur",
          message: "Impossible d'envoyer la demande",
          type: "error",
        }),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Demande de prêt</h3>
            <p className="text-sm text-gray-500">
              Simule et demande un prêt rapidement
            </p>
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="p-6">
          <LoanForm onSubmit={handleSubmit} submitting={createLoan.isPending} />
        </div>
      </div>
    </div>
  );
}
