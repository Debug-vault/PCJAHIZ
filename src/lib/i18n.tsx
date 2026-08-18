import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";

export type Locale = "fr" | "ar";
export type Messages = typeof fr;

const catalogs: Record<Locale, Messages> = { fr, ar };

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  messages: Messages;
  setLocale: (l: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem("jhz_locale");
    if (stored === "fr" || stored === "ar") return stored;
  } catch {
    /* noop */
  }
  return "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("jhz_locale", l);
      document.documentElement.lang = l;
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    } catch {
      /* noop */
    }
  }, []);

  const messages = catalogs[locale];

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const raw = getByPath(messages, path);
      if (typeof raw !== "string") return path;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
        k in (vars as Record<string, string | number>) ? String((vars as Record<string, string | number>)[k]) : `{${k}}`,
      );
    },
    [messages],
  );

  const formatPrice = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      messages,
      setLocale,
      t,
      formatPrice,
    }),
    [locale, messages, setLocale, t, formatPrice],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}