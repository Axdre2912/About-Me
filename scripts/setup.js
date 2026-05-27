/**
 * First-time setup: creates .env, pushes DB schema, and seeds the owner account.
 * Run: npm run setup
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

if (!fs.existsSync(envPath)) {
  const secret = crypto.randomBytes(32).toString("base64");
  const email = process.env.SETUP_EMAIL || "you@example.com";
  const password = process.env.SETUP_PASSWORD || "ChangeMe123!";
  const name = process.env.SETUP_NAME || "Diary Owner";

  fs.writeFileSync(
    envPath,
    `DATABASE_URL="file:./dev.db"
AUTH_SECRET="${secret}"
NEXTAUTH_URL="http://localhost:3000"
SETUP_EMAIL="${email}"
SETUP_PASSWORD="${password}"
SETUP_NAME="${name}"
`,
    "utf8"
  );
  console.log("Created .env — update credentials before deploying.");
}

const env = loadEnv(envPath);
process.env.DATABASE_URL = env.DATABASE_URL || "file:./dev.db";

execSync("npx prisma db push", { cwd: root, stdio: "inherit", env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = (env.SETUP_EMAIL || process.env.SETUP_EMAIL || "you@example.com").toLowerCase();
  const password = env.SETUP_PASSWORD || process.env.SETUP_PASSWORD || "ChangeMe123!";
  const name = env.SETUP_NAME || process.env.SETUP_NAME || "Diary Owner";

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { password: hash, name },
    create: { email, password: hash, name },
  });
  console.log(`Owner account ready: ${email}`);
  console.log(`Password: (see .env SETUP_PASSWORD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
