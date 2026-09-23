import { useState } from "react";
import { Upload, Sparkles, Loader2, Check, X, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductInput = {
  name: string;
  brand: string;
  category: string;
  price: string;
  referenceUrl: string;
};

type GeneratedProduct = {
  nameFr: string;
  summaryFr: string;
  descriptionFr: string;
  seoTitleFr: string;
  seoDescriptionFr: string;
  specs: { k: string; v: string }[];
  faqFr: { q: string; a: string }[];
};

function emptyRow(): ProductInput {
  return { name: "", brand: "", category: "", price: "", referenceUrl: "" };
}

export default function BulkImport() {
  const [rows, setRows] = useState<ProductInput[]>([emptyRow()]);
  const [aiLoading, setAiLoading] = useState(false);
  const [generated, setGenerated] = useState<(GeneratedProduct & { brand?: string; category?: string; price?: number })[]>([]);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{ ok: boolean; slug: string; error?: string }[]>([]);
  const generateBulk = trpc.ai.generateBulk.useMutation();
  const bulkCreate = trpc.admin.products.bulkCreate.useMutation();

  const updateRow = (i: number, field: keyof ProductInput, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleGenerate = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return;
    setAiLoading(true);
    try {
      const result = await generateBulk.mutateAsync({
        products: valid.map((r) => ({
          name: r.name.trim(),
          brand: r.brand.trim() || undefined,
          category: r.category.trim() || undefined,
          price: r.price ? Number(r.price) : undefined,
          referenceUrl: r.referenceUrl.trim() || undefined,
        })),
      });
      setGenerated(
        result.map((r, i) => ({
          ...("specs" in r ? r : { nameFr: r.nameFr ?? valid[i]?.name ?? "", summaryFr: "", descriptionFr: "", seoTitleFr: "", seoDescriptionFr: "", specs: [], faqFr: [] }),
          brand: valid[i]?.brand,
          category: valid[i]?.category,
          price: valid[i]?.price ? Number(valid[i].price) : undefined,
        })) as (GeneratedProduct & { brand?: string; category?: string; price?: number })[],
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImport = async () => {
    if (generated.length === 0) return;
    setSaving(true);
    try {
      const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const payload = generated.map((g) => ({
        slug: slugify(g.nameFr),
        sku: `JHZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        nameFr: g.nameFr,
        summaryFr: g.summaryFr || null,
        descriptionFr: g.descriptionFr || null,
        seoTitleFr: g.seoTitleFr || null,
        seoDescriptionFr: g.seoDescriptionFr || null,
        brandSlug: g.brand || null,
        categorySlug: g.category || null,
        price: g.price ?? 0,
        stock: 0,
        images: [],
        specs: g.specs ?? [],
        faqFr: g.faqFr ?? [],
        sectionsFr: (g as any).sectionsFr ?? [],
        variants: (g as any).variants ?? [],
      }));
      const res = await bulkCreate.mutateAsync(payload);
      setResults(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-hud text-xl font-bold">Bulk Import</h1>
        <p className="text-sm text-[var(--text-2)]">Add multiple products in a single operation with AI</p>
      </div>

      {/* Input Table */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-hud text-sm font-bold">Products to generate</h2>
          <Button variant="outline" size="sm" onClick={addRow}><Upload className="mr-1 h-3.5 w-3.5" /> Add a row</Button>
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input placeholder="Product name *" value={row.name} onChange={(e) => updateRow(i, "name", e.target.value)} className="flex-[2]" />
              <Input placeholder="Brand" value={row.brand} onChange={(e) => updateRow(i, "brand", e.target.value)} className="flex-1" />
              <Input placeholder="Category" value={row.category} onChange={(e) => updateRow(i, "category", e.target.value)} className="flex-1" />
              <Input placeholder="Price MAD" type="number" value={row.price} onChange={(e) => updateRow(i, "price", e.target.value)} className="flex-1" />
              <Input placeholder="URL or SKU (optional)" value={row.referenceUrl} onChange={(e) => updateRow(i, "referenceUrl", e.target.value)} className="flex-[2]" />
              {rows.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-[var(--alert)]" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleGenerate} disabled={aiLoading || rows.every((r) => !r.name.trim())} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate with AI ({rows.filter((r) => r.name.trim()).length} products)
          </Button>
        </div>
      </div>

      {/* Generated Preview */}
      {generated.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-hud text-sm font-bold">Preview ({generated.length} generated products)</h2>
            <Button onClick={handleImport} disabled={saving} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import to store
            </Button>
          </div>
          <div className="space-y-3">
            {generated.map((g, i) => (
              <div key={i} className="rounded border border-[var(--line)] p-3 text-sm">
                <p className="font-bold">{g.nameFr}</p>
                <p className="text-xs text-[var(--text-2)] mt-1 line-clamp-2">{g.summaryFr}</p>
                {g.specs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.specs.slice(0, 4).map((s, j) => (
                      <span key={j} className="rounded bg-[var(--gold-dim)] px-1.5 py-0.5 text-[10px] text-[var(--gold)]">{s.k}: {s.v}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Results */}
      {results.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-4">
          <h2 className="font-hud text-sm font-bold mb-3">Import results</h2>
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {r.ok ? <Check className="h-4 w-4 text-green-400" /> : <X className="h-4 w-4 text-[var(--alert)]" />}
                <span className="font-mono text-xs">{r.slug}</span>
                {r.error && <span className="text-xs text-[var(--alert)]">— {r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
