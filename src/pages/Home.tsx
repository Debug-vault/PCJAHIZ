import { Link } from "react-router";
import { Truck, BadgeCheck, RotateCcw, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/product-card";
import { Marquee } from "@/components/storefront/marquee";
import { SectionHead } from "@/components/storefront/section-head";
import { DropZoneMap } from "@/components/storefront/drop-zone-map";

export default function Home() {
  const { t, locale } = useI18n();
  const { settings } = useStoreSettings();
  const { data: featured, isLoading: featuredLoading } = trpc.shop.featured.useQuery(undefined, {
    staleTime: 60 * 1000,
  });
  const { data: newest } = trpc.shop.newest.useQuery(undefined, {
    staleTime: 60 * 1000,
  });
  const { data: categories } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: marqueeBrands } = trpc.shop.marqueeBrands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  const hero = settings.homeHero;

  return (
    <>
      <Marquee />
      <section className="nebula-bg relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[var(--gold-dim)] blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[var(--ice-dim)] blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:flex-row lg:gap-16">
          <div className={`flex-1 text-center lg:text-${hero.align === "center" ? "center" : "left"}`}>
            <p className="hud-chip gold mx-auto mb-5 lg:mx-0">
              {settings.storeName} · {t("hero.badge")}
            </p>
            <h1 className="font-hud text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--text-1)] sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--text-2)] sm:text-lg lg:mx-0">
              {t("hero.subtitle")}
            </p>
            {hero.showCtas ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link to="/shop" className="btn-dock">
                  {t("hero.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop?sort=discount" className="btn-ghost2">
                  {t("hero.cta2")}
                </Link>
              </div>
            ) : null}
            {hero.showStats ? (
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">
                <div className="text-center lg:text-left">
                  <p className="price-mono text-2xl">{t("hero.deliveryValue")}</p>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{t("hero.statsDelivery")}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="price-mono text-2xl">{t("hero.codValue")}</p>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{t("hero.statsCod")}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="price-mono text-2xl">4.9★</p>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{t("hero.statsOrders")}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative flex-1">
            <div className="relative mx-auto aspect-square w-full max-w-md animate-float">
              <div className="absolute inset-0 rounded-full border border-[rgba(253,213,2,0.2)]" />
              <div className="absolute inset-6 animate-spin-slow rounded-full border border-dashed border-[rgba(122,162,255,0.25)]" />
              <div className="absolute inset-0 m-auto flex h-40 w-40 items-center justify-center rounded-full bg-[var(--gold-dim)] ring-1 ring-[rgba(253,213,2,0.4)] shadow-[var(--glow-gold)]">
                {settings.storeLogo ? (
                  <img src={settings.storeLogo} alt={settings.storeName} className="h-24 w-24 rounded-full object-contain" />
                ) : (
                  <span className="font-hud text-6xl font-extrabold text-[var(--gold)]">J</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured && featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead eyebrow={t("home.eyebrow")} title={t("common.featured")} viewAllTo="/shop" />
          <div className={`mt-8 grid grid-cols-2 gap-4 md:grid-cols-${settings.homeProducts.columns}`}>
            {featured.slice(0, settings.homeProducts.count).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : featuredLoading ? (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center font-mono text-sm text-[var(--text-2)] sm:px-6">
          {t("common.loading")}
        </div>
      ) : null}

      {categories && categories.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <SectionHead title={t("common.categories")} viewAllTo="/shop" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="group relative flex h-28 items-end overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4 transition-all hover:border-[rgba(253,213,2,0.4)]"
              >
                <span className="font-hud text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--gold)]">
                  {locale === "ar" ? c.nameAr : c.nameFr}
                </span>
                {c.image ? (
                  <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-45" />
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {marqueeBrands && marqueeBrands.length > 0 && settings.homeBrandsMarquee.show ? (
        <section className="border-y border-[var(--line)] bg-[#060b18] py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-6 text-center font-hud text-sm font-bold uppercase tracking-[0.3em] text-[var(--text-2)]">
              {t("home.partnersTitle")}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {marqueeBrands.map((b) => (
                <Link key={b.slug} to="/shop" className="flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100">
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt={b.name}
                      style={{ height: settings.homeBrandsMarquee.logoHeight }}
                      className="max-h-14 object-contain grayscale hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-2)]">
                      {b.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {newest && newest.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead title={t("common.newArrivals")} viewAllTo="/shop" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {newest.slice(0, settings.homeProducts.count).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <SectionHead eyebrow={t("home.dropEyebrow")} title={t("home.dropTitle")} />
        <DropZoneMap />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-5">
            <Truck className="h-8 w-8 shrink-0 text-[var(--gold)]" />
            <div>
              <p className="font-hud text-sm font-bold text-[var(--text-1)]">{t("trust.ship")}</p>
              <p className="text-xs text-[var(--text-2)]">{t("trust.shipDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-5">
            <BadgeCheck className="h-8 w-8 shrink-0 text-[var(--gold)]" />
            <div>
              <p className="font-hud text-sm font-bold text-[var(--text-1)]">{t("trust.cod")}</p>
              <p className="text-xs text-[var(--text-2)]">{t("trust.codDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-5">
            <RotateCcw className="h-8 w-8 shrink-0 text-[var(--gold)]" />
            <div>
              <p className="font-hud text-sm font-bold text-[var(--text-1)]">{t("trust.exchange")}</p>
              <p className="text-xs text-[var(--text-2)]">{t("trust.exchangeDesc")}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}