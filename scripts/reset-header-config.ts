import { getPool } from "../api/queries/connection";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

async function main() {
  const pool = getPool();
  await pool.query('DELETE FROM jhz_settings WHERE key = \'headerConfig\'');
  console.log("headerConfig row deleted");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});