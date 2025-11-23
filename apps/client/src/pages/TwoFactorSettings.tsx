import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../services/api";

export default function TwoFactorSettings() {
  const { data: setupData } = useQuery({
    queryKey: ["2fa-setup"],
    queryFn: async () => (await api.get("/auth/2fa/setup")).data,
  });
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"enabled" | "disabled" | "pending">(
    "pending"
  );
  const [message, setMessage] = useState("");

  const enable2fa = useMutation({
    mutationFn: async () => {
      await api.post("/auth/2fa/enable", { token });
    },
    onSuccess: () => {
      setStatus("enabled");
      setMessage("2FA activée !");
    },
    onError: () => {
      setMessage("Erreur lors de l’activation 2FA");
    },
  });

  const disable2fa = useMutation({
    mutationFn: async () => {
      await api.post("/auth/2fa/disable", { token });
    },
    onSuccess: () => {
      setStatus("disabled");
      setMessage("2FA désactivée.");
    },
    onError: () => {
      setMessage("Erreur lors de la désactivation 2FA");
    },
  });

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">
        Sécurité : Authentification à deux facteurs (2FA)
      </h1>
      {setupData && (
        <div className="mb-4">
          <p>Scannez ce QR code avec Google Authenticator ou équivalent :</p>
          <img src={setupData.qrCodeUrl} alt="QR Code 2FA" className="my-4" />
          <p>
            Ou entrez ce secret :{" "}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {setupData.secret}
            </span>
          </p>
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Code 2FA</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            placeholder="123456"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => enable2fa.mutate()}
            disabled={status === "enabled"}
          >
            Activer 2FA
          </button>
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => disable2fa.mutate()}
            disabled={status === "disabled"}
          >
            Désactiver 2FA
          </button>
        </div>
        {message && <div className="text-blue-700 text-sm mt-2">{message}</div>}
      </form>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Pourquoi activer 2FA ?</h2>
        <ul className="list-disc pl-6 text-sm text-gray-700">
          <li>Protection renforcée contre le vol de compte.</li>
          <li>Obligatoire pour les rôles admin/compliance.</li>
          <li>Compatible Google Authenticator, Authy, etc.</li>
        </ul>
      </div>
    </div>
  );
}
