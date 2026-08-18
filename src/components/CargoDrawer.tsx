import { Drawer } from "vaul";
import { Link } from "react-router";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function CargoDrawer() {
  const { open, setOpen, items, remove, setQty, subtotal, count } = useCartStore();
  const { t, locale, formatPrice } = useI18n();

  const freeThreshold = 1000;
  const progress = Math.min(100, (subtotal() / freeThreshold) * 100);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[#0b1226] outline-none" aria-label={t("cart.title")}>
          <Drawer.Title className="sr-only">{t("cart.title")}</Drawer.Title>
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="font-hud text-lg font-bold text-[var(--text-1)]">{t("cart.title")}</p>
              <p className="font-mono text-xs text-[var(--text-2)]">
                {count()} {count() > 1 ? t("cart.items") : t("cart.item")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-white/5"
              aria-label={t("common.cancel")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-[var(--line)] px-5 py-3">
            <p className="mb-2 font-mono text-xs text-[var(--text-2)]">
              {subtotal() >= freeThreshold
                ? t("common.freeShippingTresholdReached")
                : t("cart.freeShippingProgress", { price: formatPrice(freeThreshold) })}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ffe76d] to-[#fdd502] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="font-hud text-base font-semibold text-[var(--text-1)]">{t("cart.empty")}</p>
                <Link
                  to="/shop"
                  onClick={() => setOpen(false)}
                  className="btn-dock !py-2.5 text-sm"
                >
                  {t("cart.emptyCta")}
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3 rounded-xl border border-[var(--line)] bg-[rgba(6,11,24,0.5)] p-3">
                    {item.img ? (
                      <img src={item.img} alt={locale === "ar" ? item.nameAr : item.nameFr} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--glass)] font-mono text-[10px] uppercase text-[var(--text-2)]">
                        {item.slug}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-2 text-sm font-semibold text-[var(--text-1)] hover:text-[var(--gold)]"
                        >
                          {locale === "ar" ? item.nameAr : item.nameFr}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          className="shrink-0 text-[var(--text-2)] transition-colors hover:text-[var(--alert)]"
                          aria-label={t("cart.remove")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 rounded-full border border-[var(--line)] px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, item.qty - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                            aria-label={t("common.previous")}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs text-[var(--text-1)]">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, item.qty + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                            aria-label={t("common.next")}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="price-mono text-sm">{formatPrice(item.price * item.qty)} MAD</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 ? (
            <div className="border-t border-[var(--line)] px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-hud text-sm font-semibold text-[var(--text-2)]">{t("cart.subtotal")}</span>
                <span className="price-mono text-xl">{formatPrice(subtotal())} MAD</span>
              </div>
              <Link to="/checkout" onClick={() => setOpen(false)} className="btn-dock w-full text-sm">
                {t("cart.checkout")}
              </Link>
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}