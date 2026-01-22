import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation mobile"
    >
      <div
        className="w-80 max-w-full bg-white dark:bg-slate-900 h-full shadow-lg border-r border-gray-200 dark:border-slate-800"
        ref={ref}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Menu
          </h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
          >
            Accounts
          </Link>
          <Link
            to="/loans"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
          >
            Loans
          </Link>
          <Link
            to="/tontines"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
          >
            Tontines
          </Link>
          {user?.role === "ADMIN" && (
            <>
              <Link
                to="/admin/dashboard"
                onClick={onClose}
                className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/analytics"
                onClick={onClose}
                className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
              >
                Analytics
              </Link>
              <Link
                to="/admin/webhooks"
                onClick={onClose}
                className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
              >
                Webhooks
              </Link>
            </>
          )}
          {/* KYC moved into Profile page */}
          <Link
            to="/profile"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
          >
            Profile
          </Link>
        </nav>

        {/* Logout stays below the menus on mobile */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 mt-auto">
          <button
            onClick={() => {
              logout();
              navigate("/login");
              onClose();
            }}
            className="w-full text-left py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}
