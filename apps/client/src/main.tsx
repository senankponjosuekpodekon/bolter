/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-useless-escape, no-empty */
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./i18n";
import "./index.css";
import { NotificationsProvider } from "./lib/notifications";
import { ToastProvider } from "./components/ui/ToastProvider";
import { getApiErrorMessage } from "./lib/apiError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        type AxiosLike = { response?: { status?: number }; code?: string }
        const e = error as AxiosLike
        // Don't retry on 4xx or timeout — only on network/5xx
        if (e?.response?.status && e.response.status < 500) return false
        if (e?.code === 'ECONNABORTED') return false
        return failureCount < 2
      },
      staleTime: 30_000,
    },
    mutations: {
      onError: (error: unknown) => {
        const msg = getApiErrorMessage(error)
        if (msg.includes('timeout') || msg.includes('Network')) {
          // Use a custom event so ToastProvider (rendered later) can pick it up
          window.dispatchEvent(new CustomEvent('api:error', { detail: msg }))
        }
      },
    },
  },
});

// Development-only: instrument URL construction to help debug invalid base/host strings
// This logs the raw/base arguments passed to URL() when construction fails so we can
// identify the exact value that breaks `new URL(...)` in the simulator/dev.
if (import.meta.env.DEV) {
  try {
    const OriginalURL = URL;
    const URLWrapper: any = function (raw: string, base?: string) {
      try {
        return base === undefined
          ? new (OriginalURL as any)(raw)
          : new (OriginalURL as any)(raw, base);
      } catch (err) {
        // When URL parsing fails, try safe fallbacks so runtime code doesn't crash
        try {
          console.warn(
            "URL construction failed, attempting safe fallbacks — raw:",
            raw,
            "base:",
            base,
            "error:",
            err
          );

          // If base provided, try using it (or window origin) first
          if (base && typeof window !== "undefined" && window.location) {
            try {
              return new (OriginalURL as any)(
                raw,
                base || window.location.origin
              );
            } catch (err) {
              // ignore failures when attempting to add visualViewport listener
            }
          }

          // Heuristics for common malformed values like ':3000', 'host:3000' or '//host/path'
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
            } catch (e2) {
              // continue to final fallback
            }
          }

          // final fallback — return a safe URL object instead of throwing to avoid breaking event handlers
          const fallbackBase =
            (typeof window !== "undefined" &&
              window.location &&
              window.location.origin) ||
            "about:blank";
          console.warn(
            "URL wrapper: returning safe fallback URL for",
            raw,
            "base",
            base
          );
          return new (OriginalURL as any)(fallbackBase);
        } catch (e) {
          // If fallback attempts fail, rethrow the original error to avoid swallowing unknown states
          console.error("URL wrapper fallback failed unexpectedly", e);
          throw err;
        }
      }
    };

    // Preserve prototype and static members
    URLWrapper.prototype = OriginalURL.prototype;
    Object.getOwnPropertyNames(OriginalURL).forEach((k) => {
      try {
        URLWrapper[k] = (OriginalURL as any)[k];
      } catch (_e) {}
    });

    // apply the wrapper to the global window in dev only
    (window as any).URL = URLWrapper;
    console.info("DEV: URL constructor wrapped to capture invalid inputs");
  } catch (e) {
    // If something unexpectedly fails, don't block the app — log and continue
    console.warn("DEV: failed to instrument URL constructor", e);
  }

  // Additional dev-only global error hooks to capture uncaught exceptions/rejections
  try {
    window.addEventListener("error", (ev) => {
      console.error(
        "Global error captured (dev):",
        ev.error || ev.message,
        ev.filename,
        ev.lineno,
        ev.colno
      );
    });
    window.addEventListener("unhandledrejection", (ev) => {
      console.error("Unhandled rejection captured (dev):", ev.reason);
    });
  } catch {
    // no-op
  }
}

// --- Mobile viewport height helper --------------------------------------------------
// Mobile browsers include browser chrome / address bars which change available
// window.innerHeight. Using 100vh directly can lead to layouts that overflow or
// are too short when the browser UI shows/hides. We set a --vh CSS variable to the
// real inner height (1% unit) and update it on resize / visualViewport changes.
// Then use `height: calc(var(--vh) * 100)` where needed instead of 100vh.
try {
  const setVh = () => {
    if (typeof window === "undefined" || !document.documentElement) return;
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVh();
  // Update on window resize and visualViewport resize (some browsers expose visualViewport height)
  window.addEventListener("resize", setVh);
  if ((window as any).visualViewport) {
    try {
      (window as any).visualViewport.addEventListener("resize", setVh);
    } catch (err) {
      // no-op
    }
  }
} catch {
  // no-op — this helper is best-effort
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
