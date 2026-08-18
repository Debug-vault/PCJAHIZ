import { Link } from "react-router";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";

export default function Brands() {
  const { t } = useI18n();
  const { data: brands, isLoading } = trpc.shop.brands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{t("brands.eyebrow")}</p>
      <h1 className="mt-2 font-hud text-3xl font-bold text-[var(--text-1)]">{t("brands.title")}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-2)]">{t("brands.subtitle")}</p>
      <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{(brands ?? []).length} {t("brands.count")}</p>

      {isLoading ? (
        <div className="py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>
      ) : brands && brands.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <Link
              key={b.slug}
              to={`/shop?brand=${b.slug}`}
              className="group flex h-32 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-6 transition-all hover:border-[rgba(253,213,2,0.4)] hover:shadow-[var(--glow-gold)]"
            >
              {b.logo ? (
                <img src={b.logo} alt={b.name} className="max-h-16 max-w-full object-contain opacity-80 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0" />
              ) : (
                <span className="font-hud text-lg font-bold uppercase tracking-widest text-[var(--text-1)] group-hover:text-[var(--gold)]">
                  {b.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-sm text-[var(--text-2)]">{t("brands.empty")}</p>
      )}
    </div>
  );
}