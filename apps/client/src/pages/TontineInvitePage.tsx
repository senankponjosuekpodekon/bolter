/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";

const badgeTone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  COMPLETED: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

export default function TontineInvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [applicationResult, setApplicationResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    api
      .get(`/tontines/invite/${code}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      // Save code to return after login
      sessionStorage.setItem("pendingInvite", code || "");
      navigate("/login");
      return;
    }

    setApplying(true);
    setApplicationResult(null);
    try {
      await api.post(`/tontines/invite/${code}/apply`, { message });
      setApplicationResult({
        success:
          "Candidature envoyée avec succès ! Le créateur examinera votre demande.",
      });
    } catch (e: any) {
      setApplicationResult({ error: e?.response?.data?.message || e.message });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>Chargement de l&apos;invitation…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 text-red-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold">Invitation invalide</h2>
          </div>
          <p className="text-sm">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => navigate("/tontines")}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tontine, invitation } = data;
  const canApply = tontine.status === "PENDING";
  const isCreator = user?.id === tontine.creator_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Invitation à rejoindre
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">
            {tontine.name}
          </h1>
        </div>

        <div className="rounded-2xl bg-white shadow-lg border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Statut</p>
              <span
                className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeTone[tontine.status] || "bg-slate-100 text-slate-700"}`}
              >
                {tontine.status}
              </span>
            </div>
            {isCreator && (
              <div className="text-sm text-slate-600 bg-blue-50 px-3 py-1 rounded-lg">
                Vous êtes le créateur
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Description</p>
              <p className="text-slate-800">
                {tontine.description || "Aucune description fournie."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Contribution</p>
                <p className="text-lg font-semibold text-slate-900">
                  {tontine.contribution_amount} {tontine.currency}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Fréquence</p>
                <p className="text-lg font-semibold text-slate-900">
                  {tontine.frequency}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Cycles</p>
                <p className="text-lg font-semibold text-slate-900">
                  {tontine.total_cycles}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">
                Méthode de distribution
              </p>
              <p className="text-sm font-medium text-slate-900">
                {tontine.distribution_method}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {tontine.distribution_method === "SENIORITY" &&
                  "Les plus anciens membres reçoivent en premier"}
                {tontine.distribution_method === "RANDOM" &&
                  "Ordre aléatoire déterminé au démarrage"}
                {tontine.distribution_method === "LOTTERY" &&
                  "Tirage au sort à chaque cycle"}
                {tontine.distribution_method === "MANUAL_ORDER" &&
                  "Ordre manuel défini par le créateur"}
              </p>
            </div>

            {!canApply && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                {tontine.status === "ACTIVE" &&
                  "Cette tontine a déjà démarré et n'accepte plus de candidatures."}
                {tontine.status === "COMPLETED" &&
                  "Cette tontine est terminée."}
                {tontine.status === "CANCELLED" &&
                  "Cette tontine a été annulée."}
              </div>
            )}

            {applicationResult?.success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
                {applicationResult.success}
              </div>
            )}

            {applicationResult?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
                {applicationResult.error}
              </div>
            )}

            {canApply && !isCreator && !applicationResult?.success && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Postuler pour rejoindre
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message au créateur (optionnel)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {applying
                      ? "Envoi…"
                      : isAuthenticated
                        ? "Envoyer ma candidature"
                        : "Se connecter et postuler"}
                  </button>
                  <button
                    onClick={() => navigate("/tontines")}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {isCreator && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm">
                Vous &ecirc;tes le cr&eacute;ateur de cette tontine. Partagez ce
                lien pour inviter des participants.
                <div className="mt-2">
                  <a
                    href={`/tontines/${tontine.id}`}
                    className="inline-block px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    Gérer la tontine
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Code d&apos;invitation :{" "}
          <span className="font-mono font-semibold">{invitation.code}</span>
        </div>
      </div>
    </div>
  );
}
