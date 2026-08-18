import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readCompare, toggleCompare, clearCompare } from "@/lib/compare";

type CompareContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => (typeof window === "undefined" ? [] : readCompare()));

  useEffect(() => {
    const onFocus = () => setIds(readCompare());
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, []);

  const value: CompareContextValue = {
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => setIds(toggleCompare(id)),
    clear: () => {
      clearCompare();
      setIds([]);
    },
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}