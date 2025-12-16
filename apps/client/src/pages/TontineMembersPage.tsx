import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { tontinesService, AddMemberDto } from "../services/tontines.service";

type Member = {
  id: string;
  user_id: string;
  status: string;
  distribution_order?: number;
  total_contributed?: number;
  total_expected?: number;
};

export default function TontineMembersPage() {
  const { id } = useParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AddMemberDto>({ user_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tontinesService.members(id);
      setMembers(data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addMember = async () => {
    if (!id || !form.user_id) return;
    setSubmitting(true);
    try {
      await tontinesService.addMember(id, form);
      setForm({ user_id: "" });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Membres de la tontine</h1>

      <div className="rounded border p-3 space-y-2">
        <h2 className="font-medium text-sm text-gray-700">Ajouter un membre</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">ID utilisateur *</span>
            <input
              className="border rounded px-3 py-2"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              placeholder="uuid de l'utilisateur"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">
              Ordre de distribution (optionnel)
            </span>
            <input
              className="border rounded px-3 py-2"
              type="number"
              value={form.distribution_order ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  distribution_order: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={addMember}
            disabled={submitting || !form.user_id}
          >
            {submitting ? "Ajout…" : "Ajouter"}
          </button>
          <a
            href={`/tontines/${id}`}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Retour
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span>Chargement des membres…</span>
        </div>
      ) : error ? (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
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
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={load}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded border">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2">Membre</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Ordre</th>
                <th className="p-2">Contribué</th>
                <th className="p-2">Attendu</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{m.user_id}</td>
                  <td className="p-2">{m.status}</td>
                  <td className="p-2">{m.distribution_order ?? "-"}</td>
                  <td className="p-2">{m.total_contributed ?? 0}</td>
                  <td className="p-2">{m.total_expected ?? 0}</td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td className="p-2" colSpan={5}>
                    Aucun membre pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
