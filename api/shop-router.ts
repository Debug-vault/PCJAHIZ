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
} from "@db/schema";
import { eq, and, desc, asc, or, ilike, gte, lte, inArray, ne, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "./lib/env";

const listInput = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["price-asc", "price-desc", "newest", "popular"]).optional(),
});

function productCard(p: typeof products.$inferSelect) {
  const img = Array.isArray(p.images) && p.images.length ? p.images[0] : p.img;
  return {
    id: p.id,
    slug: p.slug,
    nameFr: p.nameFr,
    nameAr: p.nameAr,
    summaryFr: p.summaryFr,
    summaryAr: p.summaryAr,
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
  };
}

export const shopRouter = createRouter({
  categories: publicQuery.query(() =>
    getDb()
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.deck), asc(categories.sortOrder)),
  ),

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

  settings: publicQuery.query(async () => {
    const rows = await getDb().select().from(settings).orderBy(asc(settings.key));
    const map: Record<string, unknown> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }),

  list: publicQuery.input(listInput).query(async ({ input }) => {
    const conds: (SQL | undefined)[] = [eq(products.active, true)];
    if (input.category) conds.push(eq(products.categorySlug, input.category));
    if (input.brand) conds.push(eq(products.brandSlug, input.brand));
    if (input.minPrice != null) conds.push(gte(products.price, input.minPrice));
    if (input.maxPrice != null) conds.push(lte(products.price, input.maxPrice));
    if (input.q) {
      const q = `%${input.q}%`;
      conds.push(or(ilike(products.nameFr, q), ilike(products.nameAr, q)));
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
      .orderBy(order);
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
        .where(and(eq(products.active, true), or(ilike(products.nameFr, q), ilike(products.nameAr, q))))
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
    return rows.map(productCard);
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

  paymentConfig: publicQuery.query(() => ({
    cod: true,
    cmi: Boolean(env.cmiMerchantId && env.cmiStoreKey),
    cmiShopName: env.cmiShopName,
    cmiApiUrl: env.cmiApiUrl,
  })),

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
        payment: z.enum(["cod", "cmi"]),
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
          payment: input.payment,
          paymentStatus: input.payment === "cmi" ? "pending" : "pending",
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
            nameAr: p?.nameAr ?? "وحدة",
            unitPrice: p?.price ?? 0,
            quantity: item.qty,
            total: (p?.price ?? 0) * item.qty,
          };
        }),
      );

      if (input.payment === "cmi") {
        // CMI form payload — client builds the redirected form.
        const { createCmiFormParams } = await import("./cmi");
        const params = await createCmiFormParams({
          orderRef: ref,
          amount: total,
          currency: "504",
          shopName: env.cmiShopName,
        });
        return { ref, total, orderId, cmiParams: params };
      }

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
});