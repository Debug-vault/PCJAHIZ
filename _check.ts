import { Client } from "pg";
const c = new Client({ connectionString: "postgresql://neondb_owner:npg_vyRtu9VC1EsZ@ep-late-fire-axq9orpq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require" });
c.connect().then(async () => {
  const r = await c.query("SELECT value FROM jhz_settings WHERE key = $1", ["headerConfig"]);
  const h = r.rows[0]?.value?.value;
  if (h) {
    console.log("mainBar.bg:", h.mainBar?.bg);
    console.log("bottomNav.bg:", h.bottomNav?.bg);
    console.log("topBar.bg:", h.topBar?.bg);
  }
  await c.end();
});
