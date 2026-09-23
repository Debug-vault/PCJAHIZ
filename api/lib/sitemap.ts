import { asc, eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { products, categories, brands } from "@db/schema";
import { env } from "./env";

const STATIC_PATHS = ["/", "/shop", "/brands", "/compare"];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function buildSitemap(): Promise<string> {
  const base = env.appBaseUrl.replace(/\/+$/, "");

  const [prods, cats, brs] = await Promise.all([
    getDb().select({ slug: products.slug }).from(products).where(eq(products.active, true)).orderBy(asc(products.slug)),
    getDb().select({ slug: categories.slug }).from(categories).where(eq(categories.active, true)).orderBy(asc(categories.slug)),
    getDb().select({ slug: brands.slug }).from(brands).orderBy(asc(brands.slug)),
  ]);

  const urls: string[] = [];
  const push = (loc: string) => {
    const full = `${base}${loc}`;
    urls.push(
      `<url><loc>${esc(full)}</loc><changefreq>daily</changefreq><xhtml:link rel="alternate" hreflang="fr" href="${esc(full)}"/></url>`,
    );
  };

  for (const p of STATIC_PATHS) push(p);
  for (const p of prods) push(`/product/${p.slug}`);
  for (const c of cats) push(`/category/${c.slug}`);
  for (const b of brs) push(`/brand/${b.slug}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
}

export function buildRobots(): string {
  const base = env.appBaseUrl.replace(/\/+$/, "");
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /account
Disallow: /checkout
Disallow: /order-success/

Sitemap: ${base}/sitemap.xml
`;
}