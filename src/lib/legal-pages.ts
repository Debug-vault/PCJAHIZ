import type { FooterLegalConfig } from "@/lib/settings";

export const LEGAL_PAGE_TYPES = [
  { value: "mentions-legales", label: "Mentions légales", defaultTitle: "Mentions légales", defaultSlug: "mentions-legales" },
  { value: "cgv", label: "CGV", defaultTitle: "Conditions générales de vente", defaultSlug: "conditions-generales-de-vente" },
  { value: "confidentialite", label: "Confidentialité", defaultTitle: "Politique de confidentialité", defaultSlug: "politique-de-confidentialite" },
  { value: "cookies", label: "Cookies", defaultTitle: "Politique de cookies", defaultSlug: "politique-de-cookies" },
  { value: "livraison-retours", label: "Livraison & retours", defaultTitle: "Livraison & retours", defaultSlug: "livraison-et-retours" },
  { value: "garantie", label: "Garantie & SAV", defaultTitle: "Garantie & service après-vente", defaultSlug: "garantie-et-sav" },
  { value: "custom", label: "Custom", defaultTitle: "", defaultSlug: "" },
] as const;

export type LegalPageType = (typeof LEGAL_PAGE_TYPES)[number]["value"];

export type LegalPage = {
  id: string;
  slug: string;
  title: string;
  type: LegalPageType;
  content: string;
  enabled: boolean;
  inFooter: boolean;
  updatedAt: string;
};

export const DEFAULT_LEGAL_PAGES: LegalPage[] = [
  { id: "lp-mentions", slug: "mentions-legales", title: "Mentions légales", type: "mentions-legales", content: "", enabled: false, inFooter: true, updatedAt: "" },
  { id: "lp-cgv", slug: "conditions-generales-de-vente", title: "Conditions générales de vente", type: "cgv", content: "", enabled: false, inFooter: true, updatedAt: "" },
  { id: "lp-confidentialite", slug: "politique-de-confidentialite", title: "Politique de confidentialité", type: "confidentialite", content: "", enabled: false, inFooter: true, updatedAt: "" },
  { id: "lp-cookies", slug: "politique-de-cookies", title: "Politique de cookies", type: "cookies", content: "", enabled: false, inFooter: false, updatedAt: "" },
];

export function legalSlugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeLegalPages(raw: unknown): LegalPage[] {
  const o =
    raw && typeof raw === "object" && "value" in (raw as Record<string, unknown>) && (raw as { value: unknown }).value !== null && typeof (raw as { value: unknown }).value === "object"
      ? (raw as { value: unknown }).value
      : raw;
  if (!o || typeof o !== "object") return DEFAULT_LEGAL_PAGES;
  const pages = (o as Record<string, unknown>).pages;
  if (!Array.isArray(pages)) return DEFAULT_LEGAL_PAGES;
  return pages
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it, i) => {
      const type = LEGAL_PAGE_TYPES.find((t) => t.value === it.type);
      return {
        id: typeof it.id === "string" && it.id ? it.id : `lp-${i}-${Date.now()}`,
        slug: typeof it.slug === "string" && it.slug ? legalSlugify(it.slug) : `page-${i}`,
        title: typeof it.title === "string" ? it.title : "",
        type: (type?.value ?? "custom") as LegalPageType,
        content: typeof it.content === "string" ? it.content : "",
        enabled: it.enabled === true,
        inFooter: it.inFooter === true,
        updatedAt: typeof it.updatedAt === "string" ? it.updatedAt : "",
      };
    });
}

export function sanitizeLegalHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

/** Footer legal-bar links: legal / "#" placeholders are owned by Legal Pages. */
export function syncFooterLegalLinks(pages: LegalPage[], current: FooterLegalConfig): FooterLegalConfig {
  const active = pages.filter((p) => p.enabled && p.inFooter && p.title.trim());
  const legalLinks = active.map((p) => ({ label: p.title, url: `/legal/${p.slug}` }));
  const kept = current.links.filter(
    (l) => !l.url.startsWith("/legal/") && l.url !== "#" && !legalLinks.some((n) => n.url === l.url),
  );
  return { ...current, links: [...legalLinks, ...kept] };
}
