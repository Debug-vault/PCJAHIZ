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

type Store = inferRouterOutputs<AppRouter>["admin"]["storeLocations"]["list"][number];

function StoreForm({ initial, onClose }: { initial: Store | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.storeLocations.create.useMutation({ onSuccess: () => { utils.admin.storeLocations.list.invalidate(); utils.shop.storeLocations.invalidate(); onClose(); } });
  const update = trpc.admin.storeLocations.update.useMutation({ onSuccess: () => { utils.admin.storeLocations.list.invalidate(); utils.shop.storeLocations.invalidate(); onClose(); } });
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    phone: initial?.phone ?? "",
    monSat: (initial?.hours as { monSat?: string } | null)?.monSat ?? "9h00 – 19h00",
    mapsUrl: initial?.mapsUrl ?? "",
    isPickupPoint: initial?.isPickupPoint ?? false,
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  }));
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.name.trim() || !f.city.trim() || !f.address.trim()) { setError("Name, city, and address are required."); return; }
    const payload = {
      name: f.name.trim(),
      city: f.city.trim(),
      address: f.address.trim(),
      phone: f.phone || null,
      hours: { monSat: f.monSat, sun: "Closed" },
      mapsUrl: f.mapsUrl || null,
      isPickupPoint: f.isPickupPoint,
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
              <DialogTitle>{initial ? "Edit Store Location" : "New Store Location"}</DialogTitle>
              <DialogDescription>Stores and pickup points displayed on the homepage.</DialogDescription>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="PC Jahiz Casablanca" /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Hours</Label><Input value={f.monSat} onChange={(e) => set("monSat", e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Google Maps Link</Label><Input value={f.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isPickupPoint} onChange={(e) => set("isPickupPoint", e.target.checked)} /> Pickup Point</label>
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

export default function StoreLocations() {
  const { data, isLoading } = trpc.admin.storeLocations.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.admin.storeLocations.delete.useMutation({ onSuccess: () => { utils.admin.storeLocations.list.invalidate(); utils.shop.storeLocations.invalidate(); } });
  const [editing, setEditing] = useState<Store | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Store Locations" subtitle={`${data?.length ?? 0} stores`} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.city}</td>
                <td className="px-4 py-3 text-[var(--text-2)]">{s.address}</td>
                <td className="px-4 py-3"><span className={cn("rounded px-2 py-0.5 text-xs", s.isPickupPoint ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "bg-[var(--ice-dim)] text-[var(--ice)]")}>{s.isPickupPoint ? "Pickup Point" : "Store"}</span></td>
                <td className="px-4 py-3"><span className={cn("rounded px-2 py-0.5 text-xs", s.active ? "bg-emerald-500/15 text-emerald-500" : "bg-[var(--alert)]/15 text-[var(--alert)]")}>{s.active ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: s.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <StoreForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}