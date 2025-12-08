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

// Development-only: instrument URL construction in admin entry as well
if (import.meta.env.DEV) {
  try {
    const OriginalURL = URL;
    const URLWrapper: any = function (raw: string, base?: string) {
      try {
        return base === undefined
          ? new (OriginalURL as any)(raw)
          : new (OriginalURL as any)(raw, base);
      } catch (err) {
        try {
          console.warn(
            "Admin URL construction failed, attempting fallbacks — raw:",
            raw,
            "base:",
            base,
            "error:",
            err
          );

          if (base && typeof window !== "undefined" && window.location) {
            try {
              return new (OriginalURL as any)(
                raw,
                base || window.location.origin
              );
            } catch {}
          }

          let candidate = String(raw ?? "");
          if (
            candidate.startsWith(":") &&
            typeof window !== "undefined" &&
            window.location
          ) {
            candidate = `${window.location.protocol}//${window.location.hostname}${candidate}`;
          } else if (
            /^[^\/]+:\d+$/.test(candidate) &&
            typeof window !== "undefined" &&
            window.location
          ) {
            candidate = `${window.location.protocol}//${candidate}`;
          } else if (
            candidate.startsWith("//") &&
            typeof window !== "undefined"
          ) {
            candidate = `${window.location.protocol}${candidate}`;
          }

          if (typeof window !== "undefined" && window.location) {
            try {
              return new (OriginalURL as any)(
                candidate,
                window.location.origin
              );
            } catch {}
          }

          const fallbackBase =
            (typeof window !== "undefined" &&
              window.location &&
              window.location.origin) ||
            "about:blank";
          console.warn(
            "Admin URL wrapper: returning safe fallback URL for",
            raw,
            "base",
            base
          );
          return new (OriginalURL as any)(fallbackBase);
        } catch (e) {
          console.error("Admin URL wrapper fallback failed unexpectedly", e);
          throw err;
        }
      }
    };

    URLWrapper.prototype = OriginalURL.prototype;
    Object.getOwnPropertyNames(OriginalURL).forEach((k) => {
      try {
        // @ts-ignore assign static props
        URLWrapper[k] = (OriginalURL as any)[k];
      } catch (_e) {}
    });
    (window as any).URL = URLWrapper;
    // eslint-disable-next-line no-console
    console.info(
      "DEV: Admin URL constructor wrapped to capture invalid inputs"
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("DEV: failed to instrument admin URL constructor", e);
  }
  try {
    window.addEventListener("error", (ev) => {
      // eslint-disable-next-line no-console
      console.error(
        "Admin global error captured (dev):",
        ev.error || ev.message,
        ev.filename,
        ev.lineno,
        ev.colno
      );
    });
    window.addEventListener("unhandledrejection", (ev) => {
      // eslint-disable-next-line no-console
      console.error("Admin unhandled rejection captured (dev):", ev.reason);
    });
  } catch {}
}
