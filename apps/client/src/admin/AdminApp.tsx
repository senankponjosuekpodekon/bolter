import React from "react";
import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { SystemConfigPage } from "./pages/SystemConfigPage";
import { TenantsPage } from "./pages/TenantsPage";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { adminTheme } from "./theme";
import { UserList, UserEdit, UserCreate } from "./resources/users";
import {
  PendingTransactionList,
  TransactionValidation,
  TransactionHistoryList,
  TransactionCreate,
} from "./resources/transactions";
import { KYCDocumentList, KYCDocumentReview } from "./resources/kycDocuments";
import { AccountList, AccountEdit } from "./resources/accounts";
import { AuditLogList } from "./resources/auditLogs";
import { LoanList, LoanShow } from "./resources/loans";
import AdminError from "./components/AdminError";

// AdminApp component that can be mounted at /admin route
export const AdminApp: React.FC = () => {
  return (
    <Admin
      catchAll={AdminError}
      dataProvider={dataProvider}
      authProvider={authProvider}
      title="Banking Admin"
      theme={adminTheme}
      basename="/admin"
    >
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        create={UserCreate}
      />
      <Resource name="accounts" list={AccountList} edit={AccountEdit} />
      <Resource
        name="transactions"
        options={{ label: "Transactions" }}
        list={TransactionHistoryList}
        create={TransactionCreate}
      />
      <Resource
        name="transactions/pending"
        options={{ label: "Pending Transactions" }}
        list={PendingTransactionList}
        edit={TransactionValidation}
      />
      <Resource
        name="kyc/documents/pending"
        options={{ label: "Pending KYC" }}
        list={KYCDocumentList}
        edit={KYCDocumentReview}
      />
      <Resource
        name="audit-logs"
        options={{ label: "Audit Trail" }}
        list={AuditLogList}
      />
      <Resource
        name="loans"
        options={{ label: "Loan Requests" }}
        list={LoanList}
        show={LoanShow}
      />
      <CustomRoutes>
        <Route path="/system-config" element={<SystemConfigPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
      </CustomRoutes>
    </Admin>
  );
};

export default AdminApp;
