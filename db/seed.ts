import { getDb } from "../api/queries/connection";
import { categories, brands, products, reviews, users, campaigns, storeLocations } from "./schema";
import { CATS, BRANDS, PRODUCTS, REVIEWS, CAMPAIGNS, STORE_LOCATIONS } from "../api/seed-data";
import { hashPassword } from "../api/lib/auth";
import { eq, notInArray } from "drizzle-orm";
import { env } from "../api/lib/env";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  for (const cat of CATS) {
    const { img, ...rest } = cat as { img?: string | null } & Record<string, unknown>;
    await db
      .insert(categories)
      .values({ ...rest, image: img ?? null } as never)
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          nameFr: cat.nameFr,
          image: img ?? null,
          deck: cat.deck,
          parentSlug: cat.parentSlug ?? null,
          description: cat.description ?? null,
          sortOrder: cat.sortOrder ?? 0,
          active: true,
        },
      });
  }

  for (const b of BRANDS) {
    await db
      .insert(brands)
      .values(b)
      .onConflictDoUpdate({ target: brands.slug, set: { name: b.name, logo: b.logo ?? null } });
  }

  for (const p of PRODUCTS) {
    await db
      .insert(products)
      .values(p)
      .onConflictDoUpdate({ target: products.slug, set: { price: p.price } });
  }

  // Remap legacy product category slugs onto the new taxonomy, then drop any
  // categories that no longer exist in the seed data.
  const categoryRemap: Record<string, string> = {
    "pc-portables": "pc-portable",
    "ordinateur-pc-portable": "pc-portable",
    imprimantes: "imprimante",
    smartphones: "telephone-sans-fil",
    "telephonie-telephone-sans-fil": "telephone-sans-fil",
    audio: "casque",
    ecrans: "peripherique-moniteur",
    "souris-claviers": "peripherique",
    reseaux: "reseau",
    composants: "ordinateur",
  };
  for (const [oldSlug, newSlug] of Object.entries(categoryRemap)) {
    await db
      .update(products)
      .set({ categorySlug: newSlug })
      .where(eq(products.categorySlug, oldSlug));
  }

  const liveSlugs = CATS.map((c) => c.slug);
  await db.delete(categories).where(notInArray(categories.slug, liveSlugs));

  for (const c of CAMPAIGNS) {
    await db
      .insert(campaigns)
      .values(c)
      .onConflictDoUpdate({ target: campaigns.slug, set: { heading: c.heading } });
  }

  for (const s of STORE_LOCATIONS) {
    await db
      .insert(storeLocations)
      .values(s)
      .onConflictDoUpdate({ target: storeLocations.name, set: { address: s.address } });
  }

  for (const r of REVIEWS) {
    const prod = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.slug, r.slug),
    });
    if (!prod) continue;
    const existing = await db.query.reviews.findFirst({
      where: (rev, { and, eq }) => and(eq(rev.productId, prod.id), eq(rev.author, r.author)),
    });
    if (existing) continue;
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
    console.log("Admin account created:", env.adminEmail);
  }

  console.log("Done.");
  process.exit(0);
}

seed();