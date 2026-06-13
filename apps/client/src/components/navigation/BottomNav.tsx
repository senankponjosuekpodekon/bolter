// No default React import needed with the new JSX runtime
import { NavLink } from "react-router-dom";
import {
  Home,
  CreditCard,
  DollarSign,
  User,
  LucideIcon,
  Group,
} from "lucide-react";
import { useEnabledWidgets } from "../../hooks/useEnabledWidgets";

const Item = ({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex-1 flex flex-col items-center justify-center py-3 px-2 gap-1 transition-colors ${
        isActive
          ? "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-slate-800"
          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      }`
    }
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

export const BottomNav = () => {
  const enabledWidgets = useEnabledWidgets();

  // Count visible items to adjust grid columns
  const items = [
    enabledWidgets.dashboard && { to: "/dashboard", label: "Accueil", icon: Home },
    enabledWidgets.accounts && { to: "/accounts", label: "Comptes", icon: CreditCard },
    enabledWidgets.loans && { to: "/loans", label: "Prêts", icon: DollarSign },
    enabledWidgets.tontines && { to: "/tontines", label: "Tontines", icon: Group },
    { to: "/profile", label: "Profil", icon: User }, // Profile always visible
  ].filter(Boolean) as { to: string; label: string; icon: LucideIcon }[];

  const gridCols = items.length === 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : items.length === 3 ? "grid-cols-3" : items.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 md:hidden shadow-2xl z-40 safe-area-inset-bottom">
      <div className={`grid ${gridCols} divide-x divide-gray-200 dark:divide-slate-800`}>
        {items.map((item) => (
          <Item key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
