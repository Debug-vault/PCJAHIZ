import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { HeaderConfig, HeaderItem, HeaderSliderItem, HeaderSliderDirection } from "@/lib/settings";
import { HEADER_ICON_OPTIONS, HeaderIcon } from "@/lib/header-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
      <h3 className="font-hud text-base font-bold text-[var(--text-1)]">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  label,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" min={min} value={value} onChange={(e) => onChange(Number(e.target.value) || min)} />
    </div>
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
        <span className="font-mono text-xs text-[var(--text-2)]">{value}</span>
      </div>
    </div>
  );
}

function ItemsEditor({ items, onChange }: { items: HeaderItem[]; onChange: (items: HeaderItem[]) => void }) {
  const upd = (i: number, patch: Partial<HeaderItem>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...items, { id: `it-${Date.now()}-${items.length}`, text: "", link: "", icon: null, enabled: true, type: "link", children: [] }]);

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={it.enabled} onChange={(e) => upd(i, { enabled: e.target.checked })} title="Active" />
            <Input value={it.text} onChange={(e) => upd(i, { text: e.target.value })} placeholder="Text" className="min-w-0 flex-1" />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded-md border border-[var(--line)] p-1.5 text-[var(--text-2)] hover:bg-[var(--page-soft)] disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="rounded-md border border-[var(--line)] p-1.5 text-[var(--text-2)] hover:bg-[var(--page-soft)] disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-md border border-[var(--line)] p-1.5 text-red-400 hover:bg-red-400/10"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={it.type ?? "link"}
              onChange={(e) => upd(i, { type: e.target.value as HeaderItem["type"] })}
              className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
            >
              <option value="link">Link</option>
              <option value="button">Button</option>
              <option value="menu">Menu (list)</option>
              <option value="categories">Categories (auto)</option>
            </select>
            <select
              value={it.icon ?? ""}
              onChange={(e) => upd(i, { icon: e.target.value || null })}
              className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
            >
              <option value="">(no icon)</option>
              {HEADER_ICON_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text-2)]">
              <HeaderIcon name={it.icon} className="h-4 w-4" />
            </span>
            {it.type === "categories" ? (
              <span className="rounded-md bg-[var(--page-soft)] px-2 py-1.5 text-xs text-[var(--text-2)]">
                Automatically displays all categories + subcategories.
              </span>
            ) : (
              <Input
                value={it.link}
                onChange={(e) => upd(i, { link: e.target.value })}
                placeholder="Link (e.g., /shop, /contact, tel:…)"
                className="min-w-0 flex-1"
              />
            )}
          </div>
          {it.type === "menu" ? (
            <div className="space-y-1.5 rounded-md bg-[var(--page-soft)] p-2.5">
              <p className="px-1 font-hud text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
                Menu items
              </p>
              <ItemsEditor
                items={it.children ?? []}
                onChange={(children) => upd(i, { children })}
              />
            </div>
          ) : null}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Add item
      </Button>
    </div>
  );
}

function SliderItemsEditor({ items, onChange }: { items: HeaderSliderItem[]; onChange: (items: HeaderSliderItem[]) => void }) {
  const upd = (i: number, patch: Partial<HeaderSliderItem>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  const add = () => onChange([...items, { id: `sl-${Date.now()}-${items.length}`, text: "", link: "", icon: null, image: null, textColor: null, textSize: null, iconColor: null, iconGlow: false, iconShadow: false }]);

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={it.text} onChange={(e) => upd(i, { text: e.target.value })} placeholder="Text or description" className="min-w-0 flex-1" />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md border border-[var(--line)] p-1.5 text-[var(--text-2)] hover:bg-[var(--page-soft)] disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-md border border-[var(--line)] p-1.5 text-[var(--text-2)] hover:bg-[var(--page-soft)] disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => remove(i)} className="rounded-md border border-[var(--line)] p-1.5 text-red-400 hover:bg-red-400/10" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={it.icon ?? ""} onChange={(e) => upd(i, { icon: e.target.value || null })} className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm">
              <option value="">(no icon)</option>
              {HEADER_ICON_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text-2)]"><HeaderIcon name={it.icon} className="h-4 w-4" /></span>
            <Input value={it.link} onChange={(e) => upd(i, { link: e.target.value })} placeholder="Link (optional)" className="min-w-0 flex-1" />
            <div className="flex items-center gap-1.5">
              <label className="cursor-pointer rounded-md border border-dashed border-[var(--line-strong)] px-2.5 py-1.5 text-xs text-[var(--text-2)] hover:border-[var(--gold-hot)] hover:text-[var(--gold)]" title="Upload an image">
                Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => upd(i, { image: String(r.result ?? "") });
                      r.readAsDataURL(f);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <Input value={it.image ?? ""} onChange={(e) => upd(i, { image: e.target.value || null })} placeholder="Image URL" className="min-w-0 flex-1" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--text-2)]">Text color</span>
              <input type="color" value={it.textColor ?? "#17181c"} onChange={(e) => upd(i, { textColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
            </div>
            <Input type="number" min={10} value={it.textSize ?? ""} onChange={(e) => upd(i, { textSize: e.target.value ? Number(e.target.value) : null })} placeholder="Size (px)" className="w-28" />
            {it.image ? <img src={it.image} alt="" className="h-9 w-9 rounded-md object-cover" /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--text-2)]">Icon color</span>
              <input type="color" value={it.iconColor ?? "#fcd406"} onChange={(e) => upd(i, { iconColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
            </div>
            <Toggle checked={it.iconGlow} onChange={(v) => upd(i, { iconGlow: v })} label="Glow" />
            <Toggle checked={it.iconShadow} onChange={(v) => upd(i, { iconShadow: v })} label="Shadow" />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /> Add item</Button>
    </div>
  );
}

export function HeaderEditor({
  value,
  onChange,
  section,
}: {
  value: HeaderConfig;
  onChange: (next: HeaderConfig) => void;
  section?: "topBar" | "utilityBar" | "mainBar" | "slider" | "bottomNav" | "mobileDrawer";
}) {
  const upd = (sec: keyof HeaderConfig, patch: Record<string, unknown>) =>
    onChange({ ...value, [sec]: { ...(value[sec] as object), ...patch } } as HeaderConfig);
  const updItems = (sec: "topBar" | "utilityBar" | "bottomNav", items: HeaderItem[]) => upd(sec, { items });
  const updMain = (patch: Partial<HeaderConfig["mainBar"]>) => onChange({ ...value, mainBar: { ...value.mainBar, ...patch } });
  const show = (s: typeof section) => !section || section === s;

  return (
    <div className="space-y-4">
      {show("topBar") && (
      <Card title="Top Bar">
        <Toggle checked={value.topBar.enabled} onChange={(v) => upd("topBar", { enabled: v })} label="Top Bar enabled" />
        {value.topBar.enabled ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput value={value.topBar.bg} onChange={(v) => upd("topBar", { bg: v })} label="Background color" />
              <ColorInput value={value.topBar.textColor} onChange={(v) => upd("topBar", { textColor: v })} label="Text color" />
              <NumberInput value={value.topBar.interval} onChange={(v) => upd("topBar", { interval: v })} label="Rotation speed (ms)" min={2000} />
              <NumberInput value={value.topBar.maxWidth} onChange={(v) => upd("topBar", { maxWidth: v })} label="Max width (px, 0 = full)" min={0} step={50} />
            </div>
            <ItemsEditor items={value.topBar.items} onChange={(items) => updItems("topBar", items)} />
            <p className="text-xs text-[var(--text-2)]">Multiple messages = auto rotation every {Math.round(Math.max(value.topBar.interval, 2000) / 1000)}s.</p>
          </>
        ) : null}
      </Card>
      )}

      {show("utilityBar") && (
      <Card title="Utility Bar (line above logo)">
        <Toggle checked={value.utilityBar.enabled} onChange={(v) => upd("utilityBar", { enabled: v })} label="Utility Bar enabled" />
        {value.utilityBar.enabled ? (
          <>
            <Toggle checked={value.utilityBar.showTaxToggle} onChange={(v) => upd("utilityBar", { showTaxToggle: v })} label="HT/TTC tax toggle" />
            <ItemsEditor items={value.utilityBar.items} onChange={(items) => updItems("utilityBar", items)} />
          </>
        ) : null}
      </Card>
      )}

      {show("mainBar") && (
      <Card title="Main Bar (logo + search)">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput value={value.mainBar.height} onChange={(v) => updMain({ height: v })} label="Height (px)" min={48} />
          <ColorInput value={value.mainBar.bg} onChange={(v) => updMain({ bg: v })} label="Background color" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput value={value.mainBar.logo.height} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, height: v } })} label="Logo height (px)" min={16} />
          <NumberInput value={value.mainBar.logo.width} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, width: v } })} label="Logo width (px, 0 = auto)" min={0} />
          <div className="flex items-end pb-1"><Toggle checked={value.mainBar.logo.showName} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, showName: v } })} label="Show store name" /></div>
        </div>
        <div className="rounded-md bg-[var(--page-soft)] p-3">
          <Toggle checked={value.mainBar.logo.hover.enabled} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, enabled: v } } })} label="Hover effect: logo slides and Home icon appears" />
          {value.mainBar.logo.hover.enabled ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-2)]">Slide direction</span>
                <select
                  value={value.mainBar.logo.hover.direction}
                  onChange={(e) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, direction: e.target.value as "top" | "bottom" | "left" | "right" } } })}
                  className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
                >
                  <option value="top">Up</option>
                  <option value="bottom">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-2)]">Replacement icon</span>
                <select
                  value={value.mainBar.logo.hover.icon ?? "home"}
                  onChange={(e) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, icon: e.target.value || null } } })}
                  className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
                >
                  {HEADER_ICON_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <Input
                  type="number"
                  min={12}
                  value={value.mainBar.logo.hover.iconSize ?? ""}
                  onChange={(e) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, iconSize: e.target.value ? Number(e.target.value) : null } } })}
                  placeholder="Size (px)"
                  className="w-28"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-2)]">Icon color</span>
                  <input
                    type="color"
                    value={value.mainBar.logo.hover.iconColor ?? "#fcd406"}
                    onChange={(e) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, iconColor: e.target.value } } })}
                    className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1"
                  />
                </div>
                <Toggle checked={value.mainBar.logo.hover.iconGlow} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, iconGlow: v } } })} label="Glow" />
                <Toggle checked={value.mainBar.logo.hover.iconShadow} onChange={(v) => updMain({ logo: { ...value.mainBar.logo, hover: { ...value.mainBar.logo.hover, iconShadow: v } } })} label="Shadow" />
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Toggle checked={value.mainBar.sticky} onChange={(v) => updMain({ sticky: v })} label="Sticky bar — hides on scroll down, returns on scroll up" />
          <div className="flex items-end pb-1">
            <Toggle checked={value.mainBar.search.enabled} onChange={(v) => updMain({ search: { ...value.mainBar.search, enabled: v } })} label="Search enabled" />
          </div>
        </div>
        {value.mainBar.search.enabled ? (
          <div className="grid grid-cols-2 gap-3">
            <NumberInput value={value.mainBar.search.maxWidth} onChange={(v) => updMain({ search: { ...value.mainBar.search, maxWidth: v } })} label="Search max width (px)" min={200} />
            <div className="space-y-1.5">
              <Label>Search text</Label>
              <Input value={value.mainBar.search.placeholder} onChange={(e) => updMain({ search: { ...value.mainBar.search, placeholder: e.target.value } })} />
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={value.mainBar.showCart} onChange={(v) => updMain({ showCart: v })} label="Cart" />
          <Toggle checked={value.mainBar.showAccount} onChange={(v) => updMain({ showAccount: v })} label="Account" />
          <Toggle checked={value.mainBar.showCompare} onChange={(v) => updMain({ showCompare: v })} label="Compare" />
        </div>
      </Card>
      )}

      {show("slider") && (
      <Card title="Slider Bar (near logo)">
        <Toggle checked={value.mainBar.slider.enabled} onChange={(v) => updMain({ slider: { ...value.mainBar.slider, enabled: v } })} label="Slider Bar enabled" />
        {value.mainBar.slider.enabled ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput value={value.mainBar.slider.interval} onChange={(v) => updMain({ slider: { ...value.mainBar.slider, interval: v } })} label="Interval (ms)" min={2000} />
              <NumberInput value={value.mainBar.slider.maxWidth} onChange={(v) => updMain({ slider: { ...value.mainBar.slider, maxWidth: v } })} label="Max width (px)" min={160} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-2)]">Scroll direction</span>
              <select
                value={value.mainBar.slider.direction}
                onChange={(e) => updMain({ slider: { ...value.mainBar.slider, direction: e.target.value as HeaderSliderDirection } })}
                className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
              >
                <option value="rtl">Right to left</option>
                <option value="ltr">Left to right</option>
                <option value="btt">Bottom to top</option>
                <option value="ttb">Top to bottom</option>
              </select>
            </div>
            <p className="text-xs text-[var(--text-2)]">Slides: with image (banner), or text + animated icon. Multiple = auto rotation.</p>
            <SliderItemsEditor items={value.mainBar.slider.items} onChange={(items) => updMain({ slider: { ...value.mainBar.slider, items } })} />
          </>
        ) : null}
      </Card>
      )}

      {show("bottomNav") && (
      <Card title="Bottom Nav (navigation)">
        <Toggle checked={value.bottomNav.enabled} onChange={(v) => upd("bottomNav", { enabled: v })} label="Bottom Nav enabled" />
        {value.bottomNav.enabled ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput value={value.bottomNav.bg} onChange={(v) => upd("bottomNav", { bg: v })} label="Background color" />
              <ColorInput value={value.bottomNav.textColor} onChange={(v) => upd("bottomNav", { textColor: v })} label="Text color" />
            </div>
            <div className="space-y-1.5">
              <Label>Category display</Label>
                <select
                  value={value.bottomNav.display}
                  onChange={(e) => upd("bottomNav", { display: e.target.value as "mega" | "inline" | "drawer" })}
                  className="rounded-md border border-[var(--line)] bg-[var(--page)] px-2 py-1.5 text-sm"
                >
                  <option value="drawer">Vertical hamburger menu</option>
                  <option value="inline">Inline list (categories shown)</option>
                  <option value="mega">Mega menu (single trigger)</option>
                </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <Toggle checked={value.bottomNav.showImages} onChange={(v) => upd("bottomNav", { showImages: v })} label="Category icons" />
              <Toggle checked={value.bottomNav.showCounts} onChange={(v) => upd("bottomNav", { showCounts: v })} label="Product count" />
              <Toggle checked={value.bottomNav.indicator} onChange={(v) => upd("bottomNav", { indicator: v })} label="Active / hover underline" />
            </div>
            <ItemsEditor items={value.bottomNav.items} onChange={(items) => updItems("bottomNav", items)} />
          </>
        ) : null}
      </Card>
      )}

      {show("mobileDrawer") && (
      <Card title="Mobile Drawer">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={value.mobileDrawer.showSearch} onChange={(v) => upd("mobileDrawer", { showSearch: v })} label="Search" />
          <Toggle checked={value.mobileDrawer.showPhone} onChange={(v) => upd("mobileDrawer", { showPhone: v })} label="Phone" />
          <Toggle checked={value.mobileDrawer.showAccount} onChange={(v) => upd("mobileDrawer", { showAccount: v })} label="Account" />
          <Toggle checked={value.mobileDrawer.showCompare} onChange={(v) => upd("mobileDrawer", { showCompare: v })} label="Compare" />
          <Toggle checked={value.mobileDrawer.showCart} onChange={(v) => upd("mobileDrawer", { showCart: v })} label="Cart" />
        </div>
      </Card>
      )}
    </div>
  );
}