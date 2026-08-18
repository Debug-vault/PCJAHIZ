import { authRouter } from "./auth-router";
import { shopRouter } from "./shop-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  shop: shopRouter,
});

export type AppRouter = typeof appRouter;
