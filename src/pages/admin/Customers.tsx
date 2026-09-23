import { Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";

import { PageHeader } from "@/components/admin/PageHeader";

export default function Customers() {
  const { data, isLoading } = trpc.admin.customers.useQuery();
  const { formatPrice } = useI18n();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" subtitle={`${data?.length ?? 0} accounts`} />
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 font-mono">{u.phone ?? "—"}</td>
                <td className="px-4 py-3 font-mono">{Number(u.orderCount)}</td>
                <td className="px-4 py-3 font-mono">{formatPrice(Number(u.totalSpent))}</td>
                <td className="px-4 py-3 text-[var(--text-2)]">{new Date(u.createdAt).toLocaleDateString("en-US")}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-2)]">No customers.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}