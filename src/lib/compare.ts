export const COMPARE_COOKIE = "jhz_compare";
export const COMPARE_MAX = 4;

export function readCompare(): string[] {
  if (typeof document === "undefined") return [];
  const m = document.cookie.match(new RegExp(`(?:^|; )${COMPARE_COOKIE}=([^;]*)`));
  if (!m) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    /* noop */
  }
  return [];
}

function writeCompare(ids: string[]) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(ids));
  document.cookie = `${COMPARE_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function toggleCompare(id: string): string[] {
  const current = readCompare();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : current.length >= COMPARE_MAX
      ? [...current.slice(1), id]
      : [...current, id];
  writeCompare(next);
  return next;
}

export function clearCompare(): void {
  writeCompare([]);
}