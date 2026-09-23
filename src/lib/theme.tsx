import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemeContextValue = {
  accent: string;
  reducedMotion: boolean;
  setReducedMotion: (b: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  accent = "#fcd406",
}: {
  children: ReactNode;
  accent?: string;
}) {
  const [reducedMotion, setReducedMotionState] = useState(false);

  const setReducedMotion = (b: boolean) => {
    setReducedMotionState(b);
    try { localStorage.setItem("jhz_reduced", b ? "1" : "0"); } catch {}
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      try {
        const saved = localStorage.getItem("jhz_reduced");
        if (saved === "1") setReducedMotionState(true);
        else if (saved === "0") setReducedMotionState(false);
        else setReducedMotionState(mq.matches);
      } catch {}
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) root.classList.add("reduced-motion");
    else root.classList.remove("reduced-motion");
  }, [reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gold", accent);
    root.style.setProperty("--ring", "51 100% 50%");
  }, [accent]);

  const value = useMemo<ThemeContextValue>(
    () => ({ accent, reducedMotion, setReducedMotion }),
    [accent, reducedMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
