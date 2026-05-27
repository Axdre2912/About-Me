import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (databaseUrl.includes("neon.tech")) {
    // Vercel serverless: WebSocket pool (see neon.com/docs/guides/prisma)
    if (process.env.VERCEL === "1") {
      neonConfig.webSocketConstructor = ws;
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaNeon(pool);
      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    }

    // Local dev (Windows may block port 5432 — HTTP driver works)
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
