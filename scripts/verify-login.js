/** Test that login credentials match the database. Run: node scripts/verify-login.js */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { createPrisma } = require("./create-prisma");

async function main() {
  const email = (process.env.SETUP_EMAIL || "you@example.com").toLowerCase();
  const password = process.env.SETUP_PASSWORD || "ChangeMe123!";
  const prisma = createPrisma();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("FAIL: No user found for", email);
    console.log("Run: npm run setup");
    process.exit(1);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (valid) {
    console.log("OK: Login should work for", email);
  } else {
    console.log("FAIL: Password does not match hash in database");
    console.log("Run: $env:SKIP_DB_PUSH=1; npm run setup");
  }

  await prisma.$disconnect();
  process.exit(valid ? 0 : 1);
}

main().catch((e) => {
  console.error("Database error:", e.message);
  process.exit(1);
});
