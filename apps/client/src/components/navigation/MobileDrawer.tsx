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
      <div className="w-80 max-w-full bg-white h-full shadow-lg" ref={ref}>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100"
          >
            Accounts
          </Link>
          <Link
            to="/loans"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100"
          >
            Loans
          </Link>
          {/* KYC moved into Profile page */}
          <Link
            to="/profile"
            onClick={onClose}
            className="block py-3 px-2 rounded hover:bg-gray-100"
          >
            Profile
          </Link>
        </nav>

        {/* Logout stays below the menus on mobile */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={() => {
              logout();
              navigate("/login");
              onClose();
            }}
            className="w-full text-left py-3 px-2 rounded hover:bg-gray-100 text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}
