import { useMemo, useState } from "react";
import { Plus, Pencil, Search, Trash2, Loader2 } from "lucide-react";
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
    nameAr: "",
    summaryFr: "",
    summaryAr: "",
    descriptionFr: "",
    descriptionAr: "",
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
    faqAr: [] as FaqItem[],
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
      faqAr: (initial.faqAr as FaqItem[]) ?? [],
    };
  });
  const [imgInput, setImgInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

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

  const addFaq = (lang: "fr" | "ar") => set(`faq${lang === "fr" ? "Fr" : "Ar"}`, [...(((lang === "fr" ? f.faqFr : f.faqAr) as FaqItem[]) ?? []), { q: "", a: "" }]);
  const setFaq = (lang: "fr" | "ar", i: number, k: string, v: string) => {
    const key = lang === "fr" ? "faqFr" : "faqAr";
    const list = (f[key] as FaqItem[]) ?? [];
    set(key, list.map((item, idx) => (idx === i ? { ...item, [k]: v } : item)));
  };
  const delFaq = (lang: "fr" | "ar", i: number) => {
    const key = lang === "fr" ? "faqFr" : "faqAr";
    set(key, ((f[key] as FaqItem[]) ?? []).filter((_, idx) => idx !== i));
  };

  const num = (k: string): number => Number(f[k] ?? 0);
  const bool = (k: string): boolean => Boolean(f[k]);

  const save = async () => {
    setError("");
    if (!String(f.slug).trim() || !String(f.sku).trim() || !String(f.nameFr).trim() || !String(f.nameAr).trim()) {
      setError("slug, sku, nom FR et nom AR sont obligatoires.");
      return;
    }
    setBusy(true);
    const payload = {
      slug: String(f.slug).trim(),
      sku: String(f.sku).trim(),
      nameFr: String(f.nameFr).trim(),
      nameAr: String(f.nameAr).trim(),
      summaryFr: (f.summaryFr as string) || null,
      summaryAr: (f.summaryAr as string) || null,
      descriptionFr: (f.descriptionFr as string) || null,
      descriptionAr: (f.descriptionAr as string) || null,
      seoTitleFr: (f.seoTitleFr as string) || null,
      seoTitleAr: (f.seoTitleAr as string) || null,
      seoDescriptionFr: (f.seoDescriptionFr as string) || null,
      seoDescriptionAr: (f.seoDescriptionAr as string) || null,
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
      faqAr: (f.faqAr as FaqItem[])?.filter((x) => x.q.trim() || x.a.trim()) ?? [],
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
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription>Champs FR + AR. Slug et SKU uniques.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
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
              <Label>Prix (MAD)</Label>
              <Input type="number" value={num("price")} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Ancien prix</Label>
              <Input type="number" value={f.oldPrice != null ? num("oldPrice") : ""} onChange={(e) => set("oldPrice", e.target.value === "" ? null : Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={num("stock")} onChange={(e) => set("stock", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Garantie (mois)</Label>
              <Input type="number" value={num("warrantyMonths")} onChange={(e) => set("warrantyMonths", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Marque</Label>
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
              <Label>Catégorie</Label>
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
              <Label>Popularité</Label>
              <Input type="number" value={num("popularity")} onChange={(e) => set("popularity", Number(e.target.value))} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nom FR</Label>
              <Input value={String(f.nameFr ?? "")} onChange={(e) => set("nameFr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom AR</Label>
              <Input dir="rtl" value={String(f.nameAr ?? "")} onChange={(e) => set("nameAr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Résumé FR</Label>
              <Textarea value={String(f.summaryFr ?? "")} onChange={(e) => set("summaryFr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Résumé AR</Label>
              <Textarea dir="rtl" value={String(f.summaryAr ?? "")} onChange={(e) => set("summaryAr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description FR</Label>
              <Textarea rows={4} value={String(f.descriptionFr ?? "")} onChange={(e) => set("descriptionFr", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description AR</Label>
              <Textarea rows={4} dir="rtl" value={String(f.descriptionAr ?? "")} onChange={(e) => set("descriptionAr", e.target.value)} />
            </div>
          </section>

          <section className="space-y-2">
            <Label>Images</Label>
            <div className="flex gap-2">
              <Input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://… (URL image)" />
              <Button type="button" variant="outline" onClick={addImage}>Ajouter</Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {((f.images as Images) ?? []).map((url, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--line)]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => set("images", ((f.images as Images) ?? []).filter((_, idx) => idx !== i))}
                    aria-label="Supprimer l'image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Spécifications</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>+ Ajouter</Button>
            </div>
            {((f.specs as Specs) ?? []).map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Clé (ex: Garantie)" value={s.k} onChange={(e) => setSpec(i, "k", e.target.value)} />
                <Input placeholder="Valeur (ex: 12 mois)" value={s.v} onChange={(e) => setSpec(i, "v", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => delSpec(i)} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          {(["fr", "ar"] as const).map((lang) => (
            <section key={lang} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>FAQ ({lang.toUpperCase()})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addFaq(lang)}>+ Ajouter</Button>
              </div>
              {(((lang === "fr" ? f.faqFr : f.faqAr) as FaqItem[]) ?? []).map((item, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-[var(--line)] p-3">
                  <Input placeholder="Question" dir={lang === "ar" ? "rtl" : undefined} value={item.q} onChange={(e) => setFaq(lang, i, "q", e.target.value)} />
                  <Textarea rows={2} placeholder="Réponse" dir={lang === "ar" ? "rtl" : undefined} value={item.a} onChange={(e) => setFaq(lang, i, "a", e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => delFaq(lang, i)}>Supprimer</Button>
                </div>
              ))}
            </section>
          ))}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["featured", "isNew", "active"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bool(flag)} onChange={(e) => set(flag, e.target.checked)} />
                {flag === "featured" ? "Mis en avant" : flag === "isNew" ? "Nouveauté" : "Actif"}
              </label>
            ))}
          </section>

          {error && <p className="text-sm text-[var(--alert)]" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="button" onClick={save} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
      (p) => p.nameFr.toLowerCase().includes(ql) || p.nameAr.includes(q) || p.sku.toLowerCase().includes(ql) || p.slug.includes(ql),
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
        <div>
          <h1 className="font-hud text-2xl font-bold">Produits</h1>
          <p className="text-sm text-[var(--text-2)]">{filtered.length} références</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-2)]" />
            <Input className="w-56 pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nouveau
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Statut</th>
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
                    {p.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: p.id })} aria-label="Supprimer">
                      <Trash2 className="h-4 w-4 text-[var(--alert)]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-2)]">Aucun produit.</td>
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