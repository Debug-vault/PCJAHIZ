import { createContext, useContext, useState, useCallback } from "react";

interface HeroSlideInfo {
  eyebrow?: string | null;
  heading?: string | null;
  bgColor?: string | null;
}

interface HeroContextValue {
  currentSlide: HeroSlideInfo | null;
  setCurrentSlide: (info: HeroSlideInfo | null) => void;
}

const HeroContext = createContext<HeroContextValue>({ currentSlide: null, setCurrentSlide: () => {} });

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const [currentSlide, setCurrentSlide] = useState<HeroSlideInfo | null>(null);
  return <HeroContext.Provider value={{ currentSlide, setCurrentSlide }}>{children}</HeroContext.Provider>;
}

export function useHeroSlide() {
  return useContext(HeroContext);
}
