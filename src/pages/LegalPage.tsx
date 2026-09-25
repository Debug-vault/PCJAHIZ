import { useParams, Link } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { sanitizeLegalHtml } from "@/lib/legal-pages";

export default function LegalPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = trpc.shop.legalBySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold">Page introuvable</h1>
        <Link to="/" className="text-sm font-bold text-[var(--gold-hot)] hover:underline">← Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--gold-hot)] hover:underline mb-8">
        <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
      </Link>

      <h1 className="font-hud text-3xl font-extrabold text-[var(--text-1)] sm:text-4xl">{page.title}</h1>
      {page.updatedAt && (
        <p className="mt-3 text-xs text-[var(--text-2)]">
          Dernière mise à jour : {new Date(page.updatedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      )}

      <div
        className="mt-8 max-w-none text-sm leading-relaxed text-[var(--text-2)]
          [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-hud [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-1)]
          [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-hud [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[var(--text-1)]
          [&_p]:mb-4 [&_p]:leading-relaxed
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-1
          [&_li]:mb-1
          [&_strong]:font-semibold [&_strong]:text-[var(--text-1)]
          [&_a]:font-semibold [&_a]:text-[var(--gold-hot)] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(page.content) }}
      />
    </article>
  );
}
