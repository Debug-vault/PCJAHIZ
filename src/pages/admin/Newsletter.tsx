import { Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

import { PageHeader } from "@/components/admin/PageHeader";

export default function Newsletter() {
  const { data, isLoading } = trpc.admin.newsletter.list.useQuery();

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Newsletter" subtitle={`${data?.length ?? 0} subscribers`} />
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--void-2)] text-left text-xs uppercase tracking-wider text-[var(--text-2)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{s.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">{new Date(s.createdAt).toLocaleDateString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}