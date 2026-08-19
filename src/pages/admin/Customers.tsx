import { Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";

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
      <div>
        <h1 className="font-hud text-2xl font-bold">Clients</h1>
        <p className="text-sm text-[var(--text-2)]">{data?.length ?? 0} comptes</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Total dépensé</th>
              <th className="px-4 py-3">Inscrit le</th>
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
                <td className="px-4 py-3 text-[var(--text-2)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-2)]">Aucun client.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}