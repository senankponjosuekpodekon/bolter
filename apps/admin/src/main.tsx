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
import { AnalyticsList } from "./resources/analytics";
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
      <Resource
        name="analytics"
        options={{ label: "Analytics" }}
        list={AnalyticsList}
      />
    </Admin>
  </React.StrictMode>
);

// Development-only: instrument URL construction in admin entry as well
if (import.meta.env.DEV) {
  try {
    const OriginalURL = URL;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const URLWrapper: any = function (this: any, raw: string, base?: string) {
      try {
        return base === undefined
          ? new (OriginalURL as { new (raw: string): URL })(raw)
          : new (OriginalURL as { new (raw: string, base: string): URL })(
              raw,
              base
            );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        try {
          console.warn(
            "Admin URL construction failed, attempting fallbacks — raw:",
            raw,
            "base:",
            base,
            "error:",
            _err
          );

          if (base && typeof window !== "undefined" && window.location) {
            try {
              return new (OriginalURL as {
                new (raw: string, base: string): URL;
              })(raw, base || window.location.origin);
            } catch {
              // Fallback failed, continue to next attempt
            }
          }

          let candidate = String(raw ?? "");
          if (
            candidate.startsWith(":") &&
            typeof window !== "undefined" &&
            window.location
          ) {
            candidate = `${window.location.protocol}//${window.location.hostname}${candidate}`;
          } else if (
            /^[^/]+:\d+$/.test(candidate) &&
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
              return new (OriginalURL as {
                new (raw: string, base: string): URL;
              })(candidate, window.location.origin);
            } catch {
              // Fallback failed, continue to final fallback
            }
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
          return new (OriginalURL as { new (raw: string): URL })(fallbackBase);
        } catch (e) {
          console.error("Admin URL wrapper fallback failed unexpectedly", e);
          throw _err;
        }
      }
    };

    URLWrapper.prototype = OriginalURL.prototype;
    Object.getOwnPropertyNames(OriginalURL).forEach((k) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (URLWrapper as any)[k] = (OriginalURL as any)[k];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
      } catch (_e) {}
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } catch {
    // Event listener registration failed, continue anyway
  }
}
