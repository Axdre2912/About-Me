"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function SetupContent() {
  const params = useSearchParams();
  const secret = params.get("secret");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!secret) {
      setStatus("error");
      setMessage("Missing ?secret= in the URL. Copy AUTH_SECRET from your .env file.");
      return;
    }

    fetch(`/api/seed-account?secret=${encodeURIComponent(secret)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.ok) {
          setStatus("ok");
          setMessage(data.message || "Account ready.");
        } else {
          setStatus("error");
          const parts = [data.error, data.hint].filter(Boolean);
          setMessage(parts.join(" — ") || "Setup failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not reach the server. Redeploy on Vercel and try again.");
      });
  }, [secret]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Diary setup</h1>

        {status === "loading" && (
          <p className="mt-4 text-muted">Creating your account…</p>
        )}

        {status === "ok" && (
          <>
            <p className="mt-4 text-success">{message}</p>
            <p className="mt-2 text-sm text-muted">
              Sign in with the email and password from your .env file (SETUP_EMAIL / SETUP_PASSWORD).
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-white"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="mt-4 text-red-500">{message}</p>
            <p className="mt-4 text-sm text-muted">
              Fix DATABASE_URL on Vercel, redeploy, then open this page again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Loading…</div>}>
      <SetupContent />
    </Suspense>
  );
}
