import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../services/api";

export default function TwoFactorSettings() {
  const [showSetup, setShowSetup] = useState(true);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  // Fetch user profile to check if 2FA is already enabled
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/auth/profile")).data,
  });

  // Fetch setup data only when user initiates setup
  const { data: setupData, isLoading: setupLoading } = useQuery({
    queryKey: ["2fa-setup"],
    queryFn: async () => (await api.get("/auth/2fa/setup")).data,
    enabled: showSetup,
  });

  useEffect(() => {
    if (userProfile?.two_factor_enabled === true) {
      setIsEnabled(true);
      setShowSetup(false);
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
      // Refetch user profile to update 2FA status
      setTimeout(() => window.location.reload(), 1500);
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
      // Refetch user profile to update 2FA status
      setTimeout(() => window.location.reload(), 1500);
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
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">
        Sécurité : Authentification à deux facteurs (2FA)
      </h1>

      {profileLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">Chargement...</p>
        </div>
      )}

      {/* State 1: 2FA not enabled, no setup in progress */}
      {!showSetup && !isTwoFactorEnabled && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-gray-700 mb-3">
            2FA n&apos;est pas encore configuré. Cliquez ci-dessous pour
            commencer la configuration.
          </p>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowSetup(true)}
          >
            Setup 2FA
          </button>
        </div>
      )}

      {/* State 2: Setup in progress, loading QR code */}
      {showSetup && setupLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">Chargement du QR code...</p>
        </div>
      )}

      {/* State 3: Setup in progress, QR code ready */}
      {showSetup && setupData && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium mb-3">
              Scannez ce QR code avec Google Authenticator, Authy ou un autre
              authenticateur :
            </p>
            <img
              src={setupData.qrCodeUrl}
              alt="QR Code 2FA"
              className="my-4 border rounded"
              loading="lazy"
            />
            <p className="text-sm text-gray-600 mb-2">
              Ou entrez ce secret manuellement :
            </p>
            <code className="block bg-gray-100 p-3 rounded text-sm font-mono break-all">
              {setupData.secret}
            </code>
          </div>

          <form className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Entrez les 6 chiffres de votre authenticateur :
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={token}
                onChange={(e) =>
                  setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="mt-1 block w-full border rounded p-2 text-center text-2xl tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                onClick={() => enable2fa.mutate()}
                disabled={enable2fa.isPending || token.length !== 6}
              >
                {enable2fa.isPending ? "Vérification..." : "Activer 2FA"}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
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
                className={`text-sm p-3 rounded ${
                  message.includes("activée")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </>
      )}

      {/* State 4: 2FA already enabled */}
      {!showSetup && isTwoFactorEnabled && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-gray-700 mb-4">
            ✓ 2FA est activé pour votre compte
          </p>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Entrez votre code 2FA pour désactiver :
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={token}
                onChange={(e) =>
                  setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="mt-1 block w-full border rounded p-2 text-center text-2xl tracking-widest"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <button
              type="button"
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              onClick={() => disable2fa.mutate()}
              disabled={disable2fa.isPending || token.length !== 6}
            >
              {disable2fa.isPending ? "Vérification..." : "Désactiver 2FA"}
            </button>
            {message && (
              <div
                className={`text-sm p-3 rounded ${
                  message.includes("désactivée")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Information section */}
      <div className="mt-8 pt-4 border-t">
        <h2 className="text-lg font-semibold mb-3">Pourquoi activer 2FA ?</h2>
        <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
          <li>Protection renforcée contre le vol de compte</li>
          <li>Obligatoire pour les rôles admin et compliance</li>
          <li>
            Compatible avec Google Authenticator, Authy, Microsoft
            Authenticator, etc.
          </li>
          <li>Vous serez invité à entrer le code lors de votre connexion</li>
        </ul>
      </div>
    </div>
  );
}
