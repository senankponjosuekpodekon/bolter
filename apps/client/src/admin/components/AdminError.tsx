import React from "react";

// react-admin expects a catchAll component that accepts a `title` prop
// keep `error` available so the same component can be reused when provided
export default function AdminError({
  title,
  error,
}: {
  title?: React.ReactNode;
  error?: Error | null;
}) {
  return (
    <div style={{ padding: 24 }}>
      {/* Title may be a string or React node passed by react-admin */}
      <h2>{title ?? "Unexpected Application Error"}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {error?.message ?? "An unexpected error occurred."}
      </p>
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => window.history.back()}
          style={{ marginRight: 8 }}
        >
          Go back
        </button>
        <button onClick={() => window.location.reload()}>Reload app</button>
      </div>
    </div>
  );
}
