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

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 md:hidden shadow-2xl z-40 safe-area-inset-bottom">
    <div className="grid grid-cols-5 divide-x divide-gray-200 dark:divide-slate-800">
      <Item to="/dashboard" label="Accueil" icon={Home} />
      <Item to="/accounts" label="Comptes" icon={CreditCard} />
      <Item to="/loans" label="Prêts" icon={DollarSign} />
      <Item to="/tontines" label="Tontines" icon={Group as any} />
      <Item to="/profile" label="Profil" icon={User} />
    </div>
  </nav>
);

export default BottomNav;
