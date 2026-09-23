import { useParams } from "react-router";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/product-card";

export default function Category() {
  const { slug = "" } = useParams();
  const { t } = useI18n();
  const { data: categories } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: products, isLoading } = trpc.shop.list.useQuery({ category: slug }, { placeholderData: (prev) => prev });

  const cat = categories?.find((c) => c.slug === slug);

  return (
    <div className="mx-auto max-w-[var(--store-max-width)] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{t("nav.categories")}</p>
      <h1 className="mt-2 font-hud text-3xl font-bold text-[var(--text-1)]">
        {cat ? cat.nameFr : slug}
      </h1>
      {cat?.description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-2)]">{cat.description}</p> : null}

      {isLoading ? (
        <div className="py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>
      ) : products && products.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
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
  );
}