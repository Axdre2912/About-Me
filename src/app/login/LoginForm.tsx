"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { loginWithCredentials, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const { theme, setTheme } = useTheme();

  const [state, formAction] = useFormState<LoginState, FormData>(
    loginWithCredentials,
    undefined
  );
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const err = params.get("error");
    if (err === "CredentialsSignin") {
      setPasskeyError("Invalid email or password");
    }
  }, [params]);

  const handlePasskey = async () => {
    if (!email) {
      setPasskeyError("Enter your email first for biometric login");
      return;
    }
    setPasskeyLoading(true);
    setPasskeyError("");

    try {
      const optionsRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!optionsRes.ok) {
        setPasskeyError("No passkey found. Sign in with password first.");
        setPasskeyLoading(false);
        return;
      }

      const { options, userId } = await optionsRes.json();
      const authResponse = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResponse, userId }),
      });

      if (!verifyRes.ok) {
        setPasskeyError("Biometric verification failed");
        setPasskeyLoading(false);
        return;
      }

      const { passkeyToken } = await verifyRes.json();
      await signIn("credentials", {
        email: email.trim().toLowerCase(),
        passkeyToken,
        callbackUrl: "/",
        redirect: true,
      });
    } catch {
      setPasskeyError("Biometric login cancelled or unavailable");
      setPasskeyLoading(false);
    }
  };

  const displayError = state?.error || passkeyError;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute right-4 top-4 rounded-lg p-2 text-muted"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Personal Diary</h1>
          <p className="mt-2 text-sm text-muted">Your private space for daily reflection</p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-card-border bg-card p-6"
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div>
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </div>

          {displayError && <p className="text-sm text-red-500">{displayError}</p>}

          <SubmitButton />

          <button
            type="button"
            onClick={handlePasskey}
            disabled={passkeyLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-card-border py-2.5 transition hover:border-accent disabled:opacity-50"
          >
            {passkeyLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Fingerprint size={18} />
            )}
            Sign in with Face ID / Touch ID
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Email: <strong className="text-foreground">you@example.com</strong> · Password from .env
        </p>
      </div>
    </div>
  );
}
