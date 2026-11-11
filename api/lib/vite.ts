import type { Hono, Context } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSeo, seoHead } from "./seo";

function makeSpaHandler(indexHtml: string) {
  return async (c: Context) => {
    const url = new URL(c.req.url);
    if (url.pathname.startsWith("/api/")) {
      c.status(404);
      return c.body("Not found");
    }
    if (!fs.existsSync(indexHtml)) {
      c.status(404);
      return c.body("Not found");
    }
    let html = fs.readFileSync(indexHtml, "utf8");
    try {
      const seo = await buildSeo(url);
      if (seo) {
        const head = seoHead(seo, url);
        html = html.replace(/<head>/, `<head>\n    ${head}`);
      }
    } catch (err) {
      console.error("[seo] failed to inject metadata:", err);
    }
    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    return c.body(html);
  };
}

/**
 * Serves the built SPA from dist/public in production, with an SPA fallback
 * to index.html for client-side routes (non-/api paths). Route-aware SEO
 * metadata (title, description, canonical, hreflang, JSON-LD) is injected
 * into the served HTML.
 *
 * Cache policy: hashed assets under /assets/* are immutable (long cache);
 * the SPA HTML shell is no-cache so reloads always fetch the latest bundle;
 * missing files with an extension return a real 404 instead of HTML-as-JS,
 * so a stale cached page fails loudly instead of white-screening.
 */
export function serveStaticFiles(app: Hono<any, any, any>) {
  // Prefer the build output next to the bundled entry (dist/boot.js -> dist/public),
  // then fall back to cwd for other launch layouts.
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(moduleDir, "public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  const distDir = candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) ?? candidates[1];
  const indexHtml = path.join(distDir, "index.html");
  const spa = makeSpaHandler(indexHtml);

  // Root is matched directly by serveStatic (dir index), so handle it first
  // with the SEO-injected SPA shell, then serve static assets.
  app.get("/", spa);
  app.use("/assets/*", async (c, next) => {
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    await next();
  });
  app.use("*", serveStatic({ root: distDir }));
  app.get("*", async (c) => {
    const pathname = new URL(c.req.url).pathname;
    if (pathname.includes(".")) {
      c.status(404);
      return c.body("Not found");
    }
    return spa(c);
  });
}