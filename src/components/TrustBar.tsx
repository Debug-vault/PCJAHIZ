import { Truck, CreditCard, Store, ShieldCheck, Headphones, RotateCcw, Zap, Package, Clock, MapPin, Phone, Heart, Star, BadgeCheck, type LucideIcon } from "lucide-react";
import { useStoreSettings } from "@/lib/settings";
import type { CSSProperties } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  Truck, CreditCard, Store, ShieldCheck, Headphones, RotateCcw, Zap, Package, Clock, MapPin, Phone, Heart, Star, BadgeCheck,
};

export function TrustBar() {
  const { settings } = useStoreSettings();
  const trust = settings.homeTrust;
  const items = (trust.items ?? []).filter((it) => it.enabled);

  if (!trust.show) return null;

  const tagline = trust.tagline || "L'EXPERT";
  const taglineAccent = trust.taglineAccent || "TECH";
  const taglineBadge = trust.taglineBadge || "";
  const ts = trust.taglineStyle;
  const as = trust.accentStyle;
  const bs = trust.badgeStyle;
  const is = trust.itemStyle;
  const bar = trust.barStyle;

  const pillBase: CSSProperties = {
    display: "inline-block",
    fontWeight: ts.fontWeight || 700,
    fontStyle: ts.italic ? "italic" : undefined,
  };

  const taglineStyle: CSSProperties = ts.pill
    ? { ...pillBase, fontSize: ts.fontSize || 14, color: ts.color || "#000000", backgroundColor: ts.bg || "#fcd406", padding: `${ts.py ?? 4}px ${ts.px ?? 8}px`, borderRadius: ts.borderRadius != null ? `${ts.borderRadius}px` : "4px" }
    : { fontSize: ts.fontSize || 14, color: ts.color || undefined, fontWeight: ts.fontWeight || 700, fontStyle: ts.italic ? "italic" : undefined };

  const accentStyle: CSSProperties = as.pill
    ? { ...pillBase, fontSize: as.fontSize || 14, color: as.color || "#000000", backgroundColor: as.bg || "#fcd406", fontWeight: as.fontWeight || 900, padding: `${as.py ?? 4}px ${as.px ?? 8}px`, borderRadius: as.borderRadius != null ? `${as.borderRadius}px` : "4px" }
    : { fontSize: as.fontSize || 14, color: as.color || undefined, fontWeight: as.fontWeight || 900 };

  const badgeStyle: CSSProperties = {
    fontSize: bs.fontSize || 14,
    color: bs.color || undefined,
    fontWeight: bs.fontWeight || 400,
  };

  const barContainerStyle: CSSProperties = {
    backgroundColor: bar.bg || undefined,
    borderBottom: bar.border || undefined,
    borderRadius: bar.borderRadius ? `${bar.borderRadius}px` : undefined,
    padding: `${bar.paddingY ?? 6}px 0`,
  };

  return (
    <div style={barContainerStyle} className="border-b border-[var(--line)] bg-[var(--page)] text-[var(--text-2)]">
      <div className="mx-auto flex max-w-[var(--store-max-width)] items-center justify-between gap-6 px-4 sm:px-6">
        <p className="flex flex-wrap items-center gap-1.5" style={{ lineHeight: 1.4 }}>
          <span style={taglineStyle}>{tagline}</span>
          <span style={accentStyle}>{taglineAccent}</span>
          {taglineBadge ? <span style={badgeStyle}>{taglineBadge}</span> : null}
        </p>
        {items.length > 0 ? (
          <ul className="hidden items-center md:flex" style={{ gap: `${is.gap || 6}px` }}>
            {items.map((it) => {
              const Icon = ICON_MAP[it.icon] ?? Truck;
              const itemStyle: CSSProperties = {
                fontSize: is.fontSize || 12,
                color: is.color || undefined,
                fontWeight: is.fontWeight || 500,
              };
              const iconStyle: CSSProperties = {
                width: is.iconSize || 16,
                height: is.iconSize || 16,
                color: is.iconColor || undefined,
                flexShrink: 0,
              };
              return (
                <li key={it.label} className="flex items-center" style={{ gap: `${is.gap || 6}px` }}>
                  <Icon style={iconStyle} />
                  <span style={itemStyle}>{it.label}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
