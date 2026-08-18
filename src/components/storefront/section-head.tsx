import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SectionHead({
  eyebrow,
  title,
  viewAllTo,
}: {
  eyebrow?: string;
  title: string;
  viewAllTo?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{eyebrow}</p>
        ) : null}
        <h2 className="font-hud text-2xl font-bold tracking-tight text-[var(--text-1)] sm:text-3xl">{title}</h2>
      </div>
      {viewAllTo ? (
        <Link
          to={viewAllTo}
          className="group inline-flex items-center gap-1.5 font-hud text-sm font-semibold text-[var(--gold)]"
        >
          {t("common.viewAll")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}