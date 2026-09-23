import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router";
import { ShoppingCart, GitCompareArrows, Check, MessageCircle, Star, Truck, BadgeCheck, RotateCcw, ChevronDown, ArrowUp, ChevronRight, ChevronLeft, Cpu, Monitor, Palette, Wifi, Battery, Camera, HardDrive, Speaker, Zap, Layers, Usb, Gamepad2, MemoryStick } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import { useStoreSettings } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";
import type { ProductVariant, ProductVariantOption } from "@/lib/types";

/* ─── Scroll reveal hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Animated count-up number ─── */
function CountUp({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.3);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const duration = 1200;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value]);
  return <span ref={ref} className="font-mono text-3xl font-extrabold tracking-tight text-[var(--text-1)] tabular-nums">{display}<span className="text-lg text-[var(--gold)]">{suffix}</span></span>;
}

/* ─── Stat card: icon + big number + label ─── */
function StatCard({ icon: Ic, value, suffix, label, delay = 0 }: { icon: React.ComponentType<any>; value: number; suffix?: string; label: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.2);
  return (
    <div ref={ref} className={cn("flex flex-col items-center gap-1 px-4 py-3 transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{ transitionDelay: `${delay}ms` }}>
      <Ic className="h-5 w-5 text-[var(--gold)]" />
      <CountUp value={value} suffix={suffix} delay={delay} />
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-2)]">{label}</span>
    </div>
  );
}

/* ─── Stat row: horizontal key-value with icon ─── */
function StatRow({ icon: Ic, label, value, delay = 0 }: { icon: React.ComponentType<any>; label: string; value: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.2);
  return (
    <div ref={ref} className={cn("flex items-center gap-3 px-4 py-2 transition-all duration-500", visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")} style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--gold)]">
        <Ic className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-2)]">{label}</p>
        <p className="text-sm font-bold text-[var(--text-1)]">{value}</p>
      </div>
    </div>
  );
}

/* ─── Stat grid: 2x2 or 2x3 of StatCards ─── */
function StatGrid({ specs, keys, exclude }: { specs: { k: string; v: string }[]; keys?: string[]; exclude?: string[] }) {
  const ex = (exclude || []).map((s) => s.toLowerCase());
  const items = specs
    .filter((s) => !ex.some((e) => s.k.toLowerCase().includes(e)))
    .slice(0, 6);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s, i) => {
        const Ic = iconForSpec(s.k);
        return <StatRow key={i} icon={Ic} label={s.k} value={s.v} delay={i * 80} />;
      })}
    </div>
  );
}

/* ─── Visual renderer ─── */
/* ─── Quick Specs Ribbon ─── */
const QUICK_SPEC_KEYS = [
  { keys: ["écran", "screen", "display", "taille"], icon: Monitor },
  { keys: ["processeur", "cpu", "ryzen", "intel", "core", "snapdragon"], icon: Cpu },
  { keys: ["gpu", "graphique", "carte graphique", "rtx", "gtx", "radeon"], icon: Gamepad2 },
  { keys: ["ram", "mémoire"], icon: MemoryStick },
  { keys: ["stockage", "ssd", "disque", "nvme"], icon: HardDrive },
  { keys: ["batterie", "battery", "autonomie"], icon: Battery },
];

function QuickSpecsRibbon({ specs }: { specs: { k: string; v: string }[] }) {
  const { ref, visible } = useScrollReveal(0.2);
  const pills: { label: string; icon: React.ComponentType<any> }[] = [];
  for (const qs of QUICK_SPEC_KEYS) {
    const found = specs.find((s) => qs.keys.some((k) => s.k.toLowerCase().includes(k)));
    if (found) {
      pills.push({ label: found.v, icon: qs.icon });
    }
    if (pills.length >= 6) break;
  }
  if (pills.length === 0) return null;
  return (
    <div ref={ref} className={cn("flex flex-wrap justify-center gap-3 transition-all duration-700", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {pills.map((p, i) => {
        const Ic = p.icon;
        return (
          <div key={i} className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--line)] bg-[var(--page-soft)] px-4 py-3 text-xs font-medium text-[var(--text-1)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/5">
            <Ic className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
            <span>{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Parse spec value to number ─── */
function specToNum(v: string): number | null {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

/* ─── Build icon for spec key ─── */
function iconForSpec(k: string): React.ComponentType<any> {
  const lower = k.toLowerCase();
  if (/écran|screen|display|resolution/.test(lower)) return Monitor;
  if (/cpu|processeur|ryzen|intel|core/.test(lower)) return Cpu;
  if (/gpu|graphique|rtx|gtx|radeon/.test(lower)) return Gamepad2;
  if (/ram|mémoire/.test(lower)) return MemoryStick;
  if (/ssd|stockage|disque|nvme/.test(lower)) return HardDrive;
  if (/batterie|battery|autonomie/.test(lower)) return Battery;
  if (/wi-?fi|wifi|bluetooth|réseau/.test(lower)) return Wifi;
  if (/audio|son|haut-?parleur|speaker/.test(lower)) return Speaker;
  if (/caméra|webcam|camera/.test(lower)) return Camera;
  return Zap;
}

/* ─── Visual: bars from numeric specs ─── */
/* ─── Minimalist FAQ with JSON-LD ─── */
function FaqSection({ faq }: { faq: { q: string; a: string }[] }) {
  const { ref, visible } = useScrollReveal(0.1);
  const [open, setOpen] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section ref={ref} className={cn("transition-all duration-700", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="font-hud text-3xl font-extrabold tracking-tight text-[var(--text-1)]">Questions fréquentes</h2>
      <div className="mt-8 space-y-0">
        {faq.map((f, i) => (
          <div key={i} className="border-b border-[var(--line)]">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium text-[var(--text-1)] pr-4">{f.q}</span>
              <ChevronRight className={cn("h-4 w-4 shrink-0 text-[var(--text-2)] transition-transform duration-200", open === i && "rotate-90")} />
            </button>
            <div className={cn("overflow-hidden transition-all duration-300", open === i ? "max-h-40 pb-4" : "max-h-0")}>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{f.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Stars ─── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const s = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(s, i <= rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--line-strong)]")} />
      ))}
    </div>
  );
}

/* ─── Main component ─── */
/* ─── Variant Selector ─── */
function VariantSelector({ variants, selected, onSelect }: { variants: ProductVariant[]; selected: Record<string, string>; onSelect: (type: string, value: string) => void }) {
  if (!variants || variants.length === 0) return null;
  return (
    <div className="space-y-5">
      {variants.map((v) => (
        <div key={v.type}>
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">{v.label}</span>
            {selected[v.type] && (
              <span className="text-xs font-medium text-[var(--text-1)]">
                {v.options.find((o) => o.value === selected[v.type])?.label}
              </span>
            )}
          </div>
          {v.type === "color" ? (
            <div className="flex flex-wrap gap-2.5">
              {v.options.map((opt) => {
                const active = selected[v.type] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(v.type, opt.value)}
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                      active ? "ring-2 ring-offset-2 ring-[var(--text-1)] ring-offset-[var(--page)]" : "hover:ring-1 hover:ring-[var(--line-strong)] hover:ring-offset-1 hover:ring-offset-[var(--page)]"
                    )}
                    title={opt.label}
                  >
                    <span
                      className="h-7 w-7 rounded-full border border-[var(--line)]"
                      style={{ backgroundColor: opt.hex || "#888" }}
                    />
                    {active && <Check className="absolute h-3.5 w-3.5 text-white drop-shadow-md" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />}
                  </button>
                );
              })}
            </div>
          ) : v.type === "ram" || v.type === "storage" || v.type === "screen" || v.type === "capacity" ? (
            <div className="flex flex-wrap gap-2">
              {v.options.map((opt) => {
                const active = selected[v.type] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(v.type, opt.value)}
                    className={cn(
                      "rounded-full border px-5 py-2 font-mono text-sm font-semibold transition-all",
                      active
                        ? "border-[var(--text-1)] bg-[var(--text-1)] text-white"
                        : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--text-1)] hover:text-[var(--text-1)]"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : v.type === "processor" || v.type === "gpu" ? (
            <div className="flex flex-wrap gap-2">
              {v.options.map((opt) => {
                const active = selected[v.type] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(v.type, opt.value)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-left transition-all",
                      active
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--text-1)]"
                        : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--text-1)] hover:text-[var(--text-1)]"
                    )}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.priceDiff && opt.priceDiff !== 0 && (
                      <span className={cn("ml-2 text-xs", opt.priceDiff > 0 ? "text-[var(--gold)]" : "text-emerald-500")}>
                        {opt.priceDiff > 0 ? "+" : ""}{opt.priceDiff} MAD
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {v.options.map((opt) => {
                const active = selected[v.type] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(v.type, opt.value)}
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-[var(--text-1)] bg-[var(--text-1)] text-white"
                        : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--text-1)] hover:text-[var(--text-1)]"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Product() {
  const { slug = "" } = useParams();
  const { t, formatPrice } = useI18n();
  const { settings } = useStoreSettings();
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [imgPaused, setImgPaused] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "", city: "" });
  const [showSticky, setShowSticky] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const heroRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.shop.bySlug.useQuery({ slug }, { staleTime: 60 * 1000 });
  const addReview = trpc.shop.addReview.useMutation();
  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Auto-advance image carousel */
  const gallery = data?.product?.images?.length
    ? data.product.images
    : data?.product?.img
      ? [data.product.img]
      : [];

  useEffect(() => {
    if (imgPaused || gallery.length <= 1) return;
    const id = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % gallery.length);
    }, 3000);
    return () => clearInterval(id);
  }, [imgPaused, gallery.length]);

  /* Initialize default variant selections */
  useEffect(() => {
    if (data?.product?.variants && Array.isArray(data.product.variants)) {
      const defaults: Record<string, string> = {};
      for (const v of data.product.variants) {
        if (v.options.length > 0) defaults[v.type] = v.options[0].value;
      }
      setSelectedVariants(defaults);
    }
  }, [data?.product?.variants]);

  if (isLoading) {
    return <div className="mx-auto max-w-[var(--store-max-width)] px-4 py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>;
  }

  if (!data?.product) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("notFound.title")}</h1>
        <Link to="/shop" className="mt-6 rounded-full bg-[var(--text-1)] px-6 py-3 font-hud text-sm font-bold text-white">{t("cart.emptyCta")}</Link>
      </section>
    );
  }

  const { product, similar, reviews } = data;
  const name = product.nameFr;
  const summary = product.summaryFr;
  const description = product.descriptionFr;
  const faq = product.faqFr as { q: string; a: string }[] | null | undefined;
  const specs = (product.specs ?? []) as { k: string; v: string }[];
  const variants = (product.variants ?? null) as ProductVariant[] | null;
  const inCompare = compare.has(product.id);
  const avgRating = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  /* Variant price/stock computation */
  const handleVariantSelect = (type: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [type]: value }));
  };

  const variantPriceDiff = (() => {
    if (!variants) return 0;
    let diff = 0;
    for (const v of variants) {
      const sel = selectedVariants[v.type];
      if (sel) {
        const opt = v.options.find((o) => o.value === sel);
        if (opt?.priceDiff) diff += opt.priceDiff;
      }
    }
    return diff;
  })();

  const variantStock = (() => {
    if (!variants) return product.stock;
    let lowest: number | null = null;
    for (const v of variants) {
      const sel = selectedVariants[v.type];
      if (sel) {
        const opt = v.options.find((o) => o.value === sel);
        if (opt?.stock != null) {
          lowest = lowest === null ? opt.stock : Math.min(lowest, opt.stock);
        }
      }
    }
    return lowest ?? product.stock;
  })();

  const effectivePrice = product.price + variantPriceDiff;
  const effectiveStock = variantStock;

  const waMessage = t("product.orderByWhatsAppMsg", {
    store: settings.storeName,
    name,
    price: formatPrice(effectivePrice),
  });

  const handleReviewSubmit = () => {
    if (!me) { toast(t("auth.loginTitle")); return; }
    addReview.mutate(
      { productId: product.id, rating: review.rating, comment: review.comment, city: review.city || undefined },
      { onSuccess: () => { toast.success(t("common.save")); setReview({ rating: 5, comment: "", city: "" }); }, onError: () => toast.error(t("errors.generic")) },
    );
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* Hero — full-width product showcase */}
      <div ref={heroRef} className="relative min-h-[70vh] bg-[var(--page-soft)]">
        <div className="mx-auto grid min-h-[70vh] max-w-[var(--store-max-width)] items-center gap-8 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div
              className="relative aspect-square overflow-hidden rounded-3xl bg-white"
              onMouseEnter={() => setImgPaused(true)}
              onMouseLeave={() => setImgPaused(false)}
            >
              {gallery[activeImg] ? (
                <img src={gallery[activeImg]} alt={name} className="h-full w-full object-contain p-8 transition-transform duration-500" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-sm uppercase tracking-widest text-[var(--text-2)]">{product.sku}</div>
              )}
              {/* Watermark overlay */}
              {settings.productWatermark.enabled && (settings.productWatermark.logo || settings.storeLogo) && (
                <div className="pointer-events-none absolute inset-0 z-[5] p-5">
                  {/* Top-left: product name */}
                  <span className="absolute top-4 left-4 font-hud font-black uppercase tracking-wider" style={{ fontSize: settings.productWatermark.fontSize, color: settings.productWatermark.textColor }}>{name}</span>
                  {/* Top-right: price */}
                  <span className="absolute top-4 right-4 font-hud font-black" style={{ fontSize: settings.productWatermark.fontSize, color: settings.productWatermark.textColor }}>{formatPrice(effectivePrice)}</span>
                  {/* Center: logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={settings.productWatermark.logo || settings.storeLogo}
                      alt=""
                      className="select-none"
                      draggable={false}
                      style={{ width: settings.productWatermark.size, opacity: settings.productWatermark.opacity / 100 }}
                    />
                  </div>
                  {/* Bottom-left: store URL */}
                  {settings.productWatermark.urlText && (
                    <span className="absolute bottom-4 left-4 font-hud font-black" style={{ fontSize: settings.productWatermark.fontSize, color: settings.productWatermark.textColor }}>{settings.productWatermark.urlText}</span>
                  )}
                </div>
              )}
              {/* Nav arrows */}
              {gallery.length > 1 && (
                <>
                  <button type="button" onClick={() => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setActiveImg((i) => (i + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Dot indicators */}
              {gallery.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                  {gallery.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActiveImg(i)}
                      className={cn("h-1.5 rounded-full transition-all duration-300", i === activeImg ? "w-4 bg-[var(--gold)]" : "w-1.5 bg-black/30")} />
                  ))}
                </div>
              )}
            </div>
            {gallery.length > 1 ? (
              <div className="mt-4 flex justify-center gap-3">
                {gallery.map((img, i) => (
                  <button key={i} type="button" onClick={() => setActiveImg(i)}
                    className={cn("relative h-16 w-16 overflow-hidden rounded-lg transition-all", i === activeImg ? "opacity-100" : "opacity-40 hover:opacity-70")}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    {i === activeImg && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--text-1)]" />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="order-1 flex flex-col lg:order-2">
            {product.discount ? (
              <span className="mb-4 w-fit rounded-full bg-[var(--gold)] px-4 py-1.5 font-hud text-xs font-bold text-black">-{product.discount}%</span>
            ) : null}
            {product.isNew ? (
              <span className="mb-4 w-fit rounded-full bg-[var(--text-1)] px-4 py-1.5 font-hud text-xs font-bold text-white">{t("common.newArrivals")}</span>
            ) : null}

            <h1 className="font-hud text-4xl font-extrabold leading-tight tracking-tight text-[var(--text-1)] sm:text-5xl">{name}</h1>

            {reviews.length ? (
              <div className="mt-4 flex items-center gap-3">
                <Stars rating={avgRating} size="md" />
                <span className="text-sm text-[var(--text-2)]">{t("product.reviewCount", { count: reviews.length })}</span>
              </div>
            ) : null}

            {summary ? <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--text-2)]">{summary}</p> : null}

            {/* Variant selector */}
            {variants && variants.length > 0 && (
              <div className="mt-6">
                <VariantSelector variants={variants} selected={selectedVariants} onSelect={handleVariantSelect} />
              </div>
            )}

            <div className="mt-8 flex items-baseline gap-4">
              <span className="price-mono text-5xl font-extrabold">{formatPrice(effectivePrice)}</span>
              {product.oldPrice ? <span className="price-mono text-xl text-[var(--text-2)] line-through">{formatPrice(product.oldPrice)}</span> : null}
            </div>
            <p className="mt-1 text-xs text-[var(--text-2)]">{t("product.priceInclTax")}</p>

            {/* Stock */}
            <div className="mt-6 flex items-center gap-3">
              {effectiveStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> {t("common.inStock")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600">{t("common.outOfStock")}</span>
              )}
              <span className="text-xs text-[var(--text-2)]">{t("product.shippedWithin")}</span>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-1 rounded-full border border-[var(--line)] px-1.5 py-1">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[var(--text-2)] hover:bg-[var(--page-soft)]">−</button>
                <span className="w-10 text-center font-mono text-sm font-bold text-[var(--text-1)]">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(effectiveStock || 1, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[var(--text-2)] hover:bg-[var(--page-soft)]">+</button>
              </div>
              <button
                type="button"
                disabled={effectiveStock <= 0}
                onClick={() => { add({ productId: product.id, slug: product.slug, nameFr: product.nameFr, price: effectivePrice, oldPrice: product.oldPrice, img: gallery[0] ?? null, stock: effectiveStock }, qty); setOpen(true); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--text-1)] px-8 py-3.5 font-hud text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" /> {t("common.addToCart")}
              </button>
              <button type="button" onClick={() => compare.toggle(product.id)}
                className={cn("inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 font-hud text-sm font-semibold transition-all",
                  inCompare ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--text-1)] hover:text-[var(--text-1)]")}>
                <GitCompareArrows className="h-4 w-4" /> {inCompare ? t("product.inCompare") : t("product.addToCompare")}
              </button>
            </div>

            <a href={buildWhatsAppUrl(settings.contactPhone, waMessage)} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] px-6 py-3.5 font-hud text-sm font-semibold text-[var(--text-2)] transition-all hover:border-[var(--text-1)] hover:text-[var(--text-1)]">
              <MessageCircle className="h-4 w-4" /> {t("product.orderByWhatsApp")}
            </a>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { icon: Truck, text: t("trust.ship") },
                { icon: BadgeCheck, text: t("trust.cod") },
                { icon: RotateCcw, text: t("trust.exchange") },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                  <b.icon className="h-4 w-4 text-[var(--gold)]" />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <button type="button" onClick={() => scrollTo("product-details")} className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[var(--text-2)] hover:text-[var(--text-1)]">
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>

      {/* Sticky add-to-cart bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--page)]/95 backdrop-blur-md transition-all duration-300", showSticky ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
        <div className="mx-auto flex max-w-[var(--store-max-width)] items-center justify-between gap-4 px-6 py-3">
          <div className="hidden items-center gap-4 sm:flex">
            {gallery[0] ? <img src={gallery[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /> : null}
            <div>
              <p className="max-w-[300px] truncate font-hud text-sm font-bold text-[var(--text-1)]">{name}</p>
              <span className="price-mono text-lg font-bold">{formatPrice(effectivePrice)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollTo("product-top")} className="hidden items-center justify-center rounded-full border border-[var(--line)] p-2.5 text-[var(--text-2)] hover:text-[var(--text-1)] sm:flex">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={effectiveStock <= 0}
              onClick={() => { add({ productId: product.id, slug: product.slug, nameFr: product.nameFr, price: effectivePrice, oldPrice: product.oldPrice, img: gallery[0] ?? null, stock: effectiveStock }, qty); setOpen(true); }}
              className="rounded-full bg-[var(--text-1)] px-8 py-3 font-hud text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {t("common.addToCart")}
            </button>
          </div>
        </div>
      </div>

      <div id="product-top" />

      {/* ─── Details section ─── */}
      <div id="product-details" className="mx-auto max-w-[var(--store-max-width)] px-6 py-20 space-y-24">

        {/* ─── Specs + Wireframe ─── */}
        {specs.length ? (
          <section>
            <h2 className="font-hud text-3xl font-extrabold tracking-tight text-[var(--text-1)]">{t("product.specs")}</h2>
            <div className="mt-8 space-y-0 overflow-hidden rounded-2xl border border-[var(--line)]">
              {specs.map((s, i) => (
                <div key={i} className={cn("flex items-center justify-between px-5 py-3.5", i % 2 === 0 ? "bg-[var(--page)]" : "bg-[var(--page-soft)]")}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">{s.k}</span>
                  <span className="text-sm font-medium text-[var(--text-1)]">{s.v}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── Quick Specs Ribbon ─── */}
        {specs.length > 0 ? (
          <QuickSpecsRibbon specs={specs} />
        ) : null}

        {/* ─── Description (alternating text + visual blocks) ─── */}
        {description ? (
          <section>
            <h2 className="font-hud text-3xl font-extrabold tracking-tight text-[var(--text-1)] mb-12">{t("product.description")}</h2>
            <DescriptionBlock html={description} specs={specs} />
          </section>
        ) : null}

        {/* ─── FAQ ─── */}
        {faq && faq.length ? (
          <FaqSection faq={faq} />
        ) : null}

        {/* ─── Reviews ─── */}
        <section>
          <h2 className="font-hud text-3xl font-extrabold tracking-tight text-[var(--text-1)]">
            {t("product.reviews")} <span className="text-[var(--text-2)]">({reviews.length})</span>
          </h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-hud text-base font-bold text-[var(--text-1)]">{t("product.writeReview")}</h3>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setReview((r) => ({ ...r, rating: i }))} aria-label={`${i}/5`}>
                    <Star className={cn("h-4 w-4 transition-colors", i <= review.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--line-strong)] hover:text-[var(--gold)]")} />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={review.city} onChange={(e) => setReview((r) => ({ ...r, city: e.target.value }))} placeholder={t("checkout.city")}
                  className="h-9 flex-1 rounded-full border border-[var(--line)] bg-transparent px-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-2)] focus:border-[var(--gold)]" />
                <button type="button" disabled={review.comment.trim().length < 3 || addReview.isPending} onClick={handleReviewSubmit}
                  className="shrink-0 rounded-full bg-[var(--text-1)] px-5 h-9 font-hud text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40">
                  {t("product.writeReview")}
                </button>
              </div>
              <Textarea value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} placeholder={t("checkout.notes")}
                className="mt-2 min-h-16 rounded-xl border-[var(--line)] bg-transparent text-sm text-[var(--text-1)] placeholder:text-[var(--text-2)]" />
              {!me ? <p className="mt-2 text-xs text-[var(--text-2)]">{t("auth.loginTitle")}</p> : null}
            </div>

            <div>
              {reviews.length ? (
                <ul className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-[var(--line)] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-hud text-sm font-bold text-[var(--text-1)]">{r.author}</p>
                          <p className="text-xs text-[var(--text-2)]">{r.city ? `${r.city} · ` : ""}{new Date(r.createdAt).toLocaleDateString("fr-MA")}</p>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-[var(--line)] p-8 text-center">
                  <p className="text-sm text-[var(--text-2)]">{t("product.noReviews")}</p>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{t("product.beFirst")}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Related products */}
      {similar.length ? (
        <section className="border-t border-[var(--line)] bg-[var(--page-soft)]">
          <div className="mx-auto max-w-[var(--store-max-width)] px-6 py-20">
            <h2 className="font-hud text-3xl font-extrabold tracking-tight text-[var(--text-1)]">{t("product.related")}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/* ─── Parse description HTML into alternating text+visual blocks ─── */
function parseDescriptionSections(html: string): { title: string; content: string }[] {
  const parts = html.split(/<h3[^>]*>/i).filter(Boolean);
  const seen = new Set<string>();
  return parts.map((part) => {
    const titleMatch = part.match(/^([^<]+)<\/h3>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const content = part.replace(/^([^<]+<\/h3>)/i, "").trim();
    return { title, content };
  }).filter((s) => {
    if (!s.title && !s.content) return false;
    const key = s.title.toLowerCase();
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });
}

function getVisualForKeyword(title: string, specs: { k: string; v: string }[]): React.ReactNode | null {
  const lower = title.toLowerCase();

  /* Price / availability / Maroc */
  if (/prix|disponib|maroc|acheter|offre|commander|livraison|casablanca|magasin/.test(lower)) {
    const marque = specs.find((s) => /marque|brand/i.test(s.k));
    const modele = specs.find((s) => /modèle|model/i.test(s.k));
    const ecran = specs.find((s) => /écran|screen/i.test(s.k));
    return (
      <div className="grid grid-cols-2 gap-2">
        {marque && <StatRow icon={Zap} label="Marque" value={marque.v} delay={0} />}
        {modele && <StatRow icon={Zap} label="Modèle" value={modele.v} delay={80} />}
        {ecran && <StatRow icon={Monitor} label="Écran" value={ecran.v} delay={160} />}
        <StatRow icon={Truck} label="Livraison" value="Rapide au Maroc" delay={240} />
      </div>
    );
  }

  /* "Pour qui" / use-case */
  if (/pour qui|utilisation|usage|idéal|recommandé|convient|profil|besoin/.test(lower)) {
    const hasGpu = specs.some((s) => /gpu|rtx|gtx|radeon|graphique/i.test(s.k));
    const ram = specs.find((s) => /ram|mémoire/i.test(s.k));
    const ramNum = parseInt(ram?.v?.match(/(\d+)/)?.[1] || "0");
    const useCases = [
      { label: "Bureau", icon: Monitor, ok: true },
      { label: "Gaming", icon: Gamepad2, ok: hasGpu },
      { label: "Création", icon: Palette, ok: ramNum >= 16 },
      { label: "Études", icon: Cpu, ok: true },
    ];
    return (
      <div className="grid grid-cols-2 gap-2">
        {useCases.map((uc, i) => {
          const Ic = uc.icon;
          return (
            <div key={i} className={cn("flex items-center gap-2 px-3 py-2", uc.ok ? "text-[var(--text-1)]" : "text-[var(--text-2)]")}>
              <Ic className={cn("h-4 w-4", uc.ok ? "text-[var(--gold)]" : "text-[var(--text-2)]")} />
              <span className={cn("text-xs font-medium", uc.ok ? "text-[var(--text-1)]" : "text-[var(--text-2)]")}>{uc.label}</span>
              {uc.ok && <Check className="ml-auto h-3 w-3 text-[var(--gold)]" />}
            </div>
          );
        })}
      </div>
    );
  }

  /* Design / build */
  if (/design|finition|fabrication|ergonomie|matériau|poids|dimension|construction|qualité/.test(lower)) {
    return <StatGrid specs={specs} exclude={["marque", "modèle", "processeur", "gpu", "ram", "stockage", "écran"]} />;
  }

  /* Écran — stat cards */
  if (/écran|screen|display|affichage|résolution/.test(lower)) {
    const ecran = specs.find((s) => /écran|screen|display/i.test(s.k));
    const hz = parseInt(ecran?.v?.match(/(\d+)\s*Hz/i)?.[1] || "60");
    const size = parseFloat(ecran?.v?.match(/(\d+(?:\.\d)?)/)?.[1] || "0");
    return (
      <div className="grid grid-cols-2 gap-2">
        {size > 0 && <StatCard icon={Monitor} value={size} suffix='"' label="Écran" delay={0} />}
        <StatCard icon={Monitor} value={hz} suffix="Hz" label="Rafraîchissement" delay={80} />
      </div>
    );
  }

  /* Performances / CPU — stat cards */
  if (/performance|processeur|cpu|ryzen|intel|core|vitesse|benchmark/.test(lower)) {
    const cpu = specs.find((s) => /processeur|cpu|ryzen|intel|core/i.test(s.k));
    const ram = specs.find((s) => /ram|mémoire/i.test(s.k));
    const stockage = specs.find((s) => /ssd|stockage|nvme/i.test(s.k));
    return (
      <div className="grid grid-cols-2 gap-2">
        {ram && <StatRow icon={MemoryStick} label="RAM" value={ram.v} delay={0} />}
        {cpu && <StatRow icon={Cpu} label="Processeur" value={cpu.v} delay={80} />}
        {stockage && <StatRow icon={HardDrive} label="Stockage" value={stockage.v} delay={160} />}
      </div>
    );
  }

  /* Gaming / GPU — stat rows */
  if (/gaming|graphisme|gpu|jeu|jeux|ray.tracing|dlss|fsr/.test(lower)) {
    const gpu = specs.find((s) => /gpu|graphique|rtx|gtx|radeon/i.test(s.k));
    return (
      <div className="grid grid-cols-2 gap-2">
        {gpu && <StatRow icon={Gamepad2} label="GPU" value={gpu.v} delay={0} />}
        <StatRow icon={Gamepad2} label="Ray Tracing" value="RT" delay={80} />
        <StatRow icon={Gamepad2} label="DLSS" value="IA Boost" delay={160} />
      </div>
    );
  }

  /* Battery — stat card */
  if (/batterie|battery|autonomie|charge/.test(lower)) {
    const bat = specs.find((s) => /batterie|battery|autonomie/i.test(s.k));
    const wh = specToNum(bat?.v ?? "") || 0;
    return (
      <div className="grid grid-cols-2 gap-2">
        {bat && <StatRow icon={Battery} label="Batterie" value={bat.v} delay={0} />}
        {wh > 0 && <StatCard icon={Battery} value={wh} suffix="Wh" label="Capacité" delay={80} />}
      </div>
    );
  }

  /* Connectivity */
  if (/connect|port|usb|hdmi|wi-?fi|bluetooth|rj45|thunderbolt/.test(lower)) {
    const wifi = specs.find((s) => /wi-?fi|wifi/i.test(s.k));
    const ports = specs.filter((s) => /usb|hdmi|rj45|thunderbolt/i.test(s.k));
    return (
      <div className="grid grid-cols-2 gap-2">
        {wifi && <StatRow icon={Wifi} label="Wi-Fi" value={wifi.v} delay={0} />}
        {ports.map((p, i) => (
          <StatRow key={i} icon={Usb} label={p.k} value={p.v} delay={(i + 1) * 80} />
        ))}
      </div>
    );
  }

  /* Audio */
  if (/audio|son|haut-?parleur|speaker|micro|dolby/.test(lower)) {
    const audio = specs.find((s) => /audio|son|haut-?parleur|speaker/i.test(s.k));
    const cam = specs.find((s) => /caméra|webcam|camera/i.test(s.k));
    return (
      <div className="grid grid-cols-2 gap-2">
        {audio && <StatRow icon={Speaker} label="Audio" value={audio.v} delay={0} />}
        {cam && <StatRow icon={Camera} label="Caméra" value={cam.v} delay={80} />}
      </div>
    );
  }

  /* Verdict / conclusion — stat cards with countup */
  if (/verdict|conclusion|résumé|avis|note|opinion/.test(lower)) {
    const nums = specs
      .map((s) => ({ k: s.k, n: specToNum(s.v) }))
      .filter((x): x is { k: string; n: number } => x.n !== null && x.n > 0 && x.n < 100000)
      .slice(0, 4);
    if (nums.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2">
        {nums.map((x, i) => (
          <StatCard key={i} icon={iconForSpec(x.k)} value={x.n} label={x.k} delay={i * 80} />
        ))}
      </div>
    );
  }

  /* Conseils / tips */
  if (/conseil|tip|astuce|recommandation|comparaison|alternative/.test(lower)) {
    return <StatGrid specs={specs} exclude={["marque", "modèle"]} />;
  }

  /* Fallback: no visual for unmatched sections */
  return null;
}

function DescriptionBlock({ html, specs }: { html: string; specs: { k: string; v: string }[] }) {
  const sections = parseDescriptionSections(html);
  if (sections.length === 0) return null;

  return (
    <div className="space-y-16">
      {sections.map((sec, idx) => {
        const visual = getVisualForKeyword(sec.title, specs);
        const isReverse = idx % 2 === 1;
        const { ref, visible } = useScrollReveal(0.1);
        return (
          <div
            key={idx}
            ref={ref}
            className={cn(
              "grid grid-cols-1 gap-12 items-center transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              "lg:grid-cols-2",
            )}
          >
            {isReverse ? (
              <>
                <div className="space-y-3 flex flex-col justify-center lg:order-2">
                  {sec.title && <h3 className="font-hud text-xl font-extrabold tracking-tight text-[var(--text-1)]">{sec.title}</h3>}
                  <div className="prose max-w-none text-sm leading-relaxed text-[var(--text-2)] [&_strong]:text-[var(--text-1)] [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: sec.content }} />
                </div>
                {visual ? <div className="flex items-center justify-center lg:order-1">{visual}</div> : null}
              </>
            ) : (
              <>
                <div className="space-y-3 flex flex-col justify-center">
                  {sec.title && <h3 className="font-hud text-xl font-extrabold tracking-tight text-[var(--text-1)]">{sec.title}</h3>}
                  <div className="prose max-w-none text-sm leading-relaxed text-[var(--text-2)] [&_strong]:text-[var(--text-1)] [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: sec.content }} />
                </div>
                {visual ? <div className="flex items-center justify-center">{visual}</div> : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
