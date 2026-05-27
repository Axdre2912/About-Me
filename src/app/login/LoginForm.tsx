"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  const handlePasskey = async () => {
    if (!email) {
      setError("Enter your email first for biometric login");
      return;
    }
    setPasskeyLoading(true);
    setError("");

    try {
      const optionsRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optionsRes.ok) {
        setError("No passkey found. Sign in with password and register one in Settings.");
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
        setError("Biometric verification failed");
        setPasskeyLoading(false);
        return;
      }

      const { passkeyToken } = await verifyRes.json();
      const result = await signIn("credentials", {
        email,
        passkeyToken,
        redirect: false,
      });

      if (result?.error) {
        setError("Could not create session");
        setPasskeyLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Biometric login cancelled or unavailable");
    }
    setPasskeyLoading(false);
  };

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

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-card-border bg-card p-6">
          <div>
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Sign in
          </button>

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
          First time? Run <code className="rounded bg-card px-1">npm run setup</code> to create your account.
        </p>
      </div>
    </div>
  );
}
