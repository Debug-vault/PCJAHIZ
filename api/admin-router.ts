import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  products,
  categories,
  brands,
  orders,
  orderItems,
  reviews,
  users,
  shippingZones,
  promoCodes,
  settings,
  campaigns,
  storeLocations,
  quoteRequests,
  newsletterSubscribers,
  blogPosts,
  blogCategories,
} from "@db/schema";
import { eq, and, desc, asc, count, ne, sql, type SQL } from "drizzle-orm";

const cleanNulls = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)) as T;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ===== Products =====
const productInput = z.object({
  slug: z.string().min(1),
  sku: z.string().min(1),
  nameFr: z.string().min(1),
  summaryFr: z.string().optional().nullable(),
  descriptionFr: z.string().optional().nullable(),
  seoTitleFr: z.string().optional().nullable(),
  seoDescriptionFr: z.string().optional().nullable(),
  brandSlug: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  price: z.number().int().min(0),
  oldPrice: z.number().int().min(0).optional().nullable(),
  discount: z.number().int().min(0).max(100).optional().nullable(),
  cost: z.number().int().min(0).optional().nullable(),
  img: z.string().optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  specs: z.array(z.object({ k: z.string(), v: z.string() })).optional().nullable(),
  faqFr: z.array(z.object({ q: z.string(), a: z.string() })).optional().nullable(),
  sectionsFr: z.array(z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string(),
    text: z.string(),
    visual: z.object({
      type: z.enum(["gauges", "bars", "icons", "specs-grid"]),
      items: z.array(z.object({
        label: z.string(),
        value: z.preprocess((v) => {
          if (typeof v === "number") return v;
          const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
          return isNaN(n) ? 0 : n;
        }, z.number()),
        max: z.preprocess((v) => {
          if (v == null || v === undefined) return undefined;
          if (typeof v === "number") return v;
          const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
          return isNaN(n) ? undefined : n;
        }, z.number().optional()),
      })),
    }).nullable(),
  })).optional().nullable(),
  variants: z.array(z.object({
    type: z.string(),
    label: z.string(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
      hex: z.string().optional(),
      image: z.string().optional(),
      priceDiff: z.coerce.number().optional(),
      stock: z.coerce.number().optional(),
      sku: z.string().optional(),
    })),
  })).optional().nullable(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional().nullable(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  popularity: z.number().int().min(0).optional(),
  warrantyMonths: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// ===== Categories =====
const categoryInput = z.object({
  slug: z.string().min(1),
  nameFr: z.string().min(1),
  description: z.string().optional().nullable(),
  seoTitleFr: z.string().optional().nullable(),
  seoDescriptionFr: z.string().optional().nullable(),
  parentSlug: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  deck: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

// ===== Brands =====
const brandInput = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  showInMarquee: z.boolean().optional(),
  active: z.boolean().optional(),
});

// ===== Orders =====
const orderStatusEnum = ["preparing", "in_transit", "landed", "cancelled"] as const;
const paymentStatusEnum = ["pending", "paid", "failed", "refunded"] as const;

// ===== Promos =====
const promoInput = z.object({
  code: z.string().min(1),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().min(0),
  minOrder: z.number().int().min(0).optional().nullable(),
  maxDiscount: z.number().int().min(0).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  usageLimit: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

// ===== Shipping zones =====
const shippingInput = z.object({
  name: z.string().min(1),
  cities: z.array(z.string()).optional().nullable(),
  fee: z.number().int().min(0),
  freeThreshold: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminRouter = createRouter({
  dashboard: adminQuery.query(async () => {
    const db = getDb();
    const [prodCount, activeProd, orderCount, customerCount, pendingReviews, revenueAgg] = await Promise.all([
      db.select({ n: count() }).from(products),
      db.select({ n: count() }).from(products).where(eq(products.active, true)),
      db.select({ n: count() }).from(orders),
      db.select({ n: count() }).from(users).where(eq(users.role, "customer")),
      db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
      db
        .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(ne(orders.status, "cancelled")),
    ]);
    const revenue = Number(revenueAgg[0]?.total ?? 0);
    const lowStock = await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`)
      .orderBy(asc(products.stock))
      .limit(10);
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(6);
    const ordersWithItems = await Promise.all(
      recentOrders.map(async (o) => ({
        ...o,
        items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
      })),
    );
    const topProducts = await db
      .select({
        name: orderItems.nameFr,
        qty: sql<number>`sum(${orderItems.quantity})`,
        total: sql<number>`sum(${orderItems.total})`,
      })
      .from(orderItems)
      .groupBy(orderItems.nameFr)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(6);
    return {
      productCount: prodCount[0].n,
      activeProductCount: activeProd[0].n,
      orderCount: orderCount[0].n,
      customerCount: customerCount[0].n,
      pendingReviewCount: pendingReviews[0].n,
      revenue,
      lowStock,
      recentOrders: ordersWithItems,
      topProducts,
    };
  }),

  products: {
    list: adminQuery
      .input(z.object({ q: z.string().optional(), active: z.boolean().optional() }))
      .query(async ({ input }) => {
        const conds: (SQL | undefined)[] = [];
        if (input.active != null) conds.push(eq(products.active, input.active));
        if (input.q) {
          const q = `%${input.q}%`;
          conds.push(sql`(${products.nameFr} ilike ${q} or ${products.sku} ilike ${q})`);
        }
        const rows = await getDb()
          .select()
          .from(products)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(products.updatedAt));
        return rows.map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : p.img ? [p.img] : [],
        }));
      }),

    create: adminQuery.input(productInput).mutation(async ({ input }) => {
      const db = getDb();
      const exists = await db.select().from(products).where(eq(products.slug, input.slug)).limit(1);
      if (exists.length > 0) throw new Error("Ce slug est déjà utilisé.");
      const [row] = await db
        .insert(products)
        .values({
          ...cleanNulls(input),
          lowStockThreshold: input.lowStockThreshold ?? 3,
          warrantyMonths: input.warrantyMonths ?? 12,
          popularity: input.popularity ?? 0,
          images: input.images ?? (input.img ? [input.img] : []),
          specs: input.specs ?? [],
          faqFr: input.faqFr ?? [],
          sectionsFr: input.sectionsFr ?? null,
          variants: input.variants ?? null,
        })
        .returning();
      return row;
    }),

    bulkCreate: adminQuery
      .input(z.array(productInput).min(1).max(50))
      .mutation(async ({ input }) => {
        const db = getDb();
        const results: { ok: boolean; slug: string; error?: string }[] = [];
        for (const item of input) {
          try {
            const exists = await db.select().from(products).where(eq(products.slug, item.slug)).limit(1);
            if (exists.length > 0) {
              results.push({ ok: false, slug: item.slug, error: "Slug déjà utilisé" });
              continue;
            }
            await db.insert(products).values({
              ...cleanNulls(item),
              lowStockThreshold: item.lowStockThreshold ?? 3,
              warrantyMonths: item.warrantyMonths ?? 12,
              popularity: item.popularity ?? 0,
              images: item.images ?? (item.img ? [item.img] : []),
              specs: item.specs ?? [],
              faqFr: item.faqFr ?? [],
              sectionsFr: item.sectionsFr ?? null,
              variants: item.variants ?? null,
            });
            results.push({ ok: true, slug: item.slug });
          } catch (err) {
            results.push({ ok: false, slug: item.slug, error: err instanceof Error ? err.message : "Erreur" });
          }
        }
        return results;
      }),

    update: adminQuery
      .input(z.object({ id: z.string(), data: productInput.partial() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const { id, data } = input;
        if (data.slug) {
          const dup = await db.select().from(products).where(and(eq(products.slug, data.slug), ne(products.id, id))).limit(1);
          if (dup.length > 0) throw new Error("Ce slug est déjà utilisé.");
        }
        const [row] = await db
          .update(products)
          .set({ ...cleanNulls(data), updatedAt: new Date() } as never)
          .where(eq(products.id, id))
          .returning();
        return row;
      }),

    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(products).where(eq(products.id, input.id));
      return { ok: true };
    }),

    setActive: adminQuery
      .input(z.object({ id: z.string(), active: z.boolean() }))
      .mutation(async ({ input }) => {
        await getDb().update(products).set({ active: input.active, updatedAt: new Date() }).where(eq(products.id, input.id));
        return { ok: true };
      }),
  },

  categories: {
    list: adminQuery.query(() =>
      getDb().select().from(categories).orderBy(asc(categories.deck), asc(categories.sortOrder)),
    ),
    create: adminQuery.input(categoryInput).mutation(async ({ input }) => {
      const db = getDb();
      const slug = slugify(input.slug);
      const exists = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
      if (exists.length > 0) throw new Error("Ce slug est déjà utilisé.");
      const [row] = await db.insert(categories).values({ ...input, slug }).returning();
      return row;
    }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: categoryInput.partial() }))
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const [row] = await getDb().update(categories).set(data).where(eq(categories.id, id)).returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(categories).where(eq(categories.id, input.id));
      return { ok: true };
    }),
  },

  brands: {
    list: adminQuery.query(() => getDb().select().from(brands).orderBy(asc(brands.name))),
    create: adminQuery.input(brandInput).mutation(async ({ input }) => {
      const db = getDb();
      const slug = slugify(input.slug);
      const exists = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
      if (exists.length > 0) throw new Error("Ce slug est déjà utilisé.");
      const [row] = await db.insert(brands).values({ ...input, slug }).returning();
      return row;
    }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: brandInput.partial() }))
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const [row] = await getDb().update(brands).set(data).where(eq(brands.id, id)).returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(brands).where(eq(brands.id, input.id));
      return { ok: true };
    }),
  },

  orders: {
    list: adminQuery
      .input(
        z.object({
          q: z.string().optional(),
          status: z.enum(orderStatusEnum).optional(),
          payment: z.enum(paymentStatusEnum).optional(),
        }),
      )
      .query(async ({ input }) => {
        const db = getDb();
        const conds: (SQL | undefined)[] = [];
        if (input.status) conds.push(eq(orders.status, input.status));
        if (input.payment) conds.push(eq(orders.paymentStatus, input.payment));
        if (input.q) {
          const q = `%${input.q}%`;
          conds.push(sql`(${orders.ref} ilike ${q} or ${orders.customerName} ilike ${q} or ${orders.phone} ilike ${q} or ${orders.email} ilike ${q})`);
        }
        const rows = await db
          .select()
          .from(orders)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(orders.createdAt));
        const withItems = await Promise.all(
          rows.map(async (o) => ({
            ...o,
            items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
          })),
        );
        return withItems;
      }),

    detail: adminQuery.input(z.object({ id: z.string() })).query(async ({ input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: { items: true, user: true },
      });
      return order;
    }),

    updateStatus: adminQuery
      .input(
        z.object({
          id: z.string(),
          status: z.enum(orderStatusEnum).optional(),
          paymentStatus: z.enum(paymentStatusEnum).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const [row] = await getDb()
          .update(orders)
          .set({ ...rest, updatedAt: new Date() })
          .where(eq(orders.id, id))
          .returning();
        return row;
      }),
  },

  customers: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
        orderCount: sql<number>`(select count(*) from jhz_orders o where o."userId" = ${users.id})`,
        totalSpent: sql<number>`coalesce((select sum(o.total) from jhz_orders o where o."userId" = ${users.id} and o.status <> 'cancelled'), 0)`,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }),

  reviews: {
    list: adminQuery.query(() =>
      getDb()
        .select()
        .from(reviews)
        .orderBy(desc(reviews.createdAt))
        .limit(200),
    ),
    moderate: adminQuery
      .input(z.object({ id: z.string(), status: z.enum(["approved", "rejected"]) }))
      .mutation(async ({ input }) => {
        await getDb().update(reviews).set({ status: input.status }).where(eq(reviews.id, input.id));
        return { ok: true };
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(reviews).where(eq(reviews.id, input.id));
      return { ok: true };
    }),
  },

  promos: {
    list: adminQuery.query(() => getDb().select().from(promoCodes).orderBy(desc(promoCodes.createdAt))),
    create: adminQuery.input(promoInput).mutation(async ({ input }) => {
      const db = getDb();
      const code = input.code.toUpperCase().replace(/\s+/g, "");
      const exists = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
      if (exists.length > 0) throw new Error("Ce code existe déjà.");
      const [row] = await db
        .insert(promoCodes)
        .values({
          ...input,
          code,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .returning();
      return row;
    }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: promoInput.partial() }))
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const [row] = await getDb()
          .update(promoCodes)
          .set({
            ...data,
            code: data.code ? data.code.toUpperCase().replace(/\s+/g, "") : undefined,
            startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
            endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
          })
          .where(eq(promoCodes.id, id))
          .returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(promoCodes).where(eq(promoCodes.id, input.id));
      return { ok: true };
    }),
  },

  shipping: {
    list: adminQuery.query(() => getDb().select().from(shippingZones).orderBy(asc(shippingZones.sortOrder))),
    create: adminQuery.input(shippingInput).mutation(async ({ input }) => {
      const [row] = await getDb()
        .insert(shippingZones)
        .values({ ...input, cities: input.cities ?? [] })
        .returning();
      return row;
    }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: shippingInput.partial() }))
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const [row] = await getDb().update(shippingZones).set(data).where(eq(shippingZones.id, id)).returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(shippingZones).where(eq(shippingZones.id, input.id));
      return { ok: true };
    }),
  },

  settings: {
    get: adminQuery.query(() =>
      getDb().select().from(settings).orderBy(asc(settings.key)),
    ),
    update: adminQuery
      .input(z.object({ values: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) => {
        const db = getDb();
        for (const [key, value] of Object.entries(input.values)) {
          await db
            .insert(settings)
            .values({ key, value })
            .onConflictDoUpdate({ target: settings.key, set: { value } });
        }
        return { ok: true };
      }),
    delete: adminQuery.input(z.object({ key: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(settings).where(eq(settings.key, input.key));
      return { ok: true };
    }),
  },

  campaigns: {
    list: adminQuery.query(() => getDb().select().from(campaigns).orderBy(asc(campaigns.sortOrder))),
    create: adminQuery
      .input(
        z.object({
          slug: z.string().min(1),
          type: z.enum(["hero", "campaign"]),
            layout: z.enum(["split", "overlay", "product-grid"]).optional(),
          eyebrow: z.string().optional().nullable(),
          heading: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
          ctaLabel: z.string().optional().nullable(),
          ctaUrl: z.string().optional().nullable(),
          image: z.string().optional().nullable(),
          bgColor: z.string().optional().nullable(),
          badge: z.string().optional().nullable(),
          discountRibbon: z.string().optional().nullable(),
          oldPrice: z.number().optional().nullable(),
          price: z.number().optional().nullable(),
          brandSlug: z.string().optional().nullable(),
          brandLabel: z.string().optional().nullable(),
          brandBadge: z.string().optional().nullable(),
          products: z.any().optional().nullable(),
          bgConfig: z.any().optional().nullable(),
          styles: z.any().optional().nullable(),
          sortOrder: z.number().int().default(0),
          endsAt: z.string().optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        const [row] = await getDb()
          .insert(campaigns)
          .values({ ...input, endsAt: input.endsAt ? new Date(input.endsAt) : null })
          .returning();
        return row;
      }),
    update: adminQuery
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            slug: z.string().min(1).optional(),
            type: z.enum(["hero", "campaign"]).optional(),
          layout: z.enum(["split", "overlay", "product-grid"]).optional(),
            eyebrow: z.string().optional().nullable(),
            heading: z.string().optional().nullable(),
            description: z.string().optional().nullable(),
            ctaLabel: z.string().optional().nullable(),
            ctaUrl: z.string().optional().nullable(),
            image: z.string().optional().nullable(),
            bgColor: z.string().optional().nullable(),
            badge: z.string().optional().nullable(),
            discountRibbon: z.string().optional().nullable(),
            oldPrice: z.number().optional().nullable(),
            price: z.number().optional().nullable(),
            brandSlug: z.string().optional().nullable(),
            brandLabel: z.string().optional().nullable(),
            brandBadge: z.string().optional().nullable(),
            products: z.any().optional().nullable(),
            bgConfig: z.any().optional().nullable(),
            styles: z.any().optional().nullable(),
            sortOrder: z.number().int().optional(),
            endsAt: z.string().optional().nullable(),
            active: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const set: Record<string, unknown> = { ...data };
        if (data.endsAt !== undefined) set.endsAt = data.endsAt ? new Date(data.endsAt) : null;
        const [row] = await getDb().update(campaigns).set(set).where(eq(campaigns.id, id)).returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(campaigns).where(eq(campaigns.id, input.id));
      return { ok: true };
    }),
  },

  storeLocations: {
    list: adminQuery.query(() => getDb().select().from(storeLocations).orderBy(asc(storeLocations.sortOrder))),
    create: adminQuery
      .input(
        z.object({
          name: z.string().min(1),
          city: z.string().min(1),
          address: z.string().min(1),
          phone: z.string().optional().nullable(),
          hours: z.object({ monSat: z.string(), sun: z.string() }).optional(),
          image: z.string().optional().nullable(),
          mapsUrl: z.string().optional().nullable(),
          isPickupPoint: z.boolean().optional(),
          sortOrder: z.number().int().default(0),
        }),
      )
      .mutation(async ({ input }) => {
        const [row] = await getDb().insert(storeLocations).values(input).returning();
        return row;
      }),
    update: adminQuery
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().min(1).optional(),
            city: z.string().min(1).optional(),
            address: z.string().min(1).optional(),
            phone: z.string().optional().nullable(),
            hours: z.object({ monSat: z.string(), sun: z.string() }).optional(),
            image: z.string().optional().nullable(),
            mapsUrl: z.string().optional().nullable(),
            isPickupPoint: z.boolean().optional(),
            sortOrder: z.number().int().optional(),
            active: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const [row] = await getDb().update(storeLocations).set(data).where(eq(storeLocations.id, id)).returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(storeLocations).where(eq(storeLocations.id, input.id));
      return { ok: true };
    }),
  },

  quoteRequests: {
    list: adminQuery.query(() => getDb().select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt))),
    setStatus: adminQuery
      .input(z.object({ id: z.string(), status: z.enum(["new", "contacted", "done"]) }))
      .mutation(async ({ input }) => {
        const [row] = await getDb()
          .update(quoteRequests)
          .set({ status: input.status })
          .where(eq(quoteRequests.id, input.id))
          .returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(quoteRequests).where(eq(quoteRequests.id, input.id));
      return { ok: true };
    }),
  },

  newsletter: {
    list: adminQuery.query(() =>
      getDb().select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)),
    ),
  },

  // ===== Blog Posts =====
  blog: {
    list: adminQuery.query(() =>
      getDb().select().from(blogPosts).orderBy(desc(blogPosts.createdAt)),
    ),
    bySlug: adminQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const [post] = await getDb().select().from(blogPosts).where(eq(blogPosts.slug, input.slug));
      return post ?? null;
    }),
    create: adminQuery
      .input(
        z.object({
          slug: z.string().min(1),
          title: z.string().min(1),
          excerpt: z.string().optional().nullable(),
          body: z.string().optional().nullable(),
          coverImage: z.string().optional().nullable(),
          categorySlug: z.string().optional().nullable(),
          tags: z.array(z.string()).optional().nullable(),
          status: z.enum(["draft", "published", "archived"]).optional(),
          seoTitle: z.string().optional().nullable(),
          seoDescription: z.string().optional().nullable(),
          authorName: z.string().optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        const [row] = await getDb()
          .insert(blogPosts)
          .values({
            ...input,
            publishedAt: input.status === "published" ? new Date() : null,
          })
          .returning();
        return row;
      }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) => {
        const setData: Record<string, unknown> = { ...input.data, updatedAt: new Date() };
        if (input.data.status === "published" && !input.data.publishedAt) {
          setData.publishedAt = new Date();
        }
        const [row] = await getDb()
          .update(blogPosts)
          .set(setData)
          .where(eq(blogPosts.id, input.id))
          .returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { ok: true };
    }),
  },

  // ===== Blog Categories =====
  blogCategories: {
    list: adminQuery.query(() =>
      getDb().select().from(blogCategories).orderBy(asc(blogCategories.name)),
    ),
    create: adminQuery
      .input(z.object({ slug: z.string().min(1), name: z.string().min(1), description: z.string().optional().nullable() }))
      .mutation(async ({ input }) => {
        const [row] = await getDb().insert(blogCategories).values(input).returning();
        return row;
      }),
    update: adminQuery
      .input(z.object({ id: z.string(), data: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) => {
        const [row] = await getDb()
          .update(blogCategories)
          .set(input.data)
          .where(eq(blogCategories.id, input.id))
          .returning();
        return row;
      }),
    delete: adminQuery.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await getDb().delete(blogCategories).where(eq(blogCategories.id, input.id));
      return { ok: true };
    }),
  },
});