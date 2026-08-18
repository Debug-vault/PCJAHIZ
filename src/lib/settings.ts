import { trpc } from "@/providers/trpc";

export type StoreSettings = {
  storeName: string;
  storeLogo: string | null;
  storeFavicon: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  themeAccent: string;
  themeAccent2: string;
  marqueeEnabled: boolean;
  marqueeItems: { fr: string; ar: string }[];
  marqueeBg: string;
  marqueeText: string;
  homeHero: { align: string; showCtas: boolean; minHeight: number; showStats: boolean };
  homeProducts: { count: number; columns: number; showNew: boolean; showViewAll: boolean; showFeatured: boolean };
  homeBrandsMarquee: { show: boolean; speed: number; sepColor: string; logoHeight: number };
  homeTrust: { show: boolean; columns: number };
  aiEnabled: boolean;
  codEnabled: boolean;
  taxRate: { rate: number } | null;
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "PC Jahiz",
  storeLogo: null,
  storeFavicon: null,
  contactPhone: "+212 6 00 00 00 00",
  contactEmail: "contact@pcjahiz.ma",
  themeAccent: "#FDD502",
  themeAccent2: "#0c2a6e",
  marqueeEnabled: true,
  marqueeItems: [
    { fr: "Livraison 24-48h partout au Maroc", ar: "التوصيل 24-48 ساعة في جميع أنحاء المغرب" },
    { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
    { fr: "Prix en dirham", ar: "الأسعار بالدرهم" },
    { fr: "Échange sous 7 jours", ar: "الإرجاع خلال 7 أيام" },
  ],
  marqueeBg: "#FDD502",
  marqueeText: "#1b1b1f",
  homeHero: { align: "left", showCtas: true, minHeight: 0, showStats: false },
  homeProducts: { count: 8, columns: 4, showNew: true, showViewAll: true, showFeatured: true },
  homeBrandsMarquee: { show: true, speed: 75, sepColor: "", logoHeight: 55 },
  homeTrust: { show: false, columns: 3 },
  aiEnabled: false,
  codEnabled: true,
  taxRate: { rate: 20 },
};

function readBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "object" && v !== null && "value" in v) return readBool((v as { value: unknown }).value, fallback);
  return fallback;
}

function readStr(v: unknown, fallback: string): string {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "value" in v) {
    const inner = (v as { value: unknown }).value;
    return typeof inner === "string" ? inner : fallback;
  }
  return fallback;
}

export function normalizeSettings(raw: Record<string, unknown> | undefined): StoreSettings {
  if (!raw) return DEFAULT_SETTINGS;
  return {
    storeName: readStr(raw.storeName, DEFAULT_SETTINGS.storeName),
    storeLogo: readStr(raw.storeLogo, "") || null,
    storeFavicon: readStr(raw.storeFavicon, "") || null,
    contactPhone: readStr(raw.contactPhone, "") || null,
    contactEmail: readStr(raw.contactEmail, "") || null,
    themeAccent: readStr(raw.themeAccent, DEFAULT_SETTINGS.themeAccent),
    themeAccent2: readStr(raw.themeAccent2, DEFAULT_SETTINGS.themeAccent2),
    marqueeEnabled: readBool(raw.marqueeEnabled, DEFAULT_SETTINGS.marqueeEnabled),
    marqueeItems: Array.isArray(raw.marqueeItems) ? raw.marqueeItems : DEFAULT_SETTINGS.marqueeItems,
    marqueeBg: readStr(raw.marqueeBg, DEFAULT_SETTINGS.marqueeBg),
    marqueeText: readStr(raw.marqueeText, DEFAULT_SETTINGS.marqueeText),
    homeHero: { ...DEFAULT_SETTINGS.homeHero, ...(raw.homeHero as object) },
    homeProducts: { ...DEFAULT_SETTINGS.homeProducts, ...(raw.homeProducts as object) },
    homeBrandsMarquee: { ...DEFAULT_SETTINGS.homeBrandsMarquee, ...(raw.homeBrandsMarquee as object) },
    homeTrust: { ...DEFAULT_SETTINGS.homeTrust, ...(raw.homeTrust as object) },
    aiEnabled: readBool(raw.aiEnabled, DEFAULT_SETTINGS.aiEnabled),
    codEnabled: readBool(raw.codEnabled, DEFAULT_SETTINGS.codEnabled),
    taxRate: (raw.taxRate as { rate?: number } | null)?.rate != null ? { rate: Number((raw.taxRate as { rate: number }).rate) } : DEFAULT_SETTINGS.taxRate,
  };
}

export function useStoreSettings(): { settings: StoreSettings; isLoading: boolean } {
  const { data, isLoading } = trpc.shop.settings.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  return { settings: normalizeSettings(data as Record<string, unknown>), isLoading };
}