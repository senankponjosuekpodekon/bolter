import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = {
  id?: string;
  title?: string;
  message?: string;
  type?: "success" | "error" | "info";
};

const ToastContext = createContext<{ push: (t: Toast) => void } | undefined>(
  undefined
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provide a noop fallback in environments (like unit tests) where the provider isn't mounted
    return { push: () => {} };
  }
  return ctx;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Toast) => {
    const id = t.id || crypto.randomUUID();
    setToasts((prev) => [{ ...t, id }, ...prev].slice(0, 5));
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      4000
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      push({ type: "error", title: "Connection error", message: msg });
    };
    window.addEventListener("api:error", handler);
    return () => window.removeEventListener("api:error", handler);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-md shadow-md border ${t.type === "success" ? "bg-green-50 border-green-200 text-green-800" : t.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-white border-gray-200"}`}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.message && <div className="text-sm">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
