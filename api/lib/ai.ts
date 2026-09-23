import { env } from "./env";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";

const ZEN_BASE_URL = "https://opencode.ai/zen/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

// ===== Verified free models (tested & working on OpenCode Zen) =====
const FREE_MODELS = [
  "nemotron-3-ultra-free",
  "nemotron-3.5-lightning-free",
  "mimo-v2.5-free",
  "hy3-free",
];

// ===== In-memory response cache (4 hours TTL) =====
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const cache = new Map<string, { data: string; ts: number }>();

// ===== Concurrency limiter — max 1 AI call at a time =====
// Prevents RPM exhaustion from concurrent admin actions (e.g. bulk import).
let aiQueue: Promise<unknown> = Promise.resolve();
function withConcurrencyLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = aiQueue.then(() => fn(), () => fn());
  aiQueue = result.then(() => {}, () => {});
  return result;
}

// ===== Rate-limit retry with exponential backoff =====
const MAX_RETRIES = 3;
async function retryWithBackoff<T>(fn: () => Promise<T>, isRateLimit: (r: T) => boolean): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await fn();
    if (!isRateLimit(result) || attempt === MAX_RETRIES) return result;
    const delayMs = Math.min(2000 * Math.pow(2, attempt), 30000);
    console.warn(`[AI] Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Rate limit exceeded after retries");
}

function cacheKey(provider: string, model: string, messages: AiMessage[], temperature: number): string {
  const raw = JSON.stringify({ provider, model, messages, temperature });
  return createHash("sha256").update(raw).digest("hex");
}

function getFromCache(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: string): void {
  if (cache.size > 200) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].ts - b[1].ts)
      .slice(0, 50);
    for (const [k] of oldest) cache.delete(k);
  }
  cache.set(key, { data, ts: Date.now() });
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiGenerateOptions {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  noCache?: boolean;
}

function unwrapSetting(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "value" in v) return String((v as { value: unknown }).value ?? "");
  return "";
}

async function getSetting(key: string): Promise<string> {
  try {
    const db = getDb();
    const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (rows.length > 0) return unwrapSetting(rows[0].value);
  } catch {
    // DB not available, fall through to env
  }
  return "";
}

async function getProvider(): Promise<"opencode-zen" | "gemini"> {
  const p = await getSetting("aiProvider");
  return p === "gemini" ? "gemini" : "opencode-zen";
}

async function getZenApiKey(): Promise<string> {
  const dbKey = await getSetting("openCodeZenApiKey");
  if (dbKey) return dbKey;
  return env.openCodeZenApiKey;
}

async function getZenModel(): Promise<string> {
  const dbModel = await getSetting("openCodeZenModel");
  if (dbModel) return dbModel;
  return env.openCodeZenModel;
}

async function getGeminiApiKey(): Promise<string> {
  return getSetting("geminiApiKey");
}

async function getGeminiModel(): Promise<string> {
  const m = await getSetting("geminiModel");
  return m || "gemini-3.5-flash-lite";
}

interface FetchResult {
  ok: boolean;
  status: number;
  content?: string;
  error?: string;
  rawData?: unknown;
}

const PER_REQUEST_TIMEOUT_MS = 60000;

async function fetchZenCompletion(
  model: string,
  messages: AiMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
  outerSignal: AbortSignal,
  sessionId: string,
): Promise<FetchResult> {
  const body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "opencode/1.15.5 ai-sdk/provider-utils/4.0.23 runtime/bun/1.3.13",
    "x-opencode-client": "cli",
    "x-opencode-project": "global",
    "x-opencode-request": `msg_${randomUUID()}`,
    "x-opencode-session": sessionId,
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const localController = new AbortController();
  const onOuterAbort = () => localController.abort();
  if (outerSignal.aborted) localController.abort();
  else outerSignal.addEventListener("abort", onOuterAbort);
  const localTimeout = setTimeout(() => localController.abort(), PER_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ZEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body,
      signal: localController.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: errBody };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    const content = choices?.[0]?.message?.content;

    if (!content || content.trim() === "") {
      console.error(`[AI] Empty response from Zen ${model}:`, JSON.stringify(data).slice(0, 300));
      return { ok: false, status: 200, error: "empty_content", rawData: data };
    }

    return { ok: true, status: 200, content };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const reason = isAbort ? "timeout" : (err instanceof Error ? err.message : String(err));
    console.error(`[AI] Zen request failed for ${model}: ${reason}`);
    return { ok: false, status: 0, error: reason };
  } finally {
    clearTimeout(localTimeout);
    outerSignal.removeEventListener("abort", onOuterAbort);
  }
}

async function fetchGeminiCompletion(
  model: string,
  messages: AiMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
  outerSignal: AbortSignal,
): Promise<FetchResult> {
  const body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const localController = new AbortController();
  const onOuterAbort = () => localController.abort();
  if (outerSignal.aborted) localController.abort();
  else outerSignal.addEventListener("abort", onOuterAbort);
  const localTimeout = setTimeout(() => localController.abort(), PER_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body,
      signal: localController.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[AI] Gemini ${model} returned ${res.status}:`, errBody.slice(0, 300));
      return { ok: false, status: res.status, error: errBody };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    const content = choices?.[0]?.message?.content;

    if (!content || content.trim() === "") {
      console.error(`[AI] Empty response from Gemini ${model}:`, JSON.stringify(data).slice(0, 300));
      return { ok: false, status: 200, error: "empty_content", rawData: data };
    }

    return { ok: true, status: 200, content };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const reason = isAbort ? "timeout" : (err instanceof Error ? err.message : String(err));
    console.error(`[AI] Gemini request failed for ${model}: ${reason}`);
    return { ok: false, status: 0, error: reason };
  } finally {
    clearTimeout(localTimeout);
    outerSignal.removeEventListener("abort", onOuterAbort);
  }
}

/**
 * Call AI with auto-fallback. Routes to OpenCode Zen or Google Gemini
 * based on the provider setting in the admin dashboard.
 */
export async function aiGenerate(options: AiGenerateOptions): Promise<string> {
  const provider = await getProvider();

  // Gemini path — single model, with rate-limit retry
  if (provider === "gemini") {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key configured. Go to Settings → API & AI and add your key.");
    }
    const model = options.model ?? await getGeminiModel();
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 12288;

    if (!options.noCache) {
      const cKey = cacheKey("gemini", model, options.messages, temperature);
      const cached = getFromCache(cKey);
      if (cached) return cached;
    }

    return withConcurrencyLock(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      try {
        const result = await retryWithBackoff(
          () => fetchGeminiCompletion(model, options.messages, temperature, maxTokens, apiKey, controller.signal),
          (r) => r.status === 429,
        );

        if (result.ok && result.content) {
          if (!options.noCache) {
            const cKey = cacheKey("gemini", model, options.messages, temperature);
            setInCache(cKey, result.content);
          }
          return result.content;
        }

        throw new Error(`Gemini failed: ${result.error}`);
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  // OpenCode Zen path — with model fallback + concurrency lock
  const apiKey = await getZenApiKey();
  const configuredModel = options.model ?? await getZenModel();
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2048;

  if (!options.noCache) {
    const cKey = cacheKey("zen", configuredModel, options.messages, temperature);
    const cached = getFromCache(cKey);
    if (cached) return cached;
  }

  return withConcurrencyLock(async () => {
    const modelsToTry: string[] = [configuredModel];
    for (const m of FREE_MODELS) {
      if (m !== configuredModel) modelsToTry.push(m);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const sessionId = `ses_${randomUUID()}`;

    try {
      for (const model of modelsToTry) {
        const result = await retryWithBackoff(
          () => fetchZenCompletion(model, options.messages, temperature, maxTokens, apiKey, controller.signal, sessionId),
          (r) => r.status === 429,
        );

        if (result.ok && result.content) {
          if (!options.noCache) {
            const cKey = cacheKey("zen", model, options.messages, temperature);
            setInCache(cKey, result.content);
          }
          return result.content;
        }

        console.error(`[AI] Zen model ${model} failed (status=${result.status}): ${result.error}`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      throw new Error("Tous les modèles sont indisponibles. Réessayez dans quelques secondes.");
    } finally {
      clearTimeout(timeout);
    }
  });
}

/**
 * Sanitize LLM-generated JSON before parsing.
 * Handles: trailing commas, newlines in strings, markdown wrappers,
 * single quotes, comments, and other common LLM output quirks.
 */
function sanitizeJson(raw: string): string {
  let s = raw.trim();
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Strip // comments (but not inside strings) — use a simple state machine
  let inStr = false;
  let escaped = false;
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\" && inStr) { result += ch; escaped = true; continue; }
    if (ch === '"' && !escaped) { inStr = !inStr; result += ch; continue; }
    if (!inStr && ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      result += "\n";
      continue;
    }
    result += ch;
  }
  s = result;
  // Fix trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, "$1");
  // Fix leading commas after { or [ or , — not valid JSON but LLMs do it
  s = s.replace(/([\[{])\s*,\s*/g, "$1");
  s = s.replace(/,\s*,/g, ",");
  // Fix unescaped newlines inside string values
  // (LLMs sometimes put raw newlines in strings instead of \n)
  inStr = false;
  escaped = false;
  result = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\" && inStr) { result += ch; escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; result += ch; continue; }
    if (inStr && ch === "\n") { result += "\\n"; continue; }
    if (inStr && ch === "\t") { result += "\\t"; continue; }
    result += ch;
  }
  return result;
}

/**
 * Generate structured JSON from a prompt.
 * Parses with fallback: try raw JSON, then fenced, then sanitization.
 */
export async function aiGenerateJson<T = unknown>(
  options: Omit<AiGenerateOptions, "temperature"> & { temperature?: number },
): Promise<T> {
  const raw = await aiGenerate({ ...options, temperature: options.temperature ?? 0.3 });

  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1] ?? raw;

  // Try raw parse first
  try {
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    // Sanitize and retry
    const cleaned = sanitizeJson(jsonStr);
    try {
      return JSON.parse(cleaned) as T;
    } catch (e) {
      // Last resort: try to extract just the JSON object from the text
      const objectMatch = cleaned.match(/(\{[\s\S]*\})/);
      if (objectMatch) {
        return JSON.parse(objectMatch[1]) as T;
      }
      const errMsg = (e as Error).message;
      console.error(`[AI] JSON parse failed after sanitize: ${errMsg}`);
      console.error(`[AI] Raw (first 600):`, raw.slice(0, 600));
      console.error(`[AI] Cleaned (first 600):`, cleaned.slice(0, 600));
      throw new Error(`AI returned invalid JSON: ${errMsg}`);
    }
  }
}

/**
 * Delay helper for sequential operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Get the list of available free models.
 */
export function getFreeModels(): string[] {
  return [...FREE_MODELS];
}
