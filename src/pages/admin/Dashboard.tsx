import { Link } from "react-router";
import { Box, ShoppingBag, Users, Star, Banknote, AlertTriangle, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";

import { PageHeader } from "@/components/admin/PageHeader";

export default function Dashboard() {
  const { data, isLoading } = trpc.admin.dashboard.useQuery();
  const { formatPrice } = useI18n();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  const cards = [
    { label: "Products", value: String(data.activeProductCount), sub: `${data.productCount} total`, icon: Box },
    { label: "Orders", value: String(data.orderCount), sub: "all", icon: ShoppingBag },
    { label: "Revenue", value: formatPrice(data.revenue), sub: "excl. cancelled", icon: Banknote },
    { label: "Customers", value: String(data.customerCount), sub: "accounts", icon: Users },
    { label: "Pending Reviews", value: String(data.pendingReviewCount), sub: "to moderate", icon: Star },
  ];

  const statusLabel: Record<string, string> = {
    preparing: "Preparing",
    in_transit: "In Transit",
    landed: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of your store." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-2)]">
              <c.icon className="h-4 w-4" />
              <span className="text-xs">{c.label}</span>
            </div>
            <div className="mt-2 font-hud text-2xl font-bold text-[var(--gold)]">{c.value}</div>
            <div className="text-xs text-[var(--text-2)]">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5">
          <h2 className="mb-4 font-hud text-base font-bold">Recent Orders</h2>
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <Link
                key={o.id}
                to={`/admin/orders?ref=${encodeURIComponent(o.ref)}`}
                className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-sm transition-colors hover:border-[var(--line-strong)]"
              >
                <div>
                  <span className="font-mono text-[var(--gold)]">{o.ref}</span>
                  <span className="ml-3 text-[var(--text-2)]">{o.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatPrice(o.total)}</span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-[var(--text-2)]">
                    {statusLabel[o.status] ?? o.status}
                  </span>
                </div>
              </Link>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-sm text-[var(--text-2)]">No orders yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5">
          <h2 className="mb-4 font-hud text-base font-bold">Low Stock</h2>
          <div className="space-y-2">
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--alert)]" />
                  <span>{p.nameFr}</span>
                </div>
                <span className="font-mono text-[var(--alert)]">{p.stock} remaining</span>
              </div>
            ))}
            {data.lowStock.length === 0 && <p className="text-sm text-[var(--text-2)]">Stock is healthy.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5">
        <h2 className="mb-4 font-hud text-base font-bold">Top Selling Products</h2>
        <div className="space-y-2">
          {data.topProducts.map((tp, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
              <span className="truncate">{tp.name}</span>
              <span className="font-mono text-[var(--text-2)]">{tp.qty} sold · {formatPrice(Number(tp.total))}</span>
            </div>
          ))}
          {data.topProducts.length === 0 && <p className="text-sm text-[var(--text-2)]">No sales recorded.</p>}
        </div>
      </section>
    </div>
  );
}