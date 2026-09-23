import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const QuickViewModal = memo(function QuickViewModal({ slug, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { t, formatPrice } = useI18n();
  const add = useCartStore((s) => s.add);
  const setCartOpen = useCartStore((s) => s.setOpen);

  const { data, isLoading } = trpc.shop.bySlug.useQuery(
    { slug },
    { enabled: open, staleTime: 60_000 },
  );

  const product = data?.product;
  const gallery =
    product?.images?.length
      ? product.images
      : product?.img
        ? [product.img]
        : [];

  const [activeImg, setActiveImg] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset active image when modal opens with a new product
  useEffect(() => {
    if (open) setActiveImg(0);
  }, [open, slug]);

  // Auto-advance carousel
  useEffect(() => {
    if (!open || paused || gallery.length <= 1) return;
    const id = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % gallery.length);
    }, 1500);
    return () => clearInterval(id);
  }, [open, paused, gallery.length]);

  const prev = useCallback(() => {
    setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const next = useCallback(() => {
    setActiveImg((i) => (i + 1) % gallery.length);
  }, [gallery.length]);

  const hasDiscount = product?.oldPrice != null && product!.oldPrice > product!.price;
  const savings = hasDiscount ? product!.oldPrice! - product!.price : 0;
  const specs = (product?.specs ?? []).slice(0, 5);

  const addToCart = useCallback(() => {
    if (!product) return;
    add({
      productId: product.id,
      slug: product.slug,
      nameFr: product.nameFr,
      price: product.price,
      oldPrice: product.oldPrice,
      img: product.img,
      stock: product.stock,
    });
    setCartOpen(true);
    onOpenChange(false);
  }, [product, add, setCartOpen, onOpenChange]);

  const buyNow = useCallback(() => {
    if (!product) return;
    add({
      productId: product.id,
      slug: product.slug,
      nameFr: product.nameFr,
      price: product.price,
      oldPrice: product.oldPrice,
      img: product.img,
      stock: product.stock,
    });
    onOpenChange(false);
    navigate("/checkout");
  }, [product, add, onOpenChange, navigate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 overflow-hidden">
        {/* Loading skeleton */}
        {isLoading || !product ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row">
            {/* ─── Image carousel (left) ─── */}
            <div
              className="relative flex w-full shrink-0 items-center justify-center bg-white sm:w-1/2"
              style={{ aspectRatio: "1/1" }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Main image with crossfade */}
              {gallery.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${product.nameFr} ${i + 1}`}
                  className={cn(
                    "absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500",
                    i === activeImg ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}

              {/* Nav arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {gallery.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === activeImg
                          ? "w-4 bg-[var(--gold)]"
                          : "w-1.5 bg-black/30",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ─── Product info (right) ─── */}
            <div className="flex flex-1 flex-col gap-3 p-5 sm:max-h-[500px] sm:overflow-y-auto">
              {/* Brand */}
              {product.brandSlug ? (
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-2)]">
                  {product.brandSlug}
                </span>
              ) : null}

              {/* Name */}
              <h3 className="font-hud text-base font-bold leading-snug text-[var(--text-1)]">
                {product.nameFr}
              </h3>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="price-mono text-xl font-bold text-[var(--text-1)]">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount ? (
                  <>
                    <span className="font-mono text-sm text-[var(--text-2)] line-through">
                      {formatPrice(product.oldPrice!)}
                    </span>
                    <Badge variant="discount">
                      -{product.discount ?? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)}%
                    </Badge>
                  </>
                ) : null}
              </div>

              {hasDiscount ? (
                <p className="text-xs font-medium text-emerald-600">
                  Vous économisez {formatPrice(savings)}
                </p>
              ) : null}

              {/* Specs */}
              {specs.length > 0 ? (
                <ul className="space-y-1">
                  {specs.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-2)]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>
                        <span className="font-medium text-[var(--text-1)]">{s.k}</span>: {s.v}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Stock */}
              <span
                className={cn(
                  "text-xs font-semibold",
                  product.stock > 0 ? "text-emerald-600" : "text-red-500",
                )}
              >
                {product.stock > 0
                  ? `${product.stock} disponible${product.stock > 1 ? "s" : ""}`
                  : "Rupture de stock"}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={product.stock <= 0}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] font-hud text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {product.stock > 0 ? t("common.addToCart") : t("common.outOfStock")}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={product.stock <= 0}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--gold)] bg-transparent font-hud text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-black disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {t("common.buyNow")}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
