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

type Zone = inferRouterOutputs<AppRouter>["admin"]["shipping"]["list"][number];

function ZoneForm({ initial, onClose }: { initial: Zone | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.shipping.create.useMutation({ onSuccess: () => { utils.admin.shipping.list.invalidate(); utils.shop.shipping.invalidate(); onClose(); } });
  const update = trpc.admin.shipping.update.useMutation({ onSuccess: () => { utils.admin.shipping.list.invalidate(); utils.shop.shipping.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "",
    cities: Array.isArray(initial?.cities) ? (initial?.cities as string[]).join("\n") : "",
    fee: initial?.fee ?? 39,
    freeThreshold: initial?.freeThreshold ?? null,
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) {
      setError("Zone name is required.");
      return;
    }
    const payload = {
      name: f.name.trim(),
      cities: f.cities.split("\n").map((c) => c.trim()).filter(Boolean),
      fee: Number(f.fee),
      freeThreshold: f.freeThreshold === null ? null : Number(f.freeThreshold),
      sortOrder: Number(f.sortOrder),
      active: f.active,
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
              <DialogTitle>{initial ? "Edit Zone" : "New Zone"}</DialogTitle>
              <DialogDescription>Fixed fees per shipping zone.</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Zone Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Casablanca" /></div>
          <div className="space-y-1.5"><Label>Fee (MAD)</Label><Input type="number" value={f.fee} onChange={(e) => set("fee", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Free shipping from (MAD)</Label><Input type="number" value={f.freeThreshold ?? ""} onChange={(e) => set("freeThreshold", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <div className="col-span-2 space-y-1.5">
            <Label>Cities (one per line)</Label>
            <textarea className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={f.cities} onChange={(e) => set("cities", e.target.value)} />
          </div>
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

export default function Shipping() {
  const { data, isLoading } = trpc.admin.shipping.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.shipping.delete.useMutation({ onSuccess: () => { utils.admin.shipping.list.invalidate(); utils.shop.shipping.invalidate(); } });
  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Shipping" subtitle={`${data?.length ?? 0} zones`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Free from</th>
              <th className="px-4 py-3">Cities</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((z) => (
              <tr key={z.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{z.name}</td>
                <td className="px-4 py-3 font-mono">{z.fee} MAD</td>
                <td className="px-4 py-3 font-mono">{z.freeThreshold != null ? `${z.freeThreshold} MAD` : "—"}</td>
                <td className="px-4 py-3 text-[var(--text-2)]">{(z.cities as string[] | null)?.length ?? 0} cities</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-xs", z.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>
                    {z.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(z)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: z.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <ZoneForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}