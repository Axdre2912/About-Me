"use client";

import { useEffect, useState } from "react";
import { Smartphone, Copy, Check } from "lucide-react";

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallOnPhone() {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setOrigin(window.location.origin);
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 rounded-xl border border-card-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Smartphone size={20} className="text-accent" />
        <h2 className="font-medium">Install on your phone</h2>
      </div>

      <p className="text-sm text-muted">
        Add this app to your home screen so it opens full-screen like a native app.
      </p>

      {origin && (
        <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm">
          <code className="flex-1 truncate">{origin}</code>
          <button
            type="button"
            onClick={copyUrl}
            className="shrink-0 rounded p-1 text-muted hover:text-foreground"
            aria-label="Copy URL"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {platform === "ios" && (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Open this page in <strong className="text-foreground">Safari</strong> (not Chrome).</li>
          <li>Tap the <strong className="text-foreground">Share</strong> button (square with arrow).</li>
          <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>.</li>
          <li>Tap <strong className="text-foreground">Add</strong>.</li>
        </ol>
      )}

      {platform === "android" && (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Open this page in <strong className="text-foreground">Chrome</strong>.</li>
          <li>Tap the <strong className="text-foreground">menu</strong> (⋮) in the top right.</li>
          <li>Tap <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>.</li>
          <li>Confirm when prompted.</li>
        </ol>
      )}

      {platform === "desktop" && (
        <div className="space-y-3 text-sm text-muted">
          <p>
            <strong className="text-foreground">On the same Wi‑Fi:</strong> On your PC run{" "}
            <code className="rounded bg-background px-1">npm run dev:mobile</code>, then on your phone
            open <code className="rounded bg-background px-1">http://YOUR-PC-IP:3000</code> (find IP with{" "}
            <code className="rounded bg-background px-1">ipconfig</code> on Windows).
          </p>
          <p>
            Update <code className="rounded bg-background px-1">NEXTAUTH_URL</code> in{" "}
            <code className="rounded bg-background px-1">.env</code> to that address, restart the server,
            then sign in on your phone and use the steps above.
          </p>
          <p>
            <strong className="text-foreground">Always available:</strong> Deploy to Vercel (or similar),
            open the live URL on your phone, then Add to Home Screen / Install app.
          </p>
        </div>
      )}
    </section>
  );
}
