import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const q = async (table: string) => {
  try {
    const r = await pool.query(`select count(*)::int as n from "${table}"`);
    return `${table}: ${r.rows[0].n}`;
  } catch {
    return `${table}: ERR`;
  }
};

for (const t of [
  "User", "Address", "Category", "Brand", "Product", "ProductVariant",
  "Order", "OrderItem", "PromoCode", "Review", "Setting", "ShippingZone", "WishlistItem",
  "jhz_users", "jhz_categories", "jhz_brands", "jhz_products", "jhz_orders", "jhz_order_items", "jhz_reviews", "jhz_wishlist", "jhz_settings", "jhz_shipping_zones", "jhz_promo_codes",
]) {
  console.log(await q(t));
}
await pool.end();