import React, { useState, useEffect } from "react";
type LoanRequest = {
  id: string;
  amount: number;
  rate: number;
  duration: number;
  purpose: string;
  insurance: boolean;
  monthlyPayment?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};
import api from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { websocketService } from "../services/websocketService";

function calculateMonthlyPayment(
  amount: number,
  rate: number,
  duration: number
) {
  const monthlyRate = rate / 12 / 100;
  const n = duration * 12;
  if (monthlyRate === 0) return amount / n;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

export const LoanSimulator: React.FC = () => {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(2.5);
  const [duration, setDuration] = useState(5);
  const [monthly, setMonthly] = useState<number | null>(null);
  const [purpose, setPurpose] = useState("immobilier");
  const [insurance, setInsurance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  type Notification = {
    id: string;
    type: string;
    message: string;
    createdAt?: string;
    [key: string]: unknown;
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { data: loanRequests, refetch } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const response = await api.get("/loans");
      return response.data;
    },
  });

  useEffect(() => {
    websocketService.onNotification((payload) => {
      if (payload.type === "loan-status") {
        setNotifications((prev) => [payload, ...prev]);
        refetch();
      }
    });
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1000 || amount > 100000) {
      setError("Le montant doit être entre 1 000€ et 100 000€");
      return;
    }
    if (rate < 0.1 || rate > 10) {
      setError("Le taux doit être entre 0,1% et 10%");
      return;
    }
    if (duration < 1 || duration > 30) {
      setError("La durée doit être entre 1 et 30 ans");
      return;
    }
    setError(null);
    setMonthly(
      calculateMonthlyPayment(amount, rate + (insurance ? 0.3 : 0), duration)
    );
  };

  const handleRequest = async () => {
    setRequestStatus("loading");
    try {
      await api.post("/loans", {
        amount,
        rate: rate + (insurance ? 0.3 : 0),
        duration,
        purpose,
        insurance,
        monthlyPayment: monthly,
      });
      setRequestStatus("success");
      refetch();
    } catch (error) {
      // log error for debugging and update request status
      console.error("Loan request failed", error);
      setRequestStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Simulateur de prêt</h1>
      <form onSubmit={handleSimulate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Montant (€)</label>
          <input
            type="number"
            value={amount}
            min={1000}
            max={100000}
            step={100}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Taux annuel (%)</label>
          <input
            type="number"
            value={rate}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Durée (années)</label>
          <input
            type="number"
            value={duration}
            min={1}
            max={30}
            step={1}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Objet du prêt</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="immobilier">Immobilier</option>
            <option value="auto">Auto</option>
            <option value="travaux">Travaux</option>
            <option value="consommation">Consommation</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            id="insurance"
            className="mr-2"
          />
          <label htmlFor="insurance" className="text-sm">
            Inclure assurance (+0,3%)
          </label>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simuler
        </button>
      </form>
      {monthly !== null && (
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h2 className="text-lg font-semibold">Résultat</h2>
          <p>
            Mensualité estimée :{" "}
            <span className="font-bold">{monthly.toFixed(2)} €</span>
          </p>
          <p>
            Coût total du crédit :{" "}
            <span className="font-bold">
              {(monthly * duration * 12).toFixed(2)} €
            </span>
          </p>
          <p>
            Objet du prêt : <span className="font-bold">{purpose}</span>
          </p>
          <p>
            Assurance :{" "}
            <span className="font-bold">{insurance ? "Oui" : "Non"}</span>
          </p>
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleRequest}
            disabled={requestStatus === "loading"}
          >
            Demander ce prêt
          </button>
          {requestStatus === "success" && (
            <div className="mt-2 text-green-700">
              Demande envoyée avec succès !
            </div>
          )}
          {requestStatus === "error" && (
            <div className="mt-2 text-red-600">
              Erreur lors de l’envoi de la demande.
            </div>
          )}
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">
          Suivi de mes demandes de prêt
        </h2>
        <div className="bg-white rounded shadow p-4">
          {loanRequests?.length === 0 && <div>Aucune demande en cours.</div>}
          <ul>
            {loanRequests?.map((loan: LoanRequest) => (
              <li key={loan.id} className="mb-2 border-b pb-2">
                <div>
                  Montant : <span className="font-bold">{loan.amount} €</span>
                </div>
                <div>Durée : {loan.duration} ans</div>
                <div>Taux : {loan.rate}%</div>
                <div>Objet : {loan.purpose}</div>
                <div>Assurance : {loan.insurance ? "Oui" : "Non"}</div>
                <div>Mensualité : {loan.monthlyPayment?.toFixed(2)} €</div>
                <div className="mt-1">
                  Statut :{" "}
                  <span className="font-bold text-blue-700">{loan.status}</span>
                </div>
                {loan.status === "PENDING" && (
                  <span className="text-yellow-600">
                    En attente de validation
                  </span>
                )}
                {loan.status === "APPROVED" && (
                  <span className="text-green-600">Approuvé</span>
                )}
                {loan.status === "REJECTED" && (
                  <span className="text-red-600">Refusé</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Notifications prêt</h2>
        <div className="bg-blue-50 rounded shadow p-4 mb-4">
          {notifications.length === 0 && <div>Aucune notification.</div>}
          <ul>
            {notifications.map((notif, idx) => {
              const title =
                typeof notif.title === "string"
                  ? notif.title
                  : "Notification prêt";
              const status =
                typeof notif.status === "string" ? notif.status : "";
              return (
                <li key={idx} className="mb-2">
                  <span className="font-bold">{title}</span> : {notif.message}
                  {status && (
                    <span
                      className={
                        status === "APPROVED"
                          ? "text-green-600 ml-2"
                          : status === "REJECTED"
                            ? "text-red-600 ml-2"
                            : "text-yellow-600 ml-2"
                      }
                    >
                      {status}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
