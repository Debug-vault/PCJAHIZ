import { Link } from "react-router";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useCompare } from "@/components/compare-provider";
import { useCartStore } from "@/lib/cart";

export default function Compare() {
  const { t, locale, formatPrice } = useI18n();
  const { ids, toggle, clear } = useCompare();
  const add = useCartStore((s) => s.add);
  const setOpen = useCartStore((s) => s.setOpen);
  const { data: products, isLoading } = trpc.shop.byIds.useQuery({ ids }, { placeholderData: (prev) => prev });

  const specsOf = (p: NonNullable<typeof products>[number]) => {
    const raw = (p.specs ?? []) as { k: string; v: string }[] | null | undefined;
    return raw ?? [];
  };

  const allRows = new Map<string, Set<string>>();
  for (const p of products ?? []) {
    for (const { k, v } of specsOf(p)) {
      if (!allRows.has(k)) allRows.set(k, new Set());
      allRows.get(k)!.add(String(v).trim());
    }
  }
  const rows = [...allRows.entries()];

  if (ids.length === 0) {
    return (
      <div className="nebula-bg flex min-h-[55vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("product.compareTitle")}</h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--text-2)]">{t("product.compareEmpty")}</p>
        <Link to="/shop" className="btn-dock">{t("cart.emptyCta")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{t("product.compare")}</p>
          <h1 className="mt-1 font-hud text-3xl font-bold text-[var(--text-1)]">{t("product.compareTitle")}</h1>
          <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{t("product.compareSubtitle")}</p>
          {rows.length > 0 ? (
            <p className="mt-2 font-mono text-xs text-[var(--text-2)]">{t("product.compareDiffHint")}</p>
          ) : null}
        </div>
        <button type="button" onClick={clear} className="btn-ghost2 !py-2 text-sm">
          <X className="h-4 w-4" /> {t("product.compareClear")}
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>
      ) : products && products.length > 1 ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b border-[var(--line)] p-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--text-2)]" />
                {products.map((p) => (
                  <th key={p.id} className="border-b border-[var(--line)] p-3 text-center align-top">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        className="rounded-full p-1 text-[var(--text-2)] transition-colors hover:text-[var(--alert)]"
                        aria-label={t("product.compareUnlink")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {p.img ? (
                      <Link to={`/product/${p.slug}`}>
                        <img src={p.img} alt="" className="mx-auto aspect-square w-32 rounded-xl object-cover" />
                      </Link>
                    ) : (
                      <div className="mx-auto aspect-square w-32 rounded-xl bg-[#0a1020]" />
                    )}
                    <Link to={`/product/${p.slug}`} className="mt-2 block font-hud text-sm font-bold text-[var(--text-1)] hover:text-[var(--gold)]">
                      {locale === "ar" ? p.nameAr : p.nameFr}
                    </Link>
                    <p className="price-mono mt-1 text-lg">{formatPrice(p.price)} MAD</p>
                    {p.oldPrice ? <p className="price-mono text-xs text-[var(--text-2)] line-through">{formatPrice(p.oldPrice)} MAD</p> : null}
                    <button
                      type="button"
                      onClick={() => {
                        add({ productId: p.id, slug: p.slug, nameFr: p.nameFr, nameAr: p.nameAr, price: p.price, oldPrice: p.oldPrice, img: p.img, stock: p.stock });
                        setOpen(true);
                      }}
                      disabled={p.stock <= 0}
                      className="btn-dock mt-3 !px-4 !py-2 text-xs"
                    >
                      {p.stock > 0 ? t("common.addToCart") : t("common.outOfStock")}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[var(--line)] p-3 font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{t("product.brand")}</td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-[var(--line)] p-3 text-center text-[var(--text-1)]">{p.brandSlug ?? "—"}</td>
                ))}
              </tr>
              <tr>
                <td className="border-b border-[var(--line)] p-3 font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{t("product.category")}</td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-[var(--line)] p-3 text-center text-[var(--text-1)]">{p.categorySlug ?? "—"}</td>
                ))}
              </tr>
              <tr>
                <td className="border-b border-[var(--line)] p-3 font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{t("product.sku")}</td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-[var(--line)] p-3 text-center text-[var(--text-1)]">{p.slug}</td>
                ))}
              </tr>
              <tr>
                <td className="border-b border-[var(--line)] p-3 font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{t("common.inStock")}</td>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-[var(--line)] p-3 text-center text-[var(--text-1)]">{p.stock > 0 ? t("common.inStock") : t("common.outOfStock")}</td>
                ))}
              </tr>
              {rows.length > 0 ? (
                rows.map(([key, values]) => {
                  const common = values.size === 1 && products.length > 1;
                  return (
                    <tr key={key} className={common ? "bg-[rgba(122,162,255,0.06)]" : ""}>
                      <td className="border-b border-[var(--line)] p-3 font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{key}</td>
                      {products.map((p) => {
                        const entry = specsOf(p).find((s) => s.k === key);
                        return (
                          <td key={p.id} className="border-b border-[var(--line)] p-3 text-center text-[var(--text-1)]">
                            {entry ? entry.v : <span className="text-[var(--text-2)]">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={products.length + 1} className="p-3 text-center text-xs text-[var(--text-2)]">
                    {t("product.compareEmpty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : products && products.length === 1 ? (
        <div className="py-20 text-center text-sm text-[var(--text-2)]">{t("product.compareEmpty")}</div>
      ) : null}
    </div>
  );
}