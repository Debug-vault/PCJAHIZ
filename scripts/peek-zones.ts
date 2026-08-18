import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('select "name", fee, "freeThreshold", cities from "jhz_shipping_zones" order by "sortOrder"');
for (const row of r.rows) {
  console.log(JSON.stringify({ name: row.name, fee: row.fee, freeThreshold: row.freeThreshold, cities: row.cities }));
}
await pool.end();