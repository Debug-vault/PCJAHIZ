import { Link } from "react-router";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";
import { trpc } from "@/providers/trpc";

export function Footer() {
  const { t, locale } = useI18n();
  const { settings } = useStoreSettings();
  const { data: categories } = trpc.shop.categories.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: brands } = trpc.shop.brands.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  return (
    <footer className="border-t border-[var(--line)] bg-[#060b18]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            {settings.storeLogo ? (
              <img src={settings.storeLogo} alt={settings.storeName} className="h-9 w-auto" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-dim)] font-hud text-lg font-bold text-[var(--gold)] ring-1 ring-[rgba(253,213,2,0.35)]">
                J
              </span>
            )}
            <span className="font-hud text-lg font-bold text-[var(--text-1)]">{settings.storeName}</span>
          </div>
          <p className="mb-4 max-w-xs text-sm leading-relaxed text-[var(--text-2)]">{t("footer.tagline")}</p>
          <p className="font-mono text-xs text-[var(--text-2)]">{settings.contactEmail}</p>
          <p className="font-mono text-xs text-[var(--text-2)]">{settings.contactPhone}</p>
        </div>

        <div>
          <h3 className="mb-3 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">
            {t("footer.categories")}
          </h3>
          <ul className="flex flex-col gap-2">
            {(categories ?? []).slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/category/${c.slug}`}
                  className="text-sm text-[var(--text-2)] transition-colors hover:text-[var(--gold)]"
                >
                  {locale === "ar" ? c.nameAr : c.nameFr}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">
            {t("footer.brands")}
          </h3>
          <ul className="flex flex-col gap-2">
            {(brands ?? []).slice(0, 6).map((b) => (
              <li key={b.slug}>
                <Link to="/shop" className="text-sm text-[var(--text-2)] transition-colors hover:text-[var(--gold)]">
                  {b.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/brands" className="text-sm text-[var(--gold)] hover:underline">
                {t("footer.allBrands")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">
            {t("footer.contact")}
          </h3>
          <div className="flex flex-col gap-2 text-sm text-[var(--text-2)]">
            <Link to="/shop" className="transition-colors hover:text-[var(--gold)]">{t("nav.products")}</Link>
            <Link to="/compare" className="transition-colors hover:text-[var(--gold)]">{t("product.compare")}</Link>
            <Link to="/account" className="transition-colors hover:text-[var(--gold)]">{t("nav.account")}</Link>
          </div>
          <div className="mt-4">
            <h4 className="mb-2 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
              {t("footer.paymentMethods")}
            </h4>
            <div className="flex gap-2">
              <span className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-[10px] uppercase text-[var(--text-2)]">
                COD
              </span>
              <span className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-[10px] uppercase text-[var(--text-2)]">
                CMI
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--line)] py-5 text-center font-mono text-xs text-[var(--text-2)]">
        © {new Date().getFullYear()} {settings.storeName}. {t("footer.rights")}
      </div>
    </footer>
  );
}