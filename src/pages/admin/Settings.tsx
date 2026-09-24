import { useEffect, useState } from "react";
import { Loader2, Eye, EyeOff, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_HEADER, DEFAULT_SETTINGS, type HeaderConfig, type HeaderSliderDirection, type SiteModeConfig } from "@/lib/settings";
import { HeaderEditor } from "@/pages/admin/header-settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TopTab = "boutique" | "marque" | "entete" | "accueil" | "site" | "api";
type EnteteSection = "topBar" | "utilityBar" | "mainBar" | "slider" | "bottomNav" | "mobileDrawer";
type AccueilSection = "hero" | "produits" | "marques" | "defilant" | "confiance" | "sections";

const DEFAULTS: Record<string, string> = {
  storeName: "PC Jahiz",
  taxRate: "0",
  contactEmail: "",
  contactPhone: "",
  codEnabled: "true",
  storeLogo: "",
  storeFavicon: "",
  footerLogoSize: "64",
  footerAlign: "left",
  storeMaxWidth: "1280",
  themeAccent: "#FDD502",
  themeAccent2: "#0c2a6e",
  marqueeEnabled: "true",
  marqueeBg: "#FDD502",
  marqueeText: "#1b1b1f",
  openCodeZenApiKey: "",
  openCodeZenModel: "nemotron-3-ultra-free",
  aiProvider: "opencode-zen",
  geminiApiKey: "",
  geminiModel: "gemini-3.5-flash-lite",
};

const readVal = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("value" in o) return String(o.value ?? "");
    if ("rate" in o) return String(o.rate ?? "");
    return "";
  }
  return "";
};

const unwrap = (v: unknown): unknown => {
  if (v && typeof v === "object" && !Array.isArray(v) && "value" in (v as Record<string, unknown>) && (v as { value: unknown }).value !== null) {
    return (v as { value: unknown }).value;
  }
  return v;
};

const tabTrigger = (active: boolean) =>
  active
    ? "rounded-lg bg-[var(--gold-dim)] px-3 py-1.5 text-sm font-medium text-[var(--gold)]"
    : "rounded-lg px-3 py-1.5 text-sm text-[var(--text-2)] hover:bg-white/5";

export default function Settings() {
  const { data, isLoading } = trpc.admin.settings.get.useQuery();
  const update = trpc.admin.settings.update.useMutation();
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<TopTab>("boutique");
  const [enteteSection, setEnteteSection] = useState<EnteteSection>("mainBar");
  const [accueilSection, setAccueilSection] = useState<AccueilSection>("hero");
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [header, setHeader] = useState<HeaderConfig>(DEFAULT_HEADER);
  const [marqueeItems, setMarqueeItems] = useState<string[]>([
    "Delivery 24-48h nationwide",
    "Cash on delivery",
    "Prices in dirham",
    "Returns within 7 days",
  ]);
  const [homeTrust, setHomeTrust] = useState(DEFAULT_SETTINGS.homeTrust);
  const [homeHero, setHomeHero] = useState(DEFAULT_SETTINGS.homeHero);
  const [homeProducts, setHomeProducts] = useState(DEFAULT_SETTINGS.homeProducts);
  const [homeBrands, setHomeBrands] = useState(DEFAULT_SETTINGS.homeBrandsMarquee);
  const [sectionMaxWidths, setSectionMaxWidths] = useState(DEFAULT_SETTINGS.sectionMaxWidths);
  const [productWatermark, setProductWatermark] = useState(DEFAULT_SETTINGS.productWatermark);
  const [siteMode, setSiteMode] = useState<SiteModeConfig>(DEFAULT_SETTINGS.siteMode);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = { ...DEFAULTS };
    for (const row of data) {
      if (row.key === "marqueeItems") {
        const arr = (row.value as { value?: unknown } | unknown[] | null) ?? null;
        const list = Array.isArray(arr) ? arr : Array.isArray((arr as { value?: unknown })?.value) ? (arr as { value: unknown[] }).value : null;
        if (Array.isArray(list)) {
          setMarqueeItems(
            list.map((it) =>
              typeof it === "string"
                ? it
                : typeof (it as { fr?: unknown })?.fr === "string"
                  ? ((it as { fr: string }).fr)
                  : String(it),
            ),
          );
        }
        continue;
      }
      if (row.key === "headerConfig") {
        const raw = unwrap(row.value) as Record<string, unknown> | null;
        const from = (s: string) => (raw && typeof raw[s] === "object" && raw[s] !== null ? (raw[s] as Record<string, unknown>) : {});
        const items = (s: string) => {
          const v = (from(s) as Record<string, unknown>).items;
          if (Array.isArray(v)) return v;
          return null;
        };
        setHeader({
          topBar: {
            enabled: (from("topBar").enabled as boolean) ?? DEFAULT_HEADER.topBar.enabled,
            bg: (from("topBar").bg as string) ?? DEFAULT_HEADER.topBar.bg,
            textColor: (from("topBar").textColor as string) ?? DEFAULT_HEADER.topBar.textColor,
            interval: (from("topBar").interval as number) ?? DEFAULT_HEADER.topBar.interval,
            maxWidth: (from("topBar").maxWidth as number) ?? DEFAULT_HEADER.topBar.maxWidth,
            items: (items("topBar") as HeaderConfig["topBar"]["items"]) ?? DEFAULT_HEADER.topBar.items,
          },
          utilityBar: {
            enabled: (from("utilityBar").enabled as boolean) ?? DEFAULT_HEADER.utilityBar.enabled,
            showTaxToggle: (from("utilityBar").showTaxToggle as boolean) ?? DEFAULT_HEADER.utilityBar.showTaxToggle,
            items: (items("utilityBar") as HeaderConfig["utilityBar"]["items"]) ?? DEFAULT_HEADER.utilityBar.items,
          },
          mainBar: {
            height: (from("mainBar").height as number) ?? DEFAULT_HEADER.mainBar.height,
            sticky: (from("mainBar").sticky as boolean) ?? DEFAULT_HEADER.mainBar.sticky,
            bg: (from("mainBar").bg as string) ?? DEFAULT_HEADER.mainBar.bg,
            logo: {
              height: ((from("mainBar").logo as { height?: number })?.height as number) ?? DEFAULT_HEADER.mainBar.logo.height,
              width: ((from("mainBar").logo as { width?: number })?.width as number) ?? DEFAULT_HEADER.mainBar.logo.width,
              showName: ((from("mainBar").logo as { showName?: boolean })?.showName as boolean) ?? DEFAULT_HEADER.mainBar.logo.showName,
              hover: (() => {
                const lh = (from("mainBar").logo as { hover?: { enabled?: boolean; direction?: string; icon?: string; iconSize?: number | string; iconColor?: string; iconGlow?: boolean; iconShadow?: boolean } }).hover;
                const d = lh?.direction;
                return {
                  enabled: (lh?.enabled as boolean) ?? DEFAULT_HEADER.mainBar.logo.hover.enabled,
                  direction: d === "top" || d === "bottom" || d === "left" || d === "right" ? d : DEFAULT_HEADER.mainBar.logo.hover.direction,
                  icon: typeof lh?.icon === "string" ? lh.icon : DEFAULT_HEADER.mainBar.logo.hover.icon,
                  iconSize: typeof lh?.iconSize === "number" ? lh.iconSize : typeof lh?.iconSize === "string" && (lh.iconSize as string).trim() !== "" ? Number(lh.iconSize) : DEFAULT_HEADER.mainBar.logo.hover.iconSize,
                  iconColor: typeof lh?.iconColor === "string" ? lh.iconColor : DEFAULT_HEADER.mainBar.logo.hover.iconColor,
                  iconGlow: typeof lh?.iconGlow === "boolean" ? lh.iconGlow : DEFAULT_HEADER.mainBar.logo.hover.iconGlow,
                  iconShadow: typeof lh?.iconShadow === "boolean" ? lh.iconShadow : DEFAULT_HEADER.mainBar.logo.hover.iconShadow,
                };
              })(),
            },
            search: {
              enabled: ((from("mainBar").search as { enabled?: boolean })?.enabled as boolean) ?? DEFAULT_HEADER.mainBar.search.enabled,
              maxWidth: ((from("mainBar").search as { maxWidth?: number })?.maxWidth as number) ?? DEFAULT_HEADER.mainBar.search.maxWidth,
              placeholder: ((from("mainBar").search as { placeholder?: string })?.placeholder as string) ?? DEFAULT_HEADER.mainBar.search.placeholder,
            },
            showCart: (from("mainBar").showCart as boolean) ?? DEFAULT_HEADER.mainBar.showCart,
            showAccount: (from("mainBar").showAccount as boolean) ?? DEFAULT_HEADER.mainBar.showAccount,
            showCompare: (from("mainBar").showCompare as boolean) ?? DEFAULT_HEADER.mainBar.showCompare,
            slider: (() => {
              const sr = (from("mainBar").slider as Record<string, unknown>) || {};
              const rawItems = Array.isArray(sr.items)
                ? sr.items
                : sr.value && Array.isArray((sr.value as { items?: unknown[] }).items)
                  ? (sr.value as { items: unknown[] }).items
                  : [];
              const items = rawItems
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
                  iconGlow: typeof it.iconGlow === "boolean" ? it.iconGlow : false,
                  iconShadow: typeof it.iconShadow === "boolean" ? it.iconShadow : false,
                }));
              return {
                enabled: (sr.enabled as boolean) ?? DEFAULT_HEADER.mainBar.slider.enabled,
                interval: (sr.interval as number) ?? DEFAULT_HEADER.mainBar.slider.interval,
                maxWidth: (sr.maxWidth as number) ?? DEFAULT_HEADER.mainBar.slider.maxWidth,
                direction: ((d): HeaderSliderDirection => (d === "rtl" || d === "ltr" || d === "btt" || d === "ttb" ? d : DEFAULT_HEADER.mainBar.slider.direction))(sr.direction),
                items,
              };
            })(),
          },
          bottomNav: {
            enabled: (from("bottomNav").enabled as boolean) ?? DEFAULT_HEADER.bottomNav.enabled,
            bg: (from("bottomNav").bg as string) ?? DEFAULT_HEADER.bottomNav.bg,
            textColor: (from("bottomNav").textColor as string) ?? DEFAULT_HEADER.bottomNav.textColor,
            display: ((d) => (d === "mega" || d === "inline" ? d : DEFAULT_HEADER.bottomNav.display))(from("bottomNav").display as string),
            showImages: (from("bottomNav").showImages as boolean) ?? DEFAULT_HEADER.bottomNav.showImages,
            showCounts: (from("bottomNav").showCounts as boolean) ?? DEFAULT_HEADER.bottomNav.showCounts,
            indicator: (from("bottomNav").indicator as boolean) ?? DEFAULT_HEADER.bottomNav.indicator,
            items: (items("bottomNav") as HeaderConfig["bottomNav"]["items"]) ?? DEFAULT_HEADER.bottomNav.items,
          },
          mobileDrawer: {
            showSearch: (from("mobileDrawer").showSearch as boolean) ?? DEFAULT_HEADER.mobileDrawer.showSearch,
            showPhone: (from("mobileDrawer").showPhone as boolean) ?? DEFAULT_HEADER.mobileDrawer.showPhone,
            showAccount: (from("mobileDrawer").showAccount as boolean) ?? DEFAULT_HEADER.mobileDrawer.showAccount,
            showCompare: (from("mobileDrawer").showCompare as boolean) ?? DEFAULT_HEADER.mobileDrawer.showCompare,
            showCart: (from("mobileDrawer").showCart as boolean) ?? DEFAULT_HEADER.mobileDrawer.showCart,
          },
        });
        continue;
      }
      if (row.key === "homeTrust") {
        const o = unwrap(row.value) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          const readStyleObj = (v: unknown, fallback: Record<string, unknown>): Record<string, unknown> => {
            if (v && typeof v === "object" && !Array.isArray(v)) return { ...fallback, ...v as Record<string, unknown> };
            return fallback;
          };
          setHomeTrust((prev) => ({
            show: typeof o.show === "boolean" ? o.show : prev.show,
            columns: Number(o.columns) || prev.columns,
            iconSize: Number(o.iconSize) || prev.iconSize,
            paddingY: Number(o.paddingY) || prev.paddingY,
            align: (["left", "center", "right"] as const).includes(o.align as never) ? (o.align as "left" | "center" | "right") : prev.align,
            tagline: typeof o.tagline === "string" ? o.tagline : prev.tagline,
            taglineAccent: typeof o.taglineAccent === "string" ? o.taglineAccent : prev.taglineAccent,
            taglineBadge: typeof o.taglineBadge === "string" ? o.taglineBadge : prev.taglineBadge,
            taglineStyle: { ...prev.taglineStyle, ...(readStyleObj(o.taglineStyle, prev.taglineStyle as unknown as Record<string, unknown>)) } as typeof prev.taglineStyle,
            accentStyle: { ...prev.accentStyle, ...(readStyleObj(o.accentStyle, prev.accentStyle as unknown as Record<string, unknown>)) } as typeof prev.accentStyle,
            badgeStyle: { ...prev.badgeStyle, ...(readStyleObj(o.badgeStyle, prev.badgeStyle as unknown as Record<string, unknown>)) } as typeof prev.badgeStyle,
            itemStyle: { ...prev.itemStyle, ...(readStyleObj(o.itemStyle, prev.itemStyle as unknown as Record<string, unknown>)) } as typeof prev.itemStyle,
            barStyle: { ...prev.barStyle, ...(readStyleObj(o.barStyle, prev.barStyle as unknown as Record<string, unknown>)) } as typeof prev.barStyle,
            items: Array.isArray(o.items)
              ? (o.items as Record<string, unknown>[]).map((it) => ({
                  icon: typeof it.icon === "string" ? it.icon : "Truck",
                  label: typeof it.label === "string" ? it.label : "",
                  enabled: typeof it.enabled === "boolean" ? it.enabled : true,
                }))
              : prev.items,
          }));
        }
        continue;
      }
      if (row.key === "homeHero") {
        const o = unwrap(row.value) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          setHomeHero({
            ...DEFAULT_SETTINGS.homeHero,
            align: (typeof o.align === "string" ? o.align : "left") as "left" | "center" | "right",
            showCtas: typeof o.showCtas === "boolean" ? o.showCtas : true,
            minHeight: Number(o.minHeight) || 0,
            showStats: typeof o.showStats === "boolean" ? o.showStats : false,
            autoRotate: typeof o.autoRotate === "boolean" ? o.autoRotate : true,
            interval: Number(o.interval) || 6000,
            transition: o.transition === "fade" ? "fade" : "slide",
            parallax: typeof o.parallax === "boolean" ? o.parallax : true,
            hover: typeof o.hover === "boolean" ? o.hover : true,
            stats: Array.isArray(o.stats) ? (o.stats as { label: string; value: string }[]) : DEFAULT_SETTINGS.homeHero.stats,
          });
        }
        continue;
      }
      if (row.key === "homeProducts") {
        const o = unwrap(row.value) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          setHomeProducts((prev) => ({
            count: Number(o.count) || prev.count,
            columns: Number(o.columns) || prev.columns,
            showNew: typeof o.showNew === "boolean" ? o.showNew : prev.showNew,
            showViewAll: typeof o.showViewAll === "boolean" ? o.showViewAll : prev.showViewAll,
            showFeatured: typeof o.showFeatured === "boolean" ? o.showFeatured : prev.showFeatured,
          }));
        }
        continue;
      }
      if (row.key === "homeBrandsMarquee") {
        const o = unwrap(row.value) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          setHomeBrands((prev) => ({
            show: typeof o.show === "boolean" ? o.show : prev.show,
            speed: Number(o.speed) || prev.speed,
            sepColor: typeof o.sepColor === "string" ? o.sepColor : prev.sepColor,
            logoHeight: Number(o.logoHeight) || prev.logoHeight,
          }));
        }
        continue;
      }
      if (row.key === "sectionMaxWidths") {
        const o = unwrap(row.value) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          setSectionMaxWidths((prev) => ({
            header: Number(o.header) || prev.header,
            hero: Number(o.hero) || prev.hero,
            promos: Number(o.promos) || prev.promos,
            categories: Number(o.categories) || prev.categories,
            deals: Number(o.deals) || prev.deals,
            newArrivals: Number(o.newArrivals) || prev.newArrivals,
            bestSellers: Number(o.bestSellers) || prev.bestSellers,
            marquee: Number(o.marquee) || prev.marquee,
            valueProps: Number(o.valueProps) || prev.valueProps,
            newsletter: Number(o.newsletter) || prev.newsletter,
            footer: Number(o.footer) || prev.footer,
            expertise: Number(o.expertise) || prev.expertise,
          }));
        }
        continue;
      }
      if (row.key === "productWatermark") {
        const raw2 = unwrap(row.value) as Record<string, unknown> | null;
        const o = (raw2 && typeof raw2 === "object" && "value" in raw2 && typeof raw2.value === "object" ? raw2.value : raw2) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          setProductWatermark({
            enabled: typeof o.enabled === "boolean" ? o.enabled : DEFAULT_SETTINGS.productWatermark.enabled,
            opacity: Number(o.opacity) || DEFAULT_SETTINGS.productWatermark.opacity,
            size: Number(o.size) || DEFAULT_SETTINGS.productWatermark.size,
            logo: typeof o.logo === "string" ? o.logo : DEFAULT_SETTINGS.productWatermark.logo,
            urlText: typeof o.urlText === "string" ? o.urlText : DEFAULT_SETTINGS.productWatermark.urlText,
            textColor: typeof o.textColor === "string" ? o.textColor : DEFAULT_SETTINGS.productWatermark.textColor,
            fontSize: Number(o.fontSize) || DEFAULT_SETTINGS.productWatermark.fontSize,
          });
        }
        continue;
      }
      if (row.key === "siteMode") {
        const rawSm = unwrap(row.value) as Record<string, unknown> | null;
        const o = (rawSm && typeof rawSm === "object" && "value" in rawSm && rawSm.value !== null && typeof rawSm.value === "object" ? rawSm.value : rawSm) as Record<string, unknown> | null;
        if (o && typeof o === "object") {
          const d = DEFAULT_SETTINGS.siteMode;
          setSiteMode({
            enabled: typeof o.enabled === "boolean" ? o.enabled : d.enabled,
            mode: o.mode === "maintenance" ? "maintenance" : o.mode === "coming-soon" ? "coming-soon" : d.mode,
            title: typeof o.title === "string" ? o.title : d.title,
            message: typeof o.message === "string" ? o.message : d.message,
            submessage: typeof o.submessage === "string" ? o.submessage : d.submessage,
            countdown: typeof o.countdown === "boolean" ? o.countdown : d.countdown,
            countdownTarget: typeof o.countdownTarget === "string" ? o.countdownTarget : d.countdownTarget,
            showEmail: typeof o.showEmail === "boolean" ? o.showEmail : d.showEmail,
            emailPlaceholder: typeof o.emailPlaceholder === "string" ? o.emailPlaceholder : d.emailPlaceholder,
            showSocial: typeof o.showSocial === "boolean" ? o.showSocial : d.showSocial,
            socialLinks: Array.isArray(o.socialLinks)
              ? (o.socialLinks as { platform?: unknown; url?: unknown }[]).map((it) => ({
                  platform: typeof it?.platform === "string" ? it.platform : "",
                  url: typeof it?.url === "string" ? it.url : "",
                }))
              : d.socialLinks,
            showLogo: typeof o.showLogo === "boolean" ? o.showLogo : d.showLogo,
            bg: typeof o.bg === "string" ? o.bg : d.bg,
            textColor: typeof o.textColor === "string" ? o.textColor : d.textColor,
            accentColor: typeof o.accentColor === "string" ? o.accentColor : d.accentColor,
          });
        }
        continue;
      }
      next[row.key] = readVal(row.value);
    }
    setValues(next);
  }, [data]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {
        storeName: { value: values.storeName },
        taxRate: { rate: Number(values.taxRate) || 0 },
        contactEmail: { value: values.contactEmail },
        contactPhone: { value: values.contactPhone },
        codEnabled: { value: values.codEnabled === "true" },
        storeLogo: { value: values.storeLogo },
        storeFavicon: { value: values.storeFavicon },
        footerLogoSize: { value: Number(values.footerLogoSize) || 64 },
        footerAlign: { value: values.footerAlign },
        storeMaxWidth: { value: Number(values.storeMaxWidth) || 1280 },
        themeAccent: { value: values.themeAccent },
        themeAccent2: { value: values.themeAccent2 },
        marqueeEnabled: { value: values.marqueeEnabled === "true" },
        marqueeItems: { value: marqueeItems.map((it) => String(it).trim()) },
        marqueeBg: { value: values.marqueeBg },
        marqueeText: { value: values.marqueeText },
        homeHero: { value: homeHero },
        homeProducts: { value: homeProducts },
        homeBrandsMarquee: { value: homeBrands },
        homeTrust: { value: homeTrust },
        sectionMaxWidths: { value: sectionMaxWidths },
        productWatermark: { value: productWatermark },
        siteMode: { value: siteMode },
        headerConfig: { value: header },
        openCodeZenApiKey: { value: values.openCodeZenApiKey },
        openCodeZenModel: { value: values.openCodeZenModel },
        aiProvider: { value: values.aiProvider },
        geminiApiKey: { value: values.geminiApiKey },
        geminiModel: { value: values.geminiModel },
      };
      await update.mutateAsync({ values: payload });
      utils.shop.settings.invalidate();
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      toast.error("Failed to save");
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  const Checkbox = ({ k, label }: { k: string; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={values[k] === "true"} onChange={(e) => set(k, String(e.target.checked))} />
      {label}
    </label>
  );

  const BoolField = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  const ColorField = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
        <span className="font-mono text-xs text-[var(--text-2)]">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Store, header, and homepage configuration." />

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save</Button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {saveError && <span className="text-sm text-red-400">{saveError}</span>}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TopTab)}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="boutique" className={tabTrigger(tab === "boutique")}>Store</TabsTrigger>
          <TabsTrigger value="marque" className={tabTrigger(tab === "marque")}>Brand & Identity</TabsTrigger>
          <TabsTrigger value="entete" className={tabTrigger(tab === "entete")}>Header</TabsTrigger>
          <TabsTrigger value="accueil" className={tabTrigger(tab === "accueil")}>Home</TabsTrigger>
          <TabsTrigger value="site" className={tabTrigger(tab === "site")}>Site Mode</TabsTrigger>
          <TabsTrigger value="api" className={tabTrigger(tab === "api")}>API & AI</TabsTrigger>
        </TabsList>

        <TabsContent value="boutique">
          <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="space-y-1.5"><Label>Store name</Label><Input value={values.storeName} onChange={(e) => set("storeName", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact email</Label><Input value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tax / VAT (%)</Label><Input type="number" value={values.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></div>
              <div className="flex items-center"><Checkbox k="codEnabled" label="Cash on delivery enabled" /></div>
              <div className="space-y-1.5"><Label>Store max width (px)</Label><Input type="number" min={960} max={1920} value={values.storeMaxWidth} onChange={(e) => set("storeMaxWidth", Math.max(960, Number(e.target.value) || 1280))} /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marque">
          <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="space-y-1.5">
              <Label>Logo (device image or URL)</Label>
              <div className="flex flex-col gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--text-2)] transition-colors hover:border-[var(--gold-hot)] hover:text-[var(--gold)]">
                  Choose a file
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => set("storeLogo", String(reader.result ?? ""));
                        reader.readAsDataURL(f);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <Input value={values.storeLogo} onChange={(e) => set("storeLogo", e.target.value)} placeholder="https://… or data:image/…" />
              </div>
              {values.storeLogo ? (
                <img src={values.storeLogo} alt="Logo" className="mt-1 h-16 w-auto rounded-lg border border-[var(--line)] bg-white object-contain p-1" />
              ) : null}
            </div>
            <div className="space-y-1.5"><Label>Favicon (URL)</Label><Input value={values.storeFavicon} onChange={(e) => set("storeFavicon", e.target.value)} placeholder="https://…" /></div>
            <div className="space-y-1.5"><Label>Footer logo size (px)</Label><Input type="number" min={16} max={200} value={values.footerLogoSize} onChange={(e) => set("footerLogoSize", Math.max(16, Number(e.target.value) || 64))} /></div>
            <div className="space-y-1.5">
              <Label>Footer logo alignment</Label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} type="button" onClick={() => set("footerAlign", a)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${values.footerAlign === a ? "bg-[var(--gold)] text-black" : "bg-[var(--page-soft)] text-[var(--text-2)] hover:text-[var(--text-1)]"}`}>{a.charAt(0).toUpperCase() + a.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField value={values.themeAccent} onChange={(v) => set("themeAccent", v)} label="Primary color" />
              <ColorField value={values.themeAccent2} onChange={(v) => set("themeAccent2", v)} label="Secondary color" />
            </div>
          </div>

          <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <h3 className="font-hud text-sm font-bold">Product Image Watermark</h3>
            <p className="text-xs text-[var(--text-2)]">Overlay a transparent logo on all product images. Acts as a layer over the image area, not embedded in pixels.</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={productWatermark.enabled} onChange={(e) => setProductWatermark((w) => ({ ...w, enabled: e.target.checked }))} className="accent-[var(--gold)]" />
              Enable watermark
            </label>
            {productWatermark.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Opacity ({productWatermark.opacity}%)</Label>
                    <input type="range" min={1} max={20} value={productWatermark.opacity} onChange={(e) => setProductWatermark((w) => ({ ...w, opacity: Number(e.target.value) }))} className="w-full accent-[var(--gold)]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Logo size ({productWatermark.size}px)</Label>
                    <input type="range" min={40} max={800} step={10} value={productWatermark.size} onChange={(e) => setProductWatermark((w) => ({ ...w, size: Number(e.target.value) }))} className="w-full accent-[var(--gold)]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Watermark logo (falls back to store logo if empty)</Label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--text-2)] transition-colors hover:border-[var(--gold-hot)] hover:text-[var(--gold)]">
                      Choose a file
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { const r = new FileReader(); r.onload = () => setProductWatermark((w) => ({ ...w, logo: String(r.result ?? "") })); r.readAsDataURL(f); }
                        e.target.value = "";
                      }} />
                    </label>
                    <Input value={productWatermark.logo ?? ""} onChange={(e) => setProductWatermark((w) => ({ ...w, logo: e.target.value || null }))} placeholder="https://… or leave empty for store logo" />
                  </div>
                  {(productWatermark.logo || values.storeLogo) && (
                    <img src={productWatermark.logo || values.storeLogo} alt="Watermark preview" className="mt-1 h-10 w-auto rounded-lg border border-[var(--line)] bg-white object-contain p-1 opacity-50" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Bottom-left URL text</Label>
                  <Input value={productWatermark.urlText} onChange={(e) => setProductWatermark((w) => ({ ...w, urlText: e.target.value }))} placeholder="PCJahiz.ma" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Text color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={productWatermark.textColor} onChange={(e) => setProductWatermark((w) => ({ ...w, textColor: e.target.value }))} className="h-9 w-10 cursor-pointer rounded-md border border-input" />
                      <Input value={productWatermark.textColor} onChange={(e) => setProductWatermark((w) => ({ ...w, textColor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Text size ({productWatermark.fontSize}px)</Label>
                    <input type="range" min={8} max={32} value={productWatermark.fontSize} onChange={(e) => setProductWatermark((w) => ({ ...w, fontSize: Number(e.target.value) }))} className="w-full accent-[var(--gold)]" />
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="entete">
          <div className="space-y-3">
            <Tabs value={enteteSection} onValueChange={(v) => setEnteteSection(v as EnteteSection)}>
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="topBar" className={tabTrigger(enteteSection === "topBar")}>Top bar</TabsTrigger>
                <TabsTrigger value="utilityBar" className={tabTrigger(enteteSection === "utilityBar")}>Utility bar</TabsTrigger>
                <TabsTrigger value="mainBar" className={tabTrigger(enteteSection === "mainBar")}>Main bar</TabsTrigger>
                <TabsTrigger value="slider" className={tabTrigger(enteteSection === "slider")}>Slider</TabsTrigger>
                <TabsTrigger value="bottomNav" className={tabTrigger(enteteSection === "bottomNav")}>Bottom nav</TabsTrigger>
                <TabsTrigger value="mobileDrawer" className={tabTrigger(enteteSection === "mobileDrawer")}>Mobile drawer</TabsTrigger>
              </TabsList>
              {(["topBar", "utilityBar", "mainBar", "slider", "bottomNav", "mobileDrawer"] as EnteteSection[]).map((s) => (
                <TabsContent key={s} value={s}>
                  <HeaderEditor value={header} onChange={setHeader} section={s} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="accueil">
          <div className="space-y-3">
            <Tabs value={accueilSection} onValueChange={(v) => setAccueilSection(v as AccueilSection)}>
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="produits" className={tabTrigger(accueilSection === "produits")}>Featured products</TabsTrigger>
                <TabsTrigger value="marques" className={tabTrigger(accueilSection === "marques")}>Brands</TabsTrigger>
                <TabsTrigger value="defilant" className={tabTrigger(accueilSection === "defilant")}>Marquee</TabsTrigger>
                <TabsTrigger value="confiance" className={tabTrigger(accueilSection === "confiance")}>Trust bar</TabsTrigger>
                <TabsTrigger value="sections" className={tabTrigger(accueilSection === "sections")}>Section widths</TabsTrigger>
              </TabsList>

              <TabsContent value="produits">
                <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Number of products</Label><Input type="number" min={1} value={homeProducts.count} onChange={(e) => setHomeProducts((s) => ({ ...s, count: Math.max(1, Number(e.target.value) || 1) }))} /></div>
                    <div className="space-y-1.5"><Label>Columns</Label><Input type="number" min={1} max={6} value={homeProducts.columns} onChange={(e) => setHomeProducts((s) => ({ ...s, columns: Math.max(1, Number(e.target.value) || 1) }))} /></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 pt-1">
                    <BoolField checked={homeProducts.showNew} onChange={(v) => setHomeProducts((s) => ({ ...s, showNew: v }))} label={'Show "New Arrivals"'} />
                    <BoolField checked={homeProducts.showFeatured} onChange={(v) => setHomeProducts((s) => ({ ...s, showFeatured: v }))} label={'Show "Featured"'} />
                    <BoolField checked={homeProducts.showViewAll} onChange={(v) => setHomeProducts((s) => ({ ...s, showViewAll: v }))} label={'Show "View All"'} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="marques">
                <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
                  <BoolField checked={homeBrands.show} onChange={(v) => setHomeBrands((s) => ({ ...s, show: v }))} label="Show brands bar" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Speed (smaller = faster)</Label><Input type="number" min={10} value={homeBrands.speed} onChange={(e) => setHomeBrands((s) => ({ ...s, speed: Math.max(10, Number(e.target.value) || 10) }))} /></div>
                    <div className="space-y-1.5"><Label>Logo height (px)</Label><Input type="number" min={16} value={homeBrands.logoHeight} onChange={(e) => setHomeBrands((s) => ({ ...s, logoHeight: Math.max(16, Number(e.target.value) || 16) }))} /></div>
                  </div>
                  <ColorField value={homeBrands.sepColor || "#000000"} onChange={(v) => setHomeBrands((s) => ({ ...s, sepColor: v }))} label="Separator color (optional)" />
                </div>
              </TabsContent>

              <TabsContent value="defilant">
                <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
                  <BoolField checked={values.marqueeEnabled === "true"} onChange={(v) => set("marqueeEnabled", String(v))} label="Marquee enabled" />
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField value={values.marqueeBg} onChange={(v) => set("marqueeBg", v)} label="Bar color" />
                    <ColorField value={values.marqueeText} onChange={(v) => set("marqueeText", v)} label="Text color" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bar messages</Label>
                    {marqueeItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 gap-2">
                        <Input value={item} onChange={(e) => setMarqueeItems((s) => s.map((m, idx) => (idx === i ? e.target.value : m)))} placeholder="Message text" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setMarqueeItems((s) => [...s, ""])}>+ Add message</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="confiance">
                <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-4">
                  <BoolField checked={homeTrust.show} onChange={(v) => setHomeTrust((s) => ({ ...s, show: v }))} label="Show trust bar" />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label>Tagline</Label><Input value={homeTrust.tagline} onChange={(e) => setHomeTrust((s) => ({ ...s, tagline: e.target.value }))} placeholder="L'EXPERT" /></div>
                    <div className="space-y-1.5"><Label>Tagline accent</Label><Input value={homeTrust.taglineAccent} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineAccent: e.target.value }))} placeholder="TECH" /></div>
                    <div className="space-y-1.5"><Label>Tagline suffix</Label><Input value={homeTrust.taglineBadge} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineBadge: e.target.value }))} placeholder=" — du matériel informatique..." /></div>
                  </div>

                  {/* Tagline style */}
                  <details open className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Tagline style</summary>
                    <BoolField checked={homeTrust.taglineStyle.pill} onChange={(v) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, pill: v } }))} label="Pill mode (background highlight)" />
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Size</Label><Input type="number" min={8} max={48} value={homeTrust.taglineStyle.fontSize} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, fontSize: Number(e.target.value) || 14 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Weight</Label><Input type="number" min={100} max={900} step={100} value={homeTrust.taglineStyle.fontWeight} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, fontWeight: Number(e.target.value) || 700 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Text color</Label><input type="color" value={homeTrust.taglineStyle.color || "#000000"} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, color: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                      {homeTrust.taglineStyle.pill && <div className="space-y-1"><Label className="text-[10px]">Background</Label><input type="color" value={homeTrust.taglineStyle.bg || "#fcd406"} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, bg: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>}
                    </div>
                    {homeTrust.taglineStyle.pill && <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Radius</Label><Input type="number" min={0} max={50} value={homeTrust.taglineStyle.borderRadius} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, borderRadius: Number(e.target.value) || 0 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Pad X</Label><Input type="number" min={0} max={40} value={homeTrust.taglineStyle.px} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, px: Number(e.target.value) || 0 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Pad Y</Label><Input type="number" min={0} max={40} value={homeTrust.taglineStyle.py} onChange={(e) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, py: Number(e.target.value) || 0 } }))} /></div>
                    </div>}
                    <div className="flex items-center gap-3"><BoolField checked={homeTrust.taglineStyle.italic} onChange={(v) => setHomeTrust((s) => ({ ...s, taglineStyle: { ...s.taglineStyle, italic: v } }))} label="Italic" /></div>
                  </details>

                  {/* Accent style */}
                  <details className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Accent badge style</summary>
                    <BoolField checked={homeTrust.accentStyle.pill} onChange={(v) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, pill: v } }))} label="Pill mode (background highlight)" />
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Size</Label><Input type="number" min={8} max={48} value={homeTrust.accentStyle.fontSize} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, fontSize: Number(e.target.value) || 12 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Weight</Label><Input type="number" min={100} max={900} step={100} value={homeTrust.accentStyle.fontWeight} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, fontWeight: Number(e.target.value) || 900 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Text color</Label><input type="color" value={homeTrust.accentStyle.color || "#000000"} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, color: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                      {homeTrust.accentStyle.pill && <div className="space-y-1"><Label className="text-[10px]">Background</Label><input type="color" value={homeTrust.accentStyle.bg || "#fcd406"} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, bg: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>}
                    </div>
                    {homeTrust.accentStyle.pill && <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Radius</Label><Input type="number" min={0} max={50} value={homeTrust.accentStyle.borderRadius} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, borderRadius: Number(e.target.value) || 0 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Pad X</Label><Input type="number" min={0} max={40} value={homeTrust.accentStyle.px} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, px: Number(e.target.value) || 0 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Pad Y</Label><Input type="number" min={0} max={40} value={homeTrust.accentStyle.py} onChange={(e) => setHomeTrust((s) => ({ ...s, accentStyle: { ...s.accentStyle, py: Number(e.target.value) || 0 } }))} /></div>
                    </div>}
                  </details>

                  {/* Badge/suffix style */}
                  <details className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Suffix style</summary>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Size</Label><Input type="number" min={8} max={48} value={homeTrust.badgeStyle.fontSize} onChange={(e) => setHomeTrust((s) => ({ ...s, badgeStyle: { ...s.badgeStyle, fontSize: Number(e.target.value) || 14 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Weight</Label><Input type="number" min={100} max={900} step={100} value={homeTrust.badgeStyle.fontWeight} onChange={(e) => setHomeTrust((s) => ({ ...s, badgeStyle: { ...s.badgeStyle, fontWeight: Number(e.target.value) || 400 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Color</Label><input type="color" value={homeTrust.badgeStyle.color || "#e5e7eb"} onChange={(e) => setHomeTrust((s) => ({ ...s, badgeStyle: { ...s.badgeStyle, color: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                    </div>
                  </details>

                  {/* Bar items style */}
                  <details className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Bar items style</summary>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Font size</Label><Input type="number" min={8} max={32} value={homeTrust.itemStyle.fontSize} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, fontSize: Number(e.target.value) || 12 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Weight</Label><Input type="number" min={100} max={900} step={100} value={homeTrust.itemStyle.fontWeight} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, fontWeight: Number(e.target.value) || 500 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Icon size</Label><Input type="number" min={8} max={48} value={homeTrust.itemStyle.iconSize} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, iconSize: Number(e.target.value) || 16 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Gap</Label><Input type="number" min={0} max={32} value={homeTrust.itemStyle.gap} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, gap: Number(e.target.value) || 6 } }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Text color</Label><input type="color" value={homeTrust.itemStyle.color || "#e5e7eb"} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, color: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Icon color</Label><input type="color" value={homeTrust.itemStyle.iconColor || "#fcd406"} onChange={(e) => setHomeTrust((s) => ({ ...s, itemStyle: { ...s.itemStyle, iconColor: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                    </div>
                  </details>

                  {/* Bar container style */}
                  <details className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Bar container style</summary>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-[10px]">Background</Label><input type="color" value={homeTrust.barStyle.bg || "#ffffff"} onChange={(e) => setHomeTrust((s) => ({ ...s, barStyle: { ...s.barStyle, bg: e.target.value } }))} className="h-8 w-full cursor-pointer rounded border border-[var(--line)]" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Border radius</Label><Input type="number" min={0} max={50} value={homeTrust.barStyle.borderRadius} onChange={(e) => setHomeTrust((s) => ({ ...s, barStyle: { ...s.barStyle, borderRadius: Number(e.target.value) || 0 } }))} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Padding Y</Label><Input type="number" min={0} max={60} value={homeTrust.barStyle.paddingY} onChange={(e) => setHomeTrust((s) => ({ ...s, barStyle: { ...s.barStyle, paddingY: Number(e.target.value) || 0 } }))} /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px]">Border (CSS)</Label><Input value={homeTrust.barStyle.border} onChange={(e) => setHomeTrust((s) => ({ ...s, barStyle: { ...s.barStyle, border: e.target.value } }))} placeholder="1px solid #e5e7eb" /></div>
                  </details>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Columns</Label><Input type="number" min={1} max={6} value={homeTrust.columns} onChange={(e) => setHomeTrust((s) => ({ ...s, columns: Math.max(1, Number(e.target.value) || 1) }))} /></div>
                    <div className="space-y-1.5">
                      <Label>Alignment</Label>
                      <select value={homeTrust.align} onChange={(e) => setHomeTrust((s) => ({ ...s, align: e.target.value as "left" | "center" | "right" }))} className="w-full rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-2 text-sm">
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bar items</Label>
                    {homeTrust.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--page)] p-2">
                        <GripVertical className="h-4 w-4 shrink-0 text-[var(--text-2)]" />
                        <select
                          value={it.icon}
                          onChange={(e) => setHomeTrust((s) => {
                            const items = [...s.items];
                            items[idx] = { ...items[idx], icon: e.target.value };
                            return { ...s, items };
                          })}
                          className="w-36 rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
                        >
                          <option value="Truck">Truck (Delivery)</option>
                          <option value="CreditCard">Card (Payment)</option>
                          <option value="Store">Store</option>
                          <option value="ShieldCheck">Shield (Warranty)</option>
                          <option value="Headphones">Headphones (Support)</option>
                          <option value="RotateCcw">Return</option>
                          <option value="Zap">Lightning (Speed)</option>
                          <option value="Package">Package</option>
                          <option value="Clock">Clock (Timeline)</option>
                          <option value="MapPin">Location</option>
                          <option value="Phone">Phone</option>
                          <option value="Heart">Heart</option>
                          <option value="Star">Star</option>
                          <option value="BadgeCheck">Verified badge</option>
                        </select>
                        <Input
                          value={it.label}
                          onChange={(e) => setHomeTrust((s) => {
                            const items = [...s.items];
                            items[idx] = { ...items[idx], label: e.target.value };
                            return { ...s, items };
                          })}
                          placeholder="Display text"
                          className="flex-1"
                        />
                        <BoolField checked={it.enabled} onChange={(v) => setHomeTrust((s) => {
                          const items = [...s.items];
                          items[idx] = { ...items[idx], enabled: v };
                          return { ...s, items };
                        })} label="" />
                        <button
                          type="button"
                          onClick={() => setHomeTrust((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }))}
                          className="rounded p-1 text-[var(--text-2)] hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHomeTrust((s) => ({ ...s, items: [...s.items, { icon: "Truck", label: "New item", enabled: true }] }))}
                      className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--text-2)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sections">
                <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-4">
                  <p className="text-xs text-[var(--text-2)]">Set the max-width (px) for each homepage section. Use <strong>0</strong> for full-width (no constraint).</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["header", "Header"],
                      ["hero", "Hero (0 = full)"],
                      ["promos", "Promos"],
                      ["categories", "Categories"],
                      ["deals", "Deals"],
                      ["newArrivals", "New Arrivals"],
                      ["bestSellers", "Best Sellers"],
                      ["marquee", "Brand Marquee (0 = full)"],
                      ["valueProps", "Value Props"],
                      ["newsletter", "Newsletter"],
                      ["footer", "Footer"],
                      ["expertise", "Expertise + B2B"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={1920}
                          value={sectionMaxWidths[key]}
                          onChange={(e) => setSectionMaxWidths((s) => ({ ...s, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="site">
          <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-4">
            <div>
              <h3 className="font-hud text-sm font-bold mb-1">Site Mode</h3>
              <p className="text-xs text-[var(--text-2)]">
                Show a Coming Soon or Maintenance page to all public visitors. Admin and login pages stay accessible.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={siteMode.enabled}
                onChange={(e) => setSiteMode((s) => ({ ...s, enabled: e.target.checked }))}
                className="accent-[var(--gold)]"
              />
              Enable Site Mode
            </label>

            {siteMode.enabled && (
              <>
                <div className="space-y-1.5">
                  <Label>Page type</Label>
                  <div className="flex gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 hover:bg-white/5 has-[:checked]:border-[var(--gold)] has-[:checked]:bg-[var(--gold-dim)]">
                      <input type="radio" name="siteModeType" value="coming-soon" checked={siteMode.mode === "coming-soon"} onChange={() => setSiteMode((s) => ({ ...s, mode: "coming-soon" }))} className="accent-[var(--gold)]" />
                      <div>
                        <span className="text-sm font-medium">Coming Soon</span>
                        <span className="block text-[10px] text-[var(--text-2)]">Countdown + email signup</span>
                      </div>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 hover:bg-white/5 has-[:checked]:border-[var(--gold)] has-[:checked]:bg-[var(--gold-dim)]">
                      <input type="radio" name="siteModeType" value="maintenance" checked={siteMode.mode === "maintenance"} onChange={() => setSiteMode((s) => ({ ...s, mode: "maintenance" }))} className="accent-[var(--gold)]" />
                      <div>
                        <span className="text-sm font-medium">Maintenance</span>
                        <span className="block text-[10px] text-[var(--text-2)]">Back soon message</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={siteMode.title} onChange={(e) => setSiteMode((s) => ({ ...s, title: e.target.value }))} placeholder={siteMode.mode === "maintenance" ? "Under Maintenance" : "Coming Soon"} />
                </div>

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <textarea
                    value={siteMode.message}
                    onChange={(e) => setSiteMode((s) => ({ ...s, message: e.target.value }))}
                    rows={2}
                    className="w-full rounded-md border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm"
                    placeholder="We're launching something amazing."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Sub-message (optional)</Label>
                  <Input value={siteMode.submessage} onChange={(e) => setSiteMode((s) => ({ ...s, submessage: e.target.value }))} placeholder="Stay tuned — something great is on the way." />
                </div>

                {siteMode.mode === "coming-soon" && (
                  <>
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={siteMode.countdown} onChange={(e) => setSiteMode((s) => ({ ...s, countdown: e.target.checked }))} className="accent-[var(--gold)]" />
                        Show countdown timer
                      </label>
                      {siteMode.countdown && (
                        <div className="space-y-1.5">
                          <Label>Launch date & time</Label>
                          <Input type="datetime-local" value={siteMode.countdownTarget} onChange={(e) => setSiteMode((s) => ({ ...s, countdownTarget: e.target.value }))} />
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={siteMode.showEmail} onChange={(e) => setSiteMode((s) => ({ ...s, showEmail: e.target.checked }))} className="accent-[var(--gold)]" />
                        Show email signup form
                      </label>
                      {siteMode.showEmail && (
                        <div className="space-y-1.5">
                          <Label>Input placeholder</Label>
                          <Input value={siteMode.emailPlaceholder} onChange={(e) => setSiteMode((s) => ({ ...s, emailPlaceholder: e.target.value }))} placeholder="Enter your email address" />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={siteMode.showLogo} onChange={(e) => setSiteMode((s) => ({ ...s, showLogo: e.target.checked }))} className="accent-[var(--gold)]" />
                    Show store logo
                  </label>
                </div>

                <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={siteMode.showSocial} onChange={(e) => setSiteMode((s) => ({ ...s, showSocial: e.target.checked }))} className="accent-[var(--gold)]" />
                    Show social links
                  </label>
                  {siteMode.showSocial && (
                    <div className="space-y-2">
                      {siteMode.socialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={link.platform}
                            onChange={(e) => setSiteMode((s) => {
                              const links = [...s.socialLinks];
                              links[i] = { ...links[i], platform: e.target.value };
                              return { ...s, socialLinks: links };
                            })}
                            className="w-36 rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
                          >
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">X (Twitter)</option>
                            <option value="youtube">YouTube</option>
                            <option value="tiktok">TikTok</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="whatsapp">WhatsApp</option>
                          </select>
                          <Input
                            value={link.url}
                            onChange={(e) => setSiteMode((s) => {
                              const links = [...s.socialLinks];
                              links[i] = { ...links[i], url: e.target.value };
                              return { ...s, socialLinks: links };
                            })}
                            placeholder="https://…"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setSiteMode((s) => ({ ...s, socialLinks: s.socialLinks.filter((_, idx) => idx !== i) }))}
                            className="rounded p-1 text-[var(--text-2)] hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSiteMode((s) => ({ ...s, socialLinks: [...s.socialLinks, { platform: "facebook", url: "" }] }))}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--text-2)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add link
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={siteMode.bg} onChange={(e) => setSiteMode((s) => ({ ...s, bg: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
                      <span className="font-mono text-xs text-[var(--text-2)]">{siteMode.bg}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Text color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={siteMode.textColor} onChange={(e) => setSiteMode((s) => ({ ...s, textColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
                      <span className="font-mono text-xs text-[var(--text-2)]">{siteMode.textColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Accent</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={siteMode.accentColor} onChange={(e) => setSiteMode((s) => ({ ...s, accentColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
                      <span className="font-mono text-xs text-[var(--text-2)]">{siteMode.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[var(--gold-dim)] px-3 py-2 text-xs text-[var(--text-2)]">
                  While enabled, visitors to the storefront see this page. You can still access <strong>/admin</strong>, <strong>/login</strong> and <strong>/register</strong> to turn it off.
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-4">
            <div>
              <h3 className="font-hud text-sm font-bold mb-1">AI Provider</h3>
              <p className="text-xs text-[var(--text-2)]">
                Choose a provider for AI content generation (product sheets, blog posts, SEO, campaigns).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 cursor-pointer hover:bg-white/5 has-[:checked]:border-[var(--gold)] has-[:checked]:bg-[var(--gold-dim)]">
                  <input type="radio" name="aiProvider" value="opencode-zen" checked={values.aiProvider === "opencode-zen"} onChange={(e) => set("aiProvider", e.target.value)} className="accent-[var(--gold)]" />
                  <div>
                    <span className="text-sm font-medium">OpenCode Zen</span>
                    <span className="block text-[10px] text-[var(--text-2)]">Free models, no credit card</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 cursor-pointer hover:bg-white/5 has-[:checked]:border-[var(--gold)] has-[:checked]:bg-[var(--gold-dim)]">
                  <input type="radio" name="aiProvider" value="gemini" checked={values.aiProvider === "gemini"} onChange={(e) => set("aiProvider", e.target.value)} className="accent-[var(--gold)]" />
                  <div>
                    <span className="text-sm font-medium">Google Gemini</span>
                    <span className="block text-[10px] text-[var(--text-2)]">Fast & reliable, free tier available</span>
                  </div>
                </label>
              </div>
            </div>

            {values.aiProvider === "opencode-zen" && (
              <>
                <div className="space-y-1.5">
                  <Label>OpenCode Zen API Key</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={values.openCodeZenApiKey}
                      onChange={(e) => set("openCodeZenApiKey", e.target.value)}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-[var(--text-1)]"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Model (free)</Label>
                  <select
                    value={values.openCodeZenModel}
                    onChange={(e) => set("openCodeZenModel", e.target.value)}
                    className="w-full rounded-md border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm"
                  >
                    <option value="nemotron-3-ultra-free">Nemotron 3 Ultra Free — fast, reliable JSON</option>
                    <option value="nemotron-3.5-lightning-free">Nemotron 3.5 Lightning Free — ultra fast</option>
                    <option value="mimo-v2.5-free">MiMo V2.5 Free — reasoning model</option>
                    <option value="hy3-free">Hy3 Free — lightweight</option>
                  </select>
                  <p className="text-[10px] text-[var(--text-2)]">
                    Auto-fallback: if a model fails, the next one is tried. Works with or without an API key.
                  </p>
                </div>
                {values.openCodeZenApiKey && (
                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                    Key configured — AI features are active via OpenCode Zen
                  </div>
                )}
                {!values.openCodeZenApiKey && (
                  <div className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                    No key — AI features are disabled
                  </div>
                )}
              </>
            )}

            {values.aiProvider === "gemini" && (
              <>
                <div className="space-y-1.5">
                  <Label>Google AI (Gemini) API Key</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={values.geminiApiKey}
                      onChange={(e) => set("geminiApiKey", e.target.value)}
                      placeholder="AIza..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-[var(--text-1)]"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-2)]">
                    Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-[var(--gold)] hover:underline">aistudio.google.com/apikey</a>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <select
                    value={values.geminiModel}
                    onChange={(e) => set("geminiModel", e.target.value)}
                    className="w-full rounded-md border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm"
                  >
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite — fast, lightest</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash — fast, balanced</option>
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash — latest</option>
                  </select>
                </div>
                {values.geminiApiKey && (
                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                    Key configured — AI features are active via Google Gemini
                  </div>
                )}
                {!values.geminiApiKey && (
                  <div className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                    No key — AI features are disabled
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save</Button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {saveError && <span className="text-sm text-red-400">{saveError}</span>}
      </div>
    </div>
  );
}
