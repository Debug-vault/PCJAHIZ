import { Link, useNavigate, useSearchParams } from "react-router";
import { ShoppingCart, User, Menu, GitCompareArrows, Search, X, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useCartCount, useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import { useStoreSettings, type HeaderItem, type HeaderSliderItem, type HeaderSliderDirection, iconFxStyle } from "@/lib/settings";
import { HeaderIcon, categoryIcon } from "@/lib/header-icons";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import { TaxModeToggle } from "@/components/tax-mode-toggle";
import { useHeroSlide } from "@/lib/hero-context";

function SmartLink({
  item,
  className,
  onClick,
  onMouseEnter,
  onFocus,
  style,
  role,
  children,
}: {
  item: HeaderItem;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  style?: React.CSSProperties;
  role?: string;
  children: React.ReactNode;
}) {
  if (item.link && item.link.startsWith("/")) {
    return (
      <Link to={item.link} className={className} style={style} role={role} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus}>
        {children}
      </Link>
    );
  }
  return (
    <a href={item.link || undefined} className={className} style={style} role={role} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus}>
      {children}
    </a>
  );
}

type Category = {
  slug: string;
  nameFr: string;
  parentSlug: string | null;
  image: string | null;
  productCount?: number;
};

function CategoryPanel({
  item,
  categories,
  onNavigate,
  onClose,
  showCounts,
  showImages = true,
}: {
  item: HeaderItem;
  categories: Category[];
  onNavigate?: () => void;
  onClose: () => void;
  showCounts?: boolean;
  showImages?: boolean;
}) {
  const topCats = categories.filter((c) => !c.parentSlug);
  const childrenOf = (slug: string) => categories.filter((c) => c.parentSlug === slug);
  const close = () => {
    onClose();
    onNavigate?.();
  };

  return (
    <div className="absolute left-0 top-full z-50 w-[min(92vw,760px)] rounded-b-2xl border border-[var(--line)] bg-[var(--page)] text-[var(--text-1)] shadow-2xl">
      <div className="grid max-h-[70vh] grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto p-5 sm:grid-cols-4">
        {topCats.map((c) => {
          const kids = childrenOf(c.slug);
          return (
            <div key={c.slug}>
              <Link
                to={`/shop?category=${c.slug}`}
                onClick={close}
                className="group flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-[var(--page-soft)]"
              >
                {showImages && categoryIcon(c.slug) ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--page-soft)] text-[var(--text-2)]">
                    <HeaderIcon name={categoryIcon(c.slug)} className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--page-soft)] font-hud text-xs font-bold text-[var(--text-2)]">
                    {c.nameFr.charAt(0)}
                  </span>
                )}
                <span className="flex-1 font-hud text-sm font-semibold text-[var(--text-1)] group-hover:text-[var(--gold-hot)]">
                  {c.nameFr}
                </span>
                {showCounts && c.productCount ? (
                  <span className="rounded-full bg-[var(--gold-dim)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--gold)]">
                    {c.productCount}
                  </span>
                ) : null}
              </Link>
              {kids.length > 0 ? (
                <ul className="ml-[18px] mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                  {kids.map((ch) => (
                    <li key={ch.slug}>
                      <Link
                        to={`/shop?category=${ch.slug}`}
                        onClick={close}
                        className="block py-0.5 text-xs text-[var(--text-2)] transition-colors hover:text-[var(--gold-hot)]"
                      >
                        {ch.nameFr}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="border-t border-[var(--line)] px-5 py-3">
        <Link to="/shop" onClick={close} className="text-sm font-bold text-[var(--gold-hot)] hover:underline">
          {item.text} →
        </Link>
      </div>
    </div>
  );
}

function AllCategoriesPanel({
  categories,
  onHoverCategory,
  activeCat,
  onClose,
  showCounts,
  embedded = false,
}: {
  categories: Category[];
  onHoverCategory: (cat: Category) => void;
  activeCat: Category | null;
  onClose: () => void;
  showCounts?: boolean;
  embedded?: boolean;
}) {
  const cats = categories.filter((c) => !c.parentSlug);
  return (
    <div id="all-categories-panel" className={cn(
      "w-[300px] bg-[var(--page)] text-[var(--text-1)]",
      embedded
        ? "relative border-r border-[var(--line)]"
        : "absolute left-0 top-full z-50 mt-0 overflow-hidden rounded-b-lg border-x border-b border-[var(--line)] shadow-[0_8px_24px_rgba(0,0,0,0.15)]",
    )}>
      {cats.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          onMouseEnter={() => onHoverCategory(cat)}
          onClick={() => onHoverCategory(cat)}
          className={cn(
            "group flex w-full items-center gap-3 border-b border-[var(--line)] px-5 text-left last:border-b-0 hover:bg-[var(--page-soft)]",
            activeCat?.slug === cat.slug && "bg-[var(--gold)] text-[#1b1b1f] hover:bg-[#ffdf33]",
          )}
        >
          <HeaderIcon name={categoryIcon(cat.slug) ?? "package"} className={cn("h-[18px] w-[18px] shrink-0", activeCat?.slug === cat.slug ? "text-[#1b1b1f]" : "text-[var(--text-2)] group-hover:text-[var(--gold-hot)]")} />
          <span className={cn("flex-1 py-3 text-sm font-medium", activeCat?.slug === cat.slug ? "text-[#1b1b1f]" : "text-[var(--text-1)]")}>{cat.nameFr}</span>
          {showCounts && typeof cat.productCount === "number" ? (
            <span className="rounded-full bg-[var(--gold-dim)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--gold)]">{cat.productCount}</span>
          ) : null}
          <ChevronRight className={cn("h-4 w-4 shrink-0", activeCat?.slug === cat.slug ? "text-[#1b1b1f]" : "text-[var(--text-2)] group-hover:text-[var(--gold-hot)]")} />
        </button>
      ))}
      <Link to="/shop" onClick={onClose} className="block px-5 py-3 text-sm font-bold text-[var(--gold-hot)] no-underline hover:opacity-80">
        Voir tous les produits →
      </Link>
    </div>
  );
}

function CategorySubmenu({
  category,
  categories,
  brands,
  onNavigate,
  onClose,
  showCounts,
  showImages = true,
  sidePanel = false,
  embedded = false,
}: {
  category: Category;
  categories: Category[];
  brands?: { slug: string; name: string }[];
  onNavigate?: () => void;
  onClose: () => void;
  showCounts?: boolean;
  showImages?: boolean;
  sidePanel?: boolean;
  embedded?: boolean;
}) {
  const kids = categories.filter((c) => c.parentSlug === category.slug);
  const grandkidsOf = (slug: string) => categories.filter((c) => c.parentSlug === slug);
  const topBrands = (brands ?? []).slice(0, 14);
  const brandName = (slug?: string | null) => topBrands.find((b) => b.slug === slug)?.name ?? "";
  const { formatPrice } = useI18n();
  const { data: showcase } = trpc.shop.list.useQuery(
    { category: category.slug, sort: "popular", limit: 4 },
    { enabled: !!category.slug },
  );
  const close = () => {
    onClose();
    onNavigate?.();
  };
  return (
    <div className={cn(
      "bg-[var(--page)] p-4 text-[var(--text-1)]",
      embedded
        ? "relative min-w-0 flex-1"
        : cn("absolute top-full z-50 rounded-b-2xl border border-[var(--line)] shadow-2xl", sidePanel ? "left-0 w-[760px]" : "left-0 right-0"),
    )}>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
              {category.nameFr}
            </p>
            <div className="flex gap-2">
              <Link
                to={`/shop?category=${category.slug}&sort=popular`}
                onClick={close}
                className="rounded-full bg-[var(--gold-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-[#1b1b1f]"
              >
                Meilleures ventes
              </Link>
              <Link
                to={`/shop?category=${category.slug}&sort=newest`}
                onClick={close}
                className="rounded-full bg-[var(--gold-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-[#1b1b1f]"
              >
                Nouveautés
              </Link>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-3">
            {kids.map((ch) => {
              const grand = grandkidsOf(ch.slug);
              return (
                <div key={ch.slug}>
                   <Link
                     to={`/shop?category=${ch.slug}`}
                     onClick={close}
                     className="group flex h-10 items-center gap-1.5 px-3 font-hud text-sm font-medium text-[var(--text-1)] transition-colors hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)] hover:text-yellow-400 no-underline"
                   >
                     {showImages && categoryIcon(ch.slug) ? (
                       <HeaderIcon name={categoryIcon(ch.slug)} className="h-4 w-4 shrink-0 text-[var(--text-2)] group-hover:text-yellow-400" />
                     ) : null}
                     <span className="flex-1">{ch.nameFr}</span>
                     {showCounts && ch.productCount ? (
                       <span className="rounded-full bg-[color-mix(in_srgb,currentColor_22%,transparent)] px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums">
                         {ch.productCount}
                       </span>
                     ) : null}
                   </Link>
                  {grand.length > 0 ? (
                    <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                      {grand.map((g) => (
                        <li key={g.slug}>
                           <Link
                             to={`/shop?category=${g.slug}`}
                             onClick={close}
                             className="block rounded-md px-3 py-1 text-xs font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--gold-hot)]"
                           >
                             {g.nameFr}
                           </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <p className="mb-2 font-hud text-[11px] font-bold uppercase tracking-widest text-[var(--text-2)]">
              Marques
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topBrands.map((b) => (
                <Link
                  key={b.slug}
                  to={`/shop?brand=${b.slug}`}
                  onClick={close}
                  className="rounded-lg border border-[var(--line)] bg-[var(--page)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-dim)] hover:text-[var(--gold)]"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <aside className="mt-5 hidden w-64 shrink-0 border-l border-[var(--line)] pl-5 lg:mt-0 lg:block">
          <p className="font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
            Coup de cœur
            <span className="mt-1.5 block h-0.5 w-8 bg-[var(--gold)]" />
          </p>
          <div className="mt-3 space-y-3">
            {(showcase ?? []).slice(0, 4).map((prod) => {
              const pct =
                prod.oldPrice && prod.oldPrice > prod.price
                  ? Math.round((1 - prod.price / prod.oldPrice) * 100)
                  : 0;
              return (
                <Link
                  key={prod.slug}
                  to={`/product/${prod.slug}`}
                  onClick={close}
                  className="group flex gap-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                    <img
                      src={prod.img ?? ""}
                      alt={prod.nameFr}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                    />
                    {pct > 0 ? (
                      <span className="absolute left-0 top-0 rounded-br bg-[var(--gold)] px-1 py-0.5 text-[10px] font-bold text-[#1b1b1f]">
                        -{pct}%
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-2)]">
                      {brandName(prod.brandSlug)}
                    </p>
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--text-1)]">
                      {prod.nameFr}
                    </p>
                    <p className="price-mono mt-1 text-sm font-bold text-[var(--text-1)]">
                      {formatPrice(prod.price)}
                    </p>
                    {prod.oldPrice ? (
                      <p className="price-mono text-[11px] text-[var(--text-2)] line-through">
                        {formatPrice(prod.oldPrice)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
            {(showcase ?? []).length === 0 ? (
              <p className="text-xs text-[var(--text-2)]">Aucun produit.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MenuPanel({
  item,
  onNavigate,
  onClose,
}: {
  item: HeaderItem;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const close = () => {
    onClose();
    onNavigate?.();
  };
  const children = (item.children ?? []).filter((c) => c.enabled);

  return (
    <div className="absolute left-0 top-full z-50 min-w-56 rounded-b-2xl border border-[var(--line)] bg-[var(--page)] py-2 text-[var(--text-1)] shadow-2xl">
      {children.map((child) => (
        <SmartLink
          key={child.id}
          item={child}
          onClick={close}
          role="menuitem"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--gold-hot)]"
        >
          <HeaderIcon name={child.icon} className="h-4 w-4 text-[var(--text-2)]" />
          {child.text}
        </SmartLink>
      ))}
      {children.length === 0 ? (
        <p className="px-4 py-2 text-xs text-[var(--text-2)]">Menu vide</p>
      ) : null}
    </div>
  );
}

function HeaderSlider({
  slider,
}: {
  slider: { items: HeaderSliderItem[]; interval: number; maxWidth: number; direction: HeaderSliderDirection };
}) {
  const slides = slider.items.filter((s) => s.text || s.image);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), Math.max(slider.interval, 2000));
    return () => window.clearInterval(id);
  }, [slides.length, slider.interval]);

  if (slides.length === 0) return null;

  const n = slides.length;
  const offsetFor = (i: number): { x: number; y: number } => {
    const pos = (i - idx + n) % n;
    const forward = pos !== 0 && pos <= n / 2;
    const d = slider.direction;
    if (d === "rtl") return { x: pos === 0 ? 0 : forward ? 100 : -100, y: 0 };
    if (d === "ltr") return { x: pos === 0 ? 0 : forward ? -100 : 100, y: 0 };
    if (d === "btt") return { x: 0, y: pos === 0 ? 0 : forward ? 100 : -100 };
    return { x: 0, y: pos === 0 ? 0 : forward ? -100 : 100 };
  };

  return (
    <div data-slider className="relative hidden h-9 flex-none items-center overflow-hidden rounded-lg md:flex" style={{ width: slider.maxWidth && Number(slider.maxWidth) > 0 ? Number(slider.maxWidth) : 220 }}>
      {slides.map((s, i) => {
        const isCurrent = i === idx;
        const { x, y } = offsetFor(i);
        const inner = (
          <span className="flex h-full min-w-0 items-center justify-center gap-2 px-2">
            {s.image ? (
              <img src={s.image} alt={s.text} className="h-full w-full rounded-md object-contain" />
            ) : (
              <>
                {s.icon ? (
                  <HeaderIcon name={s.icon} className="h-4 w-4 shrink-0" style={iconFxStyle({ iconColor: s.iconColor, iconGlow: s.iconGlow, iconShadow: s.iconShadow })} />
                ) : null}
                <span
                  className="truncate text-sm font-medium"
                  style={{ color: s.textColor || undefined, fontSize: s.textSize ? `${s.textSize}px` : undefined }}
                >
                  {s.text}
                </span>
              </>
            )}
          </span>
        );
        const style: React.CSSProperties = {
          transform: `translate3d(${x}%, ${y}%, 0)`,
          opacity: isCurrent ? 1 : 0,
          transition: "transform 500ms cubic-bezier(0.4,0,0.2,1), opacity 500ms ease",
          zIndex: isCurrent ? 10 : 0,
          pointerEvents: isCurrent ? "auto" : "none",
        };
        const cls = "absolute inset-0 flex h-full min-w-0 items-center";
        return s.link && s.link.startsWith("/") ? (
          <Link key={s.id} to={s.link} className={cls} style={style} aria-hidden={!isCurrent}>
            {inner}
          </Link>
        ) : (
          <a key={s.id} href={s.link || undefined} className={cls} style={style} aria-hidden={!isCurrent}>
            {inner}
          </a>
        );
      })}
    </div>
  );
}

export function BottomItem({
  item,
  categories,
  brands,
  onNavigate,
  root,
  active,
  showCounts,
  showImages,
  indicator = true,
}: {
  item?: HeaderItem;
  categories: Category[];
  brands?: { slug: string; name: string }[];
  onNavigate?: () => void;
  root?: Category;
  active?: boolean;
  showCounts?: boolean;
  showImages?: boolean;
  indicator?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const hasDropdown = root
    ? true
    : !!item && (item.type === "categories" || (item.type === "menu" && (item.children ?? []).some((c) => c.enabled)));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [open]);

  const triggerInner = (
    <>
      {root ? (
        showImages && categoryIcon(root.slug) ? (
          <HeaderIcon name={categoryIcon(root.slug)} className="h-4 w-4" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[color-mix(in_srgb,currentColor_20%,transparent)] text-[10px] font-bold">
            {root.nameFr.charAt(0)}
          </span>
        )
      ) : (
        <HeaderIcon name={item?.icon} className="h-3.5 w-3.5" />
      )}
      <span className={cn("inline-flex items-center gap-1.5 transition-colors", indicator ? "border-b-2 border-transparent group-hover:border-current" : "")}>
        {root ? root.nameFr : item?.text}
        {root && showCounts && typeof root.productCount === "number" ? (
          <span className="rounded-full bg-[color-mix(in_srgb,currentColor_22%,transparent)] px-1.5 text-[10px] font-semibold tabular-nums">{root.productCount}</span>
        ) : null}
      </span>
      {hasDropdown ? <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} /> : null}
    </>
  );
  const triggerCommon = "group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-hud text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)]";
  const trigger = root ? (
    <a
      ref={triggerRef as React.Ref<HTMLAnchorElement>}
      href={root.slug ? `/shop?category=${encodeURIComponent(root.slug)}` : "#"}
      aria-haspopup="menu"
      aria-expanded={open}
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onFocus={() => hasDropdown && setOpen(true)}
      className={cn(triggerCommon, active ? "text-[var(--gold-hot)]" : "")}
    >
      {triggerInner}
    </a>
  ) : (
    <button
      ref={triggerRef as React.Ref<HTMLButtonElement>}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onFocus={() => hasDropdown && setOpen(true)}
      onClick={() => setOpen((o) => !o)}
      className={cn(triggerCommon, active ? "text-[var(--gold-hot)]" : "")}
    >
      {triggerInner}
    </button>
  );

  const panel = root ? (
    <CategorySubmenu category={root} categories={categories} brands={brands} onNavigate={onNavigate} onClose={close} showCounts={showCounts} showImages={showImages} />
  ) : item?.type === "categories" ? (
    <CategoryPanel item={item} categories={categories} onNavigate={onNavigate} onClose={close} showCounts={showCounts} showImages={showImages} />
  ) : (
    <MenuPanel item={item!} onNavigate={onNavigate} onClose={close} />
  );

  return (
    <div className="relative" data-bottom-item="" data-active={active ? "true" : undefined} onMouseLeave={() => setOpen(false)}>
      {trigger}
      {open && hasDropdown ? (
        <div ref={panelRef} role="menu" className="relative z-50">
          {panel}
        </div>
      ) : null}
    </div>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const cartCount = useCartCount();
  const setCartOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const { settings } = useStoreSettings();
  const h = settings.header;
  const logoHoverCfg = h.mainBar.logo.hover;
  const logoDir = logoHoverCfg.direction;
  const outVec = logoDir === "top" ? "0%,-100%" : logoDir === "bottom" ? "0%,100%" : logoDir === "left" ? "-100%,0%" : "100%,0%";
  const inVec = logoDir === "top" ? "0%,100%" : logoDir === "bottom" ? "0%,-100%" : logoDir === "left" ? "100%,0%" : "-100%,0%";
  const navigate = useNavigate();
  const { data: categoriesData } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: brandsData } = trpc.shop.brands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const categories: Category[] = (categoriesData ?? []) as Category[];
  const brands: { slug: string; name: string }[] = (brandsData ?? []).map((b) => ({ slug: b.slug, name: b.name }));
  const [searchParams] = useSearchParams();
  const activeCat = searchParams.get("category");
  const isDescendantOf = (slug: string, ancestor: string): boolean => {
    let cur = categories.find((c) => c.slug === slug);
    while (cur && cur.parentSlug) {
      if (cur.parentSlug === ancestor) return true;
      cur = categories.find((c) => c.slug === cur!.parentSlug);
    }
    return false;
  };
  const isCatActive = (slug: string) => !!activeCat && (activeCat === slug || isDescendantOf(activeCat, slug));
  const topCats = categories.filter((c) => !c.parentSlug);
  const barCats = topCats;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [flyoutCat, setFlyoutCat] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  const { data: searchResults } = trpc.shop.list.useQuery(
    { q: debouncedQ || undefined, sort: "popular", limit: 6 },
    { enabled: debouncedQ.length >= 1 },
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [slide, setSlide] = useState(0);
  const [logoHover, setLogoHover] = useState(false);
  const [topBarClosed, setTopBarClosed] = useState(() => {
    try { return localStorage.getItem("topBarClosed") === "1"; } catch { return false; }
  });
  const { currentSlide: heroSlide } = useHeroSlide();
  const [headerHidden, setHeaderHidden] = useState(false);
  const headerScroll = useRef({ lastY: 0, accum: 0 });


  const topItems = h.topBar.items.filter((it) => it.enabled);
  const utilityItems = h.utilityBar.items.filter((it) => it.enabled);
  const bottomItems = h.bottomNav.items.filter((it) => it.enabled);

  // Bottom-nav mega menu opens on hover and closes when the pointer leaves the nav.

  useEffect(() => {
    if (!h.topBar.enabled || topItems.length < 2) return;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % topItems.length), Math.max(h.topBar.interval, 2000));
    return () => window.clearInterval(id);
  }, [h.topBar.enabled, h.topBar.interval, topItems.length]);

  useEffect(() => {
    const navEl = document.querySelector("[data-bottom-nav]");
    const bottomH = navEl ? navEl.getBoundingClientRect().height : (h.bottomNav.enabled && (bottomItems.length || topCats.length) ? 46 : 0);
    const total =
      (h.topBar.enabled && topItems.length ? 32 : 0) +
      (h.utilityBar.enabled && utilityItems.length ? 36 : 0) +
      h.mainBar.height +
      bottomH;
    document.documentElement.style.setProperty("--nav-h", `${total}px`);
  }, [h, topItems.length, utilityItems.length, bottomItems.length, topCats.length]);

  useEffect(() => {
    if (!h.mainBar.sticky) return;
    const s = headerScroll.current;
    s.lastY = window.scrollY;
    s.accum = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - s.lastY;
      s.lastY = y;
      if (y <= 4) {
        s.accum = 0;
        setHeaderHidden(false);
        return;
      }
      if (delta !== 0 && Math.sign(delta) !== Math.sign(s.accum)) s.accum = 0;
      s.accum += delta;
      if (s.accum <= -30) {
        s.accum = 0;
        setHeaderHidden(false);
        return;
      }
      if (searchFocused || megaOpen || menuOpen || mobileOpen) return;
      if (y > 60 && s.accum >= 80) {
        s.accum = 0;
        setHeaderHidden(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [h.mainBar.sticky, searchFocused, megaOpen, menuOpen, mobileOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      setQuery("");
      setMobileOpen(false);
    }
  };

  const activeSlide = topItems.length ? topItems[Math.min(slide, topItems.length - 1)] : null;

  const closeMobile = () => setMobileOpen(false);
  const hideStickyHeader = headerHidden && !searchFocused && !megaOpen && !menuOpen && !mobileOpen;

  return (
    <div
      className={cn("top-0 z-40", h.mainBar.sticky && "sticky transition-transform duration-300 ease-out", h.mainBar.sticky && hideStickyHeader && "-translate-y-full")}
      onFocus={() => setHeaderHidden(false)}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--gold)] focus:px-4 focus:py-2 focus:font-hud focus:text-sm focus:font-bold focus:text-black"
      >
        Aller au contenu
      </a>

      {h.topBar.enabled && activeSlide && !topBarClosed ? (
        <div className="group relative mx-auto overflow-hidden px-4 py-1.5 text-center text-xs font-semibold sm:px-6" style={{ background: heroSlide?.bgColor || h.topBar.bg, color: heroSlide?.bgColor ? "#000" : h.topBar.textColor, maxWidth: h.topBar.maxWidth > 0 ? `${h.topBar.maxWidth}px` : undefined }}>
          {heroSlide ? (
            <div className="flex items-center justify-center gap-2">
              {heroSlide.eyebrow && <span className="truncate">{heroSlide.eyebrow}</span>}
              {heroSlide.eyebrow && heroSlide.heading && <span className="mx-1 opacity-50">—</span>}
              {heroSlide.heading && <span className="truncate font-extrabold">{heroSlide.heading}</span>}
            </div>
          ) : topItems.length === 1 ? (
            <SmartLink item={activeSlide} className="inline-flex max-w-full items-center gap-2">
              <HeaderIcon name={activeSlide.icon} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{activeSlide.text}</span>
              {activeSlide.link ? <span className="shrink-0 underline underline-offset-2 opacity-80">→</span> : null}
            </SmartLink>
          ) : (
            <div className="relative mx-auto flex min-h-[24px] max-w-5xl items-center justify-center">
              {topItems.map((it, i) => (
                <SmartLink
                  key={it.id}
                  item={it}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-500",
                    i === slide ? "opacity-100" : "pointer-events-none absolute inset-0 justify-center opacity-0",
                  )}
                >
                  <HeaderIcon name={it.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{it.text}</span>
                  {it.link ? <span className="shrink-0 underline underline-offset-2 opacity-80">→</span> : null}
                </SmartLink>
              ))}
            </div>
          )}
          <button
            onClick={() => { setTopBarClosed(true); try { localStorage.setItem("topBarClosed", "1"); } catch {} }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100"
            aria-label="Fermer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <div className="hidden border-b border-[var(--line)] bg-[var(--page)] md:block">
        <div className="mx-auto flex h-8 max-w-[var(--section-header-max-width)] items-center gap-6 px-4 text-[11px] text-[var(--text-2)] sm:px-6">
          {h.utilityBar.enabled && utilityItems.map((it) => (
            <SmartLink
              key={it.id}
              item={it}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-1)]"
            >
              <HeaderIcon name={it.icon} className="h-3.5 w-3.5" />
              {it.text}
            </SmartLink>
          ))}
          <div className="ml-auto">
            {h.utilityBar.showTaxToggle ? <TaxModeToggle /> : null}
          </div>
        </div>
      </div>

      <header className="border-b border-[var(--line)]" style={{ background: h.mainBar.bg }}>
        <div className="mx-auto flex max-w-[var(--section-header-max-width)] items-center gap-3 px-4 sm:px-6" style={{ height: h.mainBar.height }}>
          <button
            type="button"
            className={cn(
              "h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--page-soft)]",
              h.bottomNav.enabled && h.bottomNav.display === "drawer" ? "hidden lg:inline-flex" : "hidden",
            )}
            onClick={() => setMenuOpen(true)}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--page-soft)] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.menu")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/"
            data-logo-hover
            className="relative flex shrink-0 items-center gap-2.5 overflow-hidden"
            aria-label={settings.storeName}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
          >
            <span
              className="flex items-center gap-2.5"
              style={{
                transform: logoHoverCfg.enabled && logoHover ? `translate(${outVec})` : "translate(0,0)",
                transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {settings.storeLogo ? (
                <img
                  src={settings.storeLogo}
                  alt={settings.storeName}
                  className="w-auto"
                  style={{ height: h.mainBar.logo.height, width: h.mainBar.logo.width > 0 ? h.mainBar.logo.width : "auto" }}
                />
              ) : (
                <span
                  className="flex items-center justify-center rounded-full bg-[var(--gold)] font-hud font-bold text-black"
                  style={{ height: h.mainBar.logo.height, width: h.mainBar.logo.height, fontSize: h.mainBar.logo.height * 0.5 }}
                >
                  J
                </span>
              )}
              {h.mainBar.logo.showName ? (
                <span className="hidden font-hud text-lg font-bold tracking-wide text-[var(--text-1)] sm:block">
                  {settings.storeName}
                </span>
              ) : null}
            </span>
            <span
              data-home-icon
              className="absolute inset-0 flex items-center justify-center gap-1.5"
              style={{
                transform: logoHoverCfg.enabled && logoHover ? "translate(0,0)" : `translate(${inVec})`,
                transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <Link
                to="/"
                className="group flex h-8 w-8 items-center justify-center rounded-full bg-[var(--page-soft)] transition-colors hover:bg-[var(--gold)]"
                aria-label="Accueil"
              >
                <HeaderIcon
                  name="home"
                  className="h-4 w-4 text-[var(--gold-hot)] transition-colors group-hover:text-[#1b1b1f]"
                />
              </Link>
              <Link
                to="/shop"
                className="group flex h-8 w-8 items-center justify-center rounded-full bg-[var(--page-soft)] transition-colors hover:bg-[var(--gold)]"
                aria-label="Boutique"
              >
                <HeaderIcon
                  name="store"
                  className="h-4 w-4 text-[var(--gold-hot)] transition-colors group-hover:text-[#1b1b1f]"
                />
              </Link>
            </span>
          </Link>

          {h.mainBar.slider.enabled ? <HeaderSlider slider={h.mainBar.slider} /> : null}

          {h.mainBar.search.enabled ? (
            <div
              ref={searchRef}
              className="relative mx-auto hidden flex-1 md:block"
              style={{ maxWidth: h.mainBar.search.maxWidth }}
            >
              <form onSubmit={submitSearch} role="search">
                <label htmlFor="site-search" className="sr-only">
                  {h.mainBar.search.placeholder}
                </label>
                <div className="relative">
                  <input
                    id="site-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={h.mainBar.search.placeholder}
                    className="w-full rounded-full border border-[var(--line-strong)] bg-[var(--page-soft)] py-2.5 pl-4 pr-12 text-sm text-[var(--text-1)] outline-none transition-colors focus:border-[var(--gold-hot)]"
                  />
                  <button
                    type="submit"
                    aria-label={h.mainBar.search.placeholder}
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--gold)] text-black transition-transform hover:scale-105"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
              {searchFocused && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] shadow-2xl backdrop-blur-xl">
                  {searchResults.slice(0, 6).map((p) => (
                    <Link
                      key={p.slug}
                      to={`/product/${p.slug}`}
                      onClick={() => { setQuery(""); setSearchFocused(false); }}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--page-soft)]"
                    >
                      {p.img ? <img src={p.img} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-[var(--page-soft)]" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-1)]">{p.nameFr}</p>
                        <p className="font-mono text-xs text-[var(--gold)]">{p.price?.toLocaleString("fr-MA")} MAD</p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to={`/shop?q=${encodeURIComponent(debouncedQ)}`}
                    onClick={() => { setQuery(""); setSearchFocused(false); }}
                    className="block border-t border-[var(--line)] px-4 py-2.5 text-center text-xs font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--text-1)]"
                  >
                    Voir tous les résultats →
                  </Link>
                </div>
              )}
              {searchFocused && debouncedQ.length >= 1 && searchResults && searchResults.length === 0 && (
                <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] px-4 py-6 text-center text-sm text-[var(--text-2)] shadow-2xl backdrop-blur-xl">
                  Aucun résultat pour « {debouncedQ} »
                </div>
              )}
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {h.mainBar.showCompare ? (
              <Link
                to="/compare"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--text-1)]"
                aria-label={t("nav.compare")}
              >
                <GitCompareArrows className="h-5 w-5" />
                {compare.ids.length > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-1 font-mono text-[10px] font-bold text-black">
                    {compare.ids.length}
                  </span>
                ) : null}
              </Link>
            ) : null}

            {h.mainBar.showAccount ? (
              <Link
                to="/account"
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--text-1)] sm:inline-flex"
                aria-label={t("nav.account")}
              >
                <User className="h-5 w-5" />
              </Link>
            ) : null}

            {h.mainBar.showCart ? (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] px-3 font-hud text-sm font-semibold text-[var(--text-1)] transition-all hover:border-[var(--gold-hot)] hover:text-[var(--gold-hot)]"
                aria-label={t("nav.cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">{t("nav.cart")}</span>
                {cartCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 font-mono text-[10px] font-bold text-black">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </div>

        {h.bottomNav.enabled && h.bottomNav.display !== "drawer" && (bottomItems.length > 0 || topCats.length > 0) ? (
          <nav
            className="relative hidden border-t border-black/10 lg:block"
            data-bottom-nav=""
            aria-label={t("nav.menu")}
            style={{ background: h.bottomNav.bg, color: h.bottomNav.textColor }}
            onMouseLeave={() => { setMegaOpen(false); setFlyoutCat(null); }}
          >
            <div className="relative mx-auto flex items-stretch justify-between gap-2 px-2 sm:gap-3 sm:px-4">
              {/* LEFT — Tous nos produits + Promo */}
              <div className="relative flex items-stretch">
                <Link
                  to="/shop"
                  onMouseEnter={() => { setMegaOpen(true); setFlyoutCat(null); }}
                  aria-expanded={megaOpen}
                  aria-controls="all-categories-panel"
                  className="inline-flex items-center gap-1.5 bg-[var(--gold)] px-3 py-2 font-hud text-xs font-bold text-[#1b1b1f] transition-colors hover:bg-[#ffdf33] sm:px-3.5 sm:py-2.5 sm:text-sm"
                >
                  <HeaderIcon name="menu" className="h-4 w-4" />
                  <span>{t("nav.allProducts")}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaOpen && "rotate-180")} />
                </Link>
                <Link
                  to="/shop?sort=discount"
                  className="inline-flex items-center gap-1.5 bg-red-600 px-2.5 py-2 font-hud text-xs font-bold text-white transition-colors hover:bg-red-700 no-underline sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <HeaderIcon name="tag" className="h-3.5 w-3.5" />
                  <span>{t("nav.promo")}</span>
                </Link>
              </div>

              {/* CENTER — all categories */}
              <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1 bg-inherit py-1 sm:gap-1.5">
                {barCats.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/shop?category=${cat.slug}`}
                    onMouseEnter={() => { setMegaOpen(true); setFlyoutCat(cat); }}
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-2 py-1 font-hud text-xs font-medium text-current transition-colors hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)] hover:text-yellow-400 no-underline sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                      flyoutCat === cat && "bg-[color-mix(in_srgb,currentColor_14%,transparent)] text-yellow-400 font-semibold",
                    )}
                  >
                    <HeaderIcon name={categoryIcon(cat.slug) ?? "package"} className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>{cat.nameFr}</span>
                    {h.bottomNav.showCounts && typeof cat.productCount === "number" ? (
                      <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,currentColor_22%,transparent)] px-1.5 text-[10px] font-semibold tabular-nums">{cat.productCount}</span>
                    ) : null}
                  </Link>
                ))}
              </div>

            </div>

            {/* Mega menu — full width below nav */}
            {megaOpen ? (
              <div className="absolute left-0 top-full z-50 flex w-full rounded-b-lg border-x border-b border-[var(--line)] bg-[var(--page)] shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                <AllCategoriesPanel
                  embedded
                  categories={categories}
                  onHoverCategory={(c) => setFlyoutCat(c)}
                  activeCat={flyoutCat}
                  onClose={() => { setMegaOpen(false); setFlyoutCat(null); }}
                  showCounts={h.bottomNav.showCounts}
                />
                {flyoutCat ? (
                  <CategorySubmenu
                    embedded
                    sidePanel
                    category={flyoutCat}
                    categories={categories}
                    brands={brands}
                    onClose={() => setFlyoutCat(null)}
                    showCounts={h.bottomNav.showCounts}
                    showImages={h.bottomNav.showImages}
                  />
                ) : null}
              </div>
            ) : null}
          </nav>
        ) : null}
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.menu")}
            className="absolute inset-0 bg-black/40"
            onClick={closeMobile}
          />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col overflow-y-auto bg-[var(--page)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <span className="font-hud text-base font-bold text-[var(--text-1)]">{settings.storeName}</span>
              <button
                type="button"
                onClick={closeMobile}
                aria-label={t("whatsapp.close")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--page-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {h.mobileDrawer.showSearch ? (
              <form onSubmit={submitSearch} className="border-b border-[var(--line)] px-4 py-3" role="search">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={h.mainBar.search.placeholder}
                    className="w-full rounded-full border border-[var(--line-strong)] bg-[var(--page-soft)] py-2.5 pl-4 pr-11 text-sm text-[var(--text-1)] outline-none"
                  />
                  <button
                    type="submit"
                    aria-label={h.mainBar.search.placeholder}
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--gold)] text-black"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : null}

            <nav className="flex-1 overflow-y-auto px-4 py-3" aria-label={t("nav.menu")}>
              {bottomItems.length > 0 ? (
                <>
                  <p className="mb-2 px-1 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
                    {t("nav.categories")}
                  </p>
                  <ul className="mb-4 flex flex-col gap-0.5">
                    {bottomItems.map((it) => {
                      if (it.type === "categories") {
  const topCats = categories.filter((c) => !c.parentSlug);
                        return (
                          <li key={it.id}>
                            <div className="flex items-center justify-between rounded-lg px-3 py-2 font-hud text-sm font-semibold text-[var(--text-1)]">
                              <span className="inline-flex items-center gap-2">
                                <HeaderIcon name={it.icon} className="h-4 w-4 text-[var(--text-2)]" />
                                {it.text}
                              </span>
                            </div>
                            <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                              {topCats.map((c) => (
                                <li key={c.slug}>
                                  <Link
                                    to={`/shop?category=${c.slug}`}
                                    onClick={closeMobile}
                                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--page-soft)]"
                                  >
                                    {categoryIcon(c.slug) ? (
                                      <HeaderIcon name={categoryIcon(c.slug)} className="h-4 w-4 shrink-0 text-[var(--text-2)]" />
                                    ) : (
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--page-soft)] text-[10px] font-bold text-[var(--text-2)]">
                                        {c.nameFr.charAt(0)}
                                      </span>
                                    )}
                                    {c.nameFr}
                                  </Link>
                                  {(() => {
                                    const kids = categories.filter((ch) => ch.parentSlug === c.slug);
                                    return kids.length > 0 ? (
                                      <ul className="ml-5 space-y-0.5 border-l border-[var(--line)] pl-3">
                                        {kids.map((ch) => (
                                          <li key={ch.slug}>
                                            <Link
                                              to={`/shop?category=${ch.slug}`}
                                              onClick={closeMobile}
                                              className="block rounded-lg px-2 py-1.5 text-xs text-[var(--text-2)] hover:text-[var(--gold-hot)]"
                                            >
                                              {ch.nameFr}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null;
                                  })()}
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      }
                      if (it.type === "menu") {
                        const kids = (it.children ?? []).filter((c) => c.enabled);
                        return (
                          <li key={it.id}>
                            <div className="flex items-center justify-between rounded-lg px-3 py-2 font-hud text-sm font-semibold text-[var(--text-1)]">
                              <span className="inline-flex items-center gap-2">
                                <HeaderIcon name={it.icon} className="h-4 w-4 text-[var(--text-2)]" />
                                {it.text}
                              </span>
                            </div>
                            <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                              {kids.map((kid) => (
                                <li key={kid.id}>
                                  <SmartLink
                                    item={kid}
                                    onClick={closeMobile}
                                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--page-soft)]"
                                  >
                                    <HeaderIcon name={kid.icon} className="h-4 w-4 text-[var(--text-2)]" />
                                    {kid.text}
                                  </SmartLink>
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      }
                      return (
                        <li key={it.id}>
                          <SmartLink
                            item={it}
                            onClick={closeMobile}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 font-hud text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--gold-dim)]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <HeaderIcon name={it.icon} className="h-4 w-4 text-[var(--text-2)]" />
                              {it.text}
                            </span>
                            <ChevronRight className="h-4 w-4 text-[var(--text-2)]" />
                          </SmartLink>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}

              {h.mobileDrawer.showAccount || h.mobileDrawer.showCompare || h.mobileDrawer.showCart || h.mobileDrawer.showPhone ? (
                <>
                  <p className="mb-2 px-1 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
                    {t("nav.quickLinksTitle")}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {h.mobileDrawer.showAccount ? (
                      <li>
                        <Link
                          to="/account"
                          onClick={closeMobile}
                          className="block rounded-lg px-3 py-2.5 text-sm text-[var(--text-1)] hover:bg-[var(--page-soft)]"
                        >
                          {t("nav.account")}
                        </Link>
                      </li>
                    ) : null}
                    {h.mobileDrawer.showCompare ? (
                      <li>
                        <Link
                          to="/compare"
                          onClick={closeMobile}
                          className="block rounded-lg px-3 py-2.5 text-sm text-[var(--text-1)] hover:bg-[var(--page-soft)]"
                        >
                          {t("nav.compare")}
                        </Link>
                      </li>
                    ) : null}
                    {h.mobileDrawer.showCart ? (
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            setCartOpen(true);
                          }}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text-1)] hover:bg-[var(--page-soft)]"
                        >
                          {t("nav.cart")}
                        </button>
                      </li>
                    ) : null}
                    {h.mobileDrawer.showPhone && settings.contactPhone ? (
                      <li>
                        <a
                          href={`tel:${settings.contactPhone}`}
                          onClick={closeMobile}
                          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--gold-hot)]"
                        >
                          <HeaderIcon name="messageCircle" className="h-4 w-4" />
                          {settings.contactPhone}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-[var(--page)] shadow-2xl" role="dialog" aria-label={t("nav.menu")}>
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <span className="font-hud text-base font-bold text-[var(--text-1)]">{t("nav.menu")}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t("nav.menu")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--page-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label={t("nav.menu")}>
              {topCats.map((c) => {
                const kids = categories.filter((ch) => ch.parentSlug === c.slug);
                return (
                  <div key={c.slug} className="mb-1">
                    <Link
                      to={`/shop?category=${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--gold-hot)]",
                        isCatActive(c.slug) ? "bg-[var(--page-soft)] text-[var(--gold-hot)]" : "text-[var(--text-1)]",
                      )}
                    >
                      {categoryIcon(c.slug) ? (
                        <HeaderIcon name={categoryIcon(c.slug)} className="h-4 w-4 shrink-0 text-[var(--text-2)]" />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--page-soft)] text-[10px] font-bold text-[var(--text-2)]">
                          {c.nameFr.charAt(0)}
                        </span>
                      )}
                      {c.nameFr}
                    </Link>
                    {kids.length > 0 ? (
                      <ul className="ml-[26px] mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                        {kids.map((ch) => (
                          <li key={ch.slug}>
                            <Link
                              to={`/shop?category=${ch.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-1.5 py-1 text-sm text-[var(--text-2)] transition-colors hover:text-[var(--gold-hot)]"
                            >
                              {categoryIcon(ch.slug) ? (
                                <HeaderIcon name={categoryIcon(ch.slug)} className="h-3.5 w-3.5 shrink-0 text-[var(--text-2)]" />
                              ) : null}
                              {ch.nameFr}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
              {bottomItems.filter((it) => it.type !== "categories").map((it) => (
                <SmartLink
                  key={it.id}
                  item={it}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--page-soft)] hover:text-[var(--gold-hot)]"
                >
                  <HeaderIcon name={it.icon} className="h-4 w-4 text-[var(--text-2)]" />
                  {it.text}
                </SmartLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}