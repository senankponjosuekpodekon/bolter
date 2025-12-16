import { useState } from "react";
import {
  tontinesService,
  CreateTontineDto,
} from "../services/tontines.service";

const frequencies = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;

export default function TontineCreatePage() {
  const [form, setForm] = useState<CreateTontineDto>({
    name: "",
    description: "",
    contribution_amount: 0,
    currency: "EUR",
    frequency: "MONTHLY",
    total_cycles: 12,
    cycle_duration_days: 30,
    distribution_method: "SENIORITY",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === "contribution_amount" ||
        name === "total_cycles" ||
        name === "cycle_duration_days"
          ? Number(value)
          : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await tontinesService.create(form);
      window.location.href = `/tontines/${res.id}`;
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Créer une tontine</h1>

      {error && (
        <div className="mb-4 border-l-4 border-red-500 bg-red-50 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Échec de la création
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                {error.toLowerCase().includes("foreign key") && (
                  <p className="mt-2 text-xs">
                    💡 Assurez-vous que les migrations de base de données sont
                    appliquées.
                    <br />
                    Exécutez:{" "}
                    <code className="bg-red-100 px-1 rounded">
                      psql $DATABASE_URL -f
                      apps/server/migrations/0010_fix_tontines_fk.sql
                    </code>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              Montant de contribution
            </label>
            <input
              name="contribution_amount"
              type="number"
              min={1}
              value={form.contribution_amount}
              onChange={onChange}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Devise</label>
            <input
              name="currency"
              value={form.currency}
              onChange={onChange}
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Fréquence</label>
            <select
              name="frequency"
              value={form.frequency}
              onChange={onChange}
              className="w-full border rounded p-2"
            >
              {frequencies.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Nombre de cycles</label>
            <input
              name="total_cycles"
              type="number"
              min={1}
              value={form.total_cycles}
              onChange={onChange}
              className="w-full border rounded p-2"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              Durée d'un cycle (jours)
            </label>
            <input
              name="cycle_duration_days"
              type="number"
              min={1}
              value={form.cycle_duration_days}
              onChange={onChange}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Méthode de distribution
            </label>
            <select
              name="distribution_method"
              value={form.distribution_method}
              onChange={onChange}
              className="w-full border rounded p-2"
            >
              {["MANUAL_ORDER", "RANDOM", "SENIORITY", "LOTTERY"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={loading}
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Création…" : "Créer"}
          </button>
          <a
            href="/tontines"
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Annuler
          </a>
        </div>
      </form>
    </div>
  );
}
