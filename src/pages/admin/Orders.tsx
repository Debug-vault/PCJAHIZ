import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

const ORDER_STATUS = ["preparing", "in_transit", "landed", "cancelled"] as const;
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"] as const;

const statusFr: Record<string, string> = {
  preparing: "Préparation",
  in_transit: "En transit",
  landed: "Livrée",
  cancelled: "Annulée",
};
const payFr: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
};

export default function Orders() {
  const { formatPrice } = useI18n();
  const [q, setQ] = useState("");
  const { data, isLoading } = trpc.admin.orders.list.useQuery({});
  const utils = trpc.useUtils();
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.orders.list.invalidate();
      utils.admin.dashboard.invalidate();
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q.trim()) return data;
    const ql = q.toLowerCase();
    return data.filter(
      (o) =>
        o.ref.toLowerCase().includes(ql) ||
        o.customerName.toLowerCase().includes(ql) ||
        o.phone.includes(ql) ||
        (o.email ?? "").toLowerCase().includes(ql),
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
          <h1 className="font-hud text-2xl font-bold">Commandes</h1>
          <p className="text-sm text-[var(--text-2)]">{filtered.length} commandes</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-2)]" />
          <Input className="w-64 pl-9" placeholder="Réf, client, tél…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono font-semibold text-[var(--gold)]">{o.ref}</span>
                <span className="ml-3 text-sm text-[var(--text-2)]">{o.customerName}</span>
                <span className="ml-3 text-sm text-[var(--text-2)]">{o.phone}</span>
                <span className="ml-3 text-sm text-[var(--text-2)]">{o.city}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                  value={o.status}
                  onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as (typeof ORDER_STATUS)[number] })}
                  aria-label="Statut de la commande"
                >
                  {ORDER_STATUS.map((s) => (
                    <option key={s} value={s}>{statusFr[s]}</option>
                  ))}
                </select>
                <select
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                  value={o.paymentStatus}
                  onChange={(e) => updateStatus.mutate({ id: o.id, paymentStatus: e.target.value as (typeof PAYMENT_STATUS)[number] })}
                  aria-label="Statut du paiement"
                >
                  {PAYMENT_STATUS.map((s) => (
                    <option key={s} value={s}>{payFr[s]}</option>
                  ))}
                </select>
                <span className="font-mono text-sm font-bold text-[var(--gold)]">{formatPrice(o.total)}</span>
              </div>
            </div>
            {o.items.length > 0 && (
              <div className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--text-2)]">
                {o.items.map((it) => (
                  <div key={it.id} className="flex justify-between py-0.5">
                    <span>{it.nameFr} × {it.quantity}</span>
                    <span className="font-mono">{formatPrice(it.total)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between text-xs">
                  <span>Livraison : {formatPrice(o.shippingFee)} {o.discount > 0 && <>· Réduction : {formatPrice(o.discount)}</>}</span>
                  <span className="font-mono">{o.payment === "cod" ? "COD" : "CMI"}{o.promoCode ? ` · ${o.promoCode}` : ""}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-[var(--line)] p-10 text-center text-[var(--text-2)]">Aucune commande.</p>
        )}
      </div>
    </div>
  );
}