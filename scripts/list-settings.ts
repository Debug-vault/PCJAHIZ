import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('select "key", value from "jhz_settings" order by "key"');
for (const row of r.rows) {
  let v = row.value;
  if (v && typeof v === "object" && "value" in v) v = v.value;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  console.log(`${row.key}: ${s.slice(0, 80)}`);
}
await pool.end();