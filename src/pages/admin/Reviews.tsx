import { Loader2, Star, Trash2, Check, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { PageHeader } from "@/components/admin/PageHeader";

export default function Reviews() {
  const { data, isLoading } = trpc.admin.reviews.list.useQuery();
  const utils = trpc.useUtils();
  const moderate = trpc.admin.reviews.moderate.useMutation({
    onSuccess: () => {
      utils.admin.reviews.list.invalidate();
      utils.admin.dashboard.invalidate();
    },
  });
  const remove = trpc.admin.reviews.delete.useMutation({ onSuccess: () => utils.admin.reviews.list.invalidate() });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  const badge = (s: string) =>
    cn(
      "rounded px-2 py-0.5 text-xs font-medium",
      s === "approved" && "bg-emerald-500/15 text-emerald-400",
      s === "pending" && "bg-amber-500/15 text-amber-400",
      s === "rejected" && "bg-[var(--alert)]/15 text-[var(--alert)]",
    );

  return (
    <div className="space-y-4">
      <PageHeader title="Reviews" subtitle={`${data?.length ?? 0} reviews`} />
      <div className="space-y-3">
        {(data ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.author}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--text-2)]")} />
                  ))}
                </span>
                {r.city && <span className="text-xs text-[var(--text-2)]">{r.city}</span>}
              </div>
              <span className={badge(r.status)}>{r.status}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-2)]">{r.comment}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-2)]">
              <span>{new Date(r.createdAt).toLocaleDateString("en-US")}</span>
              <div className="flex gap-2">
                {r.status !== "approved" && (
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, status: "approved" })}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, status: "rejected" })}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate({ id: r.id })} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5 text-[var(--alert)]" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-[var(--line)] p-10 text-center text-[var(--text-2)]">No reviews.</p>
        )}
      </div>
    </div>
  );
}