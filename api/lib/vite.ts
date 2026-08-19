import type { Hono, Context } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import fs from "node:fs";
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
    return c.body(html);
  };
}

/**
 * Serves the built SPA from dist/public in production, with an SPA fallback
 * to index.html for client-side routes (non-/api paths). Route-aware SEO
 * metadata (title, description, canonical, hreflang, JSON-LD) is injected
 * into the served HTML.
 */
export function serveStaticFiles(app: Hono<any, any, any>) {
  const distDir = path.resolve(process.cwd(), "dist/public");
  const indexHtml = path.join(distDir, "index.html");
  const spa = makeSpaHandler(indexHtml);

  // Root is matched directly by serveStatic (dir index), so handle it first
  // with the SEO-injected SPA shell, then serve static assets.
  app.get("/", spa);
  app.use("*", serveStatic({ root: distDir }));
  app.get("*", spa);
}