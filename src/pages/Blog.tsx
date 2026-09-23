import { Link } from "react-router";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionHead } from "@/components/storefront/section-head";

export default function Blog() {
  const { data: posts, isLoading } = trpc.shop.blog.useQuery();
  const { data: cats } = trpc.shop.blogCategories.useQuery();

  return (
    <div className="mx-auto max-w-[var(--store-max-width)] px-4 py-14 sm:px-6">
      <SectionHead eyebrow="Blog" title="Actualités & Guides" />

      {cats && cats.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <span key={c.id} className="rounded-full border border-[var(--line)] bg-[var(--page-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--text-2)]">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>
      ) : !posts || posts.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-2)]">
          <p className="font-hud text-lg font-bold">Aucun article pour le moment</p>
          <p className="mt-2 text-sm">Revenez bientôt, nous préparons du contenu pour vous.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--page)] transition-all hover:border-[var(--gold-hot)] hover:shadow-lg"
            >
              {post.coverImage ? (
                <div className="aspect-video overflow-hidden">
                  <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-[var(--gold-dim)] to-[var(--page-soft)] flex items-center justify-center">
                  <span className="font-hud text-4xl font-bold text-[var(--gold)]/30">PJ</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
                  {post.authorName && <span>· {post.authorName}</span>}
                </div>
                <h2 className="mt-2 font-hud text-base font-bold text-[var(--text-1)] group-hover:text-[var(--gold-hot)] line-clamp-2">{post.title}</h2>
                {post.excerpt && <p className="mt-2 text-sm text-[var(--text-2)] line-clamp-2">{post.excerpt}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--gold-hot)] group-hover:underline">
                  Lire <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
