import { relations } from "drizzle-orm";
import {
  users,
  categories,
  brands,
  products,
  addresses,
  orders,
  orderItems,
  reviews,
  wishlist,
  shippingZones,
  promoCodes,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlist: many(wishlist),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlist: many(wishlist),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, { fields: [wishlist.userId], references: [users.id] }),
  product: one(products, { fields: [wishlist.productId], references: [products.id] }),
}));

export const shippingZonesRelations = relations(shippingZones, () => ({}));
export const promoCodesRelations = relations(promoCodes, () => ({}));
