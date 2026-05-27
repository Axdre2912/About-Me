"use client";

import { Nav } from "./Nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 md:ml-52 md:pb-8">{children}</main>
    </>
  );
}
