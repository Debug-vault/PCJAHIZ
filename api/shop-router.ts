import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  products,
  categories,
  brands,
  orders,
  orderItems,
  reviews,
  wishlist,
  shippingZones,
  promoCodes,
  settings,
  campaigns,
  storeLocations,
  newsletterSubscribers,
  quoteRequests,
  blogPosts,
  blogCategories,
} from "@db/schema";
import { eq, and, desc, asc, or, ilike, gte, lte, inArray, ne, sql, isNotNull, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";

const listInput = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["price-asc", "price-desc", "newest", "popular"]).optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

function productCard(p: typeof products.$inferSelect) {
  const img = Array.isArray(p.images) && p.images.length ? p.images[0] : p.img;
  return {
    id: p.id,
    slug: p.slug,
    nameFr: p.nameFr,
    summaryFr: p.summaryFr,
    descriptionFr: p.descriptionFr,
    price: p.price,
    oldPrice: p.oldPrice,
    discount: p.discount,
    img,
    brandSlug: p.brandSlug,
    categorySlug: p.categorySlug,
    stock: p.stock,
    featured: p.featured,
    isNew: p.isNew,
    popularity: p.popularity,
    warrantyMonths: p.warrantyMonths,
    specs: (Array.isArray(p.specs) ? p.specs : []) as { k: string; v: string }[],
  };
}

export const shopRouter = createRouter({
  categories: publicQuery.query(async () => {
    const cats = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.deck), asc(categories.sortOrder));
    const prodRows = await getDb()
      .select({ slug: products.categorySlug })
      .from(products)
      .where(eq(products.active, true));
    const direct: Record<string, number> = {};
    for (const r of prodRows) {
      if (r.slug) direct[r.slug] = (direct[r.slug] ?? 0) + 1;
    }
    const totalFor = (slug: string): number => {
      let t = direct[slug] ?? 0;
      for (const c of cats) if (c.parentSlug === slug) t += totalFor(c.slug);
      return t;
    };
    return cats.map((c) => ({ ...c, productCount: totalFor(c.slug) }));
  }),

  brands: publicQuery.query(() =>
    getDb()
      .select()
      .from(brands)
      .where(eq(brands.active, true))
      .orderBy(asc(brands.name)),
  ),

  marqueeBrands: publicQuery.query(() =>
    getDb()
      .select()
      .from(brands)
      .where(and(eq(brands.active, true), eq(brands.showInMarquee, true)))
      .orderBy(asc(brands.sortOrder)),
  ),

  brandCategories: publicQuery.query(async () => {
    const rows = await getDb()
      .selectDistinct({ brandSlug: products.brandSlug, categorySlug: products.categorySlug })
      .from(products)
      .where(and(eq(products.active, true), isNotNull(products.brandSlug)));
    return rows as { brandSlug: string; categorySlug: string }[];
  }),

  settings: publicQuery.query(async () => {
    const rows = await getDb().select().from(settings).orderBy(asc(settings.key));
    const map: Record<string, unknown> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const [prodCount] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.active, true));
    const [brandCount] = await db.select({ n: sql<number>`count(*)::int` }).from(brands).where(eq(brands.active, true));
    const [catCount] = await db.select({ n: sql<number>`count(*)::int` }).from(categories).where(eq(categories.active, true));
    const [orderCount] = await db.select({ n: sql<number>`count(*)::int` }).from(orders);
    const [reviewAvg] = await db.select({ avg: sql<number>`coalesce(avg(${reviews.rating}), 4.6)::numeric(2,1)` }).from(reviews);
    const [reviewCount] = await db.select({ n: sql<number>`count(*)::int` }).from(reviews);
    return {
      products: prodCount?.n ?? 0,
      brands: brandCount?.n ?? 0,
      categories: catCount?.n ?? 0,
      orders: orderCount?.n ?? 0,
      rating: Number(reviewAvg?.avg ?? 4.6),
      reviews: reviewCount?.n ?? 0,
    };
  }),

  list: publicQuery.input(listInput).query(async ({ input }) => {
    const conds: (SQL | undefined)[] = [eq(products.active, true)];
    if (input.category) {
      const allCats = await getDb()
        .select({ slug: categories.slug, parentSlug: categories.parentSlug })
        .from(categories);
      const slugsFor = (root: string): string[] => {
        const out = [root];
        for (const c of allCats) if (c.parentSlug === root) out.push(...slugsFor(c.slug));
        return out;
      };
      conds.push(inArray(products.categorySlug, slugsFor(input.category)));
    }
    if (input.brand) conds.push(eq(products.brandSlug, input.brand));
    if (input.minPrice != null) conds.push(gte(products.price, input.minPrice));
    if (input.maxPrice != null) conds.push(lte(products.price, input.maxPrice));
    if (input.q) {
      const q = `${input.q}%`;
      conds.push(or(ilike(products.nameFr, q), ilike(products.summaryFr, q)));
    }
    const order =
      input.sort === "price-asc"
        ? asc(products.price)
        : input.sort === "price-desc"
          ? desc(products.price)
          : input.sort === "newest"
            ? desc(products.createdAt)
            : desc(products.popularity);
    const rows = await getDb()
      .select()
      .from(products)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(order)
      .limit(input.limit ?? 200);
    return rows.map(productCard);
  }),

  featured: publicQuery.query(() =>
    getDb()
      .select()
      .from(products)
      .where(and(eq(products.featured, true), eq(products.active, true)))
      .orderBy(desc(products.popularity))
      .limit(12),
  ),

  newest: publicQuery.query(() =>
    getDb()
      .select()
      .from(products)
      .where(and(eq(products.isNew, true), eq(products.active, true)))
      .orderBy(desc(products.createdAt))
      .limit(12),
  ),

  search: publicQuery
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ input }) => {
      const q = `%${input.q}%`;
      const rows = await getDb()
        .select()
        .from(products)
        .where(and(eq(products.active, true), or(ilike(products.nameFr, q), ilike(products.summaryFr, q))))
        .orderBy(desc(products.popularity))
        .limit(12);
      return rows.map(productCard);
    }),

  bySlug: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = getDb();
    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, input.slug), eq(products.active, true)),
      with: { reviews: true },
    });
    if (!product) return null;
    const similarConds = [eq(products.active, true), ne(products.slug, product.slug)];
    if (product.categorySlug) similarConds.push(eq(products.categorySlug, product.categorySlug));
    const similar = await db
      .select()
      .from(products)
      .where(and(...similarConds))
      .limit(4);
    const productReviews = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt));
    return {
      product: { ...product, images: Array.isArray(product.images) ? product.images : product.img ? [product.img] : [] },
      similar: similar.map(productCard),
      reviews: productReviews,
    };
  }),

  byIds: publicQuery.input(z.object({ ids: z.array(z.string()) })).query(async ({ input }) => {
    if (!input.ids.length) return [];
    const rows = await getDb().select().from(products).where(inArray(products.id, input.ids));
    return rows.map((p) => ({ ...productCard(p), specs: p.specs, images: p.images }));
  }),

  latestReviews: publicQuery.query(() =>
    getDb()
      .select()
      .from(reviews)
      .where(eq(reviews.status, "approved"))
      .orderBy(desc(reviews.createdAt))
      .limit(6),
  ),

  addReview: authedQuery
    .input(
      z.object({
        productId: z.string(),
        city: z.string().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().min(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(reviews).values({
        productId: input.productId,
        userId: ctx.user.id,
        author: ctx.user.name,
        city: input.city ?? null,
        rating: input.rating,
        comment: input.comment,
        status: "approved",
      });
      return { ok: true };
    }),

  shipping: publicQuery.query(() =>
    getDb()
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.active, true))
      .orderBy(asc(shippingZones.sortOrder)),
  ),

  campaigns: publicQuery.query(() =>
    getDb()
      .select()
      .from(campaigns)
      .where(eq(campaigns.active, true))
      .orderBy(asc(campaigns.sortOrder)),
  ),

  storeLocations: publicQuery.query(() =>
    getDb()
      .select()
      .from(storeLocations)
      .where(eq(storeLocations.active, true))
      .orderBy(asc(storeLocations.sortOrder)),
  ),

  subscribeNewsletter: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const existing = await getDb().query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, input.email.toLowerCase()),
      });
      if (existing) return { ok: true, already: true };
      await getDb().insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
      });
      return { ok: true, already: false };
    }),

  createQuoteRequest: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        details: z.string().min(10).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(quoteRequests).values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        details: input.details ?? null,
      });
      return { ok: true };
    }),

  validatePromo: publicQuery
    .input(z.object({ code: z.string(), subtotal: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const promo = await db.query.promoCodes.findFirst({
        where: eq(promoCodes.code, input.code.toUpperCase()),
      });
      if (!promo) return { ok: false, reason: "not_found" };
      if (!promo.active) return { ok: false, reason: "inactive" };
      const now = new Date();
      if (promo.startsAt && now < promo.startsAt) return { ok: false, reason: "not_started" };
      if (promo.endsAt && now > promo.endsAt) return { ok: false, reason: "expired" };
      if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
        return { ok: false, reason: "limit_reached" };
      }
      if (promo.minOrder != null && input.subtotal < promo.minOrder) {
        return { ok: false, reason: "min_order" };
      }
      const discount =
        promo.type === "percent"
          ? Math.round((input.subtotal * promo.value) / 100)
          : promo.value;
      const capped = promo.maxDiscount != null ? Math.min(discount, promo.maxDiscount) : discount;
      return { ok: true, promo, discount: Math.min(capped, input.subtotal) };
    }),

  createOrder: publicQuery
    .input(
      z.object({
        customerName: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().min(8),
        city: z.string().min(2),
        region: z.string().optional(),
        address: z.string().min(5),
        notes: z.string().optional(),
        payment: z.enum(["cod"]),
        promoCode: z.string().optional(),
        items: z.array(z.object({ productId: z.string(), qty: z.number().min(1) })).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const prods = await db
        .select()
        .from(products)
        .where(inArray(products.id, input.items.map((i) => i.productId)));
      const subtotal = input.items.reduce((sum, item) => {
        const p = prods.find((pr) => pr.id === item.productId);
        return sum + (p ? p.price * item.qty : 0);
      }, 0);

      const zones = await db
        .select()
        .from(shippingZones)
        .where(eq(shippingZones.active, true));
      const cityNorm = input.city.trim().toLowerCase();
      const zone =
        zones.find((z) => {
          if (z.name.toLowerCase() === cityNorm) return true;
          return Array.isArray(z.cities) && z.cities.some((c) => String(c).toLowerCase() === cityNorm);
        }) ?? zones.find((z) => z.name.toLowerCase() === "autres villes");
      const shippingFee = zone?.fee ?? 39;
      const freeThreshold = zone?.freeThreshold ?? null;
      const effectiveShipping = freeThreshold != null && subtotal >= freeThreshold ? 0 : shippingFee;

      let discount = 0;
      if (input.promoCode) {
        const promo = await db.query.promoCodes.findFirst({
          where: eq(promoCodes.code, input.promoCode.toUpperCase()),
        });
        if (promo && promo.active) {
          discount =
            promo.type === "percent"
              ? Math.round((subtotal * promo.value) / 100)
              : promo.value;
          if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount);
          discount = Math.min(discount, subtotal);
          await db
            .update(promoCodes)
            .set({ usedCount: promo.usedCount + 1 })
            .where(eq(promoCodes.id, promo.id));
        }
      }

      const total = subtotal + effectiveShipping - discount;
      const ref = `JHZ-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const [{ id: orderId }] = await db
        .insert(orders)
        .values({
          ref,
          userId: ctx.user?.id ?? null,
          customerName: input.customerName,
          email: input.email ?? null,
          phone: input.phone,
          city: input.city,
          region: input.region ?? null,
          address: input.address,
          notes: input.notes ?? null,
          subtotal,
          shippingFee: effectiveShipping,
          discount,
          total,
          payment: "cod",
          paymentStatus: "pending",
          promoCode: input.promoCode?.toUpperCase() ?? null,
        })
        .returning({ id: orders.id });

      await db.insert(orderItems).values(
        input.items.map((item) => {
          const p = prods.find((pr) => pr.id === item.productId)!;
          return {
            orderId,
            productId: item.productId,
            sku: p?.sku ?? null,
            nameFr: p?.nameFr ?? "Module",
            unitPrice: p?.price ?? 0,
            quantity: item.qty,
            total: (p?.price ?? 0) * item.qty,
          };
        }),
      );

      return { ref, total, orderId };
    }),

  myOrders: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, ctx.user.id))
      .orderBy(desc(orders.createdAt));
    const withItems = await Promise.all(
      myOrders.map(async (o) => ({
        ...o,
        items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
      })),
    );
    return withItems;
  }),

  orderByRef: publicQuery
    .input(z.object({ ref: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.ref, input.ref.toUpperCase()),
        with: { items: true },
      });
      if (!order) return null;
      return order;
    }),

  myWishlist: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(wishlist).where(eq(wishlist.userId, ctx.user.id));
    if (!rows.length) return [];
    const prods = await db.select().from(products).where(inArray(products.id, rows.map((r) => r.productId)));
    return prods.map(productCard);
  }),

  toggleWishlist: authedQuery
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.wishlist.findFirst({
        where: and(eq(wishlist.userId, ctx.user.id), eq(wishlist.productId, input.productId)),
      });
      if (existing) {
        await db.delete(wishlist).where(eq(wishlist.id, existing.id));
        return { wished: false };
      }
      await db.insert(wishlist).values({ userId: ctx.user.id, productId: input.productId });
      return { wished: true };
    }),

  bestSellers: publicQuery
    .input(z.object({ category: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const conds: SQL[] = [eq(products.active, true)];
      if (input?.category) {
        const allCats = await getDb()
          .select({ slug: categories.slug, parentSlug: categories.parentSlug })
          .from(categories);
        const slugsFor = (root: string): string[] => {
          const out = [root];
          for (const c of allCats) if (c.parentSlug === root) out.push(...slugsFor(c.slug));
          return out;
        };
        conds.push(inArray(products.categorySlug, slugsFor(input.category)));
      }
      const rows = await getDb()
        .select()
        .from(products)
        .where(and(...conds))
        .orderBy(desc(products.popularity))
        .limit(input?.limit ?? 50);
      return rows.map(productCard);
    }),

  bestSellerCategories: publicQuery.query(async () => {
    const allCats = await getDb()
      .select({ slug: categories.slug, nameFr: categories.nameFr, parentSlug: categories.parentSlug })
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    const topLevel = allCats.filter((c) => !c.parentSlug);
    const results: { slug: string; nameFr: string; count: number }[] = [];
    for (const cat of topLevel) {
      const childSlugs = [cat.slug, ...allCats.filter((c) => c.parentSlug === cat.slug).map((c) => c.slug)];
      const [{ count }] = await getDb()
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(and(inArray(products.categorySlug, childSlugs), eq(products.active, true)));
      if (count > 0) results.push({ slug: cat.slug, nameFr: cat.nameFr, count });
    }
    return results;
  }),

  // ===== Blog (public) =====
  blog: publicQuery.query(() =>
    getDb()
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt)),
  ),
  blogBySlug: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const [post] = await getDb()
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.status, "published")));
    return post ?? null;
  }),
  blogCategories: publicQuery.query(() => getDb().select().from(blogCategories)),
});