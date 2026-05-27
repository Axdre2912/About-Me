/** Shared Prisma client for scripts (Neon when needed). */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");

function createPrisma() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("DATABASE_URL is missing from .env");
  }
  if (url.includes("neon.tech")) {
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  }
  return new PrismaClient();
}

module.exports = { createPrisma };
