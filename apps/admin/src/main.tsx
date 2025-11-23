import React from "react";
import ReactDOM from "react-dom/client";
import { Admin, Resource } from "react-admin";
import AdminError from "./components/AdminError";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { UserList, UserEdit, UserCreate } from "./resources/users";
import {
  PendingTransactionList,
  TransactionValidation,
  TransactionHistoryList,
  TransactionCreate,
} from "./resources/transactions";
import { KYCDocumentList, KYCDocumentReview } from "./resources/kycDocuments";
import { AdminLayout } from "./layout/AdminLayout";
import { adminTheme } from "./theme";
import { AccountList, AccountEdit } from "./resources/accounts";
import { AuditLogList } from "./resources/auditLogs";
import { LoanList, LoanShow } from "./resources/loans";
// Notifications are rendered inside AdminLayout (NotificationsProvider) now

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Admin
      catchAll={AdminError}
      dataProvider={dataProvider}
      authProvider={authProvider}
      title="Banking Admin"
      layout={AdminLayout}
      theme={adminTheme}
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
    </Admin>
  </React.StrictMode>
);
