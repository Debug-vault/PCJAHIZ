import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { settings, products, brands } from "@db/schema";
import { and, ilike, or, asc, gte, lte } from "drizzle-orm";

export type AiConfig = {
  enabled: boolean;
  models: string[];
  apiKey: string | null;
  systemPrompt: string | null;
};

export const DEFAULT_AI_MODEL = "gemini-2.0-flash";
export const FREE_AI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

export async function getAiConfig(): Promise<AiConfig> {
  const full = await getDb()
    .select()
    .from(settings)
    .where(
      or(
        eq(settings.key, "aiEnabled"),
        eq(settings.key, "aiModel"),
        eq(settings.key, "aiApiKey"),
        eq(settings.key, "aiSystemPrompt"),
      ),
    );
  const map = new Map<string, unknown>();
  for (const r of full) map.set(r.key, r.value);

  const str = (k: string) => {
    const v = map.get(k);
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && "value" in (v as { value?: unknown })) {
      const inner = (v as { value?: unknown }).value;
      return typeof inner === "string" ? inner : "";
    }
    return "";
  };
  const bool = (k: string) => {
    const v = map.get(k);
    if (typeof v === "boolean") return v;
    if (v && typeof v === "object" && "value" in (v as { value?: unknown })) {
      return (v as { value?: boolean }).value === true;
    }
    return false;
  };

  const enabled = bool("aiEnabled");
  const models = [...new Set(str("aiModel").split(/[\n,;]/).map((m) => m.trim()).filter(Boolean))];
  return {
    enabled,
    models: models.length ? models : FREE_AI_MODELS,
    apiKey: str("aiApiKey") || process.env.GEMINI_API_KEY || null,
    systemPrompt: str("aiSystemPrompt") || null,
  };
}

export type SearchProductResult = {
  slug: string;
  nameFr: string;
  nameAr: string;
  priceMAD: number;
  stock: number;
  summary: string;
  brand: string;
};

export async function searchProducts(params: {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
}): Promise<SearchProductResult[]> {
  const db = getDb();
  const conds = [];
  if (params.query) {
    const q = `%${params.query}%`;
    conds.push(
      or(
        ilike(products.nameFr, q),
        ilike(products.nameAr, q),
        ilike(products.summaryFr, q),
        ilike(products.summaryAr, q),
      ),
    );
  }
  if (params.brand) conds.push(ilike(brands.name, `%${params.brand}%`));
  if (params.minPrice != null) conds.push(gte(products.price, params.minPrice));
  if (params.maxPrice != null) conds.push(lte(products.price, params.maxPrice));

  const rows = await db
    .select({
      slug: products.slug,
      nameFr: products.nameFr,
      nameAr: products.nameAr,
      price: products.price,
      summaryFr: products.summaryFr,
      stock: products.stock,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandSlug, brands.slug))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(products.price))
    .limit(8);

  return rows.map((p) => ({
    slug: p.slug,
    nameFr: p.nameFr,
    nameAr: p.nameAr,
    priceMAD: p.price,
    stock: p.stock,
    summary: p.summaryFr ?? "",
    brand: p.brandName ?? "",
  }));
}

export function buildChatSystem(deps: {
  storeName: string;
  contactPhone: string | null;
  locale: string;
  systemPrompt?: string | null;
}): string {
  const base = `Tu es l'assistant de vente de ${deps.storeName}, boutique marocaine d'électronique et high-tech (ordinateurs, smartphones, audio, accessoires).
Règles :
- Réponds dans la langue du client (français ou darija marocain), de façon chaleureuse et concise.
- Prix en dirhams (MAD). Livraison 24-48h partout au Maroc. Paiement à la livraison (COD) et par carte (CMI).
- Retour/échange sous 7 jours.
${deps.contactPhone ? `- Pour commander par WhatsApp : wa.me/${deps.contactPhone.replace(/\D/g, "")}.` : ""}
- Utilise l'outil searchProducts pour recommander de vrais produits du catalogue. Cite le prix exact en MAD.
- Si tu recommandes un produit, donne son nom, son prix et un lien vers /${deps.locale}/product/{slug}.
- N'invente jamais un produit ni un prix. Si rien ne correspond, dis-le et propose des alternatives.`;
  if (deps.systemPrompt) {
    return `${base}\n\nInstructions supplémentaires de la boutique :\n${deps.systemPrompt}`;
  }
  return base;
}

const TOOL_DECL = {
  name: "searchProducts",
  description:
    "Recherche des produits dans le catalogue en ligne PC Jahiz. Utilise ceci quand le client demande une recommandation ou un produit. Retourne nom, prix en MAD, disponibilité et lien.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Mots-clés de recherche (nom, marque, usage…). Peut être en français ou en darija." },
      minPrice: { type: "number", description: "Prix minimum en MAD" },
      maxPrice: { type: "number", description: "Prix maximum en MAD" },
      brand: { type: "string", description: "Nom de la marque souhaitée" },
    },
  },
};

export type ChatMessage = { role: "user" | "model"; content: string };

export async function chatWithGemini(
  cfg: AiConfig,
  messages: ChatMessage[],
  system: string,
): Promise<string> {
  const models = cfg.models.length ? cfg.models : FREE_AI_MODELS;
  let lastErr: unknown;

  for (const model of models) {
    try {
      return await runGeminiTurn(cfg.apiKey!, model, messages, system);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("ai_all_models_failed");
}

type GeminiPart = {
  text?: string;
  thoughtSignature?: string;
  functionCall?: {
    name?: string;
    args?: Record<string, unknown>;
    thought_signature?: string;
  };
};
type GeminiResponse = { candidates?: { content?: { parts?: GeminiPart[] } }[] };

async function parseGeminiResponse(res: Response): Promise<GeminiResponse> {
  try {
    return (await res.json()) as GeminiResponse;
  } catch {
    return {};
  }
}

async function runGeminiTurn(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  system: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  type GeminiContent = {
    role: "user" | "model";
    parts: Record<string, unknown>[];
  };
  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const baseBody: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    tools: [{ functionDeclarations: [TOOL_DECL] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  for (let round = 0; round < 4; round++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...baseBody, contents }),
    });
    const data = await parseGeminiResponse(res);

    if (!res.ok) {
      throw new Error(`gemini_http_${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const fc = parts.find((p) => p.functionCall);

    if (!fc?.functionCall) {
      return parts.find((p) => p.text)?.text ?? "";
    }

    // Execute the tool and append the functionCall + functionResponse parts.
    const args = fc.functionCall.args ?? {};
    const fcPart: Record<string, unknown> = {
      functionCall: { name: "searchProducts", args },
    };
    if (fc.thoughtSignature) {
      fcPart.thoughtSignature = fc.thoughtSignature;
    }
    const result = await searchProducts(args);

    contents.push({ role: "model", parts: [fcPart] });
    contents.push({
      role: "user",
      parts: [{ functionResponse: { name: "searchProducts", response: { result } } }],
    });
  }

  throw new Error("gemini_too_many_tool_rounds");
}