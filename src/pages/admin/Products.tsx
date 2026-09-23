import { useMemo, useState } from "react";
import { Plus, Pencil, Search, Trash2, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SpecRow = { k: string; v: string };
type FaqItem = { q: string; a: string };
type Images = string[] | null;
type Specs = SpecRow[] | null;

type ProductRow = inferRouterOutputs<AppRouter>["admin"]["products"]["list"][number];

function defaultProduct(): Record<string, unknown> {
  return {
    slug: "",
    sku: "",
    nameFr: "",
    summaryFr: "",
    descriptionFr: "",
    price: 0,
    oldPrice: null,
    discount: null,
    cost: null,
    stock: 0,
    lowStockThreshold: 3,
    featured: false,
    isNew: false,
    active: true,
    warrantyMonths: 12,
    brandSlug: "",
    categorySlug: "",
    img: "",
    images: [] as Images,
    specs: [] as Specs,
    faqFr: [] as FaqItem[],
  };
}

function ProductForm({
  initial,
  onClose,
  brands,
  categories,
}: {
  initial: ProductRow | null;
  onClose: () => void;
  brands: { slug: string; name: string }[];
  categories: { slug: string; nameFr: string }[];
}) {
  const utils = trpc.useUtils();
  const create = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
      utils.admin.dashboard.invalidate();
      onClose();
    },
  });
  const update = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
      utils.admin.dashboard.invalidate();
      onClose();
    },
  });
  const [f, setF] = useState<Record<string, unknown>>(() => {
    const base = defaultProduct();
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      oldPrice: initial.oldPrice ?? null,
      discount: initial.discount ?? null,
      cost: initial.cost ?? null,
      img: initial.img ?? "",
      images: (initial.images as Images) ?? [],
      specs: (initial.specs as Specs) ?? [],
      faqFr: (initial.faqFr as FaqItem[]) ?? [],
      sectionsFr: (initial as any).sectionsFr ?? [],
      variants: (initial as any).variants ?? [],
    };
  });
  const [imgInput, setImgInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReference, setAiReference] = useState("");
  const generateProduct = trpc.ai.generateProduct.useMutation();
  const improveProduct = trpc.ai.improveProduct.useMutation();
  const generateSeo = trpc.ai.generateSeo.useMutation();

  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const handleAiGenerate = async () => {
    const name = String(f.nameFr || "").trim();
    const ref = aiReference.trim();
    if (!name && !ref) { setError("Enter a product name or paste a URL/SKU as reference."); return; }
    setAiLoading(true);
    try {
      const result = await generateProduct.mutateAsync({
        name: name || ref,
        brand: String(f.brandSlug || "") || undefined,
        category: String(f.categorySlug || "") || undefined,
        price: num("price"),
        referenceUrl: ref || undefined,
      });
      const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const autoSlug = slugify(result.nameFr || name);
      setF((s) => ({
        ...s,
        slug: autoSlug,
        sku: (result as any).sku || s.sku,
        nameFr: result.nameFr || s.nameFr,
        summaryFr: result.summaryFr || s.summaryFr,
        descriptionFr: result.descriptionFr || s.descriptionFr,
        seoTitleFr: result.seoTitleFr || s.seoTitleFr,
        seoDescriptionFr: result.seoDescriptionFr || s.seoDescriptionFr,
        specs: result.specs?.length ? result.specs : s.specs,
        faqFr: result.faqFr?.length ? result.faqFr : s.faqFr,
        sectionsFr: (result as any).sectionsFr?.length ? (result as any).sectionsFr : s.sectionsFr,
        variants: (result as any).variants?.length ? (result as any).variants : s.variants,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async () => {
    const desc = String(f.descriptionFr || "").trim();
    if (!desc) { setError("Enter a description to improve first."); return; }
    setAiLoading(true);
    try {
      const result = await improveProduct.mutateAsync({
        name: String(f.nameFr),
        currentDescription: desc,
        currentSummary: String(f.summaryFr || ""),
      });
      set("descriptionFr", result.descriptionFr);
      if (result.summaryFr) set("summaryFr", result.summaryFr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSeo = async () => {
    const name = String(f.nameFr || "").trim();
    if (!name) { setError("Enter a product name first."); return; }
    setAiLoading(true);
    try {
      const result = await generateSeo.mutateAsync({
        name,
        type: "product",
        brand: String(f.brandSlug || "") || undefined,
        category: String(f.categorySlug || "") || undefined,
      });
      set("seoTitleFr", result.seoTitle);
      set("seoDescriptionFr", result.seoDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI error.");
    } finally {
      setAiLoading(false);
    }
  };

  const addImage = () => {
    const url = imgInput.trim();
    if (!url) return;
    const list = [...((f.images as Images) ?? []), url];
    set("images", list);
    if (list.length === 1) set("img", url);
    setImgInput("");
  };

  const addSpec = () => set("specs", [...((f.specs as Specs) ?? []), { k: "", v: "" }]);
  const setSpec = (i: number, k: string, v: string) =>
    set("specs", ((f.specs as Specs) ?? []).map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const delSpec = (i: number) => set("specs", ((f.specs as Specs) ?? []).filter((_, idx) => idx !== i));

  const addFaq = () => set("faqFr", [...((f.faqFr as FaqItem[]) ?? []), { q: "", a: "" }]);
  const setFaq = (i: number, k: string, v: string) => {
    const key = "faqFr";
    const list = (f[key] as FaqItem[]) ?? [];
    set(key, list.map((item, idx) => (idx === i ? { ...item, [k]: v } : item)));
  };
  const delFaq = (i: number) => {
    const key = "faqFr";
    set(key, ((f[key] as FaqItem[]) ?? []).filter((_, idx) => idx !== i));
  };

  const num = (k: string): number => Number(f[k] ?? 0);
  const bool = (k: string): boolean => Boolean(f[k]);

  const save = async () => {
    setError("");
    if (!String(f.slug).trim() || !String(f.sku).trim() || !String(f.nameFr).trim()) {
      setError("Slug, SKU, and name are required.");
      return;
    }
    setBusy(true);
    const payload = {
      slug: String(f.slug).trim(),
      sku: String(f.sku).trim(),
      nameFr: String(f.nameFr).trim(),
      summaryFr: (f.summaryFr as string) || null,
      descriptionFr: (f.descriptionFr as string) || null,
      seoTitleFr: (f.seoTitleFr as string) || null,
      seoDescriptionFr: (f.seoDescriptionFr as string) || null,
      brandSlug: (f.brandSlug as string) || null,
      categorySlug: (f.categorySlug as string) || null,
      price: num("price"),
      oldPrice: f.oldPrice != null ? num("oldPrice") : null,
      discount: f.discount != null ? num("discount") : null,
      cost: f.cost != null ? num("cost") : null,
      img: (f.images as Images)?.[0] ?? ((f.img as string) || null),
      images: (f.images as Images) ?? [],
      specs: (f.specs as Specs)?.filter((s) => s.k.trim() || s.v.trim()) ?? [],
      faqFr: (f.faqFr as FaqItem[])?.filter((x) => x.q.trim() || x.a.trim()) ?? [],
      sectionsFr: (f.sectionsFr as any) || null,
      variants: (f.variants as any) || null,
      stock: num("stock"),
      lowStockThreshold: num("lowStockThreshold"),
      featured: bool("featured"),
      isNew: bool("isNew"),
      active: bool("active"),
      popularity: num("popularity"),
      warrantyMonths: num("warrantyMonths"),
    };
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{initial ? "Edit Product" : "New Product"}</DialogTitle>
              <DialogDescription>French fields. Unique slug & SKU.</DialogDescription>
            </div>
            <Button type="button" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* AI Generate Section */}
          <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[var(--gold)]" />
              <span className="text-sm font-semibold text-[var(--gold)]">AI Generation</span>
            </div>
            <div className="mb-3">
              <Input
                value={aiReference}
                onChange={(e) => setAiReference(e.target.value)}
                placeholder="URL, SKU or product name (optional — to enrich generation)"
                className="text-xs"
              />
              <p className="mt-1 text-[10px] text-[var(--text-2)]">
                Paste a URL to extract data automatically, or a SKU/name as reference
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                Generate Sheet
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleAiImprove} disabled={aiLoading}>
                Improve Description
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleAiSeo} disabled={aiLoading}>
                Generate SEO
              </Button>
            </div>
          </div>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={String(f.slug ?? "")} onChange={(e) => set("slug", e.target.value)} placeholder="acer-aspire-5" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={String(f.sku ?? "")} onChange={(e) => set("sku", e.target.value)} placeholder="JHZ-0001" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (MAD)</Label>
              <Input type="number" value={num("price")} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Old Price</Label>
              <Input type="number" value={f.oldPrice != null ? num("oldPrice") : ""} onChange={(e) => set("oldPrice", e.target.value === "" ? null : Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={num("stock")} onChange={(e) => set("stock", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Warranty (months)</Label>
              <Input type="number" value={num("warrantyMonths")} onChange={(e) => set("warrantyMonths", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={String(f.brandSlug ?? "")}
                onChange={(e) => set("brandSlug", e.target.value)}
              >
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={String(f.categorySlug ?? "")}
                onChange={(e) => set("categorySlug", e.target.value)}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.nameFr}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Popularity</Label>
              <Input type="number" value={num("popularity")} onChange={(e) => set("popularity", Number(e.target.value))} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={String(f.nameFr ?? "")} onChange={(e) => set("nameFr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea value={String(f.summaryFr ?? "")} onChange={(e) => set("summaryFr", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={4} value={String(f.descriptionFr ?? "")} onChange={(e) => set("descriptionFr", e.target.value)} />
            </div>
          </section>

          <section className="space-y-2">
            <Label>Images</Label>
            <div className="flex gap-2">
              <Input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://… (URL image)" />
              <Button type="button" variant="outline" onClick={addImage}>Add</Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {((f.images as Images) ?? []).map((url, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--line)]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => set("images", ((f.images as Images) ?? []).filter((_, idx) => idx !== i))}
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Specifications</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>+ Add</Button>
            </div>
            {((f.specs as Specs) ?? []).map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Key (e.g. Warranty)" value={s.k} onChange={(e) => setSpec(i, "k", e.target.value)} />
                <Input placeholder="Value (e.g. 12 months)" value={s.v} onChange={(e) => setSpec(i, "v", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => delSpec(i)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>FAQ</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>+ Add</Button>
            </div>
            {((f.faqFr as FaqItem[]) ?? []).map((item, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-[var(--line)] p-3">
                <Input placeholder="Question" value={item.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                <Textarea rows={2} placeholder="Answer" value={item.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
                <Button type="button" variant="ghost" size="sm" onClick={() => delFaq(i)}>Delete</Button>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const variants = (f.variants as any[]) ?? [];
                set("variants", [...variants, { type: "color", label: "Couleur", options: [{ label: "Noir", value: "noir", hex: "#000000" }] }]);
              }}>+ Add Variant</Button>
            </div>
            {((f.variants as any[]) ?? []).map((v, vi) => (
              <div key={vi} className="rounded-lg border border-[var(--line)] p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <select
                    className="h-8 rounded border border-[var(--line)] bg-[var(--bg)] px-2 text-xs flex-1"
                    value={v.type}
                    onChange={(e) => {
                      const variants = [...(f.variants as any[])];
                      variants[vi] = { ...variants[vi], type: e.target.value };
                      set("variants", variants);
                    }}
                  >
                    {["color","ram","storage","processor","screen","os","gpu","finish","size","capacity"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <Input placeholder="Label (e.g. Mémoire RAM)" value={v.label} onChange={(e) => {
                    const variants = [...(f.variants as any[])];
                    variants[vi] = { ...variants[vi], label: e.target.value };
                    set("variants", variants);
                  }} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => {
                    set("variants", (f.variants as any[]).filter((_, i) => i !== vi));
                  }} aria-label="Delete variant"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="pl-4 space-y-1">
                  {v.options.map((opt: any, oi: number) => (
                    <div key={oi} className="flex gap-2 items-center text-xs">
                      {v.type === "color" && (
                        <input type="color" value={opt.hex || "#000000"} onChange={(e) => {
                          const variants = [...(f.variants as any[])];
                          const opts = [...variants[vi].options];
                          opts[oi] = { ...opts[oi], hex: e.target.value };
                          variants[vi] = { ...variants[vi], options: opts };
                          set("variants", variants);
                        }} className="h-6 w-6 cursor-pointer border-0" />
                      )}
                      <Input placeholder="Label" value={opt.label} onChange={(e) => {
                        const variants = [...(f.variants as any[])];
                        const opts = [...variants[vi].options];
                        opts[oi] = { ...opts[oi], label: e.target.value };
                        variants[vi] = { ...variants[vi], options: opts };
                        set("variants", variants);
                      }} className="flex-1" />
                      <Input placeholder="Value" value={opt.value} onChange={(e) => {
                        const variants = [...(f.variants as any[])];
                        const opts = [...variants[vi].options];
                        opts[oi] = { ...opts[oi], value: e.target.value };
                        variants[vi] = { ...variants[vi], options: opts };
                        set("variants", variants);
                      }} className="w-20" />
                      <Input type="number" placeholder="Price diff" value={opt.priceDiff ?? ""} onChange={(e) => {
                        const variants = [...(f.variants as any[])];
                        const opts = [...variants[vi].options];
                        opts[oi] = { ...opts[oi], priceDiff: e.target.value ? Number(e.target.value) : undefined };
                        variants[vi] = { ...variants[vi], options: opts };
                        set("variants", variants);
                      }} className="w-20" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => {
                        const variants = [...(f.variants as any[])];
                        variants[vi] = { ...variants[vi], options: variants[vi].options.filter((_: any, i: number) => i !== oi) };
                        set("variants", variants);
                      }} aria-label="Delete option"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    const variants = [...(f.variants as any[])];
                    const opts = [...variants[vi].options, { label: "", value: "" }];
                    variants[vi] = { ...variants[vi], options: opts };
                    set("variants", variants);
                  }}>+ Option</Button>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["featured", "isNew", "active"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bool(flag)} onChange={(e) => set(flag, e.target.checked)} />
                {flag === "featured" ? "Featured" : flag === "isNew" ? "New" : "Active"}
              </label>
            ))}
          </section>

          {error && <p className="text-sm text-[var(--alert)]" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { PageHeader } from "@/components/admin/PageHeader";

export default function Products() {
  const { formatPrice } = useI18n();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = trpc.admin.products.list.useQuery({ q });
  const { data: brands } = trpc.shop.brands.useQuery();
  const { data: categories } = trpc.shop.categories.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
      utils.admin.dashboard.invalidate();
    },
  });
  const setActive = trpc.admin.products.setActive.useMutation({
    onSuccess: () => utils.admin.products.list.invalidate(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q.trim()) return data;
    const ql = q.toLowerCase();
    return data.filter(
      (p) => p.nameFr.toLowerCase().includes(ql) || p.sku.toLowerCase().includes(ql) || p.slug.includes(ql),
    );
  }, [data, q]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Products" subtitle={`${filtered.length} references`} />
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-2)]" />
            <Input className="w-56 pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {(p.images as Images)?.[0] && (
                      <img src={(p.images as Images)![0]} alt="" className="h-10 w-10 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium">{p.nameFr}</div>
                      <div className="font-mono text-xs text-[var(--text-2)]">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">{formatPrice(p.price)}</td>
                <td className={cn("px-4 py-3 font-mono", p.stock <= p.lowStockThreshold && "text-[var(--alert)]")}>
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setActive.mutate({ id: p.id, active: !p.active })}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      p.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]",
                    )}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: p.id })} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-[var(--alert)]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-2)]">No products.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ProductForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          brands={(brands ?? []).map((b) => ({ slug: b.slug, name: b.name }))}
          categories={(categories ?? []).map((c) => ({ slug: c.slug, nameFr: c.nameFr }))}
        />
      )}
    </div>
  );
}