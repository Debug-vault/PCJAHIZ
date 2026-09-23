import { useStoreSettings } from "@/lib/settings";

export function Marquee() {
  const { settings } = useStoreSettings();
  if (!settings.marqueeEnabled) return null;

  const items = settings.marqueeItems;

  return (
    <div
      className="relative overflow-hidden border-y py-2.5"
      style={{ backgroundColor: settings.marqueeBg, color: settings.marqueeText }}
    >
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center gap-10" aria-hidden={dup === 1}>
            {items.map((item, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-10 font-hud text-sm font-bold uppercase tracking-wide">
                {item}
                <span className="text-base leading-none">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}