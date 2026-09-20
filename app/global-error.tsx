"use client";

// Last-resort boundary: catches errors thrown by the root layout itself, so it must render its
// own <html>/<body>. Reported to Sentry via the browser adapter; the message shown reveals
// nothing about the failure (SECURITY §2.7). Styled inline on purpose — globals.css may be the
// thing that failed. Edged surfaces per DESIGN_SYSTEM.

import { useEffect } from "react";

import { reportError } from "@/lib/observability/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#020408",
          color: "#f2f2f2",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 16,
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: 480,
            border: "1px solid #27282f",
            padding: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", color: "#9b9ba8" }}>
            SOMETHING BROKE
          </p>
          <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 600 }}>
            This page hit an error.
          </h1>
          <p style={{ margin: "12px 0 0", lineHeight: 1.5, color: "#c9c9d2" }}>
            The problem has been recorded
            {error.digest ? ` (ref ${error.digest})` : ""}. Your interviews and feedback are safe.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              border: "1px solid #f2f2f2",
              background: "#f2f2f2",
              color: "#020408",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
