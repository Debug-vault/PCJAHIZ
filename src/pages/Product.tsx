import { useState } from "react";
import { useParams, Link } from "react-router";
import { ShoppingCart, GitCompareArrows, Check, MessageCircle, Star, Truck, BadgeCheck, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import { useStoreSettings } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--line-strong)]")} />
      ))}
    </div>
  );
}

export default function Product() {
  const { slug = "" } = useParams();
  const { t, locale, formatPrice } = useI18n();
  const { settings } = useStoreSettings();
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: "", city: "" });

  const { data, isLoading } = trpc.shop.bySlug.useQuery({ slug }, { staleTime: 60 * 1000 });
  const addReview = trpc.shop.addReview.useMutation();
  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>;
  }

  if (!data?.product) {
    return (
      <section className="nebula-bg flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("notFound.title")}</h1>
        <Link to="/shop" className="btn-dock mt-6">{t("cart.emptyCta")}</Link>
      </section>
    );
  }

  const { product, similar, reviews } = data;
  const name = locale === "ar" ? product.nameAr : product.nameFr;
  const summary = locale === "ar" ? product.summaryAr : product.summaryFr;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionFr;
  const faq = (locale === "ar" ? product.faqAr : product.faqFr) as { q: string; a: string }[] | null | undefined;
  const seoTitle = locale === "ar" ? product.seoTitleAr : product.seoTitleFr;
  const gallery = product.images.length ? product.images : [product.img].filter(Boolean);
  const specs = (product.specs ?? []) as { k: string; v: string }[];
  const inCompare = compare.has(product.id);
  const avgRating = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const waMessage = t("product.orderByWhatsAppMsg", {
    store: settings.storeName,
    name,
    price: `${formatPrice(product.price)} MAD`,
  });

  const handleReviewSubmit = () => {
    if (!me) {
      toast(t("auth.loginTitle"));
      return;
    }
    addReview.mutate(
      { productId: product.id, rating: review.rating, comment: review.comment, city: review.city || undefined },
      {
        onSuccess: () => {
          toast.success(t("common.save"));
          setReview({ rating: 5, comment: "", city: "" });
        },
        onError: () => toast.error(t("errors.generic")),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0a1020]">
            {gallery[activeImg] ? (
              <img src={gallery[activeImg]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-sm uppercase tracking-widest text-[var(--text-2)]">
                {product.sku}
              </div>
            )}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.discount ? (
                <span className="rounded-full bg-[var(--gold)] px-3 py-1 font-hud text-xs font-bold text-black">-{product.discount}%</span>
              ) : null}
              {product.isNew ? <span className="rounded-full bg-[var(--ice-dim)] px-3 py-1 font-hud text-xs font-bold text-[var(--ice)]">{t("common.newArrivals")}</span> : null}
            </div>
          </div>
          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-all",
                    i === activeImg ? "border-[var(--gold)]" : "border-[var(--line)] opacity-60 hover:opacity-100",
                  )}
                  aria-label={t("product.galleryImage", { count: i + 1 })}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.brandSlug ? <span className="hud-chip">{product.brandSlug}</span> : null}
            {product.categorySlug ? <span className="hud-chip gold">{product.categorySlug}</span> : null}
            <span className="hud-chip">{product.sku}</span>
          </div>

          <h1 className="mt-4 font-hud text-2xl font-bold leading-tight text-[var(--text-1)] sm:text-3xl">{name}</h1>
          {seoTitle ? <p className="mt-1 text-xs text-[var(--text-2)]">{seoTitle}</p> : null}

          {reviews.length ? (
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={avgRating} />
              <span className="font-mono text-xs text-[var(--text-2)]">{t("product.reviewCount", { count: reviews.length })}</span>
            </div>
          ) : null}

          {summary ? <p className="mt-4 text-sm leading-relaxed text-[var(--text-2)]">{summary}</p> : null}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="price-mono text-4xl">{formatPrice(product.price)}</span>
            <span className="font-mono text-xs uppercase text-[var(--text-2)]">MAD</span>
            {product.oldPrice ? <span className="price-mono text-lg text-[var(--text-2)] line-through">{formatPrice(product.oldPrice)} MAD</span> : null}
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{t("product.priceInclTax")}</p>

          <div className="mt-4 flex items-center gap-2">
            {product.stock > 0 ? (
              <span className="hud-chip">
                <Check className="h-3 w-3" /> {t("common.inStock")}
              </span>
            ) : (
              <span className="hud-chip !text-[var(--alert)]">{t("common.outOfStock")}</span>
            )}
            <span className="hud-chip">{t("product.shippedWithin")}</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-[var(--line)] px-1.5 py-1">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5" aria-label={t("common.previous")}>
                −
              </button>
              <span className="w-8 text-center font-mono text-sm text-[var(--text-1)]">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5" aria-label={t("common.next")}>
                +
              </button>
            </div>

            <Button
              size="dock"
              disabled={product.stock <= 0}
              onClick={() => {
                add(
                  {
                    productId: product.id,
                    slug: product.slug,
                    nameFr: product.nameFr,
                    nameAr: product.nameAr,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    img: gallery[0] ?? null,
                    stock: product.stock,
                  },
                  qty,
                );
                setOpen(true);
              }}
            >
              <ShoppingCart className="h-4 w-4" /> {t("common.addToCart")}
            </Button>

            <button
              type="button"
              onClick={() => compare.toggle(product.id)}
              aria-pressed={inCompare}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 font-hud text-sm font-semibold transition-all",
                inCompare ? "border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--text-2)] hover:text-[var(--ice)]",
              )}
            >
              <GitCompareArrows className="h-4 w-4" /> {inCompare ? t("product.inCompare") : t("product.addToCompare")}
            </button>
          </div>

          <a
            href={buildWhatsAppUrl(settings.contactPhone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost2 mt-4 w-full sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" /> {t("product.orderByWhatsApp")}
          </a>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4 text-center">
              <Truck className="h-5 w-5 text-[var(--gold)]" />
              <p className="font-mono text-xs text-[var(--text-2)]">{t("trust.ship")}</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4 text-center">
              <BadgeCheck className="h-5 w-5 text-[var(--gold)]" />
              <p className="font-mono text-xs text-[var(--text-2)]">{t("trust.cod")}</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4 text-center">
              <RotateCcw className="h-5 w-5 text-[var(--gold)]" />
              <p className="font-mono text-xs text-[var(--text-2)]">{t("trust.exchange")}</p>
            </div>
          </div>
        </div>
      </div>

      {description ? (
        <section className="mt-16">
          <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("product.description")}</h2>
          <div className="prose prose-invert mt-4 max-w-none text-sm leading-relaxed text-[var(--text-2)]" dangerouslySetInnerHTML={{ __html: description }} />
        </section>
      ) : null}

      {specs.length ? (
        <section className="mt-16">
          <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("product.specs")}</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)]">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className={i % 2 ? "bg-[rgba(6,11,24,0.5)]" : "bg-transparent"}>
                    <td className="w-1/3 px-4 py-3 font-mono text-xs uppercase tracking-wide text-[var(--text-2)]">{s.k}</td>
                    <td className="px-4 py-3 text-[var(--text-1)]">{s.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {faq && faq.length ? (
        <section className="mt-16">
          <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("product.faq")}</h2>
          <div className="mt-4 flex flex-col gap-3">
            {faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-[var(--line)] bg-[var(--glass)] px-5 py-4">
                <summary className="cursor-pointer font-hud text-sm font-semibold text-[var(--text-1)]">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">
          {t("product.reviews")} <span className="text-[var(--text-2)]">({reviews.length})</span>
        </h2>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div>
            {reviews.length ? (
              <ul className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-hud text-sm font-bold text-[var(--text-1)]">{r.author}</p>
                        <p className="font-mono text-xs text-[var(--text-2)]">{r.city ? `${r.city} · ` : ""}{new Date(r.createdAt).toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-MA")}</p>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{r.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-[var(--line)] p-6 text-center">
                <p className="text-sm text-[var(--text-2)]">{t("product.noReviews")}</p>
                <p className="mt-1 text-xs text-[var(--text-2)]">{t("product.beFirst")}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-5">
            <h3 className="font-hud text-sm font-bold text-[var(--text-1)]">{t("product.writeReview")}</h3>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setReview((r) => ({ ...r, rating: i }))} aria-label={`${i}/5`}>
                  <Star className={cn("h-5 w-5 transition-colors", i <= review.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--line-strong)] hover:text-[var(--gold)]")} />
                </button>
              ))}
            </div>
            <input
              value={review.city}
              onChange={(e) => setReview((r) => ({ ...r, city: e.target.value }))}
              placeholder={t("checkout.city")}
              className="mt-3 h-10 w-full rounded-lg border border-[var(--line)] bg-[rgba(6,11,24,0.6)] px-3 font-mono text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-2)] focus:border-[rgba(253,213,2,0.4)]"
            />
            <Textarea
              value={review.comment}
              onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
              placeholder={t("checkout.notes")}
              className="mt-3 min-h-24 bg-[rgba(6,11,24,0.6)] text-[var(--text-1)]"
            />
            <Button
              variant="gold"
              size="dock"
              className="mt-3 w-full"
              disabled={review.comment.trim().length < 3 || addReview.isPending}
              onClick={handleReviewSubmit}
            >
              {t("product.writeReview")}
            </Button>
            {!me ? <p className="mt-2 text-center font-mono text-xs text-[var(--text-2)]">{t("auth.loginTitle")}</p> : null}
          </div>
        </div>
      </section>

      {similar.length ? (
        <section className="mt-16">
          <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("product.related")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}