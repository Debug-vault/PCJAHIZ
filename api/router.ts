import { authRouter } from "./auth-router";
import { shopRouter } from "./shop-router";
import { aiRouter } from "./ai-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  shop: shopRouter,
  ai: aiRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
