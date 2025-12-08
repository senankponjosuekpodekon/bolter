// Quick actions buttons — modal-driven
import { useState } from "react";
import NewTransactionModal from "../transactions/NewTransactionModal";
import LoanRequestModal from "../loans/LoanRequestModal";

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const [openLoan, setOpenLoan] = useState(false);
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex gap-3 items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">Actions rapides</h3>
        <p className="text-xs text-gray-400">Transferts, prêts et plus</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-95"
        >
          Nouvelle transaction
        </button>
        <button
          onClick={() => setOpenLoan(true)}
          className="border border-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Demande de prêt
        </button>
      </div>
      <NewTransactionModal open={open} onClose={() => setOpen(false)} />
      <LoanRequestModal open={openLoan} onClose={() => setOpenLoan(false)} />
    </div>
  );
}
