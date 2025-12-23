import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import api from "../../services/api";

interface Verify2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempToken: string | null;
  onVerifySuccess: () => void;
}

export default function Verify2FAModal({
  isOpen,
  onClose,
  tempToken,
  onVerifySuccess,
}: Verify2FAModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (code.length !== 6) {
        setError("Code must be 6 digits");
        setLoading(false);
        return;
      }

      if (!tempToken) {
        setError("Invalid session. Please login again.");
        setLoading(false);
        return;
      }

      // Call 2FA verify endpoint with the temporary token
      await api.post(
        "/auth/2fa/verify",
        { token: code },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      // Verification successful
      toast.success("2FA verified successfully");
      onVerifySuccess();
    } catch (err) {
      let message = "Verification failed";
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosError.response?.status;
        if (status === 429) {
          message =
            axiosError.response?.data?.message ||
            "Too many attempts. Please try again later.";
        } else {
          message = axiosError.response?.data?.message || message;
        }
      }
      setError(message);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify 2FA</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-3xl tracking-widest font-mono"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || !tempToken}
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none transition"
          >
            Cancel
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            This helps keep your account secure
          </p>
        </div>
      </div>
    </div>
  );
}
