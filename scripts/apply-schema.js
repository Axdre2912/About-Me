/**
 * Applies prisma/init.sql to Neon over HTTP (bypasses blocked port 5432).
 * Run: npm run db:push:neon
 */
require("dotenv").config();
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { neon } = require("@neondatabase/serverless");

const url = process.env.DATABASE_URL;
if (!url || !url.includes("neon.tech")) {
  console.error("Set DATABASE_URL in .env to your Neon pooled connection string.");
  process.exit(1);
}

const sqlPath = join(__dirname, "..", "prisma", "init.sql");
if (!existsSync(sqlPath)) {
  console.error("Missing prisma/init.sql — run npm run db:push:neon");
  process.exit(1);
}

const raw = readFileSync(sqlPath, "utf8");
const statements = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);

async function main() {
  console.log(`Applying ${statements.length} SQL statements to Neon...`);
  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 70);
    console.log(" →", preview + "...");
    await sql.query(statement);
  }
  console.log("Done! Database tables are ready.");
}

main().catch((err) => {
  if (err.message?.includes("already exists")) {
    console.log("Tables already exist — database is ready.");
    process.exit(0);
  }
  console.error("Failed:", err.message);
  process.exit(1);
});
