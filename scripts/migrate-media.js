/**
 * Incremental migration: moves photo storage into the database and adds the
 * Audio table. Safe to run multiple times.
 * Run: npm run db:migrate:media
 */
require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

const STATEMENTS = [
  `ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "data" BYTEA`,
  `CREATE TABLE IF NOT EXISTS "Audio" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" BYTEA NOT NULL,
    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Audio_entryId_idx" ON "Audio"("entryId")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Audio_entryId_fkey') THEN
      ALTER TABLE "Audio" ADD CONSTRAINT "Audio_entryId_fkey"
        FOREIGN KEY ("entryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

async function main() {
  const url = process.env.DATABASE_URL || "";

  if (url.includes("neon.tech")) {
    // Neon over HTTP — works even when port 5432 is blocked
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(url);
    for (const statement of STATEMENTS) {
      const preview = statement.replace(/\s+/g, " ").slice(0, 70);
      console.log(" →", preview + "...");
      await sql.query(statement);
    }
    console.log("Done! Photo.data column and Audio table are ready.");
  } else {
    console.log("Non-Neon database — using prisma db push...");
    execSync("npx prisma db push", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
