import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import api from "../services/api";

export default function TwoFactorSettings() {
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  // Fetch user profile to check if 2FA is already enabled
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/auth/profile")).data,
  });

  // Fetch setup data only when user initiates setup
  const {
    data: setupData,
    isLoading: setupLoading,
    error: setupError,
  } = useQuery({
    queryKey: ["2fa-setup"],
    queryFn: async () => (await api.get("/auth/2fa/setup")).data,
    enabled: showSetup && !isEnabled,
    retry: 1,
  });

  useEffect(() => {
    if (userProfile?.two_factor_enabled === true) {
      setIsEnabled(true);
      setShowSetup(false);
    } else if (userProfile) {
      setIsEnabled(false);
    }
  }, [userProfile]);

  const enable2fa = useMutation({
    mutationFn: async () => {
      await api.post("/auth/2fa/enable", { token });
    },
    onSuccess: () => {
      setMessage("2FA activée !");
      setShowSetup(false);
      setIsEnabled(true);
      setToken("");
      // Refetch user profile to update 2FA status in store and UI
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { status?: number; headers?: Record<string, string> };
      };
      const status = error.response?.status;
      if (status === 429) {
        const retryAfter = error.response?.headers?.["retry-after"];
        setMessage(
          retryAfter
            ? `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`
            : "Trop de tentatives. Réessayez plus tard."
        );
      } else {
        setMessage("Erreur lors de l’activation 2FA");
      }
    },
  });

  const disable2fa = useMutation({
    mutationFn: async () => {
      await api.post("/auth/2fa/disable", { token });
    },
    onSuccess: () => {
      setMessage("2FA désactivée.");
      setToken("");
      setIsEnabled(false);
      // Refetch user profile to update 2FA status in store and UI
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { status?: number } };
      const status = error.response?.status;
      if (status === 429) {
        setMessage("Trop de tentatives. Réessayez plus tard.");
      } else {
        setMessage("Erreur lors de la désactivation 2FA");
      }
    },
  });

  const isTwoFactorEnabled = isEnabled;

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-indigo-800 dark:to-purple-900 rounded-lg md:rounded-2xl p-3 sm:p-6 md:p-8 shadow-lg md:shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl">
              {isEnabled ? (
                <ShieldCheck className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              ) : (
                <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white dark:text-gray-100">
                Authentification à deux facteurs
              </h1>
              <p className="text-blue-100 dark:text-indigo-200 mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:block">
                {isEnabled
                  ? "Protection active - Votre compte est sécurisé"
                  : "Renforcez la sécurité de votre compte"}
              </p>
            </div>
          </div>
          {isEnabled && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-400/30 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-green-100">
                2FA Activée
              </span>
            </div>
          )}
        </div>
      </div>

      {profileLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 dark:text-gray-300">Chargement...</p>
          </div>
        </div>
      )}

      {/* State 1: 2FA non activée */}
      {!showSetup && !isTwoFactorEnabled && (
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Configuration requise
              </h2>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              La double authentification n'est pas encore activée. Protégez
              votre compte en ajoutant une couche de sécurité supplémentaire.
            </p>
            <button
              type="button"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 group text-sm sm:text-base"
              onClick={() => setShowSetup(true)}
            >
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              Activer la 2FA
            </button>
          </div>
        </div>
      )}

      {/* State 2: Setup in progress, loading QR code */}
      {showSetup && setupLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">Chargement du QR code...</p>
        </div>
      )}

      {/* Setup Error */}
      {showSetup && setupError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700 mb-3">
            Erreur lors de la génération du QR code. Veuillez réessayer.
          </p>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowSetup(false)}
          >
            Retour
          </button>
        </div>
      )}

      {/* State 3: Configuration avec QR code */}
      {showSetup && setupData && !isEnabled && (
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Configurer l'authentificateur
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* QR Code Section */}
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                Scannez ce QR code avec votre application d'authentification
              </p>
              <div className="inline-block p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border-2 sm:border-4 border-gray-100 dark:border-slate-600">
                <img
                  src={setupData.qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 sm:w-64 sm:h-64"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-center">
                  Compatible avec Google Authenticator, Authy, Microsoft
                  Authenticator
                </span>
              </div>
            </div>

            {/* Secret manuel */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-slate-600">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                  Ou entrez ce code manuellement :
                </p>
              </div>
              <code className="block bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-mono break-all text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 select-all">
                {setupData.secret}
              </code>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

            {/* Form de vérification */}
            <form className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5 sm:gap-2">
                  <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center text-2xl sm:text-3xl tracking-[0.5em] font-bold text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all outline-none"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Entrez le code à 6 chiffres de votre application
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-1.5 sm:gap-2 group text-sm sm:text-base"
                  onClick={() => enable2fa.mutate()}
                  disabled={enable2fa.isPending || token.length !== 6}
                >
                  {enable2fa.isPending ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Vérification...</span>
                      <span className="sm:hidden">Vérif...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Activer la 2FA</span>
                      <span className="sm:hidden">Activer</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
                  onClick={() => {
                    setShowSetup(false);
                    setToken("");
                    setMessage("");
                  }}
                >
                  Annuler
                </button>
              </div>
              {message && (
                <div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 flex items-start gap-2 sm:gap-3 text-sm sm:text-base ${
                    message.includes("activée")
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {message.includes("activée") ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    {message}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* State 4: 2FA activée */}
      {!showSetup && isTwoFactorEnabled && (
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 sm:px-6 py-3 sm:py-4 border-b border-green-100 dark:border-green-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Protection active
                </h2>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  Votre compte est protégé par 2FA
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                <strong>Attention :</strong> Désactiver la 2FA réduira la
                sécurité de votre compte. Assurez-vous de vouloir continuer.
              </p>
            </div>

            <form className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5 sm:gap-2">
                  <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center text-2xl sm:text-3xl tracking-[0.5em] font-bold text-gray-900 dark:text-gray-100 focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/50 transition-all outline-none"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Entrez votre code 2FA pour désactiver la protection
                </p>
              </div>

              <button
                type="button"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 group"
                onClick={() => disable2fa.mutate()}
                disabled={disable2fa.isPending || token.length !== 6}
              >
                {disable2fa.isPending ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Vérification...</span>
                    <span className="sm:hidden">Vérif...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span>Désactiver la 2FA</span>
                  </>
                )}
              </button>

              {message && (
                <div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 flex items-start gap-2 sm:gap-3 text-sm sm:text-base ${
                    message.includes("désactivée")
                      ? "bg-orange-50 text-orange-800 border-orange-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium">
                    {message}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Section d'informations */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Pourquoi activer la 2FA ?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-slate-600">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 text-sm sm:text-base">
                  Protection renforcée
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Sécurité maximale contre les accès non autorisés
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-slate-600">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 text-sm sm:text-base">
                  Multi-applications
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Compatible avec Google, Authy, Microsoft Authenticator
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-slate-600">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 text-sm sm:text-base">
                  Requis pour admins
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Obligatoire pour les rôles admin et compliance
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-slate-600">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 text-sm sm:text-base">
                  À chaque connexion
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Code requis lors de votre authentification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
