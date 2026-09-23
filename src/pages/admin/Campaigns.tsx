import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Campaign = inferRouterOutputs<AppRouter>["admin"]["campaigns"]["list"][number];

function CampaignForm({ initial, onClose }: { initial: Campaign | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.campaigns.create.useMutation({ onSuccess: () => { utils.admin.campaigns.list.invalidate(); utils.shop.campaigns.invalidate(); onClose(); } });
  const update = trpc.admin.campaigns.update.useMutation({ onSuccess: () => { utils.admin.campaigns.list.invalidate(); utils.shop.campaigns.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    slug: initial?.slug ?? "",
    type: initial?.type ?? ("hero" as "hero" | "campaign"),
    eyebrow: initial?.eyebrow ?? "",
    heading: initial?.heading ?? "",
    description: initial?.description ?? "",
    ctaLabel: initial?.ctaLabel ?? "",
    ctaUrl: initial?.ctaUrl ?? "",
    image: initial?.image ?? "",
    bgColor: initial?.bgColor ?? "#fcd406",
    badge: initial?.badge ?? "",
    oldPrice: initial?.oldPrice ?? null,
    price: initial?.price ?? null,
    brandLabel: initial?.brandLabel ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTheme, setAiTheme] = useState("");
  const generateCampaign = trpc.ai.generateCampaign.useMutation();
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const result = await generateCampaign.mutateAsync({
        product: f.brandLabel || undefined,
        theme: aiTheme || undefined,
        style: f.type === "hero" ? "launch" : "promotional",
      });
      set("eyebrow", result.eyebrow);
      set("heading", result.heading);
      set("description", result.description);
      set("ctaLabel", result.ctaLabel);
      if (result.bgColor) set("bgColor", result.bgColor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Error.");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!f.slug.trim()) { setError("Slug is required."); return; }
    const payload = {
      slug: f.slug.trim(),
      type: f.type,
      eyebrow: f.eyebrow || null,
      heading: f.heading || null,
      description: f.description || null,
      ctaLabel: f.ctaLabel || null,
      ctaUrl: f.ctaUrl || null,
      image: f.image || null,
      bgColor: f.bgColor || null,
      badge: f.badge || null,
      oldPrice: f.oldPrice === null ? null : Number(f.oldPrice),
      price: f.price === null ? null : Number(f.price),
      brandLabel: f.brandLabel || null,
      sortOrder: Number(f.sortOrder),
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data: payload });
      else await create.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{initial ? "Edit campaign" : "New campaign"}</DialogTitle>
              <DialogDescription>Banners displayed on the homepage (hero) or as cards (campaign).</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-sm font-semibold text-[var(--gold)]">AI Generation</span>
          </div>
          <div className="flex gap-2">
            <Input value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} placeholder="Theme (e.g.: Back to School, Black Friday...)" className="flex-1" />
            <Button type="button" onClick={handleAiGenerate} disabled={aiLoading} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="back-to-school" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="hero">Hero (large banner)</option>
              <option value="campaign">Campaign (card)</option>
            </select>
          </div>
          <div className="space-y-1.5"><Label>Eyebrow</Label><Input value={f.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={f.heading} onChange={(e) => set("heading", e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Button label</Label><Input value={f.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Button link</Label><Input value={f.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="/shop?sort=discount" /></div>
          <div className="space-y-1.5"><Label>Image (URL)</Label><Input value={f.image} onChange={(e) => set("image", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Background color</Label><div className="flex gap-2"><input type="color" value={f.bgColor} onChange={(e) => set("bgColor", e.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-input" /><Input value={f.bgColor} onChange={(e) => set("bgColor", e.target.value)} /></div></div>
          <div className="space-y-1.5"><Label>Badge</Label><Input value={f.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Up to −30%" /></div>
          <div className="space-y-1.5"><Label>Original price (MAD)</Label><Input type="number" value={f.oldPrice ?? ""} onChange={(e) => set("oldPrice", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Sale price (MAD)</Label><Input type="number" value={f.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Brand label</Label><Input value={f.brandLabel} onChange={(e) => set("brandLabel", e.target.value)} /></div>
          <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
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

export default function Campaigns() {
  const { data, isLoading } = trpc.admin.campaigns.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.campaigns.delete.useMutation({ onSuccess: () => { utils.admin.campaigns.list.invalidate(); utils.shop.campaigns.invalidate(); } });
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Campaigns" subtitle={`${data?.length ?? 0} banners`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-3">
                    {c.image ? <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg" style={{ background: c.bgColor ?? "#eee" }} />}
                    <div>
                      <p>{c.heading || c.slug}</p>
                      <p className="text-xs text-[var(--text-2)]">{c.eyebrow}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={cn("rounded px-2 py-0.5 text-xs", c.type === "hero" ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "bg-[var(--ice-dim)] text-[var(--ice)]")}>{c.type === "hero" ? "Hero" : "Card"}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">{c.ctaUrl || "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", c.active ? "bg-emerald-500/15 text-emerald-500" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>{c.active ? "Active" : "Inactive"}</span>
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
      {(creating || editing) && <CampaignForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}