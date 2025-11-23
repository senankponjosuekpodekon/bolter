import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export default function ScheduledTransfers() {
  type ScheduledTransferPayload = {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    date: string;
    recurrence: string;
    description: string;
    userId?: string;
  };
  type Account = {
    id: string;
    account_type: string;
    account_number: string;
    currency: string;
  };
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: 0,
    currency: "EUR",
    date: "",
    recurrence: "once",
    description: "",
    userId: "", // for admin
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get("/accounts")).data,
  });

  const { data: scheduledTransfers } = useQuery({
    queryKey: ["scheduled-transfers"],
    queryFn: async () => (await api.get("/scheduled-transfers")).data,
  });

  const createTransfer = useMutation({
    mutationFn: async (payload: ScheduledTransferPayload) => {
      const response = await api.post("/scheduled-transfers", payload);
      return response.data;
    },
    onSuccess: () => {
      setSuccess("Virement programmé créé !");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
    onError: (err: unknown) => {
      setSuccess("");
      let message = "Erreur création virement programmé";
      if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error: err type from axios may have response property
        message = err.response?.data?.message || message;
      }
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransfer.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Virements programmés</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <div>
          <label className="block text-sm font-medium">Compte source</label>
          <select
            value={form.fromAccountId}
            onChange={(e) =>
              setForm((f) => ({ ...f, fromAccountId: e.target.value }))
            }
            required
            className="mt-1 w-full border rounded p-2"
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
          <label className="block text-sm font-medium">
            Compte destinataire
          </label>
          <input
            type="text"
            value={form.toAccountId}
            onChange={(e) =>
              setForm((f) => ({ ...f, toAccountId: e.target.value }))
            }
            required
            className="mt-1 w-full border rounded p-2"
            placeholder="IBAN ou compte interne"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Montant</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: Number(e.target.value) }))
            }
            min={1}
            required
            className="mt-1 w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Devise</label>
          <select
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value }))
            }
            className="mt-1 w-full border rounded p-2"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Date d’exécution</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            className="mt-1 w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Récurrence</label>
          <select
            value={form.recurrence}
            onChange={(e) =>
              setForm((f) => ({ ...f, recurrence: e.target.value }))
            }
            className="mt-1 w-full border rounded p-2"
          >
            <option value="once">Une fois</option>
            <option value="monthly">Mensuel</option>
            <option value="weekly">Hebdomadaire</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="mt-1 w-full border rounded p-2"
          />
        </div>
        {/* Pour admin : champ utilisateur cible */}
        <div>
          <label className="block text-sm font-medium">
            Utilisateur cible (admin)
          </label>
          <input
            type="text"
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            className="mt-1 w-full border rounded p-2"
            placeholder="ID utilisateur (optionnel)"
          />
        </div>
        {success && <div className="text-green-600 text-sm">{success}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Programmer le virement
        </button>
      </form>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">
          Suivi des virements programmés
        </h2>
        <div className="bg-white rounded shadow p-4">
          {scheduledTransfers?.length === 0 && (
            <div>Aucun virement programmé.</div>
          )}
          <ul>
            {scheduledTransfers?.map(
              (tx: import("../types/scheduledTransfer").ScheduledTransfer) => (
                <li key={tx.id} className="mb-2 border-b pb-2">
                  <div>
                    Montant :{" "}
                    <span className="font-bold">
                      {tx.amount} {tx.currency}
                    </span>
                  </div>
                  <div>Source : {tx.fromAccountId}</div>
                  <div>Destinataire : {tx.toAccountId}</div>
                  <div>Date : {tx.date}</div>
                  <div>Récurrence : {tx.recurrence}</div>
                  <div>Description : {tx.description}</div>
                  <div>
                    Statut :{" "}
                    <span className="font-bold text-blue-700">{tx.status}</span>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
