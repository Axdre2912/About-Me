"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { formatDateKey } from "@/lib/utils";

const STORAGE_KEY = "diary-reminder-enabled";
const DISMISSED_KEY = "diary-reminder-dismissed";

export function ReminderBanner() {
  const { status } = useSession();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || pathname === "/login") return;

    const enabled = localStorage.getItem(STORAGE_KEY) === "true";
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    const today = formatDateKey(new Date());

    if (!enabled || dismissed) return;

    const hour = new Date().getHours();
    if (hour >= 18 && pathname !== `/entry/${today}` && !pathname.startsWith("/entry/")) {
      setShow(true);
    }
  }, [status, pathname]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      localStorage.setItem(STORAGE_KEY, "true");
      new Notification("Personal Diary", {
        body: "Write your diary for today!",
        icon: "/icon-192.png",
      });
    }
  };

  if (!show) return null;

  return (
    <div className="border-b border-card-border bg-accent-soft px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-accent">
          <Bell size={16} />
          <span>Time to write today&apos;s diary entry.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/entry/${formatDateKey(new Date())}`}
            className="rounded-lg bg-accent px-3 py-1 text-white"
            onClick={() => sessionStorage.setItem(DISMISSED_KEY, "1")}
          >
            Write now
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(DISMISSED_KEY, "1");
              setShow(false);
            }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {permission === "default" && (
        <button
          type="button"
          onClick={requestPermission}
          className="mt-1 text-xs underline text-accent"
        >
          Enable daily notifications
        </button>
      )}
    </div>
  );
}
