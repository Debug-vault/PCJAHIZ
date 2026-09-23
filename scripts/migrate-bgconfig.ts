import { Client } from "pg";

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_vyRtu9VC1EsZ@ep-late-fire-axq9orpq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "jhz_campaigns" ADD COLUMN IF NOT EXISTS "bgConfig" jsonb');
    console.log("Migration done: bgConfig column added");
  } catch (e: any) {
    console.error("Migration error:", e.message);
  }
  await client.end();
}

main();
