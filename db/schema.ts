import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const uid = () => sql`gen_random_uuid()`;

// ===== Enums =====
export const roleEnum = pgEnum("role", ["customer", "admin"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "cmi"]);
export const orderStatusEnum = pgEnum("order_status", [
  "preparing",
  "in_transit",
  "landed",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const promoTypeEnum = pgEnum("promo_type", ["percent", "fixed"]);

// ===== Users =====
export const users = pgTable("jhz_users", {
  id: text("id").primaryKey().default(uid()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  role: roleEnum("role").default("customer").notNull(),
  locale: text("locale").default("fr").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== Categories =====
export const categories = pgTable(
  "jhz_categories",
  {
    id: text("id").primaryKey().default(uid()),
    slug: text("slug").notNull().unique(),
    nameFr: text("nameFr").notNull(),
    nameAr: text("nameAr").notNull(),
    description: text("description"),
    descriptionAr: text("descriptionAr"),
    seoTitleFr: text("seoTitleFr"),
    seoTitleAr: text("seoTitleAr"),
    seoDescriptionFr: text("seoDescriptionFr"),
    seoDescriptionAr: text("seoDescriptionAr"),
    parentSlug: text("parentSlug"),
    image: text("image"),
    deck: integer("deck").notNull().default(1),
    sortOrder: integer("sortOrder").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    parentIdx: index("jhz_cat_parent_idx").on(t.parentSlug),
  }),
);

export type Category = typeof categories.$inferSelect;

// ===== Brands =====
export const brands = pgTable("jhz_brands", {
  id: text("id").primaryKey().default(uid()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logo: text("logo"),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  seoTitle: text("seoTitle"),
  seoTitleAr: text("seoTitleAr"),
  seoDescription: text("seoDescription"),
  seoDescriptionAr: text("seoDescriptionAr"),
  sortOrder: integer("sortOrder").notNull().default(0),
  showInMarquee: boolean("showInMarquee").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Brand = typeof brands.$inferSelect;

// ===== Products =====
export const products = pgTable(
  "jhz_products",
  {
    id: text("id").primaryKey().default(uid()),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    nameFr: text("nameFr").notNull(),
    nameAr: text("nameAr").notNull(),
    summaryFr: text("summaryFr"),
    summaryAr: text("summaryAr"),
    descriptionFr: text("descriptionFr"),
    descriptionAr: text("descriptionAr"),
    seoTitleFr: text("seoTitleFr"),
    seoTitleAr: text("seoTitleAr"),
    seoDescriptionFr: text("seoDescriptionFr"),
    seoDescriptionAr: text("seoDescriptionAr"),
    faqFr: jsonb("faqFr"),
    faqAr: jsonb("faqAr"),
    aiGeneratedAt: timestamp("aiGeneratedAt"),
    aiPrompt: text("aiPrompt"),
    brandSlug: text("brandSlug"),
    categorySlug: text("categorySlug"),
    price: integer("price").notNull(),
    oldPrice: integer("oldPrice"),
    discount: integer("discount"),
    cost: integer("cost"),
    currency: text("currency").default("MAD").notNull(),
    img: text("img"),
    images: jsonb("images"),
    specs: jsonb("specs"),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("lowStockThreshold").notNull().default(3),
    featured: boolean("featured").notNull().default(false),
    isNew: boolean("isNew").notNull().default(false),
    popularity: integer("popularity").notNull().default(0),
    warrantyMonths: integer("warrantyMonths").notNull().default(12),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => ({
    categoryIdx: index("jhz_prod_cat_idx").on(t.categorySlug),
    brandIdx: index("jhz_prod_brand_idx").on(t.brandSlug),
    activeIdx: index("jhz_prod_active_idx").on(t.active),
  }),
);

export type Product = typeof products.$inferSelect;

// ===== Addresses =====
export const addresses = pgTable(
  "jhz_addresses",
  {
    id: text("id").primaryKey().default(uid()),
    userId: text("userId").notNull(),
    label: text("label").notNull(),
    fullName: text("fullName").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    region: text("region").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    isDefault: boolean("isDefault").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("jhz_addr_user_idx").on(t.userId),
  }),
);

export type Address = typeof addresses.$inferSelect;

// ===== Orders =====
export const orders = pgTable(
  "jhz_orders",
  {
    id: text("id").primaryKey().default(uid()),
    ref: text("ref").notNull().unique(),
    userId: text("userId"),
    customerName: text("customerName").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    region: text("region"),
    address: text("address"),
    notes: text("notes"),
    subtotal: integer("subtotal").notNull().default(0),
    shippingFee: integer("shippingFee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    currency: text("currency").default("MAD").notNull(),
    payment: paymentMethodEnum("payment").notNull().default("cod"),
    paymentStatus: paymentStatusEnum("paymentStatus").notNull().default("pending"),
    status: orderStatusEnum("status").notNull().default("preparing"),
    promoCode: text("promoCode"),
    cmiReference: text("cmiReference"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("jhz_order_user_idx").on(t.userId),
    statusIdx: index("jhz_order_status_idx").on(t.status),
    createdAtIdx: index("jhz_order_created_idx").on(t.createdAt),
  }),
);

export type Order = typeof orders.$inferSelect;

// ===== Order items =====
export const orderItems = pgTable(
  "jhz_order_items",
  {
    id: text("id").primaryKey().default(uid()),
    orderId: text("orderId").notNull(),
    productId: text("productId"),
    sku: text("sku"),
    nameFr: text("nameFr").notNull(),
    nameAr: text("nameAr").notNull(),
    unitPrice: integer("unitPrice").notNull(),
    quantity: integer("quantity").notNull(),
    total: integer("total").notNull(),
  },
  (t) => ({
    orderIdx: index("jhz_item_order_idx").on(t.orderId),
  }),
);

export type OrderItem = typeof orderItems.$inferSelect;

// ===== Shipping zones =====
export const shippingZones = pgTable("jhz_shipping_zones", {
  id: text("id").primaryKey().default(uid()),
  name: text("name").notNull(),
  cities: jsonb("cities"),
  fee: integer("fee").notNull().default(0),
  freeThreshold: integer("freeThreshold"),
  sortOrder: integer("sortOrder").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export type ShippingZone = typeof shippingZones.$inferSelect;

// ===== Promo codes =====
export const promoCodes = pgTable("jhz_promo_codes", {
  id: text("id").primaryKey().default(uid()),
  code: text("code").notNull().unique(),
  type: promoTypeEnum("type").notNull().default("percent"),
  value: integer("value").notNull(),
  minOrder: integer("minOrder"),
  maxDiscount: integer("maxDiscount"),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  usageLimit: integer("usageLimit"),
  usedCount: integer("usedCount").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;

// ===== Reviews =====
export const reviews = pgTable(
  "jhz_reviews",
  {
    id: text("id").primaryKey().default(uid()),
    productId: text("productId").notNull(),
    userId: text("userId"),
    author: text("author").notNull(),
    city: text("city"),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    productIdx: index("jhz_review_prod_idx").on(t.productId),
  }),
);

export type Review = typeof reviews.$inferSelect;

// ===== Wishlist =====
export const wishlist = pgTable(
  "jhz_wishlist",
  {
    id: text("id").primaryKey().default(uid()),
    userId: text("userId").notNull(),
    productId: text("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("jhz_wish_user_idx").on(t.userId),
    unique: uniqueIndex("jhz_wish_user_prod").on(t.userId, t.productId),
  }),
);

export type WishlistItem = typeof wishlist.$inferSelect;

// ===== Settings =====
export const settings = pgTable("jhz_settings", {
  id: text("id").primaryKey().default(uid()),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
});

export type Setting = typeof settings.$inferSelect;
