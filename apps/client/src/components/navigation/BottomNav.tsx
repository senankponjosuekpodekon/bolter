// No default React import needed with the new JSX runtime
import { NavLink } from "react-router-dom";

const Item = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex-1 text-center py-2 px-1 ${isActive ? "text-primary" : "text-gray-500"}`
    }
  >
    <div className="text-sm font-medium">{label}</div>
  </NavLink>
);

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden shadow-lg z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-14">
        <Item to="/dashboard" label="Accueil" />
        {/* Transactions is intentionally mobile-only in the bottom nav — dashboard contains a transactions card */}
        <Item to="/transactions" label="Transactions" />
        <Item to="/loans" label="Prêts" />
        <Item to="/profile" label="Profil" />
      </div>
    </div>
  </nav>
);

export default BottomNav;
