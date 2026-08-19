import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
    nameAr: initial?.nameAr ?? "",
    description: initial?.description ?? "",
    descriptionAr: initial?.descriptionAr ?? "",
    seoTitleFr: initial?.seoTitleFr ?? "",
    seoTitleAr: initial?.seoTitleAr ?? "",
    seoDescriptionFr: initial?.seoDescriptionFr ?? "",
    seoDescriptionAr: initial?.seoDescriptionAr ?? "",
    image: initial?.image ?? "",
    deck: initial?.deck ?? 1,
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.slug.trim() || !f.nameFr.trim() || !f.nameAr.trim()) {
      setError("slug, nom FR et nom AR sont obligatoires.");
      return;
    }
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data: f });
      else await create.mutateAsync(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          <DialogDescription>Nom FR + AR obligatoires.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Image (URL)</Label><Input value={f.image} onChange={(e) => set("image", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Nom FR</Label><Input value={f.nameFr} onChange={(e) => set("nameFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Nom AR</Label><Input dir="rtl" value={f.nameAr} onChange={(e) => set("nameAr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description FR</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description AR</Label><Textarea dir="rtl" value={f.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO title FR</Label><Input value={f.seoTitleFr} onChange={(e) => set("seoTitleFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO title AR</Label><Input dir="rtl" value={f.seoTitleAr} onChange={(e) => set("seoTitleAr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO description FR</Label><Input value={f.seoDescriptionFr} onChange={(e) => set("seoDescriptionFr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO description AR</Label><Input dir="rtl" value={f.seoDescriptionAr} onChange={(e) => set("seoDescriptionAr", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Deck</Label><Input type="number" value={f.deck} onChange={(e) => set("deck", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Ordre</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
        </div>
        {error && <p className="text-sm text-[var(--alert)]" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={save}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        <div>
          <h1 className="font-hud text-2xl font-bold">Catégories</h1>
          <p className="text-sm text-[var(--text-2)]">{data?.length ?? 0} catégories</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nouvelle</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">FR</th>
              <th className="px-4 py-3">AR</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-mono">{c.slug}</td>
                <td className="px-4 py-3">{c.nameFr}</td>
                <td className="px-4 py-3" dir="rtl">{c.nameAr}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", c.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: c.id })} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
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