import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";

export type LegalPageRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  content: string;
  enabled: boolean;
  inFooter: boolean;
  updatedAt: string;
};

export async function readLegalPages(): Promise<LegalPageRow[]> {
  try {
    const rows = await getDb()
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "legalPages"));
    const v = rows[0]?.value;
    const o = (
      v && typeof v === "object" && "value" in v && (v as { value: unknown }).value !== null && typeof (v as { value: unknown }).value === "object"
        ? (v as { value: unknown }).value
        : v
    ) as Record<string, unknown> | null;
    const pages = o && typeof o === "object" && Array.isArray(o.pages) ? o.pages : [];
    return pages
      .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
      .map((it, i) => ({
        id: typeof it.id === "string" && it.id ? it.id : `lp-${i}`,
        slug: typeof it.slug === "string" ? it.slug : "",
        title: typeof it.title === "string" ? it.title : "",
        type: typeof it.type === "string" ? it.type : "custom",
        content: typeof it.content === "string" ? it.content : "",
        enabled: it.enabled === true,
        inFooter: it.inFooter === true,
        updatedAt: typeof it.updatedAt === "string" ? it.updatedAt : "",
      }))
      .filter((p) => p.slug);
  } catch {
    return [];
  }
}
