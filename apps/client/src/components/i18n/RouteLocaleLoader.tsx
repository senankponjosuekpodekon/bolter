import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { loadLocale } from "../../i18n";

export default function RouteLocaleLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const l =
      user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US");
    loadLocale(l).finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [user?.locale]);

  if (!ready) return null;
  return <>{children}</>;
}
