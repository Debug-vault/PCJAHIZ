import { Link } from "react-router";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export default function Cart() {
  const { items, setQty, remove, subtotal, count } = useCartStore();
  const { t, locale, formatPrice } = useI18n();

  const freeThreshold = 1000;
  const progress = Math.min(100, (subtotal() / freeThreshold) * 100);

  if (items.length === 0) {
    return (
      <div className="nebula-bg flex min-h-[55vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("cart.empty")}</h1>
        <Link to="/shop" className="btn-dock">{t("cart.emptyCta")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-hud text-3xl font-bold text-[var(--text-1)]">{t("cart.title")}</h1>
      <p className="mt-1 font-mono text-sm text-[var(--text-2)]">
        {count()} {count() > 1 ? t("cart.items") : t("cart.item")}
      </p>

      <div className="mt-4">
        <p className="mb-2 font-mono text-xs text-[var(--text-2)]">
          {subtotal() >= freeThreshold
            ? t("common.freeShippingTresholdReached")
            : t("cart.freeShippingProgress", { price: formatPrice(freeThreshold) })}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#ffe76d] to-[#fdd502] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-4">
              {item.img ? (
                <img src={item.img} alt={locale === "ar" ? item.nameAr : item.nameFr} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#0a1020] font-mono text-[10px] uppercase text-[var(--text-2)]">
                  {item.slug}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/product/${item.slug}`} className="line-clamp-2 font-hud text-sm font-bold text-[var(--text-1)] hover:text-[var(--gold)]">
                  {locale === "ar" ? item.nameAr : item.nameFr}
                </Link>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-1 rounded-full border border-[var(--line)] px-1.5 py-1">
                    <button type="button" onClick={() => setQty(item.productId, item.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5" aria-label={t("common.previous")}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-sm text-[var(--text-1)]">{item.qty}</span>
                    <button type="button" onClick={() => setQty(item.productId, item.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5" aria-label={t("common.next")}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="price-mono text-lg">{formatPrice(item.price * item.qty)} MAD</span>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-2)] transition-colors hover:text-[var(--alert)]"
                  >
                    <Trash2 className="h-4 w-4" /> {t("cart.remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-6 lg:sticky lg:top-[calc(var(--nav-h)+1rem)]">
          <h2 className="font-hud text-lg font-bold text-[var(--text-1)]">{t("cart.summary")}</h2>
          <dl className="mt-5 flex flex-col gap-3 font-mono text-sm">
            <div className="flex justify-between text-[var(--text-2)]">
              <dt>{t("cart.subtotal")}</dt>
              <dd className="text-[var(--text-1)]">{formatPrice(subtotal())} MAD</dd>
            </div>
            <div className="flex justify-between text-[var(--text-2)]">
              <dt>{t("cart.shipping")}</dt>
              <dd>{t("checkout.shippingCalculated")}</dd>
            </div>
          </dl>
          <div className="my-5 border-t border-[var(--line)]" />
          <div className="flex items-center justify-between">
            <span className="font-hud text-sm font-bold text-[var(--text-1)]">{t("cart.total")}</span>
            <span className="price-mono text-2xl">{formatPrice(subtotal())} MAD</span>
          </div>
          <Link to="/checkout" className="btn-dock mt-6 w-full">
            {t("cart.checkout")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/shop" className="mt-3 block text-center font-hud text-xs font-semibold text-[var(--text-2)] hover:text-[var(--gold)]">
            {t("cart.continueShopping")}
          </Link>
        </aside>
      </div>
    </div>
  );
}