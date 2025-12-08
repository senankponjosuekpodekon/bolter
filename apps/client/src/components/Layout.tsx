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
      className="bg-gray-50"
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
    >
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Hamburger button - visible on smallest screens */}
              <button
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-2"
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
                <h1 className="text-xl font-bold text-blue-600">Banking</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  onMouseEnter={() => import("../pages/Dashboard")}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/accounts"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Accounts
                </Link>
                <Link
                  to="/loans"
                  onMouseEnter={() => import("../pages/Loans")}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Loans
                </Link>
                <Link
                  to="/profile"
                  onMouseEnter={() => import("../pages/Profile")}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Profile
                </Link>
                {/* KYC and 2FA moved into Profile page — keep Profile link only */}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span
                className="hidden sm:inline-flex text-sm text-gray-700 mr-4 "
                aria-hidden="false"
              >
                {user?.firstName} {user?.lastName}
                {user?.role && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.role === "ADMIN"
                        ? "bg-red-100 text-red-800"
                        : user.role === "COMPLIANCE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
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

      {/* Add bottom padding on small screens so the fixed bottom nav doesn't overlap page content */}
      <main
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-0"
        style={{
          paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
