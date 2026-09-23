import { memo, useState } from "react";
import { Link } from "react-router";
import { Eye, GitCompareArrows, ShoppingCart, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import type { ProductCardData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuickViewModal } from "@/components/quick-view-modal";

export const BestSellerCard = memo(function BestSellerCard({ product }: { product: ProductCardData }) {
  const { t, formatPrice } = useI18n();
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const name = product.nameFr;
  const summary = product.summaryFr;
  const inCompare = compare.has(product.id);
  const hasDiscount = product.oldPrice != null && product.oldPrice > product.price;
  const savings = hasDiscount ? product.oldPrice! - product.price : 0;
  const specs = (product.specs ?? []).slice(0, 3);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300">
      {/* Badge layer — top-left */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <Badge variant="gold">{t("home.bestSellersTopBadge")}</Badge>
        {hasDiscount ? (
          <Badge variant="discount">-{product.discount ?? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)}%</Badge>
        ) : null}
      </div>

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-white p-4">
        {product.img ? (
          <img
            src={product.img}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {product.slug}
          </div>
        )}
      </Link>

      {/* Aperçu rapide bar — opens quick view modal */}
      <button
        type="button"
        onClick={() => setQuickViewOpen(true)}
        className="flex items-center justify-center gap-2 border-y border-border bg-white py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-[var(--gold)] hover:text-black"
      >
        <Eye className="h-4 w-4" />
        {t("home.bestSellersQuickView")}
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Brand */}
        {product.brandSlug ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {product.brandSlug}
          </span>
        ) : null}

        {/* Title */}
        <Link
          to={`/product/${product.slug}`}
          className="font-hud text-sm font-bold leading-snug text-foreground line-clamp-2 transition-colors hover:text-[var(--gold)]"
        >
          {name}
        </Link>

        {/* Summary */}
        {summary ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{summary}</p>
        ) : null}

        {/* Specs bullet points */}
        {specs.length > 0 ? (
          <ul className="mt-1 space-y-0.5">
            {specs.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                <span className="line-clamp-1">
                  {s.k} : {s.v}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Stock status */}
        <span className={cn("mt-1 text-xs font-semibold", product.stock > 0 ? "text-emerald-600" : "text-red-500")}>
          {product.stock > 0 ? t("home.bestSellersInStock") : t("home.bestSellersOutOfStock")}
        </span>

        {/* Price block */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="price-mono text-lg font-bold">{formatPrice(product.price)}</span>
          </div>
          {hasDiscount ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice!)}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {t("home.bestSellersSavings", { amount: formatPrice(savings) })}
              </span>
            </div>
          ) : null}
        </div>

        {/* Delivery */}
        <div className="flex items-center gap-1.5 text-xs text-orange-600">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span>{t("home.bestSellersDelivery")}</span>
        </div>

        {/* Add to cart + compare — same as ProductCard */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                nameFr: product.nameFr,
                price: product.price,
                oldPrice: product.oldPrice,
                img: product.img,
                stock: product.stock,
              });
              setOpen(true);
            }}
            disabled={product.stock <= 0}
            className="btn-dock h-9 flex-1 !px-3 !py-2 text-xs"
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock > 0 ? t("common.addToCart") : t("common.outOfStock")}
          </button>
          <button
            type="button"
            onClick={() => compare.toggle(product.id)}
            aria-pressed={inCompare}
            aria-label={t("product.addToCompare")}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all",
              inCompare
                ? "border-[var(--gold)] bg-[rgba(253,213,2,0.15)] text-[var(--gold)]"
                : "border-border text-muted-foreground hover:border-[rgba(122,162,255,0.5)] hover:text-[#7aa2ff]",
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal slug={product.slug} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </div>
  );
});
