import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/hero";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Brand = inferRouterOutputs<AppRouter>["admin"]["brands"]["list"][number];

function BrandForm({ initial, onClose }: { initial: Brand | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.brands.create.useMutation({ onSuccess: () => { utils.admin.brands.list.invalidate(); utils.shop.brands.invalidate(); onClose(); } });
  const update = trpc.admin.brands.update.useMutation({ onSuccess: () => { utils.admin.brands.list.invalidate(); utils.shop.brands.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    logo: initial?.logo ?? "",
    description: initial?.description ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    showInMarquee: initial?.showInMarquee ?? true,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const generateSeo = trpc.ai.generateSeo.useMutation();
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      set("logo", url);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed — try again or paste a URL.");
    } finally {
      setUploading(false);
    }
  };

  const handleAiSeo = async () => {
    const name = f.name.trim();
    if (!name) { setError("Enter the brand name first."); return; }
    setAiLoading(true);
    try {
      const result = await generateSeo.mutateAsync({ name, type: "brand" });
      set("seoTitle", result.seoTitle);
      set("seoDescription", result.seoDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Error.");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!f.slug.trim() || !f.name.trim()) {
      setError("Slug and name are required.");
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
              <DialogTitle>{initial ? "Edit brand" : "New brand"}</DialogTitle>
              <DialogDescription>Slug and name required.</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-sm font-semibold text-[var(--gold)]">AI Generation</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAiSeo} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
            Generate SEO
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--text-2)] transition-colors hover:border-[var(--gold-hot)] hover:text-[var(--gold)]">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      void handleLogoFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <span className="text-[11px] text-[var(--text-2)]">PNG, JPG, SVG or WebP — max 2 MB</span>
              </div>
              <Input value={f.logo} onChange={(e) => set("logo", e.target.value)} placeholder="…or paste an image URL" />
              {f.logo && (
                <div className="flex items-center gap-3">
                  <img src={f.logo} alt="Logo preview" className="h-16 w-auto rounded-lg border border-[var(--line)] bg-white object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => set("logo", "")}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--text-2)] transition hover:border-[var(--alert)] hover:text-[var(--alert)]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO title</Label><Input value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>SEO description</Label><Input value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.showInMarquee} onChange={(e) => set("showInMarquee", e.target.checked)} /> In marquee</label>
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

export default function Brands() {
  const { data, isLoading } = trpc.admin.brands.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.brands.delete.useMutation({ onSuccess: () => { utils.admin.brands.list.invalidate(); utils.shop.brands.invalidate(); } });
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Brands" subtitle={`${data?.length ?? 0} brands`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Marquee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((b) => (
              <tr key={b.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  {b.logo ? <img src={b.logo} alt={b.name} className="h-8 w-8 rounded object-contain" /> : <span className="text-[var(--text-2)]">—</span>}
                </td>
                <td className="px-4 py-3 font-mono">{b.slug}</td>
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3">{b.showInMarquee ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", b.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>
                    {b.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(b)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: b.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <BrandForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}