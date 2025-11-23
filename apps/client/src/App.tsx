import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import KYC from "./pages/KYC";
import Profile from "./pages/Profile";
import Loans from "./pages/Loans";
import { LoanSimulator } from "./pages/LoanSimulator";
import ScheduledTransfers from "./pages/ScheduledTransfers";
import AlertsSettings from "./pages/AlertsSettings";
import TwoFactorSettings from "./pages/TwoFactorSettings";
import ActivityHistory from "./pages/ActivityHistory";
import { Notifications } from "./components/Notifications";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Routes>
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

        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="loans" element={<Loans />} />
          <Route path="kyc" element={<KYC />} />
          <Route path="profile" element={<Profile />} />
          <Route path="loan-simulator" element={<LoanSimulator />} />
          <Route path="scheduled-transfers" element={<ScheduledTransfers />} />
          <Route path="alerts-settings" element={<AlertsSettings />} />
          <Route path="/securite/2fa" element={<TwoFactorSettings />} />
          <Route path="/securite/historique" element={<ActivityHistory />} />
        </Route>
      </Routes>
      <Notifications />
    </>
  );
}

export default App;
