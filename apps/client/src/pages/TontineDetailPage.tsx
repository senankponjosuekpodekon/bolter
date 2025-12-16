import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tontinesService } from "../services/tontines.service";
import { useAuthStore } from "../stores/authStore";

const badgeTone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  COMPLETED: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

export default function TontineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tontine, setTontine] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startState, setStartState] = useState<{
    loading: boolean;
    error?: string | null;
    success?: string | null;
  }>({ loading: false });
  const [shareState, setShareState] = useState<{
    copied: boolean;
    loading?: boolean;
    error?: string | null;
  }>({ copied: false, loading: false });

  const fetchData = async (withSpinner = true) => {
    if (!id) return;
    if (withSpinner) setLoading(true);
    setError(null);
    try {
      const [t, m] = await Promise.all([
        tontinesService.get(id),
        tontinesService.members(id),
      ]);
      setTontine(t);
      setMembers(m || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      if (withSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const memberCount = members.length;
  const isCreator = useMemo(
    () => tontine?.creator_id === user?.id,
    [tontine, user]
  );
  const canStart = useMemo(() => {
    if (!tontine) return false;
    if (tontine.status === "ACTIVE" || tontine.status === "COMPLETED")
      return false;
    return memberCount >= 2;
  }, [tontine, memberCount]);

  const startHint = useMemo(() => {
    if (!tontine) return "";
    if (tontine.status === "ACTIVE") return "Tontine déjà démarrée";
    if (tontine.status === "COMPLETED") return "Tontine terminée";
    if (memberCount < 2) return "Ajoutez au moins deux membres pour démarrer";
    return "Démarrer le premier cycle et générer les contributions";
  }, [tontine, memberCount]);

  const handleStart = async () => {
    if (!id || !tontine) return;
    if (!confirm("Êtes-vous sûr de vouloir démarrer cette tontine ?")) return;
    setStartState({ loading: true, error: null, success: null });
    try {
      await tontinesService.start(id);
      setStartState({
        loading: false,
        success: "Tontine démarrée avec succès",
      });
      await fetchData(false);
    } catch (e: any) {
      const message = e?.response?.data?.message || e.message;
      setStartState({ loading: false, error: message });
    }
  };

  const handleShare = async () => {
    if (!id || !tontine) return;
    setShareState({ copied: false, loading: true, error: null });
    try {
      // Generate invitation code via API
      const res = await tontinesService.createInvitation(id, {});
      if (!res || !res.code) {
        throw new Error("Pas de code d'invitation généré");
      }
      const inviteLink = `${window.location.origin}/invite/${res.code}`;
      await navigator.clipboard.writeText(inviteLink);
      setShareState({ copied: true, loading: false });
      setTimeout(() => setShareState({ copied: false }), 3000);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Échec de la génération du lien d'invitation";
      console.error("[Share Error]", errorMsg, e);
      setShareState({ copied: false, loading: false, error: errorMsg });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-700">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span>Chargement de la tontine…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-xl p-4">
          <p className="font-semibold">Impossible de charger la tontine</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2">
            Vérifiez vos droits d'accès, l'application des migrations
            (0009/0010/0011) et réessayez.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => fetchData(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate("/tontines")}
            className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Tontine introuvable
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Cette tontine n'existe pas dans la base de données.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/tontines")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Tontine
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {tontine.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeTone[tontine.status] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}
              >
                {tontine.status || "INCONNU"}
              </span>
            </div>
            <p className="text-slate-600 max-w-3xl">
              {tontine.description || "Aucune description fournie."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-slate-500">
            <span className="text-xs">ID {tontine.id}</span>
            <span>
              Créée le {new Date(tontine.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Contribution</p>
            <p className="text-xl font-semibold text-slate-900">
              {tontine.contribution_amount} {tontine.currency}
            </p>
            <p className="text-xs text-slate-500">{tontine.frequency}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Cycles</p>
            <p className="text-xl font-semibold text-slate-900">
              {tontine.current_cycle || 0} / {tontine.total_cycles}
            </p>
            <p className="text-xs text-slate-500">
              Durée {tontine.cycle_duration_days} j
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Membres</p>
            <p className="text-xl font-semibold text-slate-900">
              {memberCount}
            </p>
            <p className="text-xs text-slate-500">Accès créateur + membres</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Distribution</p>
            <p className="text-xl font-semibold text-slate-900">
              {tontine.distribution_method}
            </p>
            <p className="text-xs text-slate-500">
              Ordre/lotterie selon config
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
            <div>
              <p className="text-sm text-slate-500">Gestion</p>
              <h3 className="text-lg font-semibold text-slate-900">
                Démarrer et suivre le cycle
              </h3>
              <p className="text-sm text-slate-600">{startHint}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <a
                href={`/tontines/${id}/members`}
                className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 text-center text-base sm:text-sm"
              >
                Gérer les membres
              </a>
              {isCreator && tontine.status === "PENDING" && (
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base sm:text-sm"
                  title="Copier le lien d'invitation"
                  disabled={shareState.loading}
                >
                  {shareState.loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span>Copie en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      <span>{shareState.copied ? "Copié !" : "Partager"}</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleStart}
                disabled={!canStart || startState.loading}
                className="px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-base sm:text-sm"
              >
                {startState.loading ? "Démarrage…" : "Démarrer la tontine"}
              </button>
            </div>
          </div>

          {(startState.error || startState.success) && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${startState.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            >
              {startState.error || startState.success}
            </div>
          )}

          {shareState.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
              ⚠️ Erreur partage: {shareState.error}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Membres</p>
              <h3 className="text-lg font-semibold text-slate-900">
                Participants ({memberCount})
              </h3>
            </div>
            <a
              href={`/tontines/${id}/members`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Voir / ajouter
            </a>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {m.user_id}
                </p>
                <p className="text-xs text-slate-600">
                  Statut: {m.status || "MEMBER"} • Ordre:{" "}
                  {m.distribution_order || "—"}
                </p>
              </div>
            ))}
            {memberCount === 0 && (
              <p className="text-sm text-slate-600">
                Aucun membre pour l'instant.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
