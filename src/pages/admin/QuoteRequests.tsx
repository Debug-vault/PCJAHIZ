import { Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";

type Quote = inferRouterOutputs<AppRouter>["admin"]["quoteRequests"]["list"][number];

import { PageHeader } from "@/components/admin/PageHeader";

export default function QuoteRequests() {
  const { data, isLoading } = trpc.admin.quoteRequests.list.useQuery();
  const utils = trpc.useUtils();
  const setStatus = trpc.admin.quoteRequests.setStatus.useMutation({ onSuccess: () => utils.admin.quoteRequests.list.invalidate() });
  const remove = trpc.admin.quoteRequests.delete.useMutation({ onSuccess: () => utils.admin.quoteRequests.list.invalidate() });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  const statusStyles: Record<Quote["status"], string> = {
    new: "bg-[var(--gold-dim)] text-[var(--gold)]",
    contacted: "bg-[var(--ice-dim)] text-[var(--ice)]",
    done: "bg-emerald-500/15 text-emerald-500",
  };
  const statusLabels: Record<Quote["status"], string> = { new: "New", contacted: "Contacted", done: "Done" };

  return (
    <div className="space-y-4">
      <PageHeader title="Quote Requests" subtitle={`${data?.length ?? 0} requests`} />
      <div className="grid gap-4">
        {(data ?? []).map((q) => (
          <div key={q.id} className="rounded-xl border border-[var(--line)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-hud text-base font-bold text-[var(--text-1)]">{q.name}</p>
                <p className="text-sm text-[var(--text-2)]">
                  {q.company ? `${q.company} · ` : ""}{q.email}{q.phone ? ` · ${q.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={q.status}
                  onChange={(e) => setStatus.mutate({ id: q.id, status: e.target.value as Quote["status"] })}
                  className={cn("rounded-md border border-[var(--line)] px-2 py-1 text-xs", statusStyles[q.status])}
                >
                  {(Object.keys(statusLabels) as Quote["status"][]).map((s) => (
                    <option key={s} value={s} className="bg-[var(--page)] text-[var(--text-1)]">{statusLabels[s]}</option>
                  ))}
                </select>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: q.id })} aria-label="Delete"><Trash2 className="h-4 w-4 text-[var(--alert)]" /></Button>
              </div>
            </div>
            {q.details ? <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--page-soft)] p-3 text-sm text-[var(--text-1)]">{q.details}</p> : null}
            <p className="mt-2 font-mono text-xs text-[var(--text-2)]">{new Date(q.createdAt).toLocaleString("en-US")}</p>
          </div>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-[var(--text-2)]">No requests yet.</p>}
      </div>
    </div>
  );
}