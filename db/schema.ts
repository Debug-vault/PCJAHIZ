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
export const paymentMethodEnum = pgEnum("payment_method", ["cod"]);
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
    description: text("description"),
    seoTitleFr: text("seoTitleFr"),
    seoDescriptionFr: text("seoDescriptionFr"),
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
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
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
    summaryFr: text("summaryFr"),
    descriptionFr: text("descriptionFr"),
    seoTitleFr: text("seoTitleFr"),
    seoDescriptionFr: text("seoDescriptionFr"),
    faqFr: jsonb("faqFr"),
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
    sectionsFr: jsonb("sectionsFr"),
    variants: jsonb("variants"),
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

// ===== Campaigns (hero slides + featured campaign cards) =====
export const campaignTypeEnum = pgEnum("campaign_type", ["hero", "campaign"]);

export const campaigns = pgTable("jhz_campaigns", {
  id: text("id").primaryKey().default(uid()),
  slug: text("slug").notNull().unique(),
  type: campaignTypeEnum("type").notNull().default("hero"),
  layout: text("layout").notNull().default("split"),
  eyebrow: text("eyebrow"),
  heading: text("heading"),
  description: text("description"),
  ctaLabel: text("ctaLabel"),
  ctaUrl: text("ctaUrl"),
  image: text("image"),
  bgColor: text("bgColor"),
  badge: text("badge"),
  discountRibbon: text("discountRibbon"),
  oldPrice: integer("oldPrice"),
  price: integer("price"),
  brandSlug: text("brandSlug"),
  brandLabel: text("brandLabel"),
  brandBadge: text("brandBadge"),
  products: jsonb("products"),
  bgConfig: jsonb("bgConfig"),
  styles: jsonb("styles"),
  sortOrder: integer("sortOrder").notNull().default(0),
  endsAt: timestamp("endsAt"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;

// ===== Store locations =====
export const storeLocations = pgTable("jhz_store_locations", {
  id: text("id").primaryKey().default(uid()),
  name: text("name").notNull().unique(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  hours: jsonb("hours"),
  image: text("image"),
  mapsUrl: text("mapsUrl"),
  isPickupPoint: boolean("isPickupPoint").notNull().default(false),
  sortOrder: integer("sortOrder").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoreLocation = typeof storeLocations.$inferSelect;

// ===== Newsletter subscribers =====
export const newsletterSubscribers = pgTable("jhz_newsletter_subscribers", {
  id: text("id").primaryKey().default(uid()),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// ===== Loyalty members =====
export const loyaltyMembers = pgTable("jhz_loyalty_members", {
  id: text("id").primaryKey().default(uid()),
  userId: text("userId").notNull(),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("classic"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LoyaltyMember = typeof loyaltyMembers.$inferSelect;

// ===== Quote requests (devis) =====
export const quoteStatusEnum = pgEnum("quote_status", ["new", "contacted", "done"]);

export const quoteRequests = pgTable("jhz_quote_requests", {
  id: text("id").primaryKey().default(uid()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  details: text("details"),
  status: quoteStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;

// ===== Blog =====
export const blogStatusEnum = pgEnum("blog_status", ["draft", "published", "archived"]);

export const blogCategories = pgTable("jhz_blog_categories", {
  id: text("id").primaryKey().default(uid()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogCategory = typeof blogCategories.$inferSelect;

export const blogPosts = pgTable(
  "jhz_blog_posts",
  {
    id: text("id").primaryKey().default(uid()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    coverImage: text("coverImage"),
    categorySlug: text("categorySlug"),
    tags: jsonb("tags"),
    status: blogStatusEnum("status").notNull().default("draft"),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    authorName: text("authorName").default("PC Jahiz"),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => ({
    categoryIdx: index("jhz_blog_cat_idx").on(t.categorySlug),
    statusIdx: index("jhz_blog_status_idx").on(t.status),
  }),
);

export type BlogPost = typeof blogPosts.$inferSelect;
