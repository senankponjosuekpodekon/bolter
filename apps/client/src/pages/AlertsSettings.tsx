import React, { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

export default function AlertsSettings() {
  const { user, updatePreferences } = useAuthStore();
  const [threshold, setThreshold] = useState(
    user?.preferences?.alertThreshold || 100
  );
  const [emailEnabled, setEmailEnabled] = useState(
    user?.preferences?.emailAlerts ?? true
  );
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("/users/profile/preferences", {
        alertThreshold: threshold,
        emailAlerts: emailEnabled,
      });
      updatePreferences({
        alertThreshold: threshold,
        emailAlerts: emailEnabled,
      });
      setSuccess("Préférences d’alerte enregistrées !");
      setError("");
    } catch (err) {
      setSuccess("");
      let message = "Erreur lors de la sauvegarde";
      if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error: err type from axios may have response property
        message = err.response?.data?.message || message;
      }
      setError(message);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Paramètres d’alertes</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Seuil d’alerte (montant minimum)
          </label>
          <input
            type="number"
            value={threshold}
            min={1}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            id="emailAlerts"
            className="mr-2"
          />
          <label htmlFor="emailAlerts" className="text-sm">
            Recevoir les alertes par email
          </label>
        </div>
        {success && <div className="text-green-600 text-sm">{success}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enregistrer
        </button>
      </form>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Comment ça marche ?</h2>
        <ul className="list-disc pl-6 text-sm text-gray-700">
          <li>
            Recevez une alerte si un virement ou une dépense dépasse le seuil
            défini.
          </li>
          <li>
            Les alertes sont envoyées par email et affichées dans l’application.
          </li>
          <li>
            Les admins peuvent configurer des alertes pour les comptes clients.
          </li>
        </ul>
      </div>
    </div>
  );
}
