import { Link } from "react-router";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <section className="nebula-bg flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--text-2)]">404</p>
      <h1 className="mt-3 font-hud text-3xl font-bold text-[var(--text-1)] sm:text-4xl">{t("notFound.title")}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-2)]">{t("notFound.text")}</p>
      <Link to="/" className="btn-dock mt-8">
        {t("notFound.cta")}
      </Link>
    </section>
  );
}