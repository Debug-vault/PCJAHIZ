import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Cat = inferRouterOutputs<AppRouter>["admin"]["categories"]["list"][number];

function CategoryForm({ initial, onClose }: { initial: Cat | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.categories.create.useMutation({ onSuccess: () => { utils.admin.categories.list.invalidate(); onClose(); } });
  const update = trpc.admin.categories.update.useMutation({ onSuccess: () => { utils.admin.categories.list.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    slug: initial?.slug ?? "",
    nameFr: initial?.nameFr ?? "",
    description: initial?.description ?? "",
    seoTitleFr: initial?.seoTitleFr ?? "",
    seoDescriptionFr: initial?.seoDescriptionFr ?? "",
    image: initial?.image ?? "",
    deck: initial?.deck ?? 1,
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const generateCategory = trpc.ai.generateCategory.useMutation();
  const generateSeo = trpc.ai.generateSeo.useMutation();
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const handleAiGenerate = async () => {
    const name = f.nameFr.trim();
    if (!name) { setError("Enter the category name first."); return; }
    setAiLoading(true);
    try {
      const result = await generateCategory.mutateAsync({ name });
      setF((s) => ({
        ...s,
        description: result.description || s.description,
        seoTitleFr: result.seoTitleFr || s.seoTitleFr,
        seoDescriptionFr: result.seoDescriptionFr || s.seoDescriptionFr,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSeo = async () => {
    const name = f.nameFr.trim();
    if (!name) { setError("Enter the category name first."); return; }
    setAiLoading(true);
    try {
      const result = await generateSeo.mutateAsync({ name, type: "category" });
      set("seoTitleFr", result.seoTitle);
      set("seoDescriptionFr", result.seoDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Error.");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!f.slug.trim() || !f.nameFr.trim()) {
      setError("Slug and FR name are required.");
      return;
    }
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data: f });
      else await create.mutateAsync(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{initial ? "Edit category" : "New category"}</DialogTitle>
              <DialogDescription>FR name required.</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-sm font-semibold text-[var(--gold)]">AI Generation</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
              Generate description + SEO
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleAiSeo} disabled={aiLoading}>
              Generate SEO only
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Image (URL)</Label><Input value={f.image} onChange={(e) => set("image", e.target.value)} /></div>
          {f.image && <img src={f.image} alt="" className="h-20 w-20 rounded-lg object-cover" />}
          <div className="space-y-1.5"><Label>FR Name</Label><Input value={f.nameFr} onChange={(e) => set("nameFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO title</Label><Input value={f.seoTitleFr} onChange={(e) => set("seoTitleFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO description</Label><Input value={f.seoDescriptionFr} onChange={(e) => set("seoDescriptionFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Deck</Label><Input type="number" value={f.deck} onChange={(e) => set("deck", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
        </div>
        {error && <p className="text-sm text-[var(--alert)]" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { PageHeader } from "@/components/admin/PageHeader";

export default function Categories() {
  const { data, isLoading } = trpc.admin.categories.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.categories.delete.useMutation({ onSuccess: () => utils.admin.categories.list.invalidate() });
  const [editing, setEditing] = useState<Cat | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Categories" subtitle={`${data?.length ?? 0} categories`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">FR</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  {c.image ? <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg border border-dashed border-[var(--line)] bg-[var(--page)]" />}
                </td>
                <td className="px-4 py-3 font-mono">{c.slug}</td>
                <td className="px-4 py-3">{c.nameFr}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", c.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: c.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <CategoryForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}