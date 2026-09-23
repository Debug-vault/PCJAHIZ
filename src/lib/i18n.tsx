import { createContext, useContext, useCallback, useMemo, useEffect, useState, type ReactNode } from "react";
import fr from "../messages/fr.json";

export type Locale = "fr";
export type Messages = typeof fr;
export type TaxMode = "ht" | "ttc";

const catalog: Messages = fr;
const TVA_RATE = 0.20;
const STORAGE_KEY = "pcjahiz-tax-mode";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr";
  messages: Messages;
  t: (path: string, vars?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
  formatPriceRaw: (amount: number) => string;
  taxMode: TaxMode;
  setTaxMode: (mode: TaxMode) => void;
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

function readStoredTaxMode(): TaxMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "ht" || v === "ttc") return v;
  } catch {}
  return "ttc";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [taxMode, setTaxModeState] = useState<TaxMode>(readStoredTaxMode);

  useEffect(() => {
    document.documentElement.lang = "fr";
    document.documentElement.dir = "ltr";
  }, []);

  const setTaxMode = useCallback((mode: TaxMode) => {
    setTaxModeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const raw = getByPath(catalog, path);
      if (typeof raw !== "string") return path;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
        k in (vars as Record<string, string | number>) ? String((vars as Record<string, string | number>)[k]) : `{${k}}`,
      );
    },
    [],
  );

  const formatPrice = useCallback((amount: number) => {
    const converted = taxMode === "ht" ? amount / (1 + TVA_RATE) : amount;
    const suffix = taxMode === "ht" ? "DH HT" : "DH TTC";
    return `${new Intl.NumberFormat("fr-MA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)} ${suffix}`;
  }, [taxMode]);

  const formatPriceRaw = useCallback((amount: number) => {
    const converted = taxMode === "ht" ? amount / (1 + TVA_RATE) : amount;
    return new Intl.NumberFormat("fr-MA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }, [taxMode]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: "fr",
      dir: "ltr",
      messages: catalog,
      t,
      formatPrice,
      formatPriceRaw,
      taxMode,
      setTaxMode,
    }),
    [t, formatPrice, formatPriceRaw, taxMode, setTaxMode],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}