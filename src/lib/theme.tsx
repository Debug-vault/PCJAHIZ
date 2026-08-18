import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "void" | "souk";
type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  accent: string;
  setAccent: (c: string) => void;
  reducedMotion: boolean;
  setReducedMotion: (b: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initTheme(): Theme {
  try {
    const t = localStorage.getItem("jhz_theme");
    if (t === "void" || t === "souk") return t;
  } catch {
    /* noop */
  }
  return "void";
}

export function ThemeProvider({
  children,
  accent = "#FDD502",
}: {
  children: ReactNode;
  accent?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(initTheme);
  const [currentAccent, setCurrentAccent] = useState(accent);
  const [reducedMotion, setReducedMotionState] = useState(false);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("jhz_theme", t);
    } catch {
      /* noop */
    }
  };

  const setReducedMotion = (b: boolean) => {
    setReducedMotionState(b);
    try {
      localStorage.setItem("jhz_reduced", b ? "1" : "0");
    } catch {
      /* noop */
    }
  };

  const setAccent = (c: string) => {
    setCurrentAccent(c);
    try {
      localStorage.setItem("jhz_accent", c);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jhz_reduced");
      if (saved === "1") setReducedMotionState(true);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "souk") root.classList.add("theme-souk");
    else root.classList.remove("theme-souk");

    if (reducedMotion) root.classList.add("reduced-motion");
    else root.classList.remove("reduced-motion");
  }, [theme, reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gold", currentAccent);
    root.style.setProperty("--ring", "51 98% 50%");
  }, [currentAccent]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme(theme === "void" ? "souk" : "void"),
      accent: currentAccent,
      setAccent,
      reducedMotion,
      setReducedMotion,
    }),
    [theme, currentAccent, reducedMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}