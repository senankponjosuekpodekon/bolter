import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import api from "../services/api";
import Verify2FAModal from "../components/auth/Verify2FAModal";

interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requires2FA?: boolean;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [tempRefreshToken, setTempRefreshToken] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // ensure appropriate locale bundle is loaded (use stored user locale when available)
    const defaultLocale =
      typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US";
    loadLocale(defaultLocale);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      const { accessToken, user, refreshToken, requires2FA } = response.data;

      if (requires2FA) {
        // Store temporary credentials for 2FA verification
        setTempToken(accessToken);
        setTempUser(user);
        setTempRefreshToken(refreshToken);
        setShow2FAModal(true);
      } else {
        // No 2FA needed, login directly
        setAuth(user, accessToken);
        navigate("/dashboard");
      }
    } catch (err) {
      let message = "Login failed";
      if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error: err type from axios may have response property
        message = err.response?.data?.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose2FAModal = () => {
    setShow2FAModal(false);
    setTempToken(null);
    setTempUser(null);
    setTempRefreshToken(null);
  };

  const handleVerify2FA = () => {
    // Modal verified successfully, complete login
    if (tempToken && tempUser && tempRefreshToken) {
      setAuth(tempUser, tempToken);
      handleClose2FAModal();
      navigate("/dashboard");
    }
  };

  return (
    <div
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
      className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("login.title")}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("login.email_placeholder")}
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("login.password_placeholder")}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? t("login.signing_in") : t("login.sign_in")}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              {t("login.no_account")}
            </Link>
          </div>
        </form>
      </div>

      <Verify2FAModal
        isOpen={show2FAModal}
        onClose={handleClose2FAModal}
        tempToken={tempToken}
        onVerifySuccess={handleVerify2FA}
      />
    </div>
  );
}
