import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  tontinesService,
  CreateTontineDto,
} from "../services/tontines.service";

interface Tontine {
  id: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  contribution_amount: number;
  currency: string;
  frequency: string;
  current_cycle?: number;
  total_cycles: number;
  created_at: string;
  [key: string]: unknown;
}

const frequencies = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;
const distributionMethods = [
  "MANUAL_ORDER",
  "RANDOM",
  "SENIORITY",
  "LOTTERY",
] as const;

const defaultForm: CreateTontineDto = {
  name: "",
  description: "",
  contribution_amount: 50,
  currency: "EUR",
  frequency: "MONTHLY",
  total_cycles: 12,
  cycle_duration_days: 30,
  distribution_method: "SENIORITY",
};

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  COMPLETED: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

const StatusBadge = ({ value }: { value?: string }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusTone[value || ""] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}
  >
    {value || "INCONNU"}
  </span>
);

type CreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (tontine: Tontine) => void;
};

const CreateTontineModal = ({ open, onClose, onCreated }: CreateModalProps) => {
  const [form, setForm] = useState<CreateTontineDto>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstMember, setFirstMember] = useState<{
    user_id: string;
    distribution_order?: number | "";
  }>({ user_id: "", distribution_order: "" });

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const numeric = [
      "contribution_amount",
      "total_cycles",
      "cycle_duration_days",
    ];
    setForm((f) => ({
      ...f,
      [name]: numeric.includes(name) ? Number(value) : value,
    }));
  };

  const onChangeFirstMember = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFirstMember((prev) => ({
      ...prev,
      [name]:
        name === "distribution_order" && value !== "" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateTontineDto = {
        ...form,
        initial_members:
          firstMember.user_id.trim() !== ""
            ? [
                {
                  user_id: firstMember.user_id.trim(),
                  distribution_order:
                    firstMember.distribution_order === ""
                      ? undefined
                      : Number(firstMember.distribution_order),
                },
              ]
            : undefined,
      };

      const res = await tontinesService.create(payload);
      onCreated(res);
      onClose();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string } | null;
      setError(error?.response?.data?.message || (error as { message?: string })?.message || 'Error creating tontine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur">
      <div className="bg-white shadow-2xl rounded-t-2xl sm:rounded-xl w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white">
          <div className="flex-1 pr-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Nouvelle tontine
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Créer et inviter vos membres
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 mb-2 border border-red-200 bg-red-50 text-red-800 text-sm rounded p-3">
            {error}
            {error.toLowerCase().includes("foreign key") && (
              <div className="mt-2 text-xs">
                Vérifiez les migrations 0010 et 0011 côté base de données.
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 py-4 space-y-4 pb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-700">Nom</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-700">Devise</label>
              <input
                name="currency"
                value={form.currency}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-700">
                Montant de contribution
              </label>
              <input
                name="contribution_amount"
                type="number"
                min={1}
                value={form.contribution_amount}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-700">Fréquence</label>
              <select
                name="frequency"
                value={form.frequency}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
              >
                {frequencies.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-700">Nombre de cycles</label>
              <input
                name="total_cycles"
                type="number"
                min={1}
                value={form.total_cycles}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-700">
                Durée d&apos;un cycle (jours)
              </label>
              <input
                name="cycle_duration_days"
                type="number"
                min={1}
                value={form.cycle_duration_days}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-700">
                Méthode de distribution
              </label>
              <select
                name="distribution_method"
                value={form.distribution_method}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
              >
                {distributionMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <p className="text-sm font-medium text-slate-900">
              Ajouter un premier membre (optionnel)
            </p>
            <p className="text-xs text-slate-600 mb-2 sm:mb-3">
              Indiquez l&apos;identifiant utilisateur si vous souhaitez pré-ajouter
              un participant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="space-y-1">
                <label className="text-sm text-slate-700">User ID</label>
                <input
                  name="user_id"
                  value={firstMember.user_id}
                  onChange={onChangeFirstMember}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                  placeholder="uuid utilisateur"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-700">
                  Ordre (facultatif)
                </label>
                <input
                  name="distribution_order"
                  value={firstMember.distribution_order === '' ? '' : firstMember.distribution_order}
                  onChange={onChangeFirstMember}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-500"
                  placeholder="1, 2, 3…"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-base sm:text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium text-base sm:text-sm"
            >
              {submitting ? "Création…" : "Créer la tontine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TontinesListPage() {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tontinesService.list();
      setTontines(data);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string } | null;
      const msg = error?.response?.data?.message || (error as { message?: string })?.message || 'Error loading tontines';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = tontines.length;
    const active = tontines.filter((t) => t.status === "ACTIVE").length;
    const pending = tontines.filter(
      (t) => t.status !== "ACTIVE" && t.status !== "COMPLETED"
    ).length;
    return { total, active, pending };
  }, [tontines]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                ROSCA / Tontines
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Vos tontines, en un coup d&apos;oeil
              </h1>
              <p className="text-slate-600 max-w-2xl">
                Suivez vos groupes, démarrez des cycles et enregistrez les
                contributions sans quitter cette page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
              >
                <span className="text-xl">＋</span>
                <span>Créer une tontine</span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.total}
              </p>
              <p className="text-xs text-slate-500">
                Tontines créées ou rejointes
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
              <p className="text-xs text-slate-500">Actives</p>
              <p className="text-2xl font-semibold text-emerald-700">
                {stats.active}
              </p>
              <p className="text-xs text-slate-500">Cycles en cours</p>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
              <p className="text-xs text-slate-500">En attente</p>
              <p className="text-2xl font-semibold text-amber-700">
                {stats.pending}
              </p>
              <p className="text-xs text-slate-500">À démarrer</p>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 flex items-center justify-between">
              <span>{message}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-sm underline"
              >
                OK
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 border border-red-200 bg-red-50 text-red-800 rounded-xl p-4">
              <p className="font-semibold">
                Impossible de charger vos tontines
              </p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-red-700">
                Vérifiez que votre jeton est encore valide et que l&apos;API répond
                sur le port 3000.
              </p>
              <div className="mt-3">
                <button
                  onClick={load}
                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-8 flex items-center gap-3 text-slate-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Chargement des tontines…</span>
            </div>
          )}

          {!loading && !error && tontines.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                ＋
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                Aucune tontine pour l&apos;instant
              </h3>
              <p className="mt-1 text-slate-600">
                Créez-en une et invitez vos membres en deux clics.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow"
                >
                  Créer une tontine
                </button>
              </div>
            </div>
          )}

          {!loading && !error && tontines.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {tontines.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5 hover:-translate-y-0.5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        #{t.id.slice(0, 8)}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {t.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {t.description || "Aucune description"}
                      </p>
                    </div>
                    <StatusBadge value={t.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Contribution</p>
                      <p className="font-semibold">
                        {t.contribution_amount} {t.currency}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Fréquence</p>
                      <p className="font-semibold">{t.frequency}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Cycles</p>
                      <p className="font-semibold">
                        {t.current_cycle || 0} / {t.total_cycles}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Créée le</p>
                      <p className="font-semibold">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/tontines/${t.id}`}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50"
                    >
                      Détails
                    </a>
                    <a
                      href={`/tontines/${t.id}/members`}
                      className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Membres
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTontineModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(t) => {
          setMessage(
            "Tontine créée avec succès. Ajoutez des membres et démarrez le cycle."
          );
          setTontines((prev) => [t, ...prev]);
        }}
      />
    </div>
  );
}
