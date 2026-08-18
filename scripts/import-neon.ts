import "dotenv/config";
import { Pool } from "pg";

/**
 * One-time importer: Prisma schema (PascalCase tables) -> new Drizzle schema
 * (jhz_* tables) in the same Neon database. Preserves cuid ids so foreign keys
 * stay intact. Idempotent-ish: skips rows whose id already exists.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const has = (row: any, key: string) => Object.prototype.hasOwnProperty.call(row ?? {}, key);

const moneyToInt = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  return Math.round(Number(v));
};

const statusMap: Record<string, string> = {
  PENDING: "preparing",
  CONFIRMED: "preparing",
  PROCESSING: "preparing",
  SHIPPED: "in_transit",
  DELIVERED: "landed",
  CANCELLED: "cancelled",
  REFUNDED: "cancelled",
};

const paymentStatusMap: Record<string, string> = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

const paymentMap: Record<string, string> = { COD: "cod", CMI: "cmi" };
const promoTypeMap: Record<string, string> = { PERCENT: "percent", FIXED: "fixed" };
const reviewStatusMap: Record<string, string> = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };
const roleMap: Record<string, string> = { ADMIN: "admin", CUSTOMER: "customer" };

const specToArray = (spec: any): { k: string; v: string }[] | null => {
  if (!spec) return null;
  if (Array.isArray(spec)) {
    return spec.map((s: any) => ({ k: s?.name ?? s?.k ?? "", v: s?.value ?? s?.v ?? "" }));
  }
  if (typeof spec === "object") {
    return Object.entries(spec).map(([k, v]) => ({ k, v: String(v) }));
  }
  return null;
};

async function importAll() {
  console.log("Importing categories…");
  const categories = await pool.query('select * from "Category"');
  const catSlugs = new Map<string, string>();
  for (const row of categories.rows) {
    catSlugs.set(row.id, row.slug);
    const parentSlug = row.parentId ? catSlugs.get(row.parentId) ?? null : null;
    try {
      await pool.query(
        `insert into "jhz_categories"
          ("id","slug","nameFr","nameAr","description","descriptionAr","seoTitleFr","seoTitleAr","seoDescriptionFr","seoDescriptionAr","parentSlug","image","deck","sortOrder","active","createdAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14,$15)
         on conflict (slug) do nothing`,
        [
          row.id, row.slug, row.nameFr, row.nameAr, row.description, row.descriptionAr,
          row.seoTitleFr, row.seoTitleAr, row.seoDescriptionFr, row.seoDescriptionAr,
          parentSlug, row.image, row.sortOrder ?? 0, row.active ?? true, row.createdAt ?? new Date(),
        ],
      );
    } catch (e: any) {
      console.error(`CATEGORY ${row.slug} failed:`, e?.message);
      throw e;
    }
  }

  console.log("Importing brands…");
  const brands = await pool.query('select * from "Brand"');
  const brandSlugs = new Map<string, string>();
  for (const row of brands.rows) {
    brandSlugs.set(row.id, row.slug);
    await pool.query(
      `insert into "jhz_brands"
        ("id","slug","name","logo","description","descriptionAr","seoTitle","seoTitleAr","seoDescription","seoDescriptionAr","sortOrder","showInMarquee","active","createdAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       on conflict (slug) do nothing`,
      [
        row.id, row.slug, row.name, row.logo, row.description, row.descriptionAr,
        row.seoTitle, row.seoTitleAr, row.seoDescription, row.seoDescriptionAr,
        row.sortOrder ?? 0, row.showInMarquee ?? true, row.active ?? true, row.createdAt ?? new Date(),
      ],
    );
  }

  console.log("Importing products…");
  const products = await pool.query('select * from "Product"');
  const productIds = new Map<string, string>();
  for (const row of products.rows) {
    productIds.set(row.id, row.slug);
    const price = moneyToInt(row.price) ?? 0;
    const oldPrice = moneyToInt(row.compareAtPrice);
    const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null;
    const images = Array.isArray(row.images) ? row.images : row.images ? [row.images] : [];
    const specs = JSON.stringify(specToArray(row.specsFr ?? row.specs));
    try {
      await pool.query(
        `insert into "jhz_products"
          ("id","slug","sku","nameFr","nameAr","summaryFr","summaryAr","descriptionFr","descriptionAr","seoTitleFr","seoTitleAr","seoDescriptionFr","seoDescriptionAr","faqFr","faqAr","aiGeneratedAt","aiPrompt","brandSlug","categorySlug","price","oldPrice","discount","cost","currency","img","images","specs","stock","lowStockThreshold","featured","isNew","popularity","warrantyMonths","active","createdAt","updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)
         on conflict (slug) do nothing`,
        [
          row.id, row.slug, row.sku ?? row.slug, row.nameFr, row.nameAr, row.summaryFr, row.summaryAr,
          row.descriptionFr, row.descriptionAr, row.seoTitleFr, row.seoTitleAr, row.seoDescriptionFr, row.seoDescriptionAr,
          row.faqFr ? JSON.stringify(row.faqFr) : null, row.faqAr ? JSON.stringify(row.faqAr) : null,
          row.aiGeneratedAt ?? null, row.aiPrompt ?? null,
          row.brandId ? (brandSlugs.get(row.brandId) ?? null) : null,
          row.categoryId ? (catSlugs.get(row.categoryId) ?? null) : null,
          price, oldPrice, discount, moneyToInt(row.cost), row.currency ?? "MAD",
          images[0] ?? null, JSON.stringify(images), specs,
          row.stock ?? 0, row.lowStockThreshold ?? 3, row.featured ?? false, false,
          50, row.warrantyMonths ?? 12, row.active ?? true,
          row.createdAt ?? new Date(), row.updatedAt ?? new Date(),
        ],
      );
    } catch (e: any) {
      console.error(`PRODUCT ${row.slug} failed:`, e?.message);
      throw e;
    }
  }

  console.log("Importing users…");
  const users = await pool.query('select * from "User"');
  for (const row of users.rows) {
    await pool.query(
      `insert into "jhz_users" ("id","name","email","passwordHash","phone","avatar","role","locale","createdAt","updatedAt","lastSignInAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (email) do nothing`,
      [
        row.id, row.name, row.email, row.passwordHash, row.phone ?? null, null,
        roleMap[row.role] ?? "customer", row.locale ?? "fr",
        row.createdAt ?? new Date(), row.updatedAt ?? new Date(), null,
      ],
    );
  }

  console.log("Importing shipping zones…");
  const zones = await pool.query('select * from "ShippingZone"');
  for (const row of zones.rows) {
    await pool.query(
      `insert into "jhz_shipping_zones" ("id","name","cities","fee","freeThreshold","sortOrder","active")
       values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
      [
        row.id, row.name, JSON.stringify(row.cities ?? []), moneyToInt(row.fee) ?? 0,
        moneyToInt(row.freeThreshold), row.sortOrder ?? 0, row.active ?? true,
      ],
    );
  }

  console.log("Importing promo codes…");
  const promos = await pool.query('select * from "PromoCode"');
  for (const row of promos.rows) {
    await pool.query(
      `insert into "jhz_promo_codes" ("id","code","type","value","minOrder","maxDiscount","startsAt","endsAt","usageLimit","usedCount","active","createdAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (code) do nothing`,
      [
        row.id, row.code, promoTypeMap[row.type] ?? "percent", moneyToInt(row.value) ?? 0,
        moneyToInt(row.minOrder), moneyToInt(row.maxDiscount), row.startsAt ?? null, row.endsAt ?? null,
        row.usageLimit ?? null, row.usedCount ?? 0, row.active ?? true, row.createdAt ?? new Date(),
      ],
    );
  }

  console.log("Importing orders…");
  const orders = await pool.query('select * from "Order"');
  const orderIds = new Set<string>();
  for (const row of orders.rows) {
    orderIds.add(row.id);
    await pool.query(
      `insert into "jhz_orders"
        ("id","ref","userId","customerName","email","phone","city","region","address","notes","subtotal","shippingFee","discount","total","currency","payment","paymentStatus","status","promoCode","cmiReference","createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       on conflict (ref) do nothing`,
      [
        row.id, row.orderNumber, row.userId ?? null, row.fullName, row.email, row.phone,
        row.city, row.region ?? null, [row.addressLine1, row.addressLine2 ?? null].filter(Boolean).join(", ") || null,
        row.notes ?? null, moneyToInt(row.subtotal) ?? 0, moneyToInt(row.shippingFee) ?? 0,
        moneyToInt(row.discount) ?? 0, moneyToInt(row.total) ?? 0, row.currency ?? "MAD",
        paymentMap[row.paymentMethod] ?? "cod", paymentStatusMap[row.paymentStatus] ?? "pending",
        statusMap[row.status] ?? "preparing", null, row.cmiReference ?? null,
        row.createdAt ?? new Date(), row.updatedAt ?? new Date(),
      ],
    );
  }

  console.log("Importing order items…");
  const items = await pool.query('select * from "OrderItem"');
  for (const row of items.rows) {
    await pool.query(
      `insert into "jhz_order_items" ("id","orderId","productId","sku","nameFr","nameAr","unitPrice","quantity","total")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
      [
        row.id, row.orderId, row.productId ?? null, row.sku ?? null,
        row.nameFr, row.nameAr, moneyToInt(row.unitPrice) ?? 0, row.quantity ?? 1,
        moneyToInt(row.total) ?? 0,
      ],
    );
  }

  console.log("Importing reviews…");
  const reviews = await pool.query('select * from "Review"');
  for (const row of reviews.rows) {
    await pool.query(
      `insert into "jhz_reviews" ("id","productId","userId","author","city","rating","comment","status","createdAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
      [
        row.id, row.productId, row.userId ?? null, "Client", null, row.rating,
        row.comment, reviewStatusMap[row.status] ?? "approved", row.createdAt ?? new Date(),
      ],
    );
  }

  console.log("Importing wishlist…");
  const wish = await pool.query('select * from "WishlistItem"');
  for (const row of wish.rows) {
    await pool.query(
      `insert into "jhz_wishlist" ("id","userId","productId","createdAt")
       values ($1,$2,$3,$4) on conflict (id) do nothing`,
      [row.id, row.userId, row.productId, row.createdAt ?? new Date()],
    );
  }

  console.log("Importing settings…");
  const settings = await pool.query('select * from "Setting"');
  for (const row of settings.rows) {
    const value = has(row.value, "value") ? row.value.value : row.value;
    await pool.query(
      `insert into "jhz_settings" ("id","key","value") values ($1,$2,$3) on conflict (key) do nothing`,
      [row.id, row.key, JSON.stringify(value)],
    );
  }

  console.log("Import complete.");
  await pool.end();
}

importAll().catch((e) => {
  console.error("Import failed:", e?.message ?? e);
  process.exit(1);
});