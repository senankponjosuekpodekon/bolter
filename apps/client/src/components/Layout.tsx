import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { NotificationBell } from "./NotificationBell";
import MobileDrawer from "./navigation/MobileDrawer";
import BottomNav from "./navigation/BottomNav";
import { useState, useEffect } from "react";
import { websocketService } from "../services/websocketService";
import { useNotificationListener } from "../hooks/useNotificationListener";

export default function Layout() {
  const { user, logout, accessToken } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Initialize WebSocket connection
  useEffect(() => {
    if (accessToken) {
      websocketService.connect(accessToken);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [accessToken]);

  // Listen to notifications
  useNotificationListener();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // Use the CSS viewport helper: --vh is a JS-calculated 1% of the viewport height.
    // This avoids issues with mobile browser chrome (address bars) where 100vh is unstable.
    <div
      className="bg-gray-50 dark:bg-slate-950"
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
    >
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-800 z-50 md:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Hamburger button - visible on smallest screens */}
              <button
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 mr-2"
                aria-label="Ouvrir le menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  Banking
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  onMouseEnter={() => import("../pages/Dashboard")}
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/accounts"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Accounts
                </Link>
                <Link
                  to="/loans"
                  onMouseEnter={() => import("../pages/Loans")}
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Loans
                </Link>
                <Link
                  to="/profile"
                  onMouseEnter={() => import("../pages/Profile")}
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Profile
                </Link>
                {/* KYC and 2FA moved into Profile page — keep Profile link only */}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span
                className="hidden sm:inline-flex text-sm text-gray-700 dark:text-gray-200 mr-4"
                aria-hidden="false"
              >
                {user?.firstName} {user?.lastName}
                {user?.role && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.role === "ADMIN"
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        : user.role === "COMPLIANCE"
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {user.role}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                aria-hidden="false"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Bottom navigation for mobile */}
      <BottomNav />

      {/* Add padding for fixed header and bottom nav on mobile */}
      <main
        className="max-w-7xl mx-auto pt-20 md:pt-0 py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-0"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
