import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Truck, BadgeCheck, Quote, Star, Check, LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";
import { trpc } from "@/providers/trpc";
import { BestSellerCard } from "@/components/best-seller-card";
import Hero from "@/components/storefront/Hero";
import type { HeroSlide } from "@/lib/hero";
import { SectionHead } from "@/components/storefront/section-head";
import { CountUp } from "@/components/count-up";
import { FadeIn } from "@/components/fade-in";

export default function Home() {
  const { t } = useI18n();
  const { settings } = useStoreSettings();
  const { data: categories } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: brands } = trpc.shop.brands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: campaigns } = trpc.shop.campaigns.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: newest } = trpc.shop.newest.useQuery(undefined, { staleTime: 60 * 1000 });
  const { data: deals } = trpc.shop.list.useQuery({ sort: "popular" }, { staleTime: 60 * 1000 });
  const { data: stats } = trpc.shop.stats.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const [tab, setTab] = useState("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [orbitHovered, setOrbitHovered] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string | null>(null);
  const [brandProgress, setBrandProgress] = useState(0);
  const brandTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cometAngle, setCometAngle] = useState(0);
  const cometRef = useRef<number>(0);
  const catCometRef = useRef<number>(0);
  const catCometElRef = useRef<HTMLDivElement>(null);
  const catOrbitPausedRef = useRef(false);
  const catIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BRAND_INTERVAL = 4000;
  const effectiveBrand = selectedBrandSlug ?? brands?.[0]?.slug ?? null;
  const { data: brandProducts } = trpc.shop.list.useQuery(
    { brand: effectiveBrand ?? undefined, limit: 6 },
    { staleTime: 60_000, enabled: !!effectiveBrand },
  );
  const activeBrand = useMemo(() => brands?.find((b) => b.slug === effectiveBrand), [brands, effectiveBrand]);
  const { data: brandCategories } = trpc.shop.brandCategories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const filteredBrands = useMemo(() => {
    if (!brands || !brandCategories || brands.length === 0) return brands ?? [];
    const catMap = new Map<string, Set<string>>();
    for (const row of brandCategories) {
      if (!row.brandSlug || !row.categorySlug) continue;
      if (!catMap.has(row.categorySlug)) catMap.set(row.categorySlug, new Set());
      catMap.get(row.categorySlug)!.add(row.brandSlug);
    }
    const picked = new Set<string>();
    const result: typeof brands = [];
    for (const [, brandSlugs] of catMap) {
      for (const bs of brandSlugs) {
        if (picked.has(bs)) continue;
        const b = brands.find((x) => x.slug === bs);
        if (b) { result.push(b); picked.add(bs); }
        if (result.length >= 2 * catMap.size) break;
      }
      if (result.length >= 2 * catMap.size) break;
    }
    if (result.length < 12) {
      for (const b of brands) {
        if (picked.has(b.slug)) continue;
        result.push(b); picked.add(b.slug);
        if (result.length >= 12) break;
      }
    }
    return result;
  }, [brands, brandCategories]);

  // Auto-advance brands — smooth progress with rAF
  useEffect(() => {
    if (!filteredBrands || filteredBrands.length <= 1) return;
    setBrandProgress(0);
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / BRAND_INTERVAL) * 100, 100);
      setBrandProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    brandTimerRef.current = setInterval(() => {
      setBrandProgress(0);
      setSelectedBrandSlug((prev) => {
        const idx = filteredBrands.findIndex((b) => b.slug === prev);
        return filteredBrands[(idx + 1) % filteredBrands.length].slug;
      });
    }, BRAND_INTERVAL);
    return () => { cancelAnimationFrame(raf); clearInterval(brandTimerRef.current!); };
  }, [filteredBrands, selectedBrandSlug]);

  // Comet animation — JS-driven elliptical orbit
  useEffect(() => {
    let raf: number;
    const speed = 0.003;
    const tick = () => {
      cometRef.current += speed;
      if (cometRef.current > Math.PI * 2) cometRef.current -= Math.PI * 2;
      setCometAngle(cometRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tops = useMemo(() => (categories ?? []).filter((c) => !c.parentSlug), [categories]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, typeof categories>();
    for (const c of categories ?? []) {
      if (c.parentSlug) {
        const arr = map.get(c.parentSlug) ?? [];
        arr.push(c);
        map.set(c.parentSlug, arr);
      }
    }
    return (slug: string) => map.get(slug) ?? [];
  }, [categories]);

  const CAT_COLORS = [
    { bg: "#1a0a0a", accent: "#ff2d55", glow: "rgba(255,45,85,0.3)" },
    { bg: "#0a1a0d", accent: "#30d158", glow: "rgba(48,209,88,0.3)" },
    { bg: "#1a1400", accent: "#ffd60a", glow: "rgba(255,214,10,0.3)" },
    { bg: "#0a0a2a", accent: "#0a84ff", glow: "rgba(10,132,255,0.3)" },
    { bg: "#1f0a2e", accent: "#bf5af2", glow: "rgba(191,90,242,0.3)" },
    { bg: "#0a1a2a", accent: "#64d2ff", glow: "rgba(100,210,255,0.3)" },
    { bg: "#1a1a0a", accent: "#ff9f0a", glow: "rgba(255,159,10,0.3)" },
    { bg: "#2a0a1a", accent: "#ff375f", glow: "rgba(255,55,95,0.3)" },
    { bg: "#0a2a1a", accent: "#00c7be", glow: "rgba(0,199,190,0.3)" },
    { bg: "#1a0a2a", accent: "#ac8e68", glow: "rgba(172,142,104,0.3)" },
    { bg: "#0a0a1a", accent: "#5e5ce6", glow: "rgba(94,92,230,0.3)" },
    { bg: "#2a1a0a", accent: "#ff6482", glow: "rgba(255,100,130,0.3)" },
  ];
  const catColorMap = useMemo(() => {
    const m = new Map<string, typeof CAT_COLORS[number]>();
    tops.forEach((c, i) => m.set(c.slug, CAT_COLORS[i % CAT_COLORS.length]));
    return m;
  }, [tops]);
  const activeCatColor = hoveredPlanet ? catColorMap.get(hoveredPlanet) ?? CAT_COLORS[0] : null;

  // Category orbit comet — pauses on hover, resumes after 5s idle
  useEffect(() => {
    let raf: number;
    let last: string | null = null;
    const speed = 0.004;
    const els = catCometElRef.current?.children;
    const tick = () => {
      if (!catOrbitPausedRef.current) {
        catCometRef.current += speed;
        if (catCometRef.current > Math.PI * 2) catCometRef.current -= Math.PI * 2;
      }
      const a = catCometRef.current;
      const cx = 240 + 190 * Math.cos(a);
      const cy = 240 + 190 * Math.sin(a);
      if (els && els[0]) {
        (els[0] as HTMLElement).style.left = `${cx - 4}px`;
        (els[0] as HTMLElement).style.top = `${cy - 4}px`;
      }
      for (let t = 1; t <= 3; t++) {
        const ta = a - t * 0.08;
        const tx = 240 + 190 * Math.cos(ta);
        const ty = 240 + 190 * Math.sin(ta);
        if (els && els[t]) {
          const s = 8 - t * 2;
          (els[t] as HTMLElement).style.left = `${tx - s / 2}px`;
          (els[t] as HTMLElement).style.top = `${ty - s / 2}px`;
        }
      }
      let closest: string | null = null;
      let minDist = 50;
      tops.forEach((c, i) => {
        const angle = (i / tops.length) * 2 * Math.PI;
        const px = 240 + 190 * Math.cos(angle);
        const py = 240 + 190 * Math.sin(angle);
        const dist = Math.hypot(cx - px, cy - py);
        if (dist < minDist) { minDist = dist; closest = c.slug; }
      });
      if (closest !== last) { last = closest; setHoveredPlanet(closest); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (catIdleTimerRef.current) clearTimeout(catIdleTimerRef.current); };
  }, [tops]);

  const subscribe = trpc.shop.subscribeNewsletter.useMutation();
  const { data: bestSellerCategories } = trpc.shop.bestSellerCategories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: bestSellers } = trpc.shop.bestSellers.useQuery(
    { category: tab === "all" ? undefined : tab, limit: 10 },
    { staleTime: 60 * 1000 },
  );

  const heroes = useMemo(() => (campaigns ?? []).filter((c) => c.type === "hero") as unknown as HeroSlide[], [campaigns]);
  const promoCampaigns = useMemo(() => (campaigns ?? []).filter((c) => c.type === "campaign"), [campaigns]);
  const discounted = useMemo(() => (deals ?? []).filter((p) => (p.oldPrice ?? 0) > p.price).slice(0, 5), [deals]);

  const submitNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate(
      { email },
      {
        onSuccess: () => {
          setSubscribed(true);
          setEmail("");
        },
        onError: () => setSubscribed(false),
      },
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION ORDER: Option D — Browse → Want → Buy
          1. Hero
          2. Category orbit (Browse)
          3. Campaign promos
          4. Brand orbit (Want)
          5. Deals
          6. Best sellers (Buy)
          7. New arrivals
          8. Value props
          9. Newsletter
          ═══════════════════════════════════════════ */}

      {/* 1. Hero */}
      <Hero heroes={heroes} settings={settings.homeHero} />

      {/* 2. Category explorer — orbit left, subcategories right */}
      {categories && categories.length > 0 ? (
        <FadeIn>
        <section className="relative overflow-hidden py-16 sm:py-20" role="region" aria-label={t("home.categoryTitle")} style={{ backgroundColor: activeCatColor?.bg ?? "#1a1a1a", transition: "background-color 800ms ease" }}>
          <div className="relative z-10 mx-auto max-w-[var(--section-categories-max-width)] px-4 sm:px-6">
            <h2 className="text-center font-hud text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">{t("home.categoryTitle")}</h2>
            <div className="mx-auto mt-2 mb-2 h-1 w-12 rounded-full bg-[var(--gold)]" />
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-gray-400">{t("home.categoryDesc")}</p>

            {/* Desktop: split layout */}
            <div className="mt-12 hidden lg:flex gap-8 items-center">
              {/* LEFT — Orbit */}
              <div
                className="relative flex-shrink-0"
                style={{ width: 480, height: 480 }}
                onMouseEnter={() => {
                  catOrbitPausedRef.current = true;
                  if (catIdleTimerRef.current) { clearTimeout(catIdleTimerRef.current); catIdleTimerRef.current = null; }
                }}
                onMouseMove={() => {
                  if (catIdleTimerRef.current) clearTimeout(catIdleTimerRef.current);
                  catIdleTimerRef.current = setTimeout(() => { catOrbitPausedRef.current = false; }, 5000);
                }}
                onMouseLeave={() => {
                  catIdleTimerRef.current = setTimeout(() => { catOrbitPausedRef.current = false; }, 5000);
                }}
              >
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 480" aria-hidden="true">
                  <circle cx="240" cy="240" r="190" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="6 4" />
                </svg>
                {/* Comet */}
                <div ref={catCometElRef} className="absolute inset-0 pointer-events-none">
                  <div className="absolute rounded-full transition-colors duration-700" style={{ width: 8, height: 8, left: 236, top: 236, backgroundColor: activeCatColor?.accent ?? "var(--gold)", boxShadow: `0 0 10px ${activeCatColor?.accent ?? "rgba(253,213,2,0.9)"}, 0 0 20px ${activeCatColor?.glow ?? "rgba(253,213,2,0.5)"}` }} />
                  {[1, 2, 3].map((t) => <div key={t} className="absolute rounded-full transition-colors duration-700" style={{ width: 8 - t * 2, height: 8 - t * 2, left: 236, top: 236, opacity: 0.6 / t, backgroundColor: activeCatColor?.accent ?? "var(--gold)" }} />)}
                </div>
                {/* Planets */}
                <div className="absolute inset-0">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 480" aria-hidden="true">
                    {tops.map((c, i) => {
                      const rad = (i / tops.length) * 2 * Math.PI;
                      const cc = catColorMap.get(c.slug);
                      const isH = hoveredPlanet === c.slug;
                      return <line key={c.slug} x1={240} y1={240} x2={240 + 190 * Math.cos(rad)} y2={240 + 190 * Math.sin(rad)} stroke={isH ? (cc?.accent ?? "rgba(253,213,2,0.6)") : "rgba(255,255,255,0.08)"} strokeWidth={isH ? 1.5 : 1} strokeDasharray="4 4" style={{ opacity: orbitHovered ? 1 : 0, transition: "opacity 500ms ease, stroke 500ms ease" }} />;
                    })}
                  </svg>
                  {tops.map((c, i) => {
                    const count = typeof c.productCount === "number" ? c.productCount : 0;
                    const rad = (i / tops.length) * 2 * Math.PI;
                    const isH = hoveredPlanet === c.slug;
                    const cc = catColorMap.get(c.slug);
                    return (
                      <div key={c.slug} className="absolute z-10" style={{ left: 240 + 190 * Math.cos(rad), top: 240 + 190 * Math.sin(rad), transform: "translate(-50%, -50%)" }} onMouseEnter={() => setHoveredPlanet(c.slug)}>
                        <div className="group flex flex-col items-center gap-1.5 cursor-pointer">
                          <div className={`relative h-[64px] w-[64px] overflow-hidden rounded-full border-2 bg-gradient-to-br from-gray-700 to-gray-800 p-1.5 transition-all duration-500 ${isH ? "scale-110" : "border-gray-600 group-hover:scale-110"}`} style={{ borderColor: isH ? cc?.accent : undefined, boxShadow: isH ? `0 0 24px ${cc?.glow}, 0 0 48px ${cc?.glow}` : undefined }}>
                            {c.image ? <img src={c.image} alt={c.nameFr} className="h-full w-full object-contain" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center text-lg text-gray-500">?</div>}
                          </div>
                          <p className="max-w-[90px] text-center font-hud text-[10px] font-bold uppercase leading-tight tracking-wider text-gray-400 group-hover:text-white">{c.nameFr}</p>
                          <span className="inline-flex items-center rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold text-gray-400 group-hover:bg-[var(--gold)]/10 group-hover:text-[var(--gold)]">{count} produits</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Center sun */}
                <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                  <Link to="/shop" className="group flex flex-col items-center gap-2">
                    <div className="absolute top-1/2 left-1/2 -z-30 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700" style={{ backgroundColor: activeCatColor?.accent ?? "var(--gold)", opacity: 0.12, animation: "sun-pulse-3 5s ease-in-out infinite" }} />
                    <div className="absolute top-1/2 left-1/2 -z-20 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-colors duration-700" style={{ backgroundColor: activeCatColor?.accent ?? "var(--gold)", opacity: 0.15, animation: "sun-pulse-2 4s ease-in-out 0.5s infinite" }} />
                    <div className="absolute top-1/2 left-1/2 -z-10 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-colors duration-700" style={{ backgroundColor: activeCatColor?.accent ?? "var(--gold)", opacity: 0.18, animation: "sun-pulse 3.5s ease-in-out infinite" }} />
                    <div className="relative flex h-[160px] w-[160px] items-center justify-center">
                      {settings.storeLogo ? <img src={settings.storeLogo} alt={settings.storeName} className="h-[140px] w-[140px] object-contain drop-shadow-[0_0_20px_rgba(253,213,2,0.2)]" /> : <span className="font-hud text-7xl font-black text-[var(--gold)]">J</span>}
                    </div>
                    <span className="font-hud text-sm font-extrabold uppercase tracking-[0.2em] text-gray-400 group-hover:text-[var(--gold)]">{settings.storeName}</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT — Subcategory panel */}
              <div className="flex-1 min-h-[480px] flex items-center justify-center">
                <div className="w-full">
                  {hoveredPlanet ? (() => {
                    const cat = tops.find((c) => c.slug === hoveredPlanet);
                    const subs = childrenOf(hoveredPlanet);
                    if (!cat) return null;
                    return (
                      <div key={hoveredPlanet}>
                        <div className="mb-6 flex items-center gap-4" style={{ animation: "panel-reveal 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
                          {cat.image && <img src={cat.image} alt={cat.nameFr} className="h-14 w-14 object-contain" />}
                          <div>
                            <h3 className="font-hud text-2xl font-extrabold text-white" style={{ color: activeCatColor?.accent }}>{cat.nameFr}</h3>
                            {cat.description && <p className="mt-1 text-sm text-gray-400 max-w-md">{cat.description}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => {
                            const sub = subs[i];
                            const subCount = sub ? (typeof sub.productCount === "number" ? sub.productCount : 0) : 0;
                            return sub ? (
                              <Link key={sub.slug} to={`/category/${sub.slug}`} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-300 hover:bg-white/[0.08]" style={{ animation: `panel-reveal 0.5s cubic-bezier(0.22,1,0.36,1) ${0.06 + i * 0.05}s both`, ["--cat-accent" as string]: activeCatColor?.accent }}>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                  {sub.image ? <img src={sub.image} alt={sub.nameFr} className="h-full w-full object-contain p-1" loading="lazy" /> : <span className="text-lg text-gray-500">?</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-hud text-sm font-bold text-gray-200 group-hover:text-white">{sub.nameFr}</p>
                                  <p className="text-[11px] text-gray-500">{subCount} {subCount === 1 ? "produit" : "produits"}</p>
                                </div>
                                <span className="text-gray-300 group-hover:text-white">→</span>
                              </Link>
                            )                             : <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-white/5 p-3" />;
                          })}
                        </div>
                        <Link to={`/category/${cat.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold hover:opacity-80" style={{ color: activeCatColor?.accent ?? "var(--gold)", animation: "panel-reveal 0.5s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}>Voir toute la catégorie <span>→</span></Link>
                      </div>
                    );
                  })(                  ) : <div className="flex h-[480px] items-center justify-center" />}
                </div>
              </div>
            </div>

            {/* Mobile: floating grid */}
            <div className="mt-10 grid grid-cols-3 gap-4 md:hidden">
              {tops.map((c, i) => {
                const count = typeof c.productCount === "number" ? c.productCount : 0;
                const dur = 3.5 + (i % 5) * 0.6;
                return (
                  <Link key={c.slug} to={`/category/${c.slug}`} className="group flex flex-col items-center gap-2" style={{ animation: `float-planet ${dur}s ease-in-out ${(i * 0.8) % 5}s infinite` }}>
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 p-2 transition-all duration-500 group-hover:border-[var(--gold)]/40 group-hover:shadow-[0_0_20px_rgba(253,213,2,0.15)]">
                      {c.image ? <img src={c.image} alt={c.nameFr} className="h-full w-full object-contain" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center text-lg text-gray-500">?</div>}
                    </div>
                    <p className="max-w-[90px] text-center font-hud text-[10px] font-bold uppercase leading-tight tracking-wider text-gray-400 group-hover:text-white">{c.nameFr}</p>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-gray-400 group-hover:bg-[var(--gold)]/10 group-hover:text-[var(--gold)]">{count}</span>
                  </Link>
                );
              })}
              <Link to="/shop" className="group flex flex-col items-center gap-2" style={{ animation: "float-planet 4s ease-in-out 2s infinite" }}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-600 bg-white/5 transition-all duration-500 group-hover:border-[var(--gold)] group-hover:bg-[var(--gold)]/[0.05]">
                  <LayoutGrid className="h-7 w-7 text-gray-500 group-hover:text-[var(--gold)]" />
                </div>
                <p className="text-center font-hud text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[var(--gold)]">Tout le catalogue</p>
              </Link>
            </div>
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 3. Campaign promo bands */}
      {promoCampaigns.length > 0 ? (
        <FadeIn delay={100}>
        <section className="mx-auto max-w-[var(--section-promos-max-width)] px-4 py-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {promoCampaigns.map((c) => (
              <Link
                key={c.slug}
                to={c.ctaUrl ?? "/shop"}
                className="group relative flex min-h-44 items-center overflow-hidden rounded-2xl border border-[var(--line)] p-6 transition-all hover:border-[var(--gold-hot)] hover:shadow-lg"
                style={{ background: `linear-gradient(120deg, ${c.bgColor ?? "#fcd406"}22, transparent 60%), var(--page)` }}
              >
                <div className="relative z-10 max-w-[70%]">
                  {c.eyebrow ? <p className="font-hud text-xs font-bold uppercase tracking-widest text-[var(--gold-hot)]">{c.eyebrow}</p> : null}
                  <p className="mt-1 font-hud text-xl font-extrabold text-[var(--text-1)]">{c.heading}</p>
                  {c.description ? <p className="mt-1 text-sm text-[var(--text-2)]">{c.description}</p> : null}
                  <span className="mt-3 inline-flex items-center gap-1 font-hud text-sm font-bold text-[var(--gold-hot)] group-hover:underline">
                    {t("campaign.seeProducts")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                {c.image ? (
                  <img src={c.image} alt="" className="absolute right-4 top-1/2 h-32 w-32 -translate-y-1/2 object-contain opacity-90 transition-transform group-hover:scale-105" />
                ) : null}
              </Link>
            ))}
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 4. Brand orbit — carousel selector + elliptical product orbit */}
      {filteredBrands && filteredBrands.length > 0 ? (
        <FadeIn>
        <section className="relative overflow-hidden bg-[var(--page-soft)] py-16 sm:py-20" role="region" aria-label={t("home.brandsTitle")}>
          {/* Centered title */}
          <div className="mx-auto max-w-[var(--section-marquee-max-width)] px-4 sm:px-6">
            <h2 className="text-center font-hud text-2xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-3xl">
              {t("home.brandsTitle")}
            </h2>
            <div className="mx-auto mt-2 mb-2 h-1 w-12 rounded-full bg-[var(--gold)]" />
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-gray-500">
              {t("home.brandDesc")}
            </p>
          </div>

          {/* Main layout: vertical pills left + orbit right */}
          <div className="mx-auto mt-8 max-w-[var(--section-marquee-max-width)] px-4 sm:px-6">
            <div className="flex items-center gap-8">
              {/* Left — vertical brand selector with progress bars */}
              <div className="hidden flex-shrink-0 flex-col gap-2 lg:flex">
                {filteredBrands.map((b) => {
                  const isActive = effectiveBrand === b.slug;
                  return (
                    <button
                      key={b.slug}
                      onClick={() => setSelectedBrandSlug(b.slug)}
                      className="relative overflow-hidden rounded-lg border px-4 py-2 text-left font-hud text-sm font-bold transition-all duration-300"
                      style={{
                        borderColor: isActive ? "var(--gold)" : "rgb(229 231 235)",
                        color: isActive ? "rgb(17 24 39)" : "rgb(107 114 128)",
                        backgroundColor: "white",
                        boxShadow: isActive ? "0 0 12px rgba(253,213,2,0.15)" : "none",
                        width: 140,
                      }}
                    >
                      {/* Full yellow fill — left to right */}
                      {isActive && (
                        <span
                          className="absolute inset-0 bg-[var(--gold)]"
                          style={{ clipPath: `inset(0 ${100 - brandProgress}% 0 0)` }}
                        />
                      )}
                      <span className="relative z-10">{b.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right — elliptical orbit with centered logo */}
              <div className="relative min-w-0 flex-1" style={{ height: 480 }}>
                {/* Ring 1 — outer, slow drift */}
                <div className="absolute inset-0" style={{ animation: "orbit-drift-1 8s ease-in-out infinite" }}>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 480" aria-hidden="true">
                    <ellipse cx="450" cy="240" rx="420" ry="180" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeDasharray="8 5" />
                  </svg>
                </div>
                {/* Ring 2 — middle, medium drift */}
                <div className="absolute inset-0" style={{ animation: "orbit-drift-2 6.5s ease-in-out infinite" }}>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 480" aria-hidden="true">
                    <ellipse cx="450" cy="240" rx="310" ry="130" fill="none" stroke="rgba(0,0,0,0.09)" strokeWidth="1.2" strokeDasharray="6 4" />
                  </svg>
                </div>
                {/* Ring 3 — inner, fast drift */}
                <div className="absolute inset-0" style={{ animation: "orbit-drift-3 5s ease-in-out infinite" }}>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 480" aria-hidden="true">
                    <ellipse cx="450" cy="240" rx="200" ry="80" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 3" />
                  </svg>
                </div>

                {/* Comet — 1 per ring, each on its own orbit */}
                {[
                  { rx: 420, ry: 180, size: 8, speed: 1, offset: 0 },
                  { rx: 310, ry: 130, size: 5, speed: 0.75, offset: -2 },
                  { rx: 200, ry: 80, size: 3.5, speed: 0.5, offset: -4 },
                ].map((c, i) => {
                  const a = cometAngle * c.speed + c.offset;
                  const cx = 450 + c.rx * Math.cos(a);
                  const cy = 240 + c.ry * Math.sin(a);
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: cx,
                        top: cy,
                        width: c.size * 2,
                        height: c.size * 2,
                        backgroundColor: "var(--gold)",
                        opacity: 1 - i * 0.2,
                        transform: "translate(-50%, -50%)",
                        boxShadow: i === 0 ? "0 0 14px 5px rgba(253,213,2,0.45)" : `0 0 ${8 - i * 2}px ${3 - i}px rgba(253,213,2,${0.3 - i * 0.08})`,
                      }}
                    />
                  );
                })}

                {/* Swimming dots on rings */}
                {[
                  { rx: 310, ry: 130, speed: 0.002, offset: -1, size: 3, opacity: 0.35 },
                  { rx: 200, ry: 80, speed: 0.0015, offset: -3, size: 2.5, opacity: 0.3 },
                  { rx: 420, ry: 180, speed: 0.001, offset: -5, size: 2, opacity: 0.25 },
                ].map((dot, i) => {
                  const a = cometAngle * (dot.speed / 0.003) + dot.offset;
                  const cx = 450 + dot.rx * Math.cos(a);
                  const cy = 240 + dot.ry * Math.sin(a);
                  return (
                    <div
                      key={`swim-${i}`}
                      className="absolute rounded-full"
                      style={{
                        left: cx,
                        top: cy,
                        width: dot.size * 2,
                        height: dot.size * 2,
                        backgroundColor: "var(--gold)",
                        opacity: dot.opacity,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                })}

                {/* Center brand logo — floating with breathing glow */}
                <div className="absolute left-1/2 top-1/2 z-20" style={{ animation: "brand-logo-float 5s ease-in-out infinite" }}>
                  <div key={effectiveBrand} style={{ animation: "brand-fade-in 0.4s ease-out" }} className="flex flex-col items-center gap-2">
                    {/* Breathing glow — small, soft blur behind logo */}
                    <div className="absolute left-1/2 top-1/2 -z-10 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]" style={{ animation: "brand-glow-breathe 5s ease-in-out infinite" }} />
                    <div className="relative z-10 flex h-[220px] w-[220px] items-center justify-center">
                      {activeBrand?.logo ? (
                        <img src={activeBrand.logo} alt={activeBrand.name} className="h-[200px] w-[200px] object-contain drop-shadow-[0_0_20px_rgba(253,213,2,0.15)] transition-all duration-500" />
                      ) : activeBrand ? (
                        <span className="font-hud text-8xl font-black text-gray-900">{activeBrand.name}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Products on orbit */}
                {(brandProducts ?? []).slice(0, 6).map((p, i) => {
                  const total = Math.min((brandProducts ?? []).length, 6);
                  const angle = (i / total) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const rx = 380;
                  const ry = 160;
                  const cx = 450 + rx * Math.cos(rad);
                  const cy = 240 + ry * Math.sin(rad);
                  const img = p.img;
                  const price = typeof p.price === "number" ? p.price.toLocaleString("fr-MA") : p.price;
                  const isRight = Math.cos(rad) > 0;
                  const isTop = Math.sin(rad) < 0;
                  const floatDur = 4 + (i % 3) * 0.8;
                  return (
                    <div
                      key={p.id}
                      className="absolute z-10"
                      style={{ left: cx, top: cy, animation: `product-orbit-float ${floatDur}s ease-in-out ${(i * 1.2) % 4}s infinite` }}
                    >
                      <Link to={`/product/${p.slug}`} className="group relative flex flex-col items-center gap-1.5">
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-sm transition-all duration-300 group-hover:border-[var(--gold)]/30 group-hover:shadow-lg group-hover:scale-110">
                          {img ? (
                            <img src={img} alt={p.nameFr} className="h-full w-full object-contain" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">?</div>
                          )}
                        </div>
                        <div className={`pointer-events-none absolute z-30 flex flex-col items-center gap-0.5 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 ${
                          isRight ? "left-full ml-3" : "right-full mr-3"
                        } ${isTop ? "bottom-full mb-1" : "top-full mt-1"}`}>
                          <p className="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 font-hud text-[11px] font-bold text-gray-800 shadow-lg border border-gray-100">{p.nameFr}</p>
                          <p className="whitespace-nowrap rounded-full bg-[var(--gold)] px-2.5 py-0.5 font-hud text-[10px] font-extrabold text-gray-900">{price} MAD</p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile-only horizontal brand selector */}
          <div className="mx-auto mt-6 max-w-[var(--section-marquee-max-width)] px-4 sm:px-6 lg:hidden">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {filteredBrands.map((b) => {
                const isActive = effectiveBrand === b.slug;
                return (
                  <button
                    key={b.slug}
                    onClick={() => setSelectedBrandSlug(b.slug)}
                    className="relative overflow-hidden rounded-full border px-4 py-1.5 font-hud text-xs font-bold transition-all duration-300"
                    style={{
                      borderColor: isActive ? "var(--gold)" : "rgb(229 231 235)",
                      backgroundColor: isActive ? "var(--gold)" : "white",
                      color: isActive ? "rgb(17 24 39)" : "rgb(107 114 128)",
                    }}
                  >
                    {isActive && (
                      <span className="absolute inset-y-0 left-0 bg-[var(--gold)]/30" style={{ width: `${brandProgress}%`, transition: "width 50ms linear" }} />
                    )}
                    <span className="relative z-10">{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 5. Expertise + B2B widgets */}
      <FadeIn>
      <section className="mx-auto px-4 py-12 sm:px-6" style={{ maxWidth: settings.sectionMaxWidths.expertise > 0 ? `${settings.sectionMaxWidths.expertise}px` : undefined }}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Expertise (white card) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
            <h2 className="font-hud text-xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-2xl">
              {settings.storeName || "PC JAHIZ"}, L'EXPERT DU MATÉRIEL INFORMATIQUE AU MAROC
            </h2>
            <div className="mt-3 mb-6 h-1 w-10 rounded-full bg-[var(--gold)]" />
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-500">
              <p>
                Depuis plusieurs années, {settings.storeName || "PC JAHIZ"} accompagne les particuliers, les entreprises et les administrations dans l'achat de matériel informatique et électronique au Maroc. Notre catalogue couvre tous vos besoins :{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">ordinateurs portables et de bureau</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">imprimantes et consommables</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">périphériques image & son</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">espace gaming</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">réseaux & Wi-Fi</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">onduleurs et protection électrique</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">téléphonie</span> et{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">vidéosurveillance</span>{" "}
                — au meilleur prix et avec garantie officielle constructeur.
              </p>
              <p>
                Nos rayons les plus demandés :{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">PC portables</span> (bureautique, gaming et création),{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">écrans et moniteurs</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">cartouches et toners</span>,{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">souris et claviers</span> et{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">solutions de stockage</span>{" "}
                — des grandes marques HP, Lenovo, Dell, Epson, Canon, Samsung et Logitech, en stock et garanties.
              </p>
              <p>
                Commandez en ligne et payez à la livraison : nous expédions rapidement à Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir et dans tout le Maroc. Un projet d'équipement ou besoin d'un conseil ? Nos experts vous répondent par téléphone ou sur{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">WhatsApp</span>, et établissent votre{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 decoration-1 underline-offset-2">devis</span>{" "}
                gratuitement.
              </p>
            </div>
          </div>

          {/* Right — B2B (dark card) */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#1e1e1e] p-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                ENTREPRISES & ADMINISTRATIONS
              </p>
              <h3 className="mt-4 font-hud text-2xl font-extrabold uppercase text-white sm:text-3xl">Équipez votre entreprise</h3>
              <div className="mt-3 mb-5 h-1 w-10 rounded-full bg-[var(--gold)]" />
              <p className="text-[15px] leading-relaxed text-gray-400">
                Le partenaire high-tech des entreprises marocaines : un interlocuteur unique pour votre parc informatique, du devis à la livraison sur site, partout au Maroc.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 font-hud text-sm font-extrabold text-gray-900 transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(253,213,2,0.3)]">
                Demander un devis <span>→</span>
              </a>
              <a href="/pro" className="font-hud text-sm font-bold text-white underline decoration-white/30 decoration-1 underline-offset-2 hover:text-[var(--gold)] hover:decoration-[var(--gold)]/50">
                Découvrir l'espace pro
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: "📄", text: "Facture au nom de votre société, avec son ICE, jointe au colis" },
                { icon: "📋", text: "Devis gratuit sous 24 h ouvrées" },
                { icon: "💳", text: "Paiements adaptés aux entreprises : virement, chèque" },
                { icon: "🛡️", text: "Plus de 10 ans au service des entreprises et administrations marocaines" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 text-base grayscale-0" style={{ filter: "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)" }}>{f.icon}</span>
                  <p className="text-[13px] leading-snug text-gray-400">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </FadeIn>

      {/* 6. Statistics bar */}
      <FadeIn>
      <section className="bg-[var(--gold)] py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
          <div className="text-center">
            <p className="font-hud text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <CountUp end={stats?.rating ?? 4.6} decimals={1} />/5
            </p>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              {[1,2,3,4,5].map((star) => (
                <svg key={star} className={`h-4 w-4 ${star <= Math.round(stats?.rating ?? 4.6) ? "text-gray-900" : "text-gray-900 opacity-40"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-700">{stats?.reviews ?? 0} avis Google</p>
            <p className="mt-0.5 text-xs text-gray-600 underline decoration-gray-700 decoration-1 underline-offset-2">Voir nos avis Google</p>
          </div>
          <div className="text-center">
            <p className="font-hud text-3xl font-extrabold text-gray-900 sm:text-4xl">
              +<CountUp end={stats?.orders ?? 0} duration={2500} />
            </p>
            <p className="mt-1 text-sm text-gray-700">clients servis au Maroc</p>
          </div>
          <div className="text-center">
            <p className="font-hud text-3xl font-extrabold text-gray-900 sm:text-4xl">
              +<CountUp end={10} /> ans
            </p>
            <p className="mt-1 text-sm text-gray-700">d'expertise informatique</p>
          </div>
          <div className="text-center">
            <p className="font-hud text-3xl font-extrabold text-gray-900 sm:text-4xl">
              +<CountUp end={stats?.products ?? 0} duration={2500} />
            </p>
            <p className="mt-1 text-sm text-gray-700">produits en stock, prêts à expédier</p>
          </div>
        </div>
      </section>
      </FadeIn>

      {/* 7. Bons plans du moment */}
      {discounted.length > 0 ? (
        <FadeIn delay={100}>
        <section className="mx-auto max-w-[var(--section-deals-max-width)] px-4 py-10 sm:px-6">
          <SectionHead eyebrow={t("home.dealsEyebrow")} title={t("home.dealsTitle")} viewAllTo="/shop?sort=discount" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {discounted.map((p) => (
              <BestSellerCard key={p.id} product={p} />
            ))}
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 6. Best sellers — tabbed */}
      {bestSellers && bestSellers.length > 0 ? (
        <FadeIn delay={100}>
        <section className="bg-[var(--page-soft)] py-10">
          <div className="mx-auto max-w-[var(--section-best-sellers-max-width)] px-4 sm:px-6">
            <SectionHead eyebrow={t("home.bestSellersEyebrow")} title={t("home.bestSellersTitle")} />
            <div className="mb-6 mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t("home.topSales")}>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "all"}
                onClick={() => setTab("all")}
                className={`rounded-full px-4 py-2 font-hud text-sm font-semibold transition-all ${tab === "all" ? "bg-[var(--gold)] text-black" : "bg-white text-[var(--text-2)] hover:text-[var(--text-1)]"}`}
              >
                Tout
              </button>
              {(bestSellerCategories ?? []).map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  aria-selected={tab === c.slug}
                  onClick={() => setTab(c.slug)}
                  className={`rounded-full px-4 py-2 font-hud text-sm font-semibold transition-all ${tab === c.slug ? "bg-[var(--gold)] text-black" : "bg-white text-[var(--text-2)] hover:text-[var(--text-1)]"}`}
                >
                  {c.nameFr}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {bestSellers.slice(0, 10).map((p) => (
                <BestSellerCard key={p.id} product={p} />
              ))}
            </div>
            {tab !== "all" ? (
              <div className="mt-6 flex justify-end">
                <Link
                  to={`/category/${tab}`}
                  className="inline-flex items-center gap-1 font-hud text-sm font-bold text-[var(--gold-hot)] hover:underline"
                >
                  {t("home.viewAllIn", { category: (bestSellerCategories ?? []).find((c) => c.slug === tab)?.nameFr ?? tab })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 7. Nouveau sur le site */}
      {newest && newest.length > 0 ? (
        <FadeIn delay={100}>
        <section className="mx-auto max-w-[var(--section-new-arrivals-max-width)] px-4 py-10 sm:px-6">
          <SectionHead eyebrow={t("home.newEyebrow")} title={t("home.newTitle")} viewAllTo="/shop?sort=newest" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {newest.slice(0, 10).map((p) => (
              <BestSellerCard key={p.id} product={p} />
            ))}
          </div>
        </section>
        </FadeIn>
      ) : null}

      {/* 8. Value props */}
      <FadeIn delay={150}>
      <section className="border-y border-[var(--line)] py-6">
        <div className="mx-auto max-w-[var(--section-value-props-max-width)] px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { icon: Truck, title: t("home.value1Title"), desc: t("home.value1Desc") },
              { icon: BadgeCheck, title: t("home.value2Title"), desc: t("home.value2Desc") },
              { icon: Quote, title: t("home.value3Title"), desc: t("home.value3Desc") },
              { icon: Star, title: t("home.value4Title"), desc: t("home.value4Desc") },
            ].map((v) => (
              <div key={v.title} className="flex items-start gap-3">
                <v.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
                <div>
                  <p className="font-hud text-sm font-bold text-[var(--text-1)]">{v.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-2)]">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </FadeIn>

      {/* 9. Newsletter */}
      <FadeIn>
      <section className="bg-[var(--gold)]">
        <div className="mx-auto max-w-[var(--section-newsletter-max-width)] px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="font-hud text-xs font-bold uppercase tracking-[0.25em] text-black/50">{t("home.newsletterEyebrow")}</p>
              <h2 className="mt-1 font-hud text-2xl font-extrabold text-black sm:text-3xl">{t("home.newsletterTitle")}</h2>
              <p className="mt-1 text-sm text-black/60">{t("home.newsletterSubtitle")}</p>
            </div>
            {subscribed ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/30 px-5 py-3 font-hud text-sm font-bold text-black">
                <Check className="h-4 w-4" /> {t("home.newsletterSuccess")}
              </p>
            ) : (
              <form onSubmit={submitNewsletter} className="flex w-full max-w-md gap-2">
                <label htmlFor="newsletter-email" className="sr-only">{t("home.newsletterEmail")}</label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("home.newsletterEmail")}
                  className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-black outline-none focus:border-black/30"
                />
                <button type="submit" className="rounded-full bg-black px-6 py-3 font-hud text-sm font-bold text-white transition-opacity hover:opacity-80 whitespace-nowrap">
                  {t("home.newsletterButton")}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      </FadeIn>
    </>
  );
}
