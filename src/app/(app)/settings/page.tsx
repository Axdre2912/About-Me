"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Download, Fingerprint, Bell } from "lucide-react";
import { InstallOnPhone } from "@/components/InstallOnPhone";

export default function SettingsPage() {
  const [message, setMessage] = useState("");
  const [reminder, setReminder] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("diary-reminder-enabled") === "true"
  );

  const registerPasskey = async () => {
    setMessage("");
    try {
      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" });
      if (!optionsRes.ok) {
        setMessage("Could not start passkey registration");
        return;
      }
      const options = await optionsRes.json();
      const attestation = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      setMessage(verifyRes.ok ? "Passkey registered successfully!" : "Registration failed");
    } catch {
      setMessage("Passkey registration cancelled or not supported");
    }
  };

  const toggleReminder = async () => {
    if (!reminder && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMessage("Notification permission denied");
        return;
      }
    }
    const next = !reminder;
    setReminder(next);
    localStorage.setItem("diary-reminder-enabled", String(next));
    setMessage(next ? "Daily reminders enabled (evening banner + notifications)" : "Reminders disabled");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {message && (
        <p className="rounded-lg bg-accent-soft px-4 py-2 text-sm text-accent">{message}</p>
      )}

      <InstallOnPhone />

      <section className="space-y-3 rounded-xl border border-card-border bg-card p-4">
        <h2 className="font-medium">Security</h2>
        <button
          type="button"
          onClick={registerPasskey}
          className="flex w-full items-center gap-2 rounded-lg border border-card-border px-4 py-3 text-left hover:border-accent"
        >
          <Fingerprint size={20} />
          <div>
            <p className="font-medium">Register Face ID / Touch ID</p>
            <p className="text-sm text-muted">Use biometrics for faster sign-in</p>
          </div>
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-card-border bg-card p-4">
        <h2 className="font-medium">Reminders</h2>
        <button
          type="button"
          onClick={toggleReminder}
          className="flex w-full items-center gap-2 rounded-lg border border-card-border px-4 py-3 text-left hover:border-accent"
        >
          <Bell size={20} />
          <div>
            <p className="font-medium">
              Daily reminder {reminder ? "(on)" : "(off)"}
            </p>
            <p className="text-sm text-muted">Get nudged to write your diary each evening</p>
          </div>
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-card-border bg-card p-4">
        <h2 className="font-medium">Backup & export</h2>
        <a
          href="/api/export?format=json"
          className="flex items-center gap-2 rounded-lg border border-card-border px-4 py-3 hover:border-accent"
        >
          <Download size={20} />
          <div>
            <p className="font-medium">Export as JSON</p>
            <p className="text-sm text-muted">All entries and metadata</p>
          </div>
        </a>
        <a
          href="/api/export?format=zip"
          className="flex items-center gap-2 rounded-lg border border-card-border px-4 py-3 hover:border-accent"
        >
          <Download size={20} />
          <div>
            <p className="font-medium">Export as ZIP</p>
            <p className="text-sm text-muted">JSON + all photos</p>
          </div>
        </a>
      </section>
    </div>
  );
}
