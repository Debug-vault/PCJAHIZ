import { trpc } from "@/providers/trpc";
import type { HeroGlobalStyle } from "@/lib/hero";

export type HeaderItem = {
  id: string;
  text: string;
  link: string;
  icon: string | null;
  enabled: boolean;
  type: "link" | "button" | "menu" | "categories";
  children?: HeaderItem[];
};

export type HeaderSliderItem = {
  id: string;
  text: string;
  link: string;
  icon: string | null;
  image: string | null;
  textColor: string | null;
  textSize: number | null;
  iconColor: string | null;
  iconGlow: boolean;
  iconShadow: boolean;
};

export type IconFx = { iconColor: string | null; iconGlow: boolean; iconShadow: boolean };

export function iconFxStyle(fx: IconFx): { color?: string; filter?: string } {
  const filters: string[] = [];
  if (fx.iconGlow) filters.push(`drop-shadow(0 0 6px ${fx.iconColor || "rgba(252,212,6,0.9)"})`);
  if (fx.iconShadow) filters.push("drop-shadow(0 2px 4px rgba(0,0,0,0.45))");
  return {
    color: fx.iconColor || undefined,
    filter: filters.length ? filters.join(" ") : undefined,
  };
}

export type HeaderSliderDirection = "rtl" | "ltr" | "btt" | "ttb";

export type HeaderConfig = {
  topBar: { enabled: boolean; bg: string; textColor: string; interval: number; maxWidth: number; items: HeaderItem[] };
  utilityBar: { enabled: boolean; showTaxToggle: boolean; items: HeaderItem[] };
  mainBar: {
    height: number;
    sticky: boolean;
    bg: string;
    logo: { height: number; width: number; showName: boolean; hover: { enabled: boolean; direction: "top" | "bottom" | "left" | "right"; icon: string | null; iconSize: number | null; iconColor: string | null; iconGlow: boolean; iconShadow: boolean } };
    search: { enabled: boolean; maxWidth: number; placeholder: string };
    showCart: boolean;
    showAccount: boolean;
    showCompare: boolean;
    slider: { enabled: boolean; interval: number; maxWidth: number; direction: HeaderSliderDirection; items: HeaderSliderItem[] };
  };
  bottomNav: {
    enabled: boolean;
    bg: string;
    textColor: string;
    display: "mega" | "inline" | "drawer";
    showImages: boolean;
    showCounts: boolean;
    indicator: boolean;
    items: HeaderItem[];
  };
  mobileDrawer: { showSearch: boolean; showPhone: boolean; showAccount: boolean; showCompare: boolean; showCart: boolean };
};

export type StoreSettings = {
  storeName: string;
  storeLogo: string | null;
  storeFavicon: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  themeAccent: string;
  themeAccent2: string;
  marqueeEnabled: boolean;
  marqueeItems: string[];
  marqueeBg: string;
  marqueeText: string;
  homeHero: {
    align: "left" | "center" | "right";
    showCtas: boolean;
    minHeight: number;
    showStats: boolean;
    autoRotate: boolean;
    interval: number;
    transition: "slide" | "fade";
    parallax: boolean;
    hover: boolean;
    stats: { label: string; value: string }[];
    styles?: HeroGlobalStyle;
  };
  homeProducts: { count: number; columns: number; showNew: boolean; showViewAll: boolean; showFeatured: boolean };
  homeBrandsMarquee: { show: boolean; speed: number; sepColor: string; logoHeight: number };
  homeTrust: {
    show: boolean; columns: number; iconSize: number; paddingY: number; align: "left" | "center" | "right";
    tagline: string; taglineAccent: string; taglineBadge: string;
    taglineStyle: { fontSize: number; color: string; bg: string; fontWeight: number; italic: boolean; borderRadius: number; px: number; py: number; pill: boolean };
    accentStyle: { fontSize: number; color: string; bg: string; fontWeight: number; borderRadius: number; px: number; py: number; pill: boolean };
    badgeStyle: { fontSize: number; color: string; fontWeight: number };
    itemStyle: { fontSize: number; color: string; fontWeight: number; iconSize: number; iconColor: string; gap: number };
    barStyle: { bg: string; border: string; borderRadius: number; paddingY: number };
    items: { icon: string; label: string; enabled: boolean }[];
  };
  codEnabled: boolean;
  footerLogoSize: number;
  footerAlign: "left" | "center" | "right";
  storeMaxWidth: number;
  sectionMaxWidths: { header: number; hero: number; promos: number; categories: number; deals: number; newArrivals: number; bestSellers: number; marquee: number; valueProps: number; newsletter: number; footer: number; expertise: number };
  taxRate: { rate: number } | null;
  productWatermark: { enabled: boolean; opacity: number; size: number; logo: string | null; urlText: string; textColor: string; fontSize: number };
  header: HeaderConfig;
};

export const DEFAULT_HEADER: HeaderConfig = {
  topBar: {
    enabled: true,
    bg: "#f5f5f5",
    textColor: "#555555",
    interval: 6000,
    maxWidth: 0,
    items: [
      { id: "top-phone", text: "+212 6 00 00 00 00", link: "tel:+212600000000", icon: "phone", enabled: true, type: "link" },
      { id: "top-whatsapp", text: "WhatsApp", link: "https://wa.me/212600000000", icon: "whatsapp", enabled: true, type: "link" },
      { id: "top-email", text: "contact@pcjahiz.ma", link: "mailto:contact@pcjahiz.ma", icon: "mail", enabled: true, type: "link" },
    ],
  },
  utilityBar: {
    enabled: true,
    showTaxToggle: true,
    items: [
      { id: "util-stores", text: "Nos magasins", link: "/stores", icon: "mapPin", enabled: true, type: "link" },
      { id: "util-contact", text: "Contactez-nous", link: "/contact", icon: null, enabled: true, type: "link" },
      { id: "util-account", text: "Mon compte", link: "/account", icon: "user", enabled: true, type: "link" },
    ],
  },
  mainBar: {
    height: 56,
    sticky: true,
    bg: "#ffffff",
    logo: { height: 40, width: 0, showName: true, hover: { enabled: true, direction: "top", icon: "home", iconSize: null, iconColor: null, iconGlow: false, iconShadow: false } },
    search: { enabled: true, maxWidth: 520, placeholder: "Chercher un produit, une marque, une catégorie..." },
    showCart: true,
    showAccount: true,
    showCompare: false,
    slider: {
      enabled: false,
      interval: 4000,
      maxWidth: 360,
      direction: "rtl",
      items: [],
    },
  },
  bottomNav: {
    enabled: true,
    bg: "#1a1a2e",
    textColor: "#ffffff",
    display: "mega",
    showImages: true,
    showCounts: false,
    indicator: true,
    items: [
      { id: "bn-all", text: "Tous nos produits", link: "/shop", icon: null, enabled: true, type: "categories" },
      { id: "bn-deals", text: "Bons plans", link: "/shop?sort=discount", icon: null, enabled: true, type: "link" },
      { id: "bn-pro", text: "Espace pro", link: "/contact", icon: null, enabled: true, type: "link" },
      { id: "bn-devis", text: "Demander un devis", link: "/contact", icon: null, enabled: true, type: "link" },
    ],
  },
  mobileDrawer: { showSearch: true, showPhone: true, showAccount: true, showCompare: false, showCart: true },
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "PC Jahiz",
  storeLogo: null,
  storeFavicon: null,
  contactPhone: "+212 6 00 00 00 00",
  contactEmail: "contact@pcjahiz.ma",
  themeAccent: "#FDD502",
  themeAccent2: "#0c2a6e",
  marqueeEnabled: true,
  marqueeItems: [
    "Livraison 24-48h partout au Maroc",
    "Paiement à la livraison",
    "Prix en dirham",
    "Échange sous 7 jours",
  ],
  marqueeBg: "#FDD502",
  marqueeText: "#1b1b1f",
  homeHero: {
    align: "left",
    showCtas: true,
    minHeight: 0,
    showStats: false,
    autoRotate: true,
    interval: 6000,
    transition: "slide",
    parallax: true,
    hover: true,
    styles: {},
    stats: [
      { label: "Clients servis", value: "10 000+" },
      { label: "Produits", value: "5 000+" },
      { label: "Années d'expérience", value: "8" },
    ],
  },
  homeProducts: { count: 8, columns: 4, showNew: true, showViewAll: true, showFeatured: true },
  homeBrandsMarquee: { show: true, speed: 75, sepColor: "", logoHeight: 55 },
  homeTrust: {
    show: true, columns: 4, iconSize: 28, paddingY: 16, align: "center",
    tagline: "L'EXPERT", taglineAccent: "TECH", taglineBadge: " — du matériel informatique & électronique au Maroc",
    taglineStyle: { fontSize: 14, color: "#000000", bg: "#fcd406", fontWeight: 700, italic: false, borderRadius: 4, px: 8, py: 4, pill: true },
    accentStyle: { fontSize: 12, color: "#000000", bg: "#fcd406", fontWeight: 900, borderRadius: 4, px: 6, py: 2, pill: true },
    badgeStyle: { fontSize: 14, color: "", fontWeight: 400 },
    itemStyle: { fontSize: 12, color: "", fontWeight: 500, iconSize: 16, iconColor: "", gap: 6 },
    barStyle: { bg: "", border: "", borderRadius: 0, paddingY: 12 },
    items: [
      { icon: "Truck", label: "Expédition rapide", enabled: true },
      { icon: "CreditCard", label: "Paiement à la livraison", enabled: true },
      { icon: "Store", label: "Retrait en magasin", enabled: true },
      { icon: "ShieldCheck", label: "Garantie & SAV", enabled: true },
    ],
  },
  codEnabled: true,
  footerLogoSize: 64,
  footerAlign: "left",
  storeMaxWidth: 1280,
  sectionMaxWidths: { header: 1280, hero: 0, promos: 1280, categories: 1280, deals: 1280, newArrivals: 1280, bestSellers: 1280, marquee: 0, valueProps: 1280, newsletter: 1280, footer: 1280, expertise: 1280 },
  taxRate: { rate: 20 },
  productWatermark: { enabled: true, opacity: 5, size: 200, logo: null, urlText: "PCJahiz.ma", textColor: "#facc15", fontSize: 14 },
  header: DEFAULT_HEADER,
};

function readBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "object" && v !== null && "value" in v) return readBool((v as { value: unknown }).value, fallback);
  return fallback;
}

function readNum(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  if (typeof v === "object" && v !== null && "value" in v) return readNum((v as { value: unknown }).value, fallback);
  return fallback;
}

function readObj<T extends object>(v: unknown, fallback: T): T {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const inner = "value" in (v as Record<string, unknown>) && (v as { value: unknown }).value && typeof (v as { value: unknown }).value === "object"
      ? (v as { value: unknown }).value
      : v;
    return { ...fallback, ...(inner as object) };
  }
  return fallback;
}

function readItems(v: unknown, fallback: HeaderItem[]): HeaderItem[] {
  const arr = Array.isArray(v)
    ? v
    : v && typeof v === "object" && "value" in (v as Record<string, unknown>) && Array.isArray((v as { value: unknown }).value)
      ? ((v as { value: unknown[] }).value as unknown[])
      : null;
  if (!arr) return fallback;
  return arr
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it, i) => ({
      id: typeof it.id === "string" ? it.id : `item-${i}`,
      text: typeof it.text === "string" ? it.text : "",
      link: typeof it.link === "string" ? it.link : "",
      icon: typeof it.icon === "string" ? it.icon : null,
      enabled: it.enabled !== false,
      type: (["link", "button", "menu", "categories"] as const).includes(it.type as HeaderItem["type"]) ? (it.type as HeaderItem["type"]) : "link",
      children: readItems(it.children, []),
    }));
}

function readSliderItems(v: unknown, fallback: HeaderSliderItem[]): HeaderSliderItem[] {
  const arr = Array.isArray(v)
    ? v
    : v && typeof v === "object" && "value" in (v as Record<string, unknown>) && Array.isArray((v as { value: unknown }).value)
      ? ((v as { value: unknown[] }).value as unknown[])
      : null;
  if (!arr) return fallback;
  return arr
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it, i) => ({
      id: typeof it.id === "string" ? it.id : `sl-${i}`,
      text: typeof it.text === "string" ? it.text : "",
      link: typeof it.link === "string" ? it.link : "",
      icon: typeof it.icon === "string" ? it.icon : null,
      image: typeof it.image === "string" ? it.image : null,
      textColor: typeof it.textColor === "string" ? it.textColor : null,
      textSize: typeof it.textSize === "number" ? it.textSize : typeof it.textSize === "string" && it.textSize.trim() !== "" ? Number(it.textSize) : null,
      iconColor: typeof it.iconColor === "string" ? it.iconColor : null,
      iconGlow: readBool(it.iconGlow, false),
      iconShadow: readBool(it.iconShadow, false),
    }));
}

function readStr(v: unknown, fallback: string): string {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "value" in v) {
    const inner = (v as { value: unknown }).value;
    return typeof inner === "string" ? inner : fallback;
  }
  return fallback;
}

function readHeader(raw: Record<string, unknown> | undefined): HeaderConfig {
  const h = readObj<HeaderConfig>(raw?.headerConfig, DEFAULT_HEADER);
  return {
    topBar: {
      enabled: readBool(h.topBar?.enabled, DEFAULT_HEADER.topBar.enabled),
      bg: readStr(h.topBar?.bg, DEFAULT_HEADER.topBar.bg),
      textColor: readStr(h.topBar?.textColor, DEFAULT_HEADER.topBar.textColor),
      interval: readNum(h.topBar?.interval, DEFAULT_HEADER.topBar.interval),
      maxWidth: readNum(h.topBar?.maxWidth, DEFAULT_HEADER.topBar.maxWidth),
      items: readItems(h.topBar?.items, DEFAULT_HEADER.topBar.items),
    },
    utilityBar: {
      enabled: readBool(h.utilityBar?.enabled, DEFAULT_HEADER.utilityBar.enabled),
      showTaxToggle: readBool(h.utilityBar?.showTaxToggle, DEFAULT_HEADER.utilityBar.showTaxToggle),
      items: readItems(h.utilityBar?.items, DEFAULT_HEADER.utilityBar.items),
    },
    mainBar: {
      height: readNum(h.mainBar?.height, DEFAULT_HEADER.mainBar.height),
      sticky: readBool(h.mainBar?.sticky, DEFAULT_HEADER.mainBar.sticky),
      bg: readStr(h.mainBar?.bg, DEFAULT_HEADER.mainBar.bg),
      logo: {
        height: readNum(h.mainBar?.logo?.height, DEFAULT_HEADER.mainBar.logo.height),
        width: readNum(h.mainBar?.logo?.width, DEFAULT_HEADER.mainBar.logo.width),
        showName: readBool(h.mainBar?.logo?.showName, DEFAULT_HEADER.mainBar.logo.showName),
        hover: (() => {
          const lh = h.mainBar?.logo?.hover as { enabled?: boolean; direction?: string; icon?: unknown; iconSize?: unknown; iconColor?: unknown; iconGlow?: unknown; iconShadow?: unknown } | undefined;
          const dir = lh?.direction;
          const icon = lh?.icon;
          const isSize = (v: unknown): number | null => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : null);
          return {
            enabled: readBool(lh?.enabled, DEFAULT_HEADER.mainBar.logo.hover.enabled),
            direction: dir === "top" || dir === "bottom" || dir === "left" || dir === "right" ? dir : DEFAULT_HEADER.mainBar.logo.hover.direction,
            icon: typeof icon === "string" ? icon : DEFAULT_HEADER.mainBar.logo.hover.icon,
            iconSize: isSize(lh?.iconSize) ?? DEFAULT_HEADER.mainBar.logo.hover.iconSize,
            iconColor: typeof lh?.iconColor === "string" ? lh.iconColor : DEFAULT_HEADER.mainBar.logo.hover.iconColor,
            iconGlow: readBool(lh?.iconGlow, DEFAULT_HEADER.mainBar.logo.hover.iconGlow),
            iconShadow: readBool(lh?.iconShadow, DEFAULT_HEADER.mainBar.logo.hover.iconShadow),
          };
        })(),
      },
      search: {
        enabled: readBool(h.mainBar?.search?.enabled, DEFAULT_HEADER.mainBar.search.enabled),
        maxWidth: readNum(h.mainBar?.search?.maxWidth, DEFAULT_HEADER.mainBar.search.maxWidth),
        placeholder: readStr(h.mainBar?.search?.placeholder, DEFAULT_HEADER.mainBar.search.placeholder),
      },
      showCart: readBool(h.mainBar?.showCart, DEFAULT_HEADER.mainBar.showCart),
      showAccount: readBool(h.mainBar?.showAccount, DEFAULT_HEADER.mainBar.showAccount),
      showCompare: readBool(h.mainBar?.showCompare, DEFAULT_HEADER.mainBar.showCompare),
      slider: {
        enabled: readBool(h.mainBar?.slider?.enabled, DEFAULT_HEADER.mainBar.slider.enabled),
        interval: readNum(h.mainBar?.slider?.interval, DEFAULT_HEADER.mainBar.slider.interval),
        maxWidth: readNum(h.mainBar?.slider?.maxWidth, DEFAULT_HEADER.mainBar.slider.maxWidth),
        direction: ((dir): HeaderSliderDirection =>
          dir === "rtl" || dir === "ltr" || dir === "btt" || dir === "ttb" ? dir : DEFAULT_HEADER.mainBar.slider.direction)(h.mainBar?.slider?.direction),
        items: readSliderItems(h.mainBar?.slider?.items, DEFAULT_HEADER.mainBar.slider.items),
      },
    },
    bottomNav: {
      enabled: readBool(h.bottomNav?.enabled, DEFAULT_HEADER.bottomNav.enabled),
      bg: readStr(h.bottomNav?.bg, DEFAULT_HEADER.bottomNav.bg),
      textColor: readStr(h.bottomNav?.textColor, DEFAULT_HEADER.bottomNav.textColor),
      display: h.bottomNav?.display === "mega" || h.bottomNav?.display === "inline" || h.bottomNav?.display === "drawer" ? h.bottomNav.display : DEFAULT_HEADER.bottomNav.display,
      showImages: readBool(h.bottomNav?.showImages, DEFAULT_HEADER.bottomNav.showImages),
      showCounts: readBool(h.bottomNav?.showCounts, DEFAULT_HEADER.bottomNav.showCounts),
      indicator: readBool(h.bottomNav?.indicator, DEFAULT_HEADER.bottomNav.indicator),
      items: readItems(h.bottomNav?.items, DEFAULT_HEADER.bottomNav.items),
    },
    mobileDrawer: {
      showSearch: readBool(h.mobileDrawer?.showSearch, DEFAULT_HEADER.mobileDrawer.showSearch),
      showPhone: readBool(h.mobileDrawer?.showPhone, DEFAULT_HEADER.mobileDrawer.showPhone),
      showAccount: readBool(h.mobileDrawer?.showAccount, DEFAULT_HEADER.mobileDrawer.showAccount),
      showCompare: readBool(h.mobileDrawer?.showCompare, DEFAULT_HEADER.mobileDrawer.showCompare),
      showCart: readBool(h.mobileDrawer?.showCart, DEFAULT_HEADER.mobileDrawer.showCart),
    },
  };
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
    marqueeItems: (Array.isArray(raw.marqueeItems) ? raw.marqueeItems : DEFAULT_SETTINGS.marqueeItems).map((item) =>
      typeof item === "string"
        ? item
        : typeof (item as { fr?: unknown })?.fr === "string"
          ? ((item as { fr: string }).fr)
          : String(item),
    ),
    marqueeBg: readStr(raw.marqueeBg, DEFAULT_SETTINGS.marqueeBg),
    marqueeText: readStr(raw.marqueeText, DEFAULT_SETTINGS.marqueeText),
    homeHero: readObj(raw.homeHero as unknown, DEFAULT_SETTINGS.homeHero),
    homeProducts: readObj(raw.homeProducts as unknown, DEFAULT_SETTINGS.homeProducts),
    homeBrandsMarquee: readObj(raw.homeBrandsMarquee as unknown, DEFAULT_SETTINGS.homeBrandsMarquee),
    homeTrust: readObj(raw.homeTrust as unknown, DEFAULT_SETTINGS.homeTrust),
    codEnabled: readBool(raw.codEnabled, DEFAULT_SETTINGS.codEnabled),
    footerLogoSize: readNum(raw.footerLogoSize, DEFAULT_SETTINGS.footerLogoSize),
    footerAlign: (() => { const v = readStr(raw.footerAlign, DEFAULT_SETTINGS.footerAlign); return v === "left" || v === "center" || v === "right" ? v : DEFAULT_SETTINGS.footerAlign; })(),
    storeMaxWidth: readNum(raw.storeMaxWidth, DEFAULT_SETTINGS.storeMaxWidth),
    sectionMaxWidths: readObj(raw.sectionMaxWidths as unknown, DEFAULT_SETTINGS.sectionMaxWidths),
    taxRate: (raw.taxRate as { rate?: number } | null)?.rate != null ? { rate: Number((raw.taxRate as { rate: number }).rate) } : DEFAULT_SETTINGS.taxRate,
    productWatermark: (() => {
      const raw2 = raw.productWatermark as Record<string, unknown> | undefined;
      const w = (raw2 && typeof raw2 === "object" && "value" in raw2 && typeof raw2.value === "object" ? raw2.value : raw2) as Record<string, unknown> | undefined;
      return {
        enabled: readBool(w?.enabled, DEFAULT_SETTINGS.productWatermark.enabled),
        opacity: readNum(w?.opacity, DEFAULT_SETTINGS.productWatermark.opacity),
        size: readNum(w?.size, DEFAULT_SETTINGS.productWatermark.size),
        logo: w?.logo != null ? String(w.logo) : DEFAULT_SETTINGS.productWatermark.logo,
        urlText: w?.urlText != null ? String(w.urlText) : DEFAULT_SETTINGS.productWatermark.urlText,
        textColor: w?.textColor != null ? String(w.textColor) : DEFAULT_SETTINGS.productWatermark.textColor,
        fontSize: readNum(w?.fontSize, DEFAULT_SETTINGS.productWatermark.fontSize),
      };
    })(),
    header: readHeader(raw),
  };
}

export function useStoreSettings(): { settings: StoreSettings; isLoading: boolean } {
  const { data, isLoading } = trpc.shop.settings.useQuery(undefined, {
    staleTime: 30_000,
  });
  return { settings: normalizeSettings(data as Record<string, unknown>), isLoading };
}