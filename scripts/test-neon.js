require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) {
  console.error("No DATABASE_URL in .env");
  process.exit(1);
}

const sql = neon(url);
sql`SELECT 1 AS ok`
  .then((rows) => {
    console.log("Neon connection OK:", rows);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Neon connection FAILED:", err.message);
    process.exit(1);
  });
