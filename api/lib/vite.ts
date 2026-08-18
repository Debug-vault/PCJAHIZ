import type { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import fs from "node:fs";

/**
 * Serves the built SPA from dist/public in production, with an SPA fallback
 * to index.html for client-side routes (non-/api paths).
 */
export function serveStaticFiles(app: Hono<any, any, any>) {
  const distDir = path.resolve(process.cwd(), "dist/public");
  const indexHtml = path.join(distDir, "index.html");

  app.use("*", serveStatic({
    root: distDir,
    onNotFound: (_path, c) => {
      const url = new URL(c.req.url);
      if (url.pathname.startsWith("/api/")) {
        c.status(404);
        c.body("Not found");
        return;
      }
      if (fs.existsSync(indexHtml)) {
        c.header("Content-Type", "text/html; charset=utf-8");
        c.body(fs.readFileSync(indexHtml, "utf8"));
        return;
      }
      c.status(404);
      c.body("Not found");
    },
  }));
}