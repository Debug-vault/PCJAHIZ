import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, X, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

const SORTS = ["popular", "newest", "price-asc", "price-desc"] as const;

export default function Shop() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const brand = params.get("brand") ?? "";
  const sort = (params.get("sort") as (typeof SORTS)[number]) ?? "popular";
  const minPrice = params.get("min") ? Number(params.get("min")) : undefined;
  const maxPrice = params.get("max") ? Number(params.get("max")) : undefined;

  const { data: products, isLoading } = trpc.shop.list.useQuery(
    { q: q || undefined, category: category || undefined, brand: brand || undefined, minPrice, maxPrice, sort },
    { placeholderData: (prev) => prev },
  );
  const { data: categories } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: brands } = trpc.shop.brands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const hasFilters = q || category || brand || minPrice != null || maxPrice != null;

  const parentCategories = useMemo(() => (categories ?? []).filter((c) => !c.parentSlug), [categories]);
  const subCategories = useMemo(() => (categories ?? []).filter((c) => c.parentSlug), [categories]);
  const subsFor = (parentSlug: string) => subCategories.filter((c) => c.parentSlug === parentSlug);

  const toggleExpand = (slug: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const activeCategoryObj = useMemo(() => (categories ?? []).find((c) => c.slug === category), [categories, category]);

  const activeCategory = useMemo(() => categories?.find((c) => c.slug === category), [categories, category]);
  const activeBrand = useMemo(() => brands?.find((b) => b.slug === brand), [brands, brand]);

  return (
    <div className="mx-auto max-w-[var(--store-max-width)] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{t("nav.boutique")}</p>
        <h1 className="mt-2 font-hud text-3xl font-bold text-[var(--text-1)]">
          {activeCategory ? activeCategory.nameFr : activeBrand ? activeBrand.name : t("nav.products")}
        </h1>
        <p className="mt-2 font-mono text-sm text-[var(--text-2)]">
          {isLoading ? t("common.loading") : `${products?.length ?? 0} ${t("product.resultsCount")}`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:self-start">
          <div>
            <label htmlFor="shop-q" className="mb-2 flex items-center gap-2 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
              <Search className="h-3.5 w-3.5" /> {t("nav.search")}
            </label>
            <div className="relative">
              <input
                id="shop-q"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder={t("nav.search")}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--glass)] px-3.5 pr-9 font-mono text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--text-2)] focus:border-[rgba(253,213,2,0.4)]"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setParam("q", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-[var(--text-1)]"
                  aria-label={t("common.cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {t("common.filter")}
            </h3>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setParam("category", "")}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  !category ? "bg-[var(--gold)] text-[#1b1b1f]" : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
                )}
              >
                {t("common.all")}
              </button>
              {parentCategories.map((c) => {
                const children = subsFor(c.slug);
                const isExpanded = expandedCats.has(c.slug);
                const isActive = category === c.slug;
                const hasActiveChild = children.some((ch) => ch.slug === category);
                return (
                  <div key={c.slug}>
                    <div className={cn(
                      "flex items-center rounded-lg transition-colors",
                      (isActive || hasActiveChild) && "bg-[var(--gold)]/10",
                    )}>
                      <button
                        type="button"
                        onClick={() => setParam("category", c.slug)}
                        className={cn(
                          "flex-1 px-3 py-2 text-left text-sm font-medium transition-colors",
                          isActive ? "text-[var(--gold)]" : "text-[var(--text-1)] hover:text-[var(--gold)]",
                        )}
                      >
                        {c.nameFr}
                        {typeof c.productCount === "number" ? (
                          <span className="ml-1.5 text-[10px] text-[var(--text-2)]">({c.productCount})</span>
                        ) : null}
                      </button>
                      {children.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.slug)}
                          className="mr-1 flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                          aria-label={`Expand ${c.nameFr}`}
                        >
                          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} />
                        </button>
                      ) : null}
                    </div>
                    {isExpanded && children.length > 0 ? (
                      <div className="ml-3 border-l border-[var(--line)] pl-2">
                        {children.map((ch) => (
                          <button
                            key={ch.slug}
                            type="button"
                            onClick={() => setParam("category", ch.slug)}
                            className={cn(
                              "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                              category === ch.slug ? "bg-[var(--gold)] text-[#1b1b1f] font-medium" : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
                            )}
                          >
                            {ch.nameFr}
                            {typeof ch.productCount === "number" ? (
                              <span className={cn("ml-1.5 text-[10px]", category === ch.slug ? "text-[#1b1b1f]/60" : "text-[var(--text-2)]")}>({ch.productCount})</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="mb-2 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">{t("product.brand")}</h3>
            <select
              value={brand}
              onChange={(e) => setParam("brand", e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] px-3 font-mono text-sm text-[var(--text-1)] outline-none focus:border-[rgba(253,213,2,0.4)]"
            >
              <option value="">{t("common.all")}</option>
              {(brands ?? []).map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <h3 className="mb-2 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">Prix</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice ?? ""}
                onChange={(e) => setParam("min", e.target.value)}
                placeholder="Min"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--glass)] px-3 font-mono text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-2)] focus:border-[rgba(253,213,2,0.4)]"
              />
              <span className="text-[var(--text-2)]">–</span>
              <input
                type="number"
                value={maxPrice ?? ""}
                onChange={(e) => setParam("max", e.target.value)}
                placeholder="Max"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--glass)] px-3 font-mono text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-2)] focus:border-[rgba(253,213,2,0.4)]"
              />
            </div>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="w-full rounded-xl border border-[var(--line-strong)] py-2.5 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)] transition-colors hover:border-[rgba(253,213,2,0.4)] hover:text-[var(--gold)]"
            >
              {t("common.cancel")}
            </button>
          ) : null}
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="hidden font-mono text-xs text-[var(--text-2)] sm:block">{t("palette.hint")}</p>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="ml-auto h-10 rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] px-3 font-mono text-sm text-[var(--text-1)] outline-none focus:border-[rgba(253,213,2,0.4)]"
              aria-label={t("common.sort")}
            >
              <option value="popular">{t("product.sortPopular")}</option>
              <option value="newest">{t("product.sortNewest")}</option>
              <option value="price-asc">{t("product.sortPriceAsc")}</option>
              <option value="price-desc">{t("product.sortPriceDesc")}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-hud text-base font-semibold text-[var(--text-1)]">{t("product.noResults")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}