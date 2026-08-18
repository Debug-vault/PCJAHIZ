import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import { env } from "../lib/env";

let pool: Pool | null = null;
let db: ReturnType<typeof createDb> | null = null;

function createDb() {
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }
  return drizzle(pool, { schema: { ...schema, ...relations } });
}

export function getDb() {
  if (!db) db = createDb();
  return db;
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }
  return pool;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}