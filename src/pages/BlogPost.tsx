import { useParams, Link } from "react-router";
import { Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

function renderMarkdown(md: string) {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-2 font-hud text-lg font-bold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 font-hud text-xl font-bold">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="my-3 space-y-1">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
    .replace(/^(?!<[hul])/gm, '')
    .replace(/^/, '<p class="mb-4 leading-relaxed">')
    .replace(/$/, '</p>');
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = trpc.shop.blogBySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  const tags = (Array.isArray(post?.tags) ? post.tags : []) as string[];

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  if (!post) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold">Article introuvable</h1>
        <Link to="/blog" className="text-sm font-bold text-[var(--gold-hot)] hover:underline">← Retour au blog</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--gold-hot)] hover:underline mb-8">
        <ArrowLeft className="h-4 w-4" /> Retour au blog
      </Link>

      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="w-full rounded-2xl object-cover max-h-[400px]" />
      )}

      <div className="flex items-center gap-2 text-xs text-[var(--text-2)] mt-6">
        <Calendar className="h-3.5 w-3.5" />
        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
        {post.authorName && <span>· {post.authorName}</span>}
      </div>

      <h1 className="mt-3 font-hud text-3xl font-extrabold text-[var(--text-1)] sm:text-4xl">{post.title}</h1>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[var(--gold-dim)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">{tag}</span>
          ))}
        </div>
      )}

      {post.body && (
        <div
          className="prose prose-invert mt-8 max-w-none text-[var(--text-2)] [&_h2]:text-[var(--text-1)] [&_h3]:text-[var(--text-1)] [&_strong]:text-[var(--text-1)]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
      )}
    </article>
  );
}
