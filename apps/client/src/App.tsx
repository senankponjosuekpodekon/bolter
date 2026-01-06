import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import SkeletonPage from "./components/skeleton/SkeletonPage";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ToastContainer } from "./components/ui/ToastContainer";
import { I18nDebugPanel } from "./components/I18nDebugPanel";
import { useTheme } from "./hooks/useTheme";
const Dashboard = lazy(() => import("./pages/Dashboard"));
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
const Profile = lazy(() => import("./pages/Profile"));
const Loans = lazy(() => import("./pages/Loans"));
const LoanSimulator = lazy(() =>
  import("./pages/LoanSimulator").then((m) => ({ default: m.LoanSimulator }))
);
import ScheduledTransfers from "./pages/ScheduledTransfers";
import RouteLocaleLoader from "./components/i18n/RouteLocaleLoader";
import AlertsSettings from "./pages/AlertsSettings";
import ActivityHistory from "./pages/ActivityHistory";
import { Notifications } from "./components/Notifications";
import TontinesListPage from "./pages/TontinesListPage";
import TontineCreatePage from "./pages/TontineCreatePage";
import TontineDetailPage from "./pages/TontineDetailPage";
import TontineMembersPage from "./pages/TontineMembersPage";
import TontineInvitePage from "./pages/TontineInvitePage";
import Landing from "./pages/Landing";

function App() {
  const { isAuthenticated } = useAuthStore();

  // Apply theme based on user preferences
  useTheme();

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
          }
        />

        {/* Public invitation route */}
        <Route path="/invite/:code" element={<TontineInvitePage />} />

        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<SkeletonPage title="Dashboard" />}>
                <RouteLocaleLoader>
                  <Dashboard />
                </RouteLocaleLoader>
              </Suspense>
            }
          />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route
            path="loans"
            element={
              <Suspense fallback={<SkeletonPage title="Loans" />}>
                <RouteLocaleLoader>
                  <Loans />
                </RouteLocaleLoader>
              </Suspense>
            }
          />
          <Route
            path="kyc"
            element={<Navigate to="/profile#profile-kyc" replace />}
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<SkeletonPage title="Profile" />}>
                <RouteLocaleLoader>
                  <Profile />
                </RouteLocaleLoader>
              </Suspense>
            }
          />
          <Route
            path="loan-simulator"
            element={
              <Suspense fallback={<SkeletonPage title="Simulator" />}>
                <RouteLocaleLoader>
                  <LoanSimulator />
                </RouteLocaleLoader>
              </Suspense>
            }
          />
          <Route path="scheduled-transfers" element={<ScheduledTransfers />} />
          <Route path="alerts-settings" element={<AlertsSettings />} />
          <Route path="tontines" element={<TontinesListPage />} />
          <Route path="tontines/new" element={<TontineCreatePage />} />
          <Route path="tontines/:id" element={<TontineDetailPage />} />
          <Route path="tontines/:id/members" element={<TontineMembersPage />} />
          <Route
            path="/securite/2fa"
            element={<Navigate to="/profile#profile-2fa" replace />}
          />
          <Route path="/securite/historique" element={<ActivityHistory />} />
        </Route>
      </Routes>
      <ToastContainer />
      <Notifications />
      <I18nDebugPanel />
    </>
  );
}

export default App;
