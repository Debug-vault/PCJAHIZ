import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";

const CITY_MARKERS = [
  { id: "casa", x: 128, y: 158 },
  { id: "rabat", x: 136, y: 140 },
  { id: "fes", x: 168, y: 128 },
  { id: "meknes", x: 160, y: 134 },
  { id: "tanger", x: 150, y: 92 },
  { id: "oujda", x: 214, y: 122 },
  { id: "marrakech", x: 118, y: 192 },
  { id: "agadir", x: 106, y: 226 },
  { id: "laayoune", x: 92, y: 262 },
];

const CITY_NAMES: Record<string, string> = {
  casa: "Casablanca",
  rabat: "Rabat",
  fes: "Fès",
  meknes: "Meknès",
  tanger: "Tanger",
  oujda: "Oujda",
  marrakech: "Marrakech",
  agadir: "Agadir",
  laayoune: "Laâyoune",
};

export function DropZoneMap({ compact = false }: { compact?: boolean }) {
  const { t, formatPrice } = useI18n();
  const { data: zones } = trpc.shop.shipping.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  return (
    <div className={cn("dropzone-map", compact && "compact")} role="img" aria-label="Morocco drop zones">
      <svg viewBox="0 0 300 300" aria-hidden="true" className="w-full">
        <path
          d="M108 74 L132 58 L164 62 L196 74 L224 92 L236 118 L238 148 L226 162 L212 176 L200 168 L186 180 L172 174 L160 182 L146 172 L132 176 L118 168 L108 172 L96 162 L88 168 L80 158 L78 142 L88 132 L82 118 L92 106 L84 94 L96 84 Z"
          fill="none"
          stroke="var(--ice)"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          strokeLinejoin="round"
        />
        <path
          d="M78 142 L96 162 L108 172 L118 168 L132 176 L146 172 L160 182 L172 174 L186 180 L200 168 L212 176"
          fill="none"
          stroke="var(--ice)"
          strokeWidth="0.8"
          strokeOpacity="0.35"
          strokeDasharray="3 4"
        />
        {CITY_MARKERS.map((c) => (
          <g key={c.id}>
            <circle className="dropzone-ring" cx={c.x} cy={c.y} r={5} />
            <circle className="dropzone-city" cx={c.x} cy={c.y} r={2.4}>
              <title>{CITY_NAMES[c.id]}</title>
            </circle>
          </g>
        ))}
      </svg>

      {!compact && zones && zones.length ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {zones.map((z) => (
            <span key={z.id} className="hud-chip">
              {z.name}
              {z.fee != null ? ` · ${formatPrice(z.fee)}` : ""}
            </span>
          ))}
        </div>
      ) : null}

      <p className="dropzone-caption" style={{ textAlign: "center" }}>
        <span className="hud-dot" aria-hidden="true" />
        {t("home.dropCaption")}
      </p>
    </div>
  );
}