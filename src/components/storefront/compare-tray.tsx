import { Link } from "react-router";
import { X, GitCompareArrows } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useCompare } from "@/components/compare-provider";
import { COMPARE_MAX } from "@/lib/compare";

export function CompareTray() {
  const { t, locale } = useI18n();
  const { ids, clear } = useCompare();
  const { data: products } = trpc.shop.byIds.useQuery({ ids }, { enabled: ids.length > 0, placeholderData: (prev) => prev });

  if (ids.length === 0) return null;

  return (
    <div className="compare-tray" role="region" aria-label={t("product.compare")}>
      <div className="compare-tray-info">
        <span className="compare-tray-count">
          <GitCompareArrows size={15} />
          {ids.length}/{COMPARE_MAX}
        </span>
        <button type="button" className="compare-clear" onClick={clear} aria-label={t("product.compareClear")}>
          <X size={14} />
        </button>
      </div>
      <div className="compare-tray-items">
        {(products ?? []).map((p) => (
          <span key={p.id} className="compare-chip">
            {p.img ? <img src={p.img} alt="" className="compare-chip-img" /> : null}
            {locale === "ar" ? p.nameAr : p.nameFr}
          </span>
        ))}
      </div>
      <Link to="/compare" className="btn-dock !px-4 !py-2 text-xs">
        {t("product.compare")}
      </Link>
    </div>
  );
}