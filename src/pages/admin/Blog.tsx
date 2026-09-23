import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import type { AppRouter } from "../../../api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type BlogPost = inferRouterOutputs<AppRouter>["admin"]["blog"]["list"][number];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function PostForm({ initial, onClose }: { initial: BlogPost | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: cats } = trpc.admin.blogCategories.list.useQuery();
  const create = trpc.admin.blog.create.useMutation({
    onSuccess: () => { utils.admin.blog.list.invalidate(); utils.shop.blog.invalidate(); onClose(); },
  });
  const update = trpc.admin.blog.update.useMutation({
    onSuccess: () => { utils.admin.blog.list.invalidate(); utils.shop.blog.invalidate(); onClose(); },
  });
  const generatePost = trpc.ai.generateBlogPost.useMutation();
  const [f, setF] = useState(() => ({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    coverImage: initial?.coverImage ?? "",
    categorySlug: initial?.categorySlug ?? "",
    tags: Array.isArray(initial?.tags) ? (initial!.tags as string[]) : ([] as string[]),
    status: (initial?.status ?? "draft") as "draft" | "published" | "archived",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    authorName: initial?.authorName ?? "PC Jahiz",
  }));
  const [error, setError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const result = await generatePost.mutateAsync({ topic: aiTopic, category: f.categorySlug || undefined });
      setF((s) => ({
        ...s,
        title: result.title,
        excerpt: result.excerpt,
        body: result.body,
        tags: result.tags,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        slug: s.slug || slugify(result.title),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI error.");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!f.slug.trim()) { setError("Slug is required."); return; }
    if (!f.title.trim()) { setError("Title is required."); return; }
    const payload = {
      slug: f.slug.trim(),
      title: f.title.trim(),
      excerpt: f.excerpt || null,
      body: f.body || null,
      coverImage: f.coverImage || null,
      categorySlug: f.categorySlug || null,
      tags: f.tags,
      status: f.status,
      seoTitle: f.seoTitle || null,
      seoDescription: f.seoDescription || null,
      authorName: f.authorName || null,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{initial ? "Edit post" : "New post"}</DialogTitle>
              <DialogDescription>Write or generate a blog post for PC Jahiz.</DialogDescription>
            </div>
            <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Save" : "Publish"}
            </Button>
          </div>
        </DialogHeader>

        {/* AI Generate Section */}
        {!initial && (
          <div className="rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-dim)]/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[var(--gold)]" />
              <span className="text-sm font-semibold text-[var(--gold)]">Generate with AI</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="E.g. Best gaming laptops 2026 in Morocco"
                onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
              />
              <Button onClick={handleAiGenerate} disabled={aiLoading || !aiTopic.trim()} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--alert)]">{error}</p>}

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Slug</Label><Input value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="meilleurs-pc-gaming-2026" /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={f.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Excerpt</Label><Input value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Summary in 1-2 sentences" /></div>
          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <textarea
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[200px] font-mono"
              value={f.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="# Post title&#10;&#10;Content in markdown..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={f.categorySlug} onChange={(e) => set("categorySlug", e.target.value)}>
                <option value="">None</option>
                {(cats ?? []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label>Author</Label><Input value={f.authorName} onChange={(e) => set("authorName", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Cover image (URL)</Label><Input value={f.coverImage} onChange={(e) => set("coverImage", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={f.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>SEO Title</Label><Input value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="60 chars max" /></div>
            <div className="space-y-1.5"><Label>SEO Description</Label><Input value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="155 chars max" /></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
            {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? "Save" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManager() {
  const utils = trpc.useUtils();
  const { data: cats } = trpc.admin.blogCategories.list.useQuery();
  const create = trpc.admin.blogCategories.create.useMutation({ onSuccess: () => utils.admin.blogCategories.list.invalidate() });
  const del = trpc.admin.blogCategories.delete.useMutation({ onSuccess: () => utils.admin.blogCategories.list.invalidate() });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const add = () => {
    if (!name.trim() || !slug.trim()) return;
    create.mutate({ slug: slug.trim(), name: name.trim() });
    setName(""); setSlug("");
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--page)] p-4">
      <h3 className="font-hud text-sm font-bold mb-3">Blog Categories</h3>
      <div className="flex gap-2 mb-3">
        <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} placeholder="Name" className="flex-1" />
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="w-32" />
        <Button onClick={add} disabled={create.isPending} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {(cats ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-white/5">
            <span>{c.name} <span className="text-[var(--text-2)]">({c.slug})</span></span>
            <button onClick={() => del.mutate({ id: c.id })} className="text-[var(--alert)] hover:underline text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BlogAdmin() {
  const { data: posts, isLoading } = trpc.admin.blog.list.useQuery();
  const del = trpc.admin.blog.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().admin.blog.list.invalidate();
    },
  });
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCats, setShowCats] = useState(false);

  const statusBadge = (s: string) => {
    const cls = s === "published" ? "bg-green-500/20 text-green-400" : s === "draft" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400";
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{s}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-hud text-xl font-bold">Blog</h1>
          <p className="text-sm text-[var(--text-2)]">Blog posts and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCats(!showCats)} className="text-sm">
            <BookOpen className="mr-2 h-4 w-4" /> Categories
          </Button>
          <Button onClick={() => setCreating(true)} className="bg-[var(--gold)] text-black hover:bg-[var(--gold-hot)]">
            <Plus className="mr-2 h-4 w-4" /> New post
          </Button>
        </div>
      </div>

      {showCats && <div className="mb-6"><CategoryManager /></div>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>
      ) : (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--page)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[var(--text-2)]">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-[var(--text-2)]">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{new Date(p.createdAt).toLocaleDateString("en-US")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(p)} className="mr-3 text-[var(--ice)] hover:underline"><Pencil className="inline h-4 w-4" /></button>
                    <button onClick={() => { if (confirm("Delete this post?")) del.mutate({ id: p.id }); }} className="text-[var(--alert)] hover:underline"><Trash2 className="inline h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {(posts ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--text-2)]">No posts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <PostForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}
