import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const q = async (table: string) => {
  const r = await pool.query(`select count(*)::int as n from "${table}"`);
  return `${table}: ${r.rows[0].n}`;
};

for (const t of [
  "jhz_users", "jhz_categories", "jhz_brands", "jhz_products",
  "jhz_orders", "jhz_order_items", "jhz_reviews", "jhz_wishlist",
  "jhz_settings", "jhz_shipping_zones", "jhz_promo_codes",
]) {
  console.log(await q(t));
}

const sample = await pool.query(
  'select slug, "nameFr", "nameAr", price, "oldPrice", img, stock, featured from "jhz_products" order by "createdAt" limit 5',
);
console.log("\nSAMPLE PRODUCTS:");
for (const r of sample.rows) console.log(JSON.stringify(r));

await pool.end();