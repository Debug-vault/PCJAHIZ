import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schemas = await pool.query(
  "select schema_name from information_schema.schemata order by schema_name",
);
console.log("SCHEMAS:\n" + schemas.rows.map((r) => r.schema_name).join("\n"));

const tables = await pool.query(
  "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name",
);
console.log("\nTABLES:\n" + tables.rows.map((r) => `${r.table_schema}.${r.table_name}`).join("\n"));

const db = await pool.query("select current_database() as db");
console.log("\nCURRENT DB: " + db.rows[0].db);
await pool.end();