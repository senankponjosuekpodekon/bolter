import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router-dom";
import { useEnabledWidgets } from "../../hooks/useEnabledWidgets";

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const ref = useRef<HTMLDivElement | null>(null);
  const enabledWidgets = useEnabledWidgets();

  useEffect(() => {
    if (!open) return;

    const drawer = ref.current;
    if (!drawer) return;

    const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
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
          {enabledWidgets.dashboard && (
            <Link
              to="/dashboard"
              onClick={onClose}
              className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
            >
              Dashboard
            </Link>
          )}
          {enabledWidgets.accounts && (
            <Link
              to="/accounts"
              onClick={onClose}
              className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
            >
              Accounts
            </Link>
          )}
          {enabledWidgets.loans && (
            <Link
              to="/loans"
              onClick={onClose}
              className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
            >
              Loans
            </Link>
          )}
          {enabledWidgets.tontines && (
            <Link
              to="/tontines"
              onClick={onClose}
              className="block py-3 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
            >
              Tontines
            </Link>
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
