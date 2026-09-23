import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { aiGenerateJson, delay } from "./lib/ai";

const SYSTEM_FR = `Tu es un expert e-commerce spécialisé dans la vente de matériel informatique et électronique au Maroc.
Tu écris toujours en français professionnel, orienté SEO, pour la marque "PC Jahiz".
Les prix sont en dirhams marocains (MAD). Tu connais bien le marché tech marocain.
Réponds TOUJOURS avec du JSON valide quand on te le demande, sans texte avant ou après.
IMPORTANT: Le JSON doit être strictement valide — pas de virgules finales, pas de commentaires, pas de texte hors du JSON. Chaque chaîne doit être correctement échappée.`;

async function generate<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  return aiGenerateJson<T>({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    noCache: true,
  });
}

// ===== URL/Product Reference Extraction =====
interface ExtractedProduct {
  name?: string;
  brand?: string;
  price?: string;
  description?: string;
  specs?: string;
  imageUrl?: string;
  sku?: string;
  source?: string;
}

async function extractFromUrl(url: string): Promise<ExtractedProduct> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PCJahizBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return { source: "URL inaccessible" };

    const html = await res.text();
    const result: ExtractedProduct = { source: url };

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.name = titleMatch[1].trim().substring(0, 200);

    // Extract meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      ?? html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (descMatch) result.description = descMatch[1].trim().substring(0, 500);

    // Extract Open Graph tags
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle && !result.name) result.name = ogTitle[1].trim();

    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImage) result.imageUrl = ogImage[1].trim();

    // Extract JSON-LD Product schema
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const ld = JSON.parse(match[1]);
        const product = ld["@type"] === "Product" ? ld : ld?.["graph"]?.find((g: { "@type"?: string }) => g["@type"] === "Product");
        if (product) {
          if (product.sku) result.sku = String(product.sku);
          if (product.name && !result.name) result.name = String(product.name);
          if (product.brand?.name) result.brand = String(product.brand.name);
          if (product.description && !result.description) result.description = String(product.description).substring(0, 500);
          if (product.offers?.price) result.price = String(product.offers.price);
          if (product.image) result.imageUrl = Array.isArray(product.image) ? product.image[0] : String(product.image);
          if (product.additionalProperty?.length) {
            result.specs = product.additionalProperty
              .map((p: { name?: string; value?: string }) => `${p.name}: ${p.value}`)
              .join("\n");
          }
          break;
        }
      } catch { /* skip invalid JSON-LD */ }
    }

    // Extract specs from common patterns
    if (!result.specs) {
      const specPatterns = [
        /(?:caractéristiques|spécifications|specs|tech)[\s\S]{0,100}(<(?:table|dl|ul)[^>]*>[\s\S]*?<\/(?:table|dl|ul)>)/i,
        /class=["'][^"']*(?:spec|feature|detail|tech)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      ];
      for (const pattern of specPatterns) {
        const specMatch = html.match(pattern);
        if (specMatch) {
          const cleaned = specMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (cleaned.length > 20) {
            result.specs = cleaned.substring(0, 1000);
            break;
          }
        }
      }
    }

    // Extract SKU from common patterns if not found in JSON-LD
    if (!result.sku) {
      const skuPatterns = [
        /<meta\s+property=["']product:retailer_item_id["']\s+content=["']([^"']+)["']/i,
        /<span\s+class=["'][^"']*sku[^"']*["'][^>]*>([^<]+)<\/span>/i,
        /(?:sku|référence|ref\.?|model|mpn)["\s:]+([A-Z0-9][\w\-\.]+)/i,
      ];
      for (const pattern of skuPatterns) {
        const match = html.match(pattern);
        if (match) {
          result.sku = match[1].trim().substring(0, 50);
          break;
        }
      }
    }

    return result;
  } catch {
    return { source: "Erreur lors de l'accès à l'URL" };
  }
}

function buildReferenceBlock(ref: ExtractedProduct | null): string {
  if (!ref) return "";
  const lines: string[] = ["\n--- RÉFÉRENCE PRODUIT (extrait automatiquement) ---"];
  if (ref.name) lines.push(`Nom original: ${ref.name}`);
  if (ref.brand) lines.push(`Marque détectée: ${ref.brand}`);
  if (ref.sku) lines.push(`SKU/Référence: ${ref.sku}`);
  if (ref.price) lines.push(`Prix détecté: ${ref.price} MAD`);
  if (ref.description) lines.push(`Description originale: ${ref.description}`);
  if (ref.specs) lines.push(`Spécifications trouvées:\n${ref.specs}`);
  if (ref.imageUrl) lines.push(`Image: ${ref.imageUrl}`);
  lines.push("--- FIN RÉFÉRENCE ---\n");
  return lines.join("\n");
}

// ===== Input Schemas =====
const generateProductInput = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  price: z.number().int().optional(),
  referenceUrl: z.string().optional(),
});

const generateSeoInput = z.object({
  name: z.string().min(1),
  type: z.enum(["product", "category", "brand"]),
  category: z.string().optional(),
  brand: z.string().optional(),
});

const generateBlogInput = z.object({
  topic: z.string().min(1),
  category: z.string().optional(),
  tone: z.enum(["professionnel", "décontracté", "technique", "comparatif"]).optional(),
});

const generateBulkInput = z.object({
  products: z.array(z.object({
    name: z.string().min(1),
    brand: z.string().optional(),
    category: z.string().optional(),
    price: z.number().int().optional(),
    referenceUrl: z.string().optional(),
  })).min(1).max(20),
});

const generateCampaignInput = z.object({
  product: z.string().optional(),
  theme: z.string().optional(),
  style: z.enum(["promotionnel", "lancement", "comparatif", "saisonier"]).optional(),
});

const generateCategoryInput = z.object({
  name: z.string().min(1),
  parentCategory: z.string().optional(),
});

// ===== Router =====
export const aiRouter = createRouter({
  /** Generate a full product listing from a name + optional URL/SKU reference */
  generateProduct: adminQuery
    .input(generateProductInput)
    .mutation(async ({ input }) => {
      // Extract data from URL if provided
      let ref: ExtractedProduct | null = null;
      if (input.referenceUrl?.trim()) {
        const url = input.referenceUrl.trim();
        if (url.startsWith("http")) {
          ref = await extractFromUrl(url);
        } else {
          // Treat as SKU/name reference
          ref = { name: url, source: "Référence manuelle" };
        }
      }

      const details = [
        input.brand ? `Marque: ${input.brand}` : ref?.brand ? `Marque: ${ref.brand}` : "",
        input.category ? `Catégorie: ${input.category}` : "",
        input.price ? `Prix: ${input.price} MAD` : ref?.price ? `Prix: ${ref.price} MAD` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const refBlock = buildReferenceBlock(ref);

      const result = await generate<{
        nameFr: string;
        sku: string;
        variants: {
          type: string;
          label: string;
          options: { label: string; value: string; hex?: string; priceDiff?: number; stock?: number }[];
        }[];
        summaryFr: string;
        descriptionFr: string;
        seoTitleFr: string;
        seoDescriptionFr: string;
        specs: { k: string; v: string }[];
        faqFr: { q: string; a: string }[];
        sectionsFr: {
          id: string;
          title: string;
          icon: string;
          text: string;
          visual: {
            type: "gauges" | "bars" | "icons" | "specs-grid";
            items: { label: string; value: number; max?: number }[];
          } | null;
        }[];
      }>(
        SYSTEM_FR,
        `Génère une fiche produit complète pour un produit informatique/électronique vendu au Maroc par PC Jahiz.
${refBlock}
Produit: ${input.name}
${details}

Utilise les données de référence ci-dessus si elles sont disponibles pour enrichir la fiche produit.
Tu peux reprendre et améliorer le nom original, reprendre les spécifications, et reformuler la description de manière plus professionnelle et orientée conversion.

Retourne un JSON avec ces champs:
- nameFr: nom du produit en français (ex: "PC Portable Acer Nitro V16 - 16 Go RAM - RTX 4050")
- sku: référence/fabricant du produit (ex: "NH.QNEEA.005", "NITRO V16 ANV16-41-R6FC"). Cherche dans les données de référence. Si non trouvé, génère un SKU logique basé sur le nom.
- variants: OBLIGATOIRE. Tableau JSON de variantes. Exemples concrets:
  PC portable: [{"type":"ram","label":"Mémoire RAM","options":[{"label":"8 Go","value":"8go"},{"label":"16 Go","value":"16go"},{"label":"32 Go","value":"32go"}]},{"type":"storage","label":"Stockage","options":[{"label":"256 Go SSD","value":"256"},{"label":"512 Go SSD","value":"512"},{"label":"1 To SSD","value":"1024"}]},{"type":"color","label":"Couleur","options":[{"label":"Noir","value":"noir","hex":"#1a1a1a"},{"label":"Blanc","value":"blanc","hex":"#f5f5f5"}]}]
  Téléphone: [{"type":"color","label":"Couleur","options":[{"label":"Noir","value":"noir","hex":"#1a1a1a"},{"label":"Bleu","value":"bleu","hex":"#2563eb"}]},{"type":"storage","label":"Stockage","options":[{"label":"128 Go","value":"128"},{"label":"256 Go","value":"256"}]}]
  Types valides: color, ram, storage, processor, screen, os, gpu, finish, size, capacity.
  Si pas de variations: retourne [].
- summaryFr: résumé en 1-2 phrases (pitch commercial court)
- descriptionFr: Description SEO optimisée en HTML. Règles STRICTES:
  STRUCTURE:
  - Commence par un paragraphe d'introduction (2-3 phrases) qui contient le nom complet du produit et le mot-clé principal
  - Utilise <h3> pour chaque section (pas de <h2> — le H2 est déjà utilisé pour le titre de la page)
  - Termine par un paragraphe de conclusion avec CTA
  - Minimum 5 sections, Maximum 10 (adapte selon le produit)
  
  SEO:
  - Inclus le nom du produit dans les 100 premiers mots
  - Utilise des mots-clés d'achat: "meilleur", "acheter", "prix", "offre", "disponible au Maroc"
  - Utilise des mots-clés de comparaison: "contrairement à", "comparable à", "alternative à", "vs"
  - Utilise des mots-clés de localisation: "au Maroc", "à Casablanca", "livraison Morocco"
  - Chaque section H3 doit contenir un mot-clé pertinent
  - Inclus des chiffres et données précises (Google adore les chiffres)
  
  UX:
  - Utilise <ul><li> pour les listes (Google extrait celles-ci pour les rich snippets)
  - Utilise <strong> pour les termes importants (modèle, vitesse, capacité)
  - Pas de paragraphes de plus de 4 lignes — scannabilité
  - Commence chaque section par une réponse directe à la question que l'utilisateur se pose
  
  SECTIONS RECOMMANDÉES (adapte au produit):
  1. <h3>Pour qui est ce [produit] ?</h3> — Cible, usage, positionnement
  2. <h3>Design et Qualité de Fabrication</h3> — Matériaux, poids, finitions
  3. <h3>Écran et Affichage</h3> — Spécifications techniques écran
  4. <h3>Performances</h3> — CPU, RAM, SSD avec chiffres (benchmark, vitesse)
  5. <h3>Gaming et Graphismes</h3> — GPU, FPS, Ray Tracing (si applicable)
  6. <h3>Batterie et Autonomie</h3> — Wh, heures réelles, charge
  7. <h3>Connectivité</h3> — Ports, Wi-Fi, Bluetooth
  8. <h3>Audio et Caméra</h3> — Haut-parleurs, micro, webcam
  9. <h3>Prix et Disponibilité au Maroc</h3> — Prix, où acheter, garantie
  10. <h3>Notre Verdict</h3> — Points forts/faibles, recommandation finale
  
  EXEMPLE de phrase SEO: "Le [nom du produit] s'impose comme le meilleur choix pour les étudiants marocains qui recherchent un PC portable performant à prix abordable, avec ses [X] Go de RAM et son écran [Y] Hz."
- seoTitleFr: titre SEO optimisé (60 car. max). Inclus le nom du produit + mot-clé principal
- seoDescriptionFr: meta description SEO (155 car. max). Phrase d'accroche avec CTA et prix si disponible
- specs: tableau de 6-10 spécifications techniques [{k: "Écran", v: "16\\" FHD+ 165 Hz"}, ...]
- faqFr: 3-5 questions fréquentes [{q: "...", a: "..."}, ...]
- sectionsFr: tableau de 3-5 sections visuelles avec des DONNÉES RÉELLES et FACTUELLES. Chaque section: {id, title, icon: nom Lucide, text: HTML court, visual: {type, items}}

Règles IMPORTANTES pour items:
- Chaque item DOIT avoir une valeur numérique RÉELLE extraite des specs du produit (pas des scores arbitraires).
- value = nombre réel (ex: 16 pour RAM, 512 pour stockage, 165 pour refresh rate, 85 pour autonomie batterie)
- max = le maximum réaliste de cette métrique (ex: 64 pour RAM, 2048 pour stockage, 240 pour refresh rate, 100 pour batterie)
- label = nom Court de la métrique (ex: "RAM", "SSD", "Écran Hz", "Batterie")

Exemples de sections RÉELLES pour un PC portable:
  type "gauges": [{label:"RAM", value:16, max:64}, {label:"Stockage", value:512, max:2048}, {label:"Écran Hz", value:165, max:240}]
  type "bars": [{label:"Autonomie batterie", value:85, max:100}, {label:"Poids", value:2100, max:3000}]
  type "icons": [{label:"Wi-Fi 6E"}, {label:"USB-C"}, {label:"Clavier rétroéclairé"}]
  type "specs-grid": [{label:"Processeur", value:"Ryzen 7 7735HS"}, {label:"GPU", value:"RTX 4050 6GB"}]

Pour un téléphone:
  type "gauges": [{label:"Batterie", value:5000, max:6000}, {label:"RAM", value:8, max:16}, {label:"Stockage", value:256, max:1024}]
  type "bars": [{label:"Autonomie", value:92, max:100}, {label:"Caméra DxO", value:140, max:160}]`,
      );

      return result;
    }),

  /** Improve an existing product description */
  improveProduct: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        currentDescription: z.string().optional(),
        currentSummary: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await generate<{
        summaryFr: string;
        descriptionFr: string;
        sectionsFr: {
          id: string;
          title: string;
          icon: string;
          text: string;
          visual: {
            type: "gauges" | "bars" | "icons" | "specs-grid";
            items: { label: string; value: number; max?: number }[];
          } | null;
        }[];
      }>(
        SYSTEM_FR,
        `Améliore la description de ce produit pour PC Jahiz (e-commerce Maroc).

Produit: ${input.name}
Description actuelle: ${input.currentDescription || "aucune"}
Résumé actuel: ${input.currentSummary || "aucune"}

Retourne un JSON avec:
- summaryFr: résumé commercial amélioré (1-2 phrases, percutant)
- descriptionFr: description complète améliorée en HTML (<h3>, <p>, <ul>). 400-600 mots, orientée conversion.
- sectionsFr: tableau de 3-5 sections visuelles. Chaque section: {id: slug, title, icon: nom Lucide, text: HTML court, visual: {type: "gauges"|"bars"|"icons"|"specs-grid", items: [{label, value, max?}]} | null}

IMPORTANT: descriptionFr = HTML. sectionsFr = JSON valide. Adapté au produit.`,
      );

      return result;
    }),

  /** Generate SEO fields for any entity */
  generateSeo: adminQuery
    .input(generateSeoInput)
    .mutation(async ({ input }) => {
      const context = [
        input.type === "product" ? "un produit" : input.type === "category" ? "une catégorie" : "une marque",
        input.category ? `Catégorie: ${input.category}` : "",
        input.brand ? `Marque: ${input.brand}` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      const result = await generate<{ seoTitle: string; seoDescription: string }>(
        SYSTEM_FR,
        `Génère le SEO pour ${context} sur le site PC Jahiz (e-commerce tech Maroc).

Nom: ${input.name}

Contraintes SEO:
- Title: 60 caractères max, inclure le nom + "PC Jahiz" + "Prix Maroc"
- Description: 155 caractères max, accroche + bénéfice + CTA
- Mots-clés: informatique, Maroc, MAD, prix

Retourne un JSON avec:
- seoTitle: titre meta optimisé
- seoDescription: meta description optimisée`,
      );

      return result;
    }),

  /** Generate category description + SEO */
  generateCategory: adminQuery
    .input(generateCategoryInput)
    .mutation(async ({ input }) => {
      const result = await generate<{
        description: string;
        seoTitleFr: string;
        seoDescriptionFr: string;
      }>(
        SYSTEM_FR,
        `Génère la description et le SEO pour une catégorie de PC Jahiz.

Catégorie: ${input.name}
${input.parentCategory ? `Sous-catégorie de: ${input.parentCategory}` : ""}

Retourne un JSON avec:
- description: description de la catégorie (2-3 paragraphes, orientée conversion)
- seoTitleFr: titre SEO (60 car. max)
- seoDescriptionFr: meta description SEO (155 car. max)`,
      );

      return result;
    }),

  /** Generate a full blog post */
  generateBlogPost: adminQuery
    .input(generateBlogInput)
    .mutation(async ({ input }) => {
      const result = await generate<{
        title: string;
        excerpt: string;
        body: string;
        tags: string[];
        seoTitle: string;
        seoDescription: string;
      }>(
        SYSTEM_FR,
        `Tu es un rédacteur web expert en tech et e-commerce pour le Maroc.
Écris un article de blog complet pour PC Jahiz.

Sujet: ${input.topic}
${input.category ? `Catégorie: ${input.category}` : ""}
Ton: ${input.tone || "professionnel"}

L'article doit:
- Avoir 800-1200 mots
- Être structuré avec des titres H2/H3 en markdown
- Inclure des références au marché marocain et aux prix en MAD
- Être optimisé SEO (mots-clés naturels, structure claire)
- Terminer par un CTA vers la boutique PC Jahiz

Retourne un JSON avec:
- title: titre accrocheur de l'article
- excerpt: résumé en 2 phrases
- body: contenu complet en markdown (avec ##, ###, listes, etc.)
- tags: tableau de 5-8 tags pertinents
- seoTitle: titre SEO (60 car. max)
- seoDescription: meta description SEO (155 car. max)`,
      );

      return result;
    }),

  /** Generate a blog outline */
  generateBlogOutline: adminQuery
    .input(z.object({ topic: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const result = await generate<{
        title: string;
        outline: { heading: string; points: string[] }[];
        tags: string[];
      }>(
        SYSTEM_FR,
        `Génère un plan détaillé pour un article de blog PC Jahiz.

Sujet: ${input.topic}

Retourne un JSON avec:
- title: titre accrocheur
- outline: tableau de 4-6 sections, chacune avec "heading" (titre H2) et "points" (3-4 points à couvrir)
- tags: 5-8 tags SEO`,
      );

      return result;
    }),

  /** Generate campaign/hero copy */
  generateCampaign: adminQuery
    .input(generateCampaignInput)
    .mutation(async ({ input }) => {
      const result = await generate<{
        eyebrow: string;
        heading: string;
        description: string;
        ctaLabel: string;
        bgColor: string;
      }>(
        SYSTEM_FR,
        `Génère le copywriting pour une bannière hero ou campagne PC Jahiz.

${input.product ? `Produit: ${input.product}` : ""}
${input.theme ? `Thème: ${input.theme}` : ""}
Style: ${input.style || "promotionnel"}

Retourne un JSON avec:
- eyebrow: texte d'œil (ex: "GAMING", "RENTRÉE SCOLAIRE", "PROMO -30%")
- heading: titre principal accrocheur (1 ligne)
- description: sous-titre (1-2 phrases)
- ctaLabel: texte du bouton CTA
- bgColor: couleur de fond hex suggérée (ex: "#1a1a2e")`,
      );

      return result;
    }),

  /** Bulk generate products — sequential with delays to avoid rate limits */
  generateBulk: adminQuery
    .input(generateBulkInput)
    .mutation(async ({ input }) => {
      const results: (Record<string, unknown> & { error?: string })[] = [];

      for (const p of input.products) {
        try {
          // Extract from URL if provided
          let ref: ExtractedProduct | null = null;
          if (p.referenceUrl?.trim()) {
            const url = p.referenceUrl.trim();
            if (url.startsWith("http")) {
              ref = await extractFromUrl(url);
            } else {
              ref = { name: url, source: "Référence manuelle" };
            }
          }

          const details = [
            p.brand ? `Marque: ${p.brand}` : ref?.brand ? `Marque: ${ref.brand}` : "",
            p.category ? `Catégorie: ${p.category}` : "",
            p.price ? `Prix: ${p.price} MAD` : ref?.price ? `Prix: ${ref.price} MAD` : "",
          ]
            .filter(Boolean)
            .join("\n");

          const refBlock = buildReferenceBlock(ref);

          const item = await generate<{
            nameFr: string;
            summaryFr: string;
            descriptionFr: string;
            seoTitleFr: string;
            seoDescriptionFr: string;
            specs: { k: string; v: string }[];
            faqFr: { q: string; a: string }[];
            sectionsFr: {
              id: string;
              title: string;
              icon: string;
              text: string;
              visual: {
                type: "gauges" | "bars" | "icons" | "specs-grid";
                items: { label: string; value: number; max?: number }[];
              } | null;
            }[];
            variants: {
              type: string;
              label: string;
              options: { label: string; value: string; hex?: string; priceDiff?: number; stock?: number }[];
            }[];
          }>(
            SYSTEM_FR,
            `Génère une fiche produit pour PC Jahiz.
${refBlock}
Produit: ${p.name}
${details}

Utilise les données de référence si disponibles.
Retourne un JSON: {nameFr, summaryFr, descriptionFr, seoTitleFr, seoDescriptionFr, specs: [{k,v}], faqFr: [{q,a}], sectionsFr: [{id, title, icon, text, visual: {type, items} | null}], variants: [{type, label, options: [{label, value, hex?, priceDiff?, stock?}]}]}`,
          );

          results.push(item);
        } catch (err) {
          results.push({ error: `Erreur pour "${p.name}": ${err instanceof Error ? err.message : "inconnue"}`, nameFr: p.name });
        }

        // Delay between requests to avoid rate limits
        if (input.products.indexOf(p) < input.products.length - 1) {
          await delay(2000);
        }
      }

      return results;
    }),
});
