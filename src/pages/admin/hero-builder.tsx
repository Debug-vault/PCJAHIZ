import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowUp, ArrowDown, GripVertical, ImagePlus, LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { uploadImage, migrateSlideStyle, normalizeDevice, parseJsonField, migrateBgColor } from "@/lib/hero";
import type { HeroSlide, HeroProduct, HeroElementStyle, HeroGlobalStyle, HeroBackground, SlideStyle, PerDevice, DeviceImageStyle, DeviceContentStyle } from "@/lib/hero";
import Hero, { type HeroSettings } from "@/components/storefront/Hero";
import BackgroundMaker from "@/components/admin/BackgroundMaker";
import { PreviewFrame } from "@/components/admin/PreviewFrame";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

type Device = "mobile" | "tablet" | "desktop";
const DEVICE_LABEL: Record<Device, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

interface SlideDraft {
  id: string | null;
  slug: string;
  type?: string | null;
  image: string;
  imageData?: string;
  brandLabel: string;
  brandBadge: string;
  products: HeroProduct[];
  bgConfig: HeroBackground | null;
  eyebrow?: string;
  heading: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  price?: number | null;
  oldPrice?: number | null;
  badge?: string;
  layout: "split" | "overlay" | "product-grid";
  bgColor?: string;
  active: boolean;
  styles?: SlideStyle | null;
}

const EMPTY: SlideDraft = {
  id: null, slug: "", image: "", brandLabel: "", brandBadge: "", products: [], bgConfig: null, eyebrow: "", heading: "New promo",
  description: "", ctaLabel: "Discover", ctaUrl: "/shop", price: null, oldPrice: null, badge: "",
  layout: "split", bgColor: "#fcd406", active: true, styles: {},
};

const ELEMENT_KEYS = ["eyebrow", "heading", "description", "price", "cta", "badge"] as const;
type ElKey = (typeof ELEMENT_KEYS)[number];
const EL_LABEL: Record<ElKey, string> = {
  eyebrow: "Eyebrow (pill)", heading: "Heading", description: "Description", price: "Price", cta: "CTA Button", badge: "Badge",
};
const CHIP_KEYS: ElKey[] = ["eyebrow", "cta", "badge"];

function parseProducts(raw: unknown): HeroProduct[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return [];
}

function merge<T extends object>(a: T | undefined, b: Partial<T>): T {
  return { ...(a ?? ({} as T)), ...b };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold)]";

function NumberField({ label, value, onChange, min, max }: { label: string; value?: number | null; onChange: (v: number | null) => void; min?: number; max?: number }) {
  return (
    <Field label={label}>
      <input type="number" className={inputCls} value={value ?? ""} min={min} max={max} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
    </Field>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" className="h-9 w-12 rounded border border-[var(--line)] bg-transparent" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#rrggbb" />
      </div>
    </Field>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  );
}

function ElementStyleEditor({ label, value, chip, device, onChange }: { label: string; value?: HeroElementStyle; chip?: boolean; device: Device; onChange: (patch: Partial<HeroElementStyle>) => void }) {
  const v = value ?? {};
  return (
    <details className="rounded-lg border border-[var(--line)] bg-[var(--page-soft)] px-3 py-2">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[var(--text-1)]">
        <span>{label}</span>
        <span className="rounded bg-[var(--gold-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-1)]">{DEVICE_LABEL[device]}</span>
      </summary>
      <p className="mt-2 text-[11px] text-[var(--text-2)]">Editing {DEVICE_LABEL[device]} — inherits global style if empty.</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="col-span-2 flex items-center justify-between text-sm">
          <span>Visible</span>
          <input type="checkbox" checked={v.show !== false} onChange={(e) => onChange({ show: e.target.checked })} />
        </label>
        <NumberField label="Size (px)" value={v.fontSize ?? null} onChange={(n) => onChange({ fontSize: n ?? undefined })} />
        <NumberField label="Weight" value={v.fontWeight ?? null} onChange={(n) => onChange({ fontWeight: n ?? undefined })} />
        <SelectField label="Alignment" value={v.align ?? "left"} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} onChange={(a) => onChange({ align: a })} />
        <NumberField label="Bottom spacing (px)" value={v.spacing ?? null} onChange={(n) => onChange({ spacing: n ?? undefined })} />
        <NumberField label="Border radius (px)" value={v.radius ?? null} onChange={(n) => onChange({ radius: n ?? undefined })} />
        <NumberField label="Line height" value={v.lineHeight ?? null} onChange={(n) => onChange({ lineHeight: n ?? undefined })} />
        <NumberField label="Letter spacing (px)" value={v.letterSpacing ?? null} onChange={(n) => onChange({ letterSpacing: n ?? undefined })} />
        <NumberField label="Max width (px)" value={v.maxWidth ?? null} onChange={(n) => onChange({ maxWidth: n ?? undefined })} />
        <SelectField label="Text case" value={v.textTransform ?? "none"} options={[{ value: "none", label: "None" }, { value: "uppercase", label: "UPPERCASE" }, { value: "capitalize", label: "Capitalize" }, { value: "lowercase", label: "lowercase" }]} onChange={(tt) => onChange({ textTransform: tt })} />
        {chip ? (
          <>
            <ColorField label="Background" value={v.bg} onChange={(c) => onChange({ bg: c })} />
            <ColorField label="Text" value={v.textColor} onChange={(c) => onChange({ textColor: c })} />
          </>
        ) : (
          <ColorField label="Color" value={v.color} onChange={(c) => onChange({ color: c })} />
        )}
      </div>
    </details>
  );
}

export default function HeroBuilder() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const updateCamp = trpc.admin.campaigns.update.useMutation();
  const createCamp = trpc.admin.campaigns.create.useMutation();
  const updateSettings = trpc.admin.settings.update.useMutation();
  const [drafts, setDrafts] = useState<SlideDraft[]>([]);
  const [settings, setSettings] = useState<HeroSettings>({
    align: "left", showCtas: true, minHeight: 0, showStats: true, autoRotate: true, interval: 6000,
    transition: "slide", parallax: true, hover: true, stats: [], styles: {},
  });
  const [selected, setSelected] = useState<string>("");
  const [device, setDevice] = useState<Device>("desktop");
  const [tab, setTab] = useState<"slides" | "global">("slides");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [list, s] = await Promise.all([
          utils.admin.campaigns.list.fetch(),
          utils.admin.settings.get.fetch().catch(() => []),
        ]);
        const mapped: SlideDraft[] = (list as unknown as HeroSlide[])
          .filter((c) => c.type === "hero" || c.type == null)
          .map((c) => ({
            id: (c as any).id ?? null,
            slug: c.slug,
            type: c.type ?? "hero",
            image: c.image ?? "",
            brandLabel: (c as any).brandLabel ?? "",
            brandBadge: (c as any).brandBadge ?? "",
            products: parseProducts((c as any).products),
            bgConfig: parseJsonField((c as any).bgConfig, null) ?? migrateBgColor((c as any).bgColor),
            eyebrow: c.eyebrow ?? "",
            heading: c.heading ?? "",
            description: c.description ?? "",
            ctaLabel: c.ctaLabel ?? "",
            ctaUrl: c.ctaUrl ?? "",
            price: c.price ?? null,
            oldPrice: c.oldPrice ?? null,
            badge: c.badge ?? "",
            layout: (c.layout as any) ?? "split",
            bgColor: (c as any).bgColor ?? "#fcd406",
            active: c.active !== false,
            styles: migrateSlideStyle((c as any).styles),
          }));
        const sorted = [...mapped].sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
        setDrafts(sorted);
        if (sorted[0]) setSelected(sorted[0].slug);
        const rows = (s as { key: string; value: unknown }[]) ?? [];
        const row = rows.find((r) => r.key === "homeHero");
        const st = row ? ((row.value as any)?.value ?? (row.value as any)) : null;
        if (st) {
          setSettings({
            align: st.align ?? "left", showCtas: st.showCtas ?? true, minHeight: st.minHeight ?? 0,
            showStats: st.showStats ?? true, autoRotate: st.autoRotate ?? true, interval: st.interval ?? 6000,
            transition: st.transition ?? "slide", parallax: st.parallax ?? true, hover: st.hover ?? true,
            stats: st.stats ?? [], styles: st.styles ?? {},
          });
        }
      } catch (e) {
        toast.error("Loading error: " + String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [utils]);

  const updateSlide = useCallback((slug: string, patch: Partial<SlideDraft>) => {
    setDrafts((d) => d.map((s) => (s.slug === slug ? { ...s, ...patch } : s)));
  }, []);

  // Merge a patch into a specific device of a per-device style key.
  const patchDevice = useCallback(<T,>(slug: string, which: keyof SlideStyle, device: Device, patch: Partial<T>) => {
    setDrafts((d) => d.map((s) => {
      if (s.slug !== slug) return s;
      const base = (s.styles ?? {}) as SlideStyle;
      const pd = normalizeDevice((base as any)[which] as PerDevice<T> | undefined) as Record<Device, Partial<T> | undefined>;
      return { ...s, styles: { ...base, [which]: { ...pd, [device]: { ...(pd[device] ?? {}), ...patch } } } };
    }));
  }, []);

  const updateElStyle = useCallback((slug: string, key: ElKey, device: Device, patch: Partial<HeroElementStyle>) => {
    patchDevice<HeroElementStyle>(slug, key, device, patch);
  }, [patchDevice]);

  const updateLayoutStyle = useCallback((slug: string, which: "image" | "content", device: Device, patch: Partial<DeviceImageStyle & DeviceContentStyle>) => {
    patchDevice(slug, which, device, patch);
  }, [patchDevice]);

  const selectedSlide = drafts.find((s) => s.slug === selected) ?? drafts[0];

  const onUpload = async (slug: string, file: File) => {
    try {
      const url = await uploadImage(file);
      updateSlide(slug, { image: url, imageData: url });
    } catch (e) {
      toast.error("Upload failed: " + String(e));
    }
  };

  const addSlide = () => {
    const slug = "promo-" + Math.random().toString(36).slice(2, 7);
    const d: SlideDraft = { ...EMPTY, slug };
    setDrafts((d2) => [...d2, d]);
    setSelected(slug);
  };

  const removeSlide = (slug: string) => {
    setDrafts((d) => {
      const next = d.filter((s) => s.slug !== slug);
      if (selected === slug) setSelected(next[0]?.slug ?? "");
      return next;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const existing = drafts.filter((d) => d.id != null);
      const created = drafts.filter((d) => d.id == null);
      for (const d of existing) await updateCamp.mutateAsync({ id: d.id!, data: toPayload(d) });
      for (const d of created) await createCamp.mutateAsync(toPayload(d));
      toast.success("Slides saved");
    } catch (e) {
      toast.error("Failed: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const saveGlobal = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({ values: { homeHero: { value: settings } } });
      toast.success("Global settings saved");
    } catch (e) {
      toast.error("Failed: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const previewSlide: HeroSlide | null = selectedSlide
    ? { ...(selectedSlide as any), type: "hero", styles: selectedSlide.styles ?? {} }
    : null;

  if (loading) return <div className="p-6 text-[var(--text-2)]">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <LayoutTemplate className="h-5 w-5 text-[var(--gold)]" />
        <h1 className="text-lg font-bold">Hero Builder</h1>
        <div className="ml-auto flex items-center gap-2">
          {tab === "slides" ? (
            <Button size="sm" onClick={saveAll} disabled={saving}><Save className="h-4 w-4" /> Save slides</Button>
          ) : (
            <Button size="sm" onClick={saveGlobal} disabled={saving}><Save className="h-4 w-4" /> Save global</Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex w-full flex-col border-b border-[var(--line)] md:w-[470px] md:border-b-0 md:border-r">
          <div className="flex border-b border-[var(--line)]">
            <button className={cnTab(tab === "slides")} onClick={() => setTab("slides")}>Slides</button>
            <button className={cnTab(tab === "global")} onClick={() => setTab("global")}>Global & Style</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "slides" ? (
              <SlidesPanel
                drafts={drafts} selected={selected} onSelect={setSelected} onAdd={addSlide} onRemove={removeSlide}
                slide={selectedSlide} updateSlide={updateSlide} updateElStyle={updateElStyle} updateLayoutStyle={updateLayoutStyle} onUpload={onUpload} device={device}
              />
            ) : (
              <GlobalPanel settings={settings} setSettings={setSettings} />
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-2">
            <span className="text-sm font-medium text-[var(--text-1)]">Preview</span>
            <span className="text-sm text-[var(--text-2)]">— {DEVICE_LABEL[device]}</span>
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--page-soft)] p-1">
              {(["mobile", "tablet", "desktop"] as const).map((d) => (
                <button key={d} onClick={() => setDevice(d)} className={cnDev(device === d)} aria-pressed={device === d}>
                  {DEVICE_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
          <PreviewFrame device={device}>
            {previewSlide ? <Hero heroes={[previewSlide]} settings={settings} preview /> : <div className="p-6 text-[var(--text-2)]">No slides</div>}
          </PreviewFrame>
        </div>
      </div>
    </div>
  );
}

function toPayload(d: SlideDraft) {
  return {
    type: "hero" as const, image: d.image, eyebrow: d.eyebrow, heading: d.heading, description: d.description,
    ctaLabel: d.ctaLabel, ctaUrl: d.ctaUrl, price: d.price, oldPrice: d.oldPrice, badge: d.badge,
    layout: d.layout, brandLabel: d.brandLabel, brandBadge: d.brandBadge, bgColor: d.bgColor, active: d.active,
    slug: d.slug, styles: d.styles ?? {}, products: d.products ?? [], bgConfig: d.bgConfig,
  };
}

function cnTab(active: boolean) {
  return `flex-1 px-4 py-2 text-sm font-semibold ${active ? "border-b-2 border-[var(--gold)] text-[var(--text-1)]" : "text-[var(--text-2)]"}`;
}
function cnDev(active: boolean) {
  return `rounded-md px-3 py-1 text-sm ${active ? "bg-[var(--gold)] text-black" : "text-[var(--text-2)]"}`;
}

function SlidesPanel({ drafts, selected, onSelect, onAdd, onRemove, slide, updateSlide, updateElStyle, updateLayoutStyle, onUpload, device }: any) {
  const dv: Device = device;
  if (!slide) return <p className="text-sm text-[var(--text-2)]">No slides. Add one.</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {drafts.map((s: SlideDraft) => (
          <button key={s.slug} onClick={() => onSelect(s.slug)} className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${s.slug === selected ? "border-[var(--gold)] bg-[var(--gold-dim)]" : "border-[var(--line)]"}`}>
            <span className="max-w-[120px] truncate">{s.heading || s.slug}</span>
            <Trash2 className="h-3.5 w-3.5 text-[var(--text-2)] hover:text-red-500" onClick={(e) => { e.stopPropagation(); onRemove(s.slug); }} />
          </button>
        ))}
        <button onClick={onAdd} className="flex items-center gap-1 rounded-lg border border-dashed border-[var(--line)] px-3 py-1.5 text-sm text-[var(--text-2)]"><Plus className="h-4 w-4" /> Add</button>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <Field label="Image">
          <div className="flex items-center gap-3">
            {slide.image ? <img src={slide.image} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-[var(--page-soft)] text-[var(--text-2)]"><ImagePlus className="h-5 w-5" /></div>}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(slide.slug, e.target.files[0])} />
          </div>
        </Field>
        <Field label="Heading"><input className={inputCls} value={slide.heading} onChange={(e) => updateSlide(slide.slug, { heading: e.target.value })} /></Field>
        <Field label="Eyebrow"><input className={inputCls} value={slide.eyebrow ?? ""} onChange={(e) => updateSlide(slide.slug, { eyebrow: e.target.value })} /></Field>
        <Field label="Description"><textarea className={inputCls} rows={2} value={slide.description ?? ""} onChange={(e) => updateSlide(slide.slug, { description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price"><input type="number" className={inputCls} value={slide.price ?? ""} onChange={(e) => updateSlide(slide.slug, { price: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          <Field label="Old price"><input type="number" className={inputCls} value={slide.oldPrice ?? ""} onChange={(e) => updateSlide(slide.slug, { oldPrice: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button (label)"><input className={inputCls} value={slide.ctaLabel ?? ""} onChange={(e) => updateSlide(slide.slug, { ctaLabel: e.target.value })} /></Field>
          <Field label="Button (url)"><input className={inputCls} value={slide.ctaUrl ?? ""} onChange={(e) => updateSlide(slide.slug, { ctaUrl: e.target.value })} /></Field>
        </div>
        <Field label="Badge"><input className={inputCls} value={slide.badge ?? ""} onChange={(e) => updateSlide(slide.slug, { badge: e.target.value })} /></Field>
        <Field label="Brand badge (top right)"><input className={inputCls} value={slide.brandBadge ?? ""} onChange={(e) => updateSlide(slide.slug, { brandBadge: e.target.value })} placeholder="e.g. INFINIX · SAMSUNG" /></Field>
        <label className="flex items-center justify-between text-sm"><span>Active</span><input type="checkbox" checked={slide.active} onChange={(e) => updateSlide(slide.slug, { active: e.target.checked })} /></label>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">Background</h3>
        <BackgroundMaker value={slide.bgConfig} fallbackColor={slide.bgColor} onChange={(bg) => updateSlide(slide.slug, { bgConfig: bg })} />
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <Field label="Layout">
          <select className={inputCls} value={slide.layout} onChange={(e) => updateSlide(slide.slug, { layout: e.target.value as any })}>
            <option value="split">Split (side by side)</option>
            <option value="overlay">Overlay (fullscreen)</option>
            <option value="product-grid">Product grid (iris.ma style)</option>
          </select>
        </Field>
      </div>

      {slide.layout === "product-grid" ? (
        <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
          <h3 className="text-sm font-bold">Slide products ({slide.products?.length ?? 0})</h3>
          <ProductEditor slide={slide} updateSlide={updateSlide} onUpload={onUpload} />
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">Layout ({DEVICE_LABEL[dv]})</h3>
        <LayoutEditor slide={slide} updateLayoutStyle={updateLayoutStyle} device={device} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold">Element styles ({DEVICE_LABEL[dv]})</h3>
        {ELEMENT_KEYS.map((k) => (
          <ElementStyleEditor
            key={k}
            label={EL_LABEL[k]}
            chip={CHIP_KEYS.includes(k)}
            device={dv}
            value={(slide.styles?.[k] as PerDevice<HeroElementStyle> | undefined)?.[dv]}
            onChange={(patch) => updateElStyle(slide.slug, k, dv, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ slide, updateSlide, onUpload }: { slide: SlideDraft; updateSlide: (slug: string, patch: Partial<SlideDraft>) => void; onUpload: (slug: string, file: File) => void }) {
  const products = slide.products ?? [];

  const addProduct = () => {
    const newProducts = [...products, { image: "", name: "", price: null, label: "" }];
    updateSlide(slide.slug, { products: newProducts });
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_: HeroProduct, i: number) => i !== index);
    updateSlide(slide.slug, { products: newProducts });
  };

  const updateProduct = (index: number, patch: Partial<HeroProduct>) => {
    const newProducts = products.map((p: HeroProduct, i: number) => i === index ? { ...p, ...patch } : p);
    updateSlide(slide.slug, { products: newProducts });
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;
    const newProducts = [...products];
    const temp = newProducts[index];
    newProducts[index] = newProducts[newIndex];
    newProducts[newIndex] = temp;
    updateSlide(slide.slug, { products: newProducts });
  };

  const onProductImageUpload = async (index: number, file: File) => {
    try {
      const url = await uploadImage(file);
      updateProduct(index, { image: url });
    } catch (e) {
      toast.error("Upload failed: " + String(e));
    }
  };

  return (
    <div className="space-y-3">
      {products.map((p: HeroProduct, i: number) => (
        <div key={i} className="rounded-lg border border-[var(--line)] bg-[var(--page-soft)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-[var(--text-2)]" />
              <span className="text-xs font-medium text-[var(--text-2)]">Product {i + 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveProduct(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-[var(--line)] disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveProduct(i, 1)} disabled={i === products.length - 1} className="rounded p-1 hover:bg-[var(--line)] disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeProduct(i)} className="rounded p-1 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {p.image ? <img src={p.image} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded bg-[var(--page)] text-[var(--text-2)]"><ImagePlus className="h-4 w-4" /></div>}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onProductImageUpload(i, e.target.files[0])} className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input className={inputCls} value={p.name} onChange={(e) => updateProduct(i, { name: e.target.value })} /></Field>
            <Field label="Price"><input type="number" className={inputCls} value={p.price ?? ""} onChange={(e) => updateProduct(i, { price: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          </div>
          <Field label="Label (optional)"><input className={inputCls} value={p.label ?? ""} onChange={(e) => updateProduct(i, { label: e.target.value })} placeholder="e.g. Free, -30%, Included" /></Field>
        </div>
      ))}
      <button onClick={addProduct} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-sm text-[var(--text-2)] hover:border-[var(--gold)] hover:text-[var(--text-1)]">
        <Plus className="h-4 w-4" /> Add product
      </button>
    </div>
  );
}

function LayoutEditor({ slide, updateLayoutStyle, device }: any) {
  const dv: Device = device;
  const st = slide.styles ?? {};
  const img = (st.image as PerDevice<DeviceImageStyle> | undefined)?.[dv] ?? {};
  const con = (st.content as PerDevice<DeviceContentStyle> | undefined)?.[dv] ?? {};
  const patchImg = (p: Partial<DeviceImageStyle>) => updateLayoutStyle(slide.slug, "image", dv, p);
  const patchCon = (p: Partial<DeviceContentStyle>) => updateLayoutStyle(slide.slug, "content", dv, p);
  return (
    <div className="grid grid-cols-2 gap-3">
      {slide.layout === "split" ? (
        <>
          <SelectField label="Image side" value={img.side ?? "right"} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} onChange={(v) => patchImg({ side: v })} />
          <NumberField label="Image width (%)" value={img.width ?? 50} min={20} max={80} onChange={(n) => patchImg({ width: n ?? 50 })} />
          <SelectField label="Image shape" value={img.shape ?? "rounded"} options={[{ value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} onChange={(v) => patchImg({ shape: v })} />
        </>
      ) : (
        <SelectField label="Focal point" value={img.position ?? "center"} options={[{ value: "center", label: "Center" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }]} onChange={(v) => patchImg({ position: v })} />
      )}
      <SelectField label="Vertical alignment" value={con.vertical ?? "middle"} options={[{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }]} onChange={(v) => patchCon({ vertical: v })} />
      <SelectField label="Horizontal alignment" value={con.horizontal ?? "left"} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} onChange={(v) => patchCon({ horizontal: v })} />
      <NumberField label="Content width (%)" value={con.width ?? (slide.layout === "overlay" ? 60 : 100)} min={20} max={100} onChange={(n) => patchCon({ width: n ?? 100 })} />
      <NumberField label="Vertical padding (px)" value={con.paddingY ?? null} onChange={(n) => patchCon({ paddingY: n ?? undefined })} />
    </div>
  );
}

function GlobalPanel({ settings, setSettings }: { settings: HeroSettings; setSettings: (s: HeroSettings) => void }) {
  const set = (patch: Partial<HeroSettings>) => setSettings({ ...settings, ...patch });
  const g = settings.styles ?? {};
  const setG = (patch: Partial<HeroGlobalStyle>) => setSettings({ ...settings, styles: { ...g, ...patch } });
  const setGEl = (k: ElKey, p: Partial<HeroElementStyle>) => setG({ [k]: merge(g[k], p) } as any);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">Global Hero</h3>
        <SelectField label="Alignment" value={settings.align} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} onChange={(a) => set({ align: a })} />
        <SelectField label="Transition" value={settings.transition} options={[{ value: "slide", label: "Slide" }, { value: "fade", label: "Fade" }]} onChange={(t) => set({ transition: t })} />
        <label className="flex items-center justify-between text-sm"><span>CTA Buttons</span><input type="checkbox" checked={settings.showCtas} onChange={(e) => set({ showCtas: e.target.checked })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Auto rotate</span><input type="checkbox" checked={settings.autoRotate} onChange={(e) => set({ autoRotate: e.target.checked })} /></label>
        <NumberField label="Interval (ms)" value={settings.interval} min={2000} onChange={(n) => set({ interval: n ?? 6000 })} />
        <label className="flex items-center justify-between text-sm"><span>Parallax</span><input type="checkbox" checked={settings.parallax} onChange={(e) => set({ parallax: e.target.checked })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Hover (zoom)</span><input type="checkbox" checked={settings.hover} onChange={(e) => set({ hover: e.target.checked })} /></label>
        <NumberField label="Min height (px, 0=auto)" value={settings.minHeight} min={0} onChange={(n) => set({ minHeight: n ?? 0 })} />
        <label className="flex items-center justify-between text-sm"><span>Show stats</span><input type="checkbox" checked={settings.showStats} onChange={(e) => set({ showStats: e.target.checked })} /></label>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">Section</h3>
        <NumberField label="Max width (px)" value={g.section?.maxWidth ?? null} onChange={(n) => setG({ section: { ...g.section, maxWidth: n ?? undefined } })} />
        <NumberField label="Vertical padding (px)" value={g.section?.paddingY ?? null} onChange={(n) => setG({ section: { ...g.section, paddingY: n ?? undefined } })} />
        <ColorField label="Section background" value={g.section?.bg} onChange={(c) => setG({ section: { ...g.section, bg: c } })} />
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">Statistics</h3>
        <SelectField label="Position" value={g.stats?.position ?? "below"} options={[{ value: "below", label: "Below hero" }, { value: "overlay", label: "Over hero" }]} onChange={(p) => setG({ stats: { ...g.stats, position: p } })} />
        <NumberField label="Columns" value={g.stats?.columns ?? 4} min={1} max={6} onChange={(n) => setG({ stats: { ...g.stats, columns: n ?? 4 } })} />
        <NumberField label="Value size (px)" value={g.stats?.valueSize ?? 28} min={8} onChange={(n) => setG({ stats: { ...g.stats, valueSize: n ?? 28 } })} />
        <NumberField label="Label size (px)" value={g.stats?.labelSize ?? 12} min={8} onChange={(n) => setG({ stats: { ...g.stats, labelSize: n ?? 12 } })} />
        <ColorField label="Value color" value={g.stats?.valueColor} onChange={(c) => setG({ stats: { ...g.stats, valueColor: c } })} />
        <ColorField label="Label color" value={g.stats?.labelColor} onChange={(c) => setG({ stats: { ...g.stats, labelColor: c } })} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold">Default styles (inherited by slides)</h3>
        {ELEMENT_KEYS.map((k) => (
          <ElementStyleEditor key={k} label={EL_LABEL[k]} chip={CHIP_KEYS.includes(k)} device="desktop" value={g[k]} onChange={(p) => setGEl(k, p)} />
        ))}
      </div>
    </div>
  );
}


