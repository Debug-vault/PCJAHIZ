import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "./queries/connection";
import { categories, brands, products, reviews, users, campaigns, storeLocations } from "@db/schema";
import { CATS, BRANDS, ALL_PRODUCTS, REVIEWS, CAMPAIGNS, STORE_LOCATIONS } from "./seed-data";
import { hashPassword } from "./lib/auth";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";

let bootPromise: Promise<void> | null = null;

async function seedIfEmpty() {
  const db = getDb();
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  const reseed = env.reseed === "true" || env.reseed === "1";

  if (existing.length > 0 && !reseed) return;

  if (reseed && existing.length > 0) {
    console.log("[bootstrap] RESEED requested — clearing catalog…");
    await db.delete(reviews);
    await db.delete(products);
    await db.delete(campaigns);
    await db.delete(storeLocations);
    await db.delete(categories);
    await db.delete(brands);
  }

  console.log("[bootstrap] Seeding catalog…");
  await db.insert(categories).values(CATS);
  await db.insert(brands).values(BRANDS);
  await db.insert(products).values(ALL_PRODUCTS);
  await db.insert(campaigns).values(CAMPAIGNS);
  await db.insert(storeLocations).values(STORE_LOCATIONS);

  for (const r of REVIEWS) {
    const prod = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.slug, r.slug),
    });
    if (!prod) continue;
    await db.insert(reviews).values({
      productId: prod.id,
      author: r.author,
      city: r.city,
      rating: r.rating,
      comment: r.comment,
      status: "approved",
    });
  }

  const adminExists = await db.select().from(users).where(eq(users.email, env.adminEmail)).limit(1);
  if (adminExists.length === 0) {
    await db.insert(users).values({
      name: "Admin",
      email: env.adminEmail,
      passwordHash: await hashPassword(env.adminPassword),
      role: "admin",
    });
    console.log("[bootstrap] Admin account created:", env.adminEmail);
  }
  console.log("[bootstrap] Catalog seeded.");
}

/** Run migrations + seed once, in the background. Safe to call on every boot. */
export function bootstrapDb() {
  if (!bootPromise) {
    bootPromise = (async () => {
      const migrationsFolder = path.resolve(process.cwd(), "db/migrations");
      await migrate(getDb(), { migrationsFolder });
      await seedIfEmpty();
    })().catch((e) => {
      console.error("[bootstrap] failed:", e?.message ?? e);
      bootPromise = null; // allow retry on next request
    });
  }
  return bootPromise;
}