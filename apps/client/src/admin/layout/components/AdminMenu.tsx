import { Menu, usePermissions } from "react-admin";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HistoryIcon from "@mui/icons-material/History";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import TuneIcon from "@mui/icons-material/Tune";
import ApartmentIcon from "@mui/icons-material/Apartment";
import Divider from "@mui/material/Divider";

export const AdminMenu = () => {
  const { permissions } = usePermissions();
  const isSuperAdmin = permissions === "SUPER_ADMIN";

  return (
    <Menu
      sx={{
        "& .RaMenuItemLink-root": {
          borderRadius: 2,
          marginInline: 1,
          marginBlock: 0.25,
        },
      }}
    >
      <Menu.Item to="/" primaryText="Dashboard" leftIcon={<DashboardIcon />} />
      <Menu.Item to="/users" primaryText="Users" leftIcon={<PeopleIcon />} />
      <Menu.Item
        to="/accounts"
        primaryText="Accounts"
        leftIcon={<AccountBalanceIcon />}
      />
      <Menu.Item
        to="/transactions/pending"
        primaryText="Pending Transactions"
        leftIcon={<AssignmentTurnedInIcon />}
      />
      <Menu.Item
        to="/kyc/documents/pending"
        primaryText="Pending KYC"
        leftIcon={<FactCheckIcon />}
      />
      <Menu.Item
        to="/audit-logs"
        primaryText="Audit Trail"
        leftIcon={<HistoryIcon />}
      />
      <Menu.Item
        to="/loans"
        primaryText="Loan Requests"
        leftIcon={<RequestQuoteIcon />}
      />
      {isSuperAdmin && (
        <>
          <Divider sx={{ my: 1, mx: 2 }} />
          <Menu.Item
            to="/tenants"
            primaryText="Tenants"
            leftIcon={<ApartmentIcon />}
            sx={{ color: "warning.main" }}
          />
          <Menu.Item
            to="/system-config"
            primaryText="System Config"
            leftIcon={<TuneIcon />}
            sx={{ color: "warning.main" }}
          />
        </>
      )}
    </Menu>
  );
};
