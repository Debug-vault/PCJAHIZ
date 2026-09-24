import { eq, and } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { products, categories, settings } from "@db/schema";
import { env } from "./env";

export type SeoBundle = {
  title: string;
  description: string;
  lang: "fr";
  jsonLd: Record<string, unknown>[];
  noindex?: boolean;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await getDb()
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key));
  const v = rows[0]?.value;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v) {
    const inner = (v as { value: unknown }).value;
    return typeof inner === "string" ? inner : null;
  }
  return null;
}

async function storeInfo() {
  const [name, logo] = await Promise.all([
    getSetting("storeName"),
    getSetting("storeLogo"),
  ]);
  return { name: name ?? env.appName, logo: logo ?? "" };
}

async function isSiteModeActive(): Promise<boolean> {
  try {
    const rows = await getDb()
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "siteMode"));
    const v = rows[0]?.value;
    const o = (v && typeof v === "object" && "value" in v && (v as { value: unknown }).value !== null && typeof (v as { value: unknown }).value === "object"
      ? (v as { value: unknown }).value
      : v) as Record<string, unknown> | null;
    return !!o && typeof o === "object" && o.enabled === true;
  } catch {
    return false;
  }
}

export async function buildSeo(url: URL): Promise<SeoBundle | null> {
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const base = env.appBaseUrl.replace(/\/+$/, "");
  const noindex = await isSiteModeActive();

  const home: SeoBundle = {
    lang: "fr",
    title: "PC Jahiz — High-Tech Maroc",
    description:
      "PC Jahiz — High-tech au Maroc. Prix en dirhams, livraison 24–48h partout au Maroc, paiement à la livraison.",
    jsonLd: [],
    noindex,
  };

  // Home + generic pages get Organization/WebSite schema.
  const orgSchema = async () => {
    const { name, logo } = await storeInfo();
    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url: base,
        logo: logo || undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: name || "PC Jahiz",
        url: base,
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ];
  };
  const applyOrg = async (bundle: SeoBundle): Promise<SeoBundle> => ({
    ...bundle,
    noindex: noindex || bundle.noindex,
    jsonLd: [...bundle.jsonLd, ...(await orgSchema())],
  });

  // /product/:slug
  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    const p = await getDb()
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.active, true)))
      .limit(1);
    const row = p[0];
    if (!row) return null;
    const { name: storeName } = await storeInfo();
    const img = Array.isArray(row.images) && row.images.length ? row.images[0] : row.img;
    return {
      lang: "fr",
      noindex,
      title: `${row.nameFr} — ${storeName}`,
      description: row.summaryFr || `Achetez ${row.nameFr} au Maroc.`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: row.nameFr,
          image: img ? [img] : undefined,
          description: row.summaryFr || undefined,
          sku: row.sku || undefined,
          brand:
            row.brandSlug && row.brandSlug !== "none"
              ? { "@type": "Brand", name: row.brandSlug }
              : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "MAD",
            price: row.price,
            availability: row.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${base}/product/${row.slug}`,
          },
        },
      ],
    };
  }

  // /category/:slug
  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) {
    const c = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.slug, categoryMatch[1]))
      .limit(1);
    const row = c[0];
    if (!row) return null;
    return {
      lang: "fr",
      noindex,
      title: `${row.nameFr} — PC Jahiz`,
      description: row.description || `Découvrez la catégorie ${row.nameFr} chez PC Jahiz.`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: row.nameFr,
          description: row.description || undefined,
          url: `${base}/category/${row.slug}`,
        },
      ],
    };
  }

  // /brand/:slug (admin brand page) — not a public route; skip.
  // /shop
  if (pathname === "/shop" || pathname.startsWith("/shop")) {
    return applyOrg({
      lang: "fr",
      title: "Boutique — PC Jahiz",
      description: "Tous les modules high-tech de la station PC Jahiz, triés par prix, nouveauté ou promo.",
      jsonLd: [],
    });
  }

  if (pathname === "/brands") {
    return applyOrg({
      lang: "fr",
      title: "Marques — PC Jahiz",
      description: "Les marques high-tech en orbite chez PC Jahiz.",
      jsonLd: [],
    });
  }

  if (pathname === "/compare") {
    return applyOrg({
      lang: "fr",
      title: "Console de comparaison — PC Jahiz",
      description: "Comparez 2 à 4 modules high-tech côte à côte.",
      jsonLd: [],
    });
  }

  return applyOrg(home);
}

export function seoHead(bundle: SeoBundle, url: URL): string {
  const base = env.appBaseUrl.replace(/\/+$/, "");
  const canonical = url.pathname === "/" ? base : `${base}${url.pathname}`;
  const safe = {
    title: esc(bundle.title),
    description: esc(bundle.description),
  };
  const jsonLd = bundle.jsonLd
    .filter(Boolean)
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("");

  return [
    `<title>${safe.title}</title>`,
    `<meta name="description" content="${safe.description}" />`,
    bundle.noindex ? `<meta name="robots" content="noindex, nofollow" />` : "",
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<link rel="alternate" hreflang="fr" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${safe.title}" />`,
    `<meta property="og:description" content="${safe.description}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    jsonLd,
  ]
    .filter(Boolean)
    .join("\n    ");
}
