import { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { bootstrapDb } from "./bootstrap";
import { buildSitemap, buildRobots } from "./lib/sitemap";

bootstrapDb();

const app = new Hono<{ Bindings: HttpBindings }>();
app.get("/sitemap.xml", async (c) => {
  c.header("Content-Type", "application/xml; charset=utf-8");
  return c.body(await buildSitemap());
});
app.get("/robots.txt", async (c) => {
  c.header("Content-Type", "text/plain; charset=utf-8");
  return c.body(buildRobots());
});
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
