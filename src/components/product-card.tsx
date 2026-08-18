import { Link } from "react-router";
import { ShoppingCart, GitCompareArrows } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import type { ProductCardData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { t, locale, formatPrice } = useI18n();
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const name = locale === "ar" ? product.nameAr : product.nameFr;
  const summary = locale === "ar" ? product.summaryAr : product.summaryFr;
  const inCompare = compare.has(product.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-[rgba(253,213,2,0.4)] hover:shadow-[var(--glow-gold)]">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#0a1020]">
        {product.img ? (
          <img
            src={product.img}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {product.slug}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.discount ? (
            <Badge variant="gold">-{product.discount}%</Badge>
          ) : null}
          {product.isNew ? (
            <Badge variant="secondary">{t("common.newArrivals")}</Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to={`/product/${product.slug}`}
          className="font-hud text-sm font-semibold leading-snug text-foreground transition-colors hover:text-[#fdd502]"
        >
          {name}
        </Link>
        {summary ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{summary}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="price-mono text-lg">{formatPrice(product.price)}</span>
            <span className="font-mono text-xs text-muted-foreground line-through">
              {product.oldPrice ? formatPrice(product.oldPrice) : ""}
            </span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">MAD</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                nameFr: product.nameFr,
                nameAr: product.nameAr,
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
                ? "border-[#fdd502] bg-[rgba(253,213,2,0.15)] text-[#fdd502]"
                : "border-border text-muted-foreground hover:border-[rgba(122,162,255,0.5)] hover:text-[#7aa2ff]",
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}