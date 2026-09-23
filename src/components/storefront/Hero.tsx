import { useEffect, useRef, useState, useMemo, useCallback, type CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useHeroSlide } from "@/lib/hero-context";
import {
  heroImageUrl,
  heroSrcSet,
  heroStyleSheet,
  generateBgCss,
  migrateBgColor,
  parseJsonField,
  autoTextColor,
  getDominantColor,
  luminance,
  mergeEl,
  normalizeDevice,
  type HeroSlide,
  type HeroProduct,
  type HeroStat,
  type HeroTransition,
  type HeroElementStyle,
  type HeroGlobalStyle,
  type SlideStyle,
  type HeroBackground,
  type DeviceKey,
  type PerDevice,
  type ElEntry,
  type LayoutEntry,
} from "@/lib/hero";

type ElKeyName = "eyebrow" | "heading" | "description" | "price" | "cta" | "badge";
const ELEMENT_KEYS: ElKeyName[] = ["eyebrow", "heading", "description", "price", "cta", "badge"];
const CHIP_KEYS = new Set<ElKeyName>(["eyebrow", "cta", "badge"]);

let gsapRegistered = false;
function ensureGsap() {
  if (gsapRegistered) return;
  gsapRegistered = true;
  import("gsap").then(({ default: gsap }) => {
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);
    });
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export interface HeroSettings {
  align: "left" | "center" | "right";
  showCtas: boolean;
  minHeight: number;
  showStats: boolean;
  autoRotate: boolean;
  interval: number;
  transition: HeroTransition;
  parallax: boolean;
  hover: boolean;
  stats: HeroStat[];
  styles?: HeroGlobalStyle;
}

interface HeroProps {
  heroes: HeroSlide[];
  settings: HeroSettings;
  preview?: boolean;
}

const DEFAULT_SIZES: Record<string, number> = {
  eyebrow: 12,
  heading: 56,
  description: 18,
  price: 28,
  cta: 16,
  badge: 14,
};

const TEXT_ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
const JUSTIFY: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };


export default function Hero({ heroes, settings, preview = false }: HeroProps) {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const g = settings.styles;

  const allHeroes = useMemo(() =>
    (heroes ?? []).filter((h) => h.type === "hero" || h.type == null).map((h) => ({
      ...h,
      styles: parseJsonField(h.styles, {} as SlideStyle),
      products: parseJsonField(h.products, [] as HeroProduct[]),
      bgConfig: parseJsonField(h.bgConfig, null as HeroBackground | null) ?? migrateBgColor(h.bgColor),
    })),
    [heroes],
  );
  const slides = useMemo(() => allHeroes.filter((h) => h.active !== false), [allHeroes]);
  const list = slides.length ? slides : allHeroes;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    watchDrag: settings.transition === "slide" && !preview,
    skipSnaps: false,
  });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || preview || reduced || !settings.autoRotate || settings.interval < 1000) return;
    if (list.length < 2) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const stop = () => { if (id) clearInterval(id); };
    const start = () => { stop(); id = setInterval(() => emblaApi.scrollNext(), settings.interval); };
    start();
    const node = emblaApi.rootNode();
    const pause = stop;
    const resume = start;
    node.addEventListener("mouseenter", pause);
    node.addEventListener("mouseleave", resume);
    node.addEventListener("focusin", pause);
    node.addEventListener("focusout", resume);
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      node.removeEventListener("mouseenter", pause);
      node.removeEventListener("mouseleave", resume);
      node.removeEventListener("focusin", pause);
      node.removeEventListener("focusout", resume);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [emblaApi, preview, reduced, settings.autoRotate, settings.interval, list.length]);

  useEffect(() => {
    if (!settings.parallax || preview || reduced || !sectionRef.current) return;
    const section = sectionRef.current;
    let ctx: { revert: () => void } | null = null;
    ensureGsap();
    import("gsap").then(({ default: gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>(".hero-orb").forEach((orb, i) => {
            gsap.to(orb, {
              yPercent: i % 2 === 0 ? -18 : 14,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
            });
          });
        }, section);
      });
    });
    let raf: number | null = null;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = section.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        const transform = `translate3d(${dx * 22}px, ${dy * 22}px, 0)`;
        section.querySelectorAll<HTMLElement>(".hero-parallax").forEach((el) => {
          el.style.transform = transform;
        });
      });
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      ctx?.revert();
      if (raf) cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
    };
  }, [settings.parallax, preview, reduced]);

  const isFade = settings.transition === "fade";
  const sectionStyle: CSSProperties = {
    height: settings.minHeight > 0 ? `${settings.minHeight}px` : "70vh",
    ...(g?.section?.bg ? { background: g.section.bg } : {}),
    ...(g?.section?.maxWidth ? { maxWidth: `${g.section.maxWidth}px` } : {}),
    ...(g?.section?.paddingY != null ? { paddingTop: `${g.section.paddingY}px`, paddingBottom: `${g.section.paddingY}px` } : {}),
  };

  const activeSlide = list[selected] ?? list[0];
  const sectionBgColor = useMemo(() => activeSlide ? getDominantColor(activeSlide.bgConfig) : "#fcd406", [activeSlide?.bgConfig]);
  const sectionBg: CSSProperties = useMemo(() => ({ backgroundColor: sectionBgColor }), [sectionBgColor]);

  // Sync current slide to hero context for top bar
  const { setCurrentSlide } = useHeroSlide();
  useEffect(() => {
    const s = list[selected];
    if (s) {
      setCurrentSlide({ eyebrow: s.eyebrow, heading: s.heading, bgColor: sectionBgColor });
    }
    return () => setCurrentSlide(null);
  }, [selected, list, setCurrentSlide, sectionBgColor]);

  const withSize = useCallback((key: ElKeyName, el?: HeroElementStyle): HeroElementStyle => {
    if (!el) return { fontSize: DEFAULT_SIZES[key] };
    if (el.fontSize == null) return { ...el, fontSize: DEFAULT_SIZES[key] };
    return el;
  }, []);

  const buildEntries = useCallback((slideStyles?: Partial<Record<ElKeyName, PerDevice<HeroElementStyle>>>): ElEntry[] =>
    ELEMENT_KEYS.map((key) => {
      const d = normalizeDevice(slideStyles?.[key]);
      const dev: PerDevice<HeroElementStyle> = {
        mobile: mergeEl(g?.[key], d.mobile),
        tablet: withSize(key, mergeEl(g?.[key], d.tablet)),
        desktop: mergeEl(g?.[key], d.desktop),
      };
      return { key, chip: CHIP_KEYS.has(key), dev };
    }),
    [g, withSize],
  );

  const buildLayout = useCallback((slide: HeroSlide): LayoutEntry => {
    const type = slide.layout === "overlay" ? "overlay" : slide.layout === "product-grid" ? "product-grid" : "split";
    const devImg = normalizeDevice(slide.styles?.image);
    const devCon = normalizeDevice(slide.styles?.content);
    const base = (k: DeviceKey) => ({ image: devImg[k], content: devCon[k] });
    return { type, dev: { tablet: base("tablet"), mobile: base("mobile"), desktop: base("desktop") } };
  }, []);

  const styleBlocks = useMemo(() => {
    const blocks: string[] = [];
    if (list.length === 0) {
      blocks.push(heroStyleSheet("fallback", buildEntries(), { type: "split", dev: {} }, settings.align));
    } else {
      for (const s of list) {
        blocks.push(heroStyleSheet(s.slug, buildEntries(s.styles ?? undefined), buildLayout(s), settings.align));
      }
    }
    return blocks;
  }, [list, g, settings.align]);

  // ---- Fallback (no hero slides) ----
  if (list.length === 0) {
    return (
      <section ref={sectionRef} className="hero-root hs-fallback relative w-full overflow-hidden" style={{ ...sectionStyle, background: "var(--page)" }} aria-label={t("hero.label")}>
        <style>{styleBlocks.join("\n")}</style>
        <div className="relative mx-auto flex max-w-[var(--store-max-width)] flex-col items-center gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:flex-row lg:gap-16">
          <div className="el-text flex-1 text-center lg:text-left">
            <p className="el-eyebrow hud-chip gold mx-auto mb-5 lg:mx-0">{t("hero.badge")}</p>
            <h1 className="el-heading font-hud font-extrabold leading-[1.05] tracking-tight">{t("hero.title")}</h1>
            <p className="el-description mx-auto mt-5 max-w-xl leading-relaxed lg:mx-0">{t("hero.subtitle")}</p>
            {settings.showCtas ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link to="/shop" className="el-cta btn-dock">{t("hero.cta")} <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/shop?sort=discount" className="btn-ghost2">{t("hero.cta2")}</Link>
              </div>
            ) : null}
          </div>
        </div>
        {settings.showStats ? <HeroStats stats={settings.stats} style={g?.stats} position={g?.stats?.position ?? "below"} /> : null}
      </section>
    );
  }

  const statsPos = g?.stats?.position ?? "below";

  return (
      <section
        ref={sectionRef}
        className="hero-root relative w-full overflow-hidden"
        style={{ ...sectionStyle, ...sectionBg }}
        aria-roledescription="carrousel"
        aria-label={t("hero.label")}
      >
      <style>{styleBlocks.join("\n")}</style>
      <div className="hero-orb pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(252,212,6,0.18),transparent_70%)] blur-2xl" />
      <div className="hero-orb pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_70%)] blur-2xl" />

      <div className="sr-only" aria-live="polite">{t("hero.slideCount", { current: String(selected + 1), total: String(list.length) })}</div>

      <div className="embla relative h-full overflow-hidden" ref={emblaRef}>
        <div className={cn("embla__container flex h-full", isFade && "relative !transform-none")}>
          {list.map((slide, i) => {
            const overlay = slide.layout === "overlay";
            const src = heroImageUrl(slide.image, { w: overlay ? 1600 : 1000 });
            const srcSet = heroSrcSet(slide.image);
            const active = i === selected;
            const em: Record<ElKeyName, HeroElementStyle> = {
              eyebrow: mergeEl(g?.eyebrow, normalizeDevice(slide.styles?.eyebrow).tablet),
              heading: mergeEl(g?.heading, normalizeDevice(slide.styles?.heading).tablet),
              description: mergeEl(g?.description, normalizeDevice(slide.styles?.description).tablet),
              price: mergeEl(g?.price, normalizeDevice(slide.styles?.price).tablet),
              cta: mergeEl(g?.cta, normalizeDevice(slide.styles?.cta).tablet),
              badge: mergeEl(g?.badge, normalizeDevice(slide.styles?.badge).tablet),
            };
            return (
              <div key={slide.slug} className={cn("hero-slide relative h-full w-full flex-[0_0_100%]", `hs-${slide.slug.replace(/[^a-z0-9]+/gi, "-")}`, isFade && (active ? "relative z-10 opacity-100" : "absolute inset-0 opacity-0 pointer-events-none"), !isFade && "opacity-100")} role="group" aria-roledescription={t("hero.slide")} aria-label={`${i + 1} / ${list.length}`}>
                {overlay ? (
                  <OverlaySlide slide={slide} src={src} srcSet={srcSet} settings={settings} active={active} em={em} />
                ) : slide.layout === "product-grid" ? (
                  <ProductGridSlide slide={slide} settings={settings} active={active} em={em} />
                ) : (
                  <SplitSlide slide={slide} src={src} srcSet={srcSet} settings={settings} active={active} em={em} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {list.length > 1 ? (() => {
        const activeDotDark = luminance(getDominantColor(list[selected]?.bgConfig)) > 0.4;
        return (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex items-center justify-center px-4">
            <div
              className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2"
              role="tablist"
              aria-label={t("hero.slides")}
              style={{
                backgroundColor: activeDotDark ? "rgba(255,255,255,0.85)" : "rgba(16,16,20,0.55)",
                backdropFilter: "blur(8px)",
              }}
            >
              {list.map((s, i) => {
                const dotDark = luminance(getDominantColor(s.bgConfig)) > 0.4;
                const isActive = i === selected;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${i + 1}`}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      isActive ? "w-8" : "w-2",
                    )}
                    style={{
                      backgroundColor: isActive
                        ? dotDark ? "#101014" : "#ffffff"
                        : dotDark ? "rgba(16,16,20,0.35)" : "rgba(255,255,255,0.45)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })() : null}

      {settings.showStats && statsPos === "below" ? <HeroStats stats={settings.stats} style={g?.stats} position="below" /> : null}
      {settings.showStats && statsPos === "overlay" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-5xl">
            <HeroStats stats={settings.stats} style={g?.stats} position="overlay" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

interface SlideProps {
  slide: HeroSlide;
  src: string;
  srcSet: string;
  settings: HeroSettings;
  active: boolean;
  em: Record<ElKeyName, HeroElementStyle>;
}

function SplitSlide({ slide, src, srcSet, settings, active, em }: SlideProps) {
  const { formatPrice } = useI18n();
  const align = settings.align;
  const st = slide.styles;
  const side = normalizeDevice(st?.image).tablet?.side ?? "right";
  const shape = normalizeDevice(st?.image).tablet?.shape ?? "rounded";
  const showEyebrow = em.eyebrow.show !== false;
  const showHeading = em.heading.show !== false && !!slide.heading;
  const showDesc = em.description.show !== false && !!slide.description;
  const showPrice = em.price.show !== false && slide.price != null;
  const showCta = settings.showCtas && em.cta.show !== false && !!slide.ctaLabel;
  const showBadge = em.badge.show !== false && !!slide.badge;

  const bgCss = generateBgCss(slide.bgConfig);
  const bgStyle: CSSProperties = bgCss ? bgCss as CSSProperties : { background: `radial-gradient(80% 60% at 20% 20%, ${slide.bgColor ?? "#fcd406"} 0%, transparent 70%)`, opacity: 0.2 };

  const textCfg = slide.bgConfig?.text;
  const textColors = textCfg
    ? textCfg.colorMode === "manual" && textCfg.primaryColor
      ? { primary: textCfg.primaryColor, secondary: textCfg.secondaryColor ?? textCfg.primaryColor }
      : autoTextColor(getDominantColor(slide.bgConfig))
    : null;

  const slideTextStyle: CSSProperties = textColors
    ? { "--hs-text-primary": textColors.primary, "--hs-text-secondary": textColors.secondary } as CSSProperties
    : {};

  const text = (
    <div
      className={cn("el-text relative flex flex-1 flex-col justify-center", TEXT_ALIGN[align], align === "center" && "items-center", align === "right" && "items-end")}
      style={slideTextStyle}
    >
      {showEyebrow && slide.eyebrow ? (
        <p className="el-eyebrow mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-hud font-bold uppercase tracking-widest" style={{ color: "var(--hs-text-secondary, inherit)" }}>{slide.eyebrow}</p>
      ) : null}
      {showHeading ? (
        <h1 className="el-heading font-hud font-extrabold leading-[1.05] tracking-tight" style={{ color: "var(--hs-text-primary, inherit)" }}>{slide.heading}</h1>
      ) : null}
      {showDesc ? (
        <p className="el-description mt-5 max-w-xl leading-relaxed" style={{ color: "var(--hs-text-secondary, inherit)" }}>{slide.description}</p>
      ) : null}
      {showPrice ? (
        <p className="el-price mt-5 font-hud font-bold" style={{ color: "var(--hs-text-primary, inherit)" }}>
          {formatPrice(slide.price!)}
          {slide.oldPrice != null ? <span className="ml-3 text-base font-medium line-through" style={{ color: "var(--hs-text-secondary, var(--text-2))" }}>{formatPrice(slide.oldPrice)}</span> : null}
        </p>
      ) : null}
      {showCta ? (
        <div className={cn("mt-8 flex flex-wrap items-center gap-3", JUSTIFY[align])}>
          <Link to={slide.ctaUrl ?? "/shop"} className="el-cta btn-dock transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">{slide.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : null}
    </div>
  );

  const image = slide.image ? (
    <div className="hero-parallax relative mx-auto my-auto aspect-square w-full max-w-xl self-center">
      <div className={cn("el-img absolute inset-0 transition-transform duration-700 group-hover:scale-105", shape === "square" ? "rounded-2xl" : "rounded-full", "bg-[var(--gold-dim)]")} />
      <img src={src} srcSet={srcSet || undefined} alt={slide.heading ?? ""} loading={active ? "eager" : "lazy"} fetchPriority={active ? "high" : "auto"} decoding="async" className={cn("relative z-10 h-full w-full object-contain drop-shadow-2xl transition-transform duration-700", settings.hover && "group-hover:scale-105", shape === "square" && "rounded-2xl")} />
      {showBadge ? (
        <span className="el-badge animate-float absolute left-0 top-6 z-20 -rotate-6 rounded-full px-4 py-2 font-hud text-sm font-bold text-black shadow-lg">{slide.badge}</span>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={cn("hero-grid group relative grid h-full w-full grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-12 md:px-10")} style={slideTextStyle}>
      <div className="pointer-events-none absolute inset-0" style={bgStyle} />
      {side === "left" ? image : null}
      {text}
      {side === "right" ? image : null}
    </div>
  );
}

function OverlaySlide({ slide, src, srcSet, settings, active, em }: SlideProps) {
  const { formatPrice } = useI18n();
  const align = settings.align;
  const st = slide.styles;
  const horizontal = normalizeDevice(st?.content).tablet?.horizontal ?? align;
  const showEyebrow = em.eyebrow.show !== false;
  const showHeading = em.heading.show !== false && !!slide.heading;
  const showDesc = em.description.show !== false && !!slide.description;
  const showPrice = em.price.show !== false && slide.price != null;
  const showCta = settings.showCtas && em.cta.show !== false && !!slide.ctaLabel;
  const showBadge = em.badge.show !== false && !!slide.badge;

  const hClass = horizontal === "center" ? "mx-auto text-center" : horizontal === "right" ? "ml-auto text-right" : "mr-auto text-left";

  return (
    <div className={cn("el-overlay group relative flex h-full w-full")}>
      {slide.image ? (
        <img src={src} srcSet={srcSet || undefined} alt={slide.heading ?? ""} loading={active ? "eager" : "lazy"} fetchPriority={active ? "high" : "auto"} decoding="async" className={cn("el-img absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out", settings.hover && "group-hover:scale-105")} />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
      <div className={cn("hero-parallax relative z-10 flex w-full flex-col justify-center px-4 py-16 sm:px-6 lg:px-10", hClass)}>
        <div className={cn(TEXT_ALIGN[horizontal])}>
          {showEyebrow && slide.eyebrow ? (
            <p className="el-eyebrow mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-hud font-bold uppercase tracking-widest text-white backdrop-blur">{slide.eyebrow}</p>
          ) : null}
          {showHeading ? (
            <h1 className="el-heading font-hud font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-lg">{slide.heading}</h1>
          ) : null}
          {showDesc ? (
            <p className="el-description mt-5 max-w-xl text-white/85">{slide.description}</p>
          ) : null}
          {showPrice ? (
            <p className="el-price mt-5 font-hud font-bold text-[var(--gold)]">
              {formatPrice(slide.price!)}
              {slide.oldPrice != null ? <span className="ml-3 text-base font-medium text-white/70 line-through">{formatPrice(slide.oldPrice)}</span> : null}
            </p>
          ) : null}
          {showCta ? (
            <div className={cn("mt-8 flex flex-wrap items-center gap-3", JUSTIFY[horizontal])}>
              <Link to={slide.ctaUrl ?? "/shop"} className="el-cta btn-dock transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">{slide.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : null}
        </div>
      </div>
      {showBadge ? (
        <span className="el-badge animate-float absolute right-6 top-6 z-20 rotate-3 rounded-full bg-[var(--gold)] px-4 py-2 font-hud text-sm font-bold text-black shadow-lg">{slide.badge}</span>
      ) : null}
    </div>
  );
}

function ProductGridSlide({ slide, settings, active, em }: Omit<SlideProps, "src" | "srcSet">) {
  const { formatPrice } = useI18n();
  const align = settings.align;
  const showEyebrow = em.eyebrow.show !== false;
  const showHeading = em.heading.show !== false && !!slide.heading;
  const showDesc = em.description.show !== false && !!slide.description;
  const showPrice = em.price.show !== false && slide.price != null;
  const showCta = settings.showCtas && em.cta.show !== false && !!slide.ctaLabel;
  const showBadge = em.badge.show !== false && !!slide.badge;
  const rawProducts = slide.products;
  const products: HeroProduct[] = Array.isArray(rawProducts) ? rawProducts : [];
  const brandBadge = slide.brandBadge ?? null;

  const bgCss = generateBgCss(slide.bgConfig);
  const bgStyle: CSSProperties = bgCss ? bgCss as CSSProperties : { background: `radial-gradient(80% 60% at 20% 20%, ${slide.bgColor ?? "#fcd406"} 0%, transparent 70%)`, opacity: 0.2 };

  const textCfg = slide.bgConfig?.text;
  const textColors = textCfg
    ? textCfg.colorMode === "manual" && textCfg.primaryColor
      ? { primary: textCfg.primaryColor, secondary: textCfg.secondaryColor ?? textCfg.primaryColor }
      : autoTextColor(getDominantColor(slide.bgConfig))
    : null;

  const slideTextStyle: CSSProperties = textColors
    ? { "--hs-text-primary": textColors.primary, "--hs-text-secondary": textColors.secondary } as CSSProperties
    : {};

  const text = (
    <div
      className={cn("el-text relative flex flex-1 flex-col justify-center", TEXT_ALIGN[align], align === "center" && "items-center", align === "right" && "items-end")}
      style={slideTextStyle}
    >
      {showEyebrow && slide.eyebrow ? (
        <p className="el-eyebrow mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-hud font-bold uppercase tracking-widest" style={{ color: "var(--hs-text-secondary, inherit)" }}>{slide.eyebrow}</p>
      ) : null}
      {showHeading ? (
        <h1 className="el-heading font-hud font-extrabold leading-[1.05] tracking-tight" style={{ color: "var(--hs-text-primary, inherit)" }}>{slide.heading}</h1>
      ) : null}
      {showDesc ? (
        <p className="el-description mt-5 max-w-xl leading-relaxed" style={{ color: "var(--hs-text-secondary, inherit)" }}>{slide.description}</p>
      ) : null}
      {showPrice ? (
        <p className="el-price mt-5 font-hud font-bold" style={{ color: "var(--hs-text-primary, inherit)" }}>
          {formatPrice(slide.price!)}
          {slide.oldPrice != null ? <span className="ml-3 text-base font-medium line-through" style={{ color: "var(--hs-text-secondary, var(--text-2))" }}>{formatPrice(slide.oldPrice)}</span> : null}
        </p>
      ) : null}
      {showCta ? (
        <div className={cn("mt-8 flex flex-wrap items-center gap-3", JUSTIFY[align])}>
          <Link to={slide.ctaUrl ?? "/shop"} className="el-cta btn-dock transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">{slide.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : null}
    </div>
  );

  const productGrid = (
    <div className="relative flex flex-1 items-center justify-center self-center">
      {products.length > 0 ? (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <div key={i} className="group/card flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--page)] p-3 transition-shadow hover:shadow-md">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--page-soft)]">
                <img
                  src={heroImageUrl(p.image, { w: 400 })}
                  alt={p.name}
                  loading={active && i === 0 ? "eager" : "lazy"}
                  fetchPriority={active && i === 0 ? "high" : "auto"}
                  decoding="async"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover/card:scale-105"
                />
                {p.price != null ? (
                  <span className="absolute bottom-1 right-1 rounded-md bg-[var(--gold)] px-2 py-0.5 font-mono text-xs font-bold text-black">
                    {formatPrice(p.price)}
                  </span>
                ) : null}
              </div>
              <p className="text-center text-xs font-medium leading-tight" style={{ color: "var(--hs-text-primary, var(--text-1))" }}>{p.name}</p>
              {p.label ? <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--hs-text-secondary, var(--text-2))" }}>{p.label}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-2)]">No products configured</p>
      )}
    </div>
  );

  return (
    <div className={cn("hero-grid group relative grid h-full w-full grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-12 md:px-10")} style={slideTextStyle}>
      <div className="pointer-events-none absolute inset-0" style={bgStyle} />
      {text}
      {productGrid}
      {brandBadge ? (
        <span className="el-badge animate-float absolute right-4 top-4 z-20 rounded-full bg-[var(--text-1)] px-3 py-1.5 font-hud text-[10px] font-bold uppercase tracking-wider text-white shadow-lg sm:right-6 sm:top-6 sm:text-xs">
          {brandBadge}
        </span>
      ) : null}
      {showBadge ? (
        <span className="el-badge animate-float absolute left-0 top-6 z-20 -rotate-6 rounded-full px-4 py-2 font-hud text-sm font-bold text-black shadow-lg">{slide.badge}</span>
      ) : null}
    </div>
  );
}

function HeroStats({ stats, style, position }: { stats: HeroStat[]; style?: HeroGlobalStyle["stats"]; position: "below" | "overlay" }) {
  if (!stats || !stats.length) return null;
  const columns = style?.columns ?? Math.min(stats.length, 4);
  const wrapCls = position === "overlay"
    ? "flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
    : "mx-auto flex max-w-[var(--store-max-width)] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 sm:px-6";
  return (
    <div className={position === "overlay" ? "" : "border-t border-[var(--line)] bg-[var(--page-soft)]"}>
      <div className={wrapCls} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <p className="font-hud font-extrabold" style={{ fontSize: `${style?.valueSize ?? 28}px`, color: style?.valueColor ?? "var(--text-1)" }}>{s.value}</p>
            <p className="text-xs uppercase tracking-widest" style={{ fontSize: `${style?.labelSize ?? 12}px`, color: style?.labelColor ?? "var(--text-2)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
