import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type Promo = inferRouterOutputs<AppRouter>["admin"]["promos"]["list"][number];

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 16) : "");

function PromoForm({ initial, onClose }: { initial: Promo | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.promos.create.useMutation({ onSuccess: () => { utils.admin.promos.list.invalidate(); onClose(); } });
  const update = trpc.admin.promos.update.useMutation({ onSuccess: () => { utils.admin.promos.list.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    code: initial?.code ?? "",
    type: initial?.type ?? "percent",
    value: initial?.value ?? 10,
    minOrder: initial?.minOrder ?? null,
    maxDiscount: initial?.maxDiscount ?? null,
    startsAt: iso(initial?.startsAt),
    endsAt: iso(initial?.endsAt),
    usageLimit: initial?.usageLimit ?? null,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.code.trim()) {
      setError("Code is required.");
      return;
    }
    try {
      const payload = { ...f, startsAt: f.startsAt || null, endsAt: f.endsAt || null };
      if (initial) await update.mutateAsync({ id: initial.id, data: payload });
      else await create.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{initial ? "Edit code" : "New promo code"}</DialogTitle>
              <DialogDescription>Percentage or fixed amount type.</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Code</Label><Input value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="JAHIZ10" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount (MAD)</option>
            </select>
          </div>
          <div className="space-y-1.5"><Label>Value</Label><Input type="number" value={f.value} onChange={(e) => set("value", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Min order (MAD)</Label><Input type="number" value={f.minOrder ?? ""} onChange={(e) => set("minOrder", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Max discount (MAD)</Label><Input type="number" value={f.maxDiscount ?? ""} onChange={(e) => set("maxDiscount", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Usage limit</Label><Input type="number" value={f.usageLimit ?? ""} onChange={(e) => set("usageLimit", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Start</Label><Input type="datetime-local" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End</Label><Input type="datetime-local" value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></div>
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

export default function Promos() {
  const { data, isLoading } = trpc.admin.promos.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.promos.delete.useMutation({ onSuccess: () => utils.admin.promos.list.invalidate() });
  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Promo Codes" subtitle={`${data?.length ?? 0} codes`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-mono font-semibold text-[var(--gold)]">{p.code}</td>
                <td className="px-4 py-3">{p.type === "percent" ? "%" : "MAD"}</td>
                <td className="px-4 py-3 font-mono">{p.value}{p.type === "percent" ? "%" : " MAD"}</td>
                <td className="px-4 py-3 font-mono">{p.usedCount}{p.usageLimit != null ? `/${p.usageLimit}` : ""}</td>
                <td className="px-4 py-3 text-[var(--text-2)]">{p.endsAt ? new Date(p.endsAt).toLocaleDateString("en-US") : "∞"}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", p.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: p.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <PromoForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}