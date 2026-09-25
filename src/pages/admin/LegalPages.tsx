import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Scale, Sparkles, ExternalLink, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DEFAULT_SETTINGS, type FooterLegalConfig } from "@/lib/settings";
import {
  LEGAL_PAGE_TYPES,
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPages,
  legalSlugify,
  syncFooterLegalLinks,
  type LegalPage,
  type LegalPageType,
} from "@/lib/legal-pages";

function unwrapValue(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if ("value" in o && o.value !== null && typeof o.value === "object") return o.value as Record<string, unknown>;
  return o;
}

function typeLabel(t: string) {
  return LEGAL_PAGE_TYPES.find((x) => x.value === t)?.label ?? t;
}

type Draft = {
  id: string | null;
  slug: string;
  title: string;
  type: LegalPageType;
  content: string;
  enabled: boolean;
  inFooter: boolean;
  hint: string;
};

function PageDialog({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: Draft;
  onClose: () => void;
  onSave: (d: Draft) => void;
  saving: boolean;
}) {
  const generate = trpc.ai.generateLegalPage.useMutation();
  const [d, setD] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const canGenerate = d.type !== "custom" || !!d.title.trim();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    try {
      const res = await generate.mutateAsync({
        type: d.type,
        customTitle: d.title || undefined,
        hint: d.hint || undefined,
      });
      setD((s) => ({
        ...s,
        title: s.title.trim() || res.title,
        slug: s.slug.trim() || legalSlugify(res.title),
        content: res.content,
      }));
      toast.success("AI content generated — review it, then save.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Edit legal page" : "New legal page"}</DialogTitle>
          <DialogDescription>
            Generated content is plain French HTML. Review before publishing — legal text should match your real company data.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-sm font-semibold text-[var(--gold)]">Generate with AI</span>
          </div>
          <div className="space-y-2">
            <textarea
              className="w-full rounded-md border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm"
              rows={2}
              value={d.hint}
              onChange={(e) => set("hint", e.target.value)}
              placeholder="Optional context: company address, host name, RCS details, phone…"
            />
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending || !canGenerate}
              className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]"
            >
              {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {generate.isPending ? "Generating…" : d.content ? "Regenerate" : "Generate content"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Page type</Label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={d.type}
                onChange={(e) => {
                  const t = e.target.value as LegalPageType;
                  const spec = LEGAL_PAGE_TYPES.find((x) => x.value === t);
                  setD((s) => ({
                    ...s,
                    type: t,
                    title: s.title.trim() || spec?.defaultTitle || "",
                    slug: s.slug.trim() || spec?.defaultSlug || "",
                  }));
                }}
              >
                {LEGAL_PAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL: /legal/…)</Label>
              <Input value={d.slug} onChange={(e) => set("slug", legalSlugify(e.target.value))} placeholder="mentions-legales" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Mentions légales" />
          </div>
          <div className="space-y-1.5">
            <Label>Content (HTML)</Label>
            <textarea
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[260px] font-mono"
              value={d.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="<h2>Section</h2>&#10;<p>…</p>"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={d.enabled} onChange={(e) => set("enabled", e.target.checked)} className="accent-[var(--gold)]" />
              Published (live at /legal/{d.slug || "…"})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={d.inFooter} onChange={(e) => set("inFooter", e.target.checked)} className="accent-[var(--gold)]" />
              Show in footer legal bar
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(d)} disabled={saving || !d.title.trim() || !d.slug.trim()} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LegalPagesAdmin() {
  const utils = trpc.useUtils();
  const { data: rows } = trpc.admin.settings.get.useQuery();
  const update = trpc.admin.settings.update.useMutation();
  const generate = trpc.ai.generateLegalPage.useMutation();

  const [pages, setPages] = useState<LegalPage[]>(DEFAULT_LEGAL_PAGES);
  const [footerLegal, setFooterLegal] = useState<FooterLegalConfig>(DEFAULT_SETTINGS.footerLegal);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkInfo, setBulkInfo] = useState("");

  useEffect(() => {
    if (!rows) return;
    const legalRow = rows.find((r) => r.key === "legalPages");
    setPages(legalRow ? normalizeLegalPages(legalRow.value) : DEFAULT_LEGAL_PAGES);
    const flRow = rows.find((r) => r.key === "footerLegal");
    const o = flRow ? unwrapValue(flRow.value) : null;
    if (o) {
      const dfl = DEFAULT_SETTINGS.footerLegal;
      setFooterLegal({
        enabled: typeof o.enabled === "boolean" ? o.enabled : dfl.enabled,
        legalText: typeof o.legalText === "string" ? o.legalText : dfl.legalText,
        rightsText: typeof o.rightsText === "string" ? o.rightsText : dfl.rightsText,
        links: Array.isArray(o.links)
          ? (o.links as Record<string, unknown>[])
              .filter((l) => l && typeof l === "object")
              .map((l) => ({
                label: typeof l.label === "string" ? l.label : "",
                url: typeof l.url === "string" ? l.url : "#",
              }))
          : dfl.links,
      });
    }
  }, [rows]);

  const persist = async (nextPages: LegalPage[]) => {
    const synced = syncFooterLegalLinks(nextPages, footerLegal);
    setPages(nextPages);
    setFooterLegal(synced);
    try {
      await update.mutateAsync({
        values: {
          legalPages: { value: { pages: nextPages } },
          footerLegal: { value: synced },
        },
      });
      utils.admin.settings.get.invalidate();
      utils.shop.legalPages.invalidate();
      utils.shop.legalBySlug.invalidate();
      utils.shop.settings.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const saveDraft = (d: Draft) => {
    if (pages.some((p) => p.slug === d.slug && p.id !== d.id)) {
      toast.error(`Slug "/legal/${d.slug}" is already used by another page.`);
      return;
    }
    const now = new Date().toISOString();
    const next = d.id
      ? pages.map((p) => (p.id === d.id ? { ...p, slug: d.slug, title: d.title.trim(), type: d.type, content: d.content, enabled: d.enabled, inFooter: d.inFooter, updatedAt: now } : p))
      : [...pages, { id: `lp-${Date.now()}`, slug: d.slug, title: d.title.trim(), type: d.type, content: d.content, enabled: d.enabled, inFooter: d.inFooter, updatedAt: now }];
    setDraft(null);
    void persist(next).then(() => toast.success("Legal page saved."));
  };

  const quickGenerate = async (page: LegalPage) => {
    setBusyId(page.id);
    try {
      const res = await generate.mutateAsync({ type: page.type, customTitle: page.title || undefined });
      const now = new Date().toISOString();
      const next = pages.map((p) =>
        p.id === page.id ? { ...p, title: p.title.trim() || res.title, content: res.content, updatedAt: now } : p,
      );
      await persist(next);
      toast.success(`AI content ready for "${page.title}".`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setBusyId(null);
    }
  };

  const generateMissing = async () => {
    const missing = pages.filter((p) => !p.content.trim() && (p.type !== "custom" || p.title.trim()));
    if (!missing.length) {
      toast.info("All pages already have content.");
      return;
    }
    let working = [...pages];
    let failed = 0;
    for (let i = 0; i < missing.length; i++) {
      const target = missing[i];
      setBulkInfo(`Generating ${i + 1}/${missing.length} — ${target.title}`);
      try {
        const res = await generate.mutateAsync({ type: target.type, customTitle: target.title || undefined });
        working = working.map((p) =>
          p.id === target.id ? { ...p, title: p.title.trim() || res.title, content: res.content, updatedAt: new Date().toISOString() } : p,
        );
      } catch {
        failed++;
      }
    }
    setBulkInfo("");
    await persist(working);
    toast.success(failed ? `Generated ${missing.length - failed}/${missing.length} pages (${failed} failed).` : `Generated ${missing.length} pages.`);
  };

  const removePage = (id: string) => {
    void persist(pages.filter((p) => p.id !== id));
  };

  const restoreDefaults = () => {
    const missing = DEFAULT_LEGAL_PAGES.filter((d) => !pages.some((p) => p.id === d.id));
    if (!missing.length) {
      toast.info("All default pages are present.");
      return;
    }
    void persist([...pages, ...missing]);
  };

  const isGeneratingAll = generate.isPending || !!bulkInfo;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-hud text-xl font-bold flex items-center gap-2"><Scale className="h-5 w-5 text-[var(--gold)]" /> Legal Pages</h1>
          <p className="text-sm text-[var(--text-2)]">AI-generated legal content for PC Jahiz — published at /legal/…</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={restoreDefaults} className="text-sm" title="Re-add missing default pages">
            <RotateCcw className="mr-2 h-4 w-4" /> Restore defaults
          </Button>
          <Button onClick={() => void generateMissing()} disabled={isGeneratingAll} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)] text-sm">
            {bulkInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {bulkInfo || "Generate missing"}
          </Button>
          <Button
            onClick={() => setDraft({ id: null, slug: "", title: "", type: "mentions-legales", content: "", enabled: false, inFooter: false, hint: "" })}
            className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]"
          >
            <Plus className="mr-2 h-4 w-4" /> New page
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--page)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[var(--text-2)]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.title || <span className="text-[var(--text-2)]">(untitled)</span>}</p>
                  <p className="text-xs text-[var(--text-2)]">{typeLabel(p.type)}</p>
                </td>
                <td className="px-4 py-3">
                  <a href={`/legal/${p.slug}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-[var(--ice)] hover:underline">
                    /legal/{p.slug} <ExternalLink className="inline h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {p.enabled ? "LIVE" : "DRAFT"}
                    </span>
                    {p.enabled && p.inFooter && (
                      <span className="rounded-full bg-[var(--gold-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold)]">FOOTER</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.content.trim() ? (
                    <span className="text-xs text-green-400">AI ✓ {p.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length} words</span>
                  ) : (
                    <span className="text-xs text-[var(--text-2)]">empty</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-2)]">
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => void quickGenerate(p)}
                    disabled={busyId === p.id || (p.type === "custom" && !p.title.trim())}
                    className="mr-3 text-[var(--gold)] hover:underline disabled:opacity-40"
                    title="Generate content with AI"
                  >
                    {busyId === p.id ? <Loader2 className="inline h-4 w-4 animate-spin" /> : <Sparkles className="inline h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDraft({ id: p.id, slug: p.slug, title: p.title, type: p.type, content: p.content, enabled: p.enabled, inFooter: p.inFooter, hint: "" })}
                    className="mr-3 text-[var(--ice)] hover:underline"
                  >
                    <Pencil className="inline h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${p.title}"?`)) removePage(p.id); }}
                    className="text-[var(--alert)] hover:underline"
                  >
                    <Trash2 className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-2)]">No pages — restore defaults or create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--text-2)]">
        Pages marked <span className="font-bold text-[var(--gold)]">LIVE</span> are publicly accessible at their URL. Pages marked{" "}
        <span className="font-bold text-[var(--gold)]">FOOTER</span> are linked automatically in the footer legal bar
        (Settings → Brand &amp; Identity → Legal bar).
      </p>

      {draft && (
        <PageDialog
          initial={draft}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
          saving={update.isPending}
        />
      )}
    </div>
  );
}
