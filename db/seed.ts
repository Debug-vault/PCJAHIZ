import { getDb } from "../api/queries/connection";
import { categories, brands, products, reviews, users } from "./schema";
import { CATS, BRANDS, PRODUCTS, REVIEWS } from "../api/seed-data";
import { hashPassword } from "../api/lib/auth";
import { eq } from "drizzle-orm";
import { env } from "../api/lib/env";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  for (const cat of CATS) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({ target: categories.slug, set: { nameFr: cat.nameFr } });
  }

  for (const b of BRANDS) {
    await db
      .insert(brands)
      .values(b)
      .onConflictDoUpdate({ target: brands.slug, set: { name: b.name } });
  }

  for (const p of PRODUCTS) {
    await db
      .insert(products)
      .values(p)
      .onConflictDoUpdate({ target: products.slug, set: { price: p.price } });
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