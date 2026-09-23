export type HeroLayout = "split" | "overlay" | "product-grid";
export type HeroTransition = "slide" | "fade";
export type DeviceKey = "mobile" | "tablet" | "desktop";
export type PerDevice<T> = Partial<Record<DeviceKey, T>>;

export interface HeroProduct {
  image: string;
  name: string;
  price?: number | null;
  label?: string | null;
}

// ===== Background Maker Types =====
export type BgLayerType = "solid" | "linear-gradient" | "radial-gradient" | "conic-gradient" | "pattern" | "noise";
export type BgPattern = "dots" | "grid" | "stripes" | "diagonal" | "zigzag" | "checkerboard" | "crosses" | "hexagons";
export type BgBlend = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "color-dodge" | "color-burn";

export interface BgLayer {
  id: string;
  type: BgLayerType;
  colors: string[];
  stops?: number[];
  angle?: number;
  shape?: "ellipse" | "circle";
  posX?: string;
  posY?: string;
  pattern?: BgPattern;
  patternSize?: number;
  patternColor?: string;
  patternAngle?: number;
  noiseOpacity?: number;
  noiseDensity?: number;
  opacity: number;
  blendMode: BgBlend;
  animated?: boolean;
  animationSpeed?: number;
  enabled: boolean;
}

export interface HeroBackground {
  layers: BgLayer[];
  text?: TextConfig;
}

export type FontPairingId = "tech-maroc" | "editorial" | "bold-commerce" | "heritage" | "minimalist";

export interface FontPairing {
  id: FontPairingId;
  label: string;
  heading: string;
  body: string;
  cssHeading: string;
  cssBody: string;
}

export interface TextConfig {
  fontPairing: FontPairingId;
  colorMode: "auto" | "manual";
  primaryColor?: string;
  secondaryColor?: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: "tech-maroc", label: "Tech Maroc", heading: "Space Grotesk", body: "Inter", cssHeading: "var(--font-hud)", cssBody: "var(--font-body)" },
  { id: "editorial", label: "Editorial Premium", heading: "Playfair Display", body: "Source Sans 3", cssHeading: "var(--font-playfair)", cssBody: "var(--font-source-sans)" },
  { id: "bold-commerce", label: "Bold Commerce", heading: "Sora", body: "DM Sans", cssHeading: "var(--font-sora)", cssBody: "var(--font-dm-sans)" },
  { id: "heritage", label: "Moroccan Heritage", heading: "Cairo", body: "Nunito", cssHeading: "var(--font-cairo)", cssBody: "var(--font-nunito)" },
  { id: "minimalist", label: "Minimalist", heading: "Outfit", body: "Inter", cssHeading: "var(--font-outfit)", cssBody: "var(--font-body)" },
];

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  fontPairing: "tech-maroc",
  colorMode: "auto",
  primaryColor: "#101014",
  secondaryColor: "#5b5b66",
};

export const BG_LAYER_DEFAULTS: Omit<BgLayer, "id"> = {
  type: "solid",
  colors: ["#fcd406", "transparent"],
  opacity: 1,
  blendMode: "normal",
  enabled: true,
  angle: 135,
  shape: "ellipse",
  posX: "50%",
  posY: "50%",
  patternSize: 20,
  patternColor: "rgba(255,255,255,0.15)",
  patternAngle: 0,
  noiseOpacity: 0.05,
  noiseDensity: 50,
  animated: false,
  animationSpeed: 20,
};

export const BG_PRESETS: { id: string; label: string; bg: HeroBackground }[] = [
  {
    id: "nebula", label: "Nébuleuse",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "radial-gradient", colors: ["rgba(252,212,6,0.18)", "transparent"], stops: [0, 70], shape: "ellipse", posX: "70%", posY: "-10%", opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "radial-gradient", colors: ["rgba(37,99,235,0.14)", "transparent"], stops: [0, 70], shape: "ellipse", posX: "10%", posY: "110%", opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p3", type: "solid", colors: ["var(--page-soft)", ""], opacity: 1 },
      ],
    },
  },
  {
    id: "dark-tech", label: "Dark Tech",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "linear-gradient", colors: ["#0a0e1a", "#111827"], angle: 180, opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "pattern", colors: [], pattern: "grid", patternSize: 40, patternColor: "rgba(255,255,255,0.04)", opacity: 1, blendMode: "normal" },
        { ...BG_LAYER_DEFAULTS, id: "p3", type: "noise", colors: [], noiseOpacity: 0.06, noiseDensity: 60, opacity: 1 },
      ],
    },
  },
  {
    id: "clean-white", label: "Blanc propre",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "solid", colors: ["#ffffff", ""], opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "pattern", colors: [], pattern: "dots", patternSize: 24, patternColor: "rgba(0,0,0,0.04)", opacity: 1 },
      ],
    },
  },
  {
    id: "gradient-mesh", label: "Mesh",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "radial-gradient", colors: ["rgba(252,212,6,0.25)", "transparent"], stops: [0, 60], shape: "ellipse", posX: "20%", posY: "20%", opacity: 1, animated: true, animationSpeed: 25 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "radial-gradient", colors: ["rgba(37,99,235,0.18)", "transparent"], stops: [0, 60], shape: "ellipse", posX: "80%", posY: "60%", opacity: 1, animated: true, animationSpeed: 30 },
        { ...BG_LAYER_DEFAULTS, id: "p3", type: "radial-gradient", colors: ["rgba(16,185,129,0.12)", "transparent"], stops: [0, 60], shape: "ellipse", posX: "50%", posY: "90%", opacity: 1, animated: true, animationSpeed: 22 },
        { ...BG_LAYER_DEFAULTS, id: "p4", type: "solid", colors: ["#f7f7f4", ""], opacity: 1 },
      ],
    },
  },
  {
    id: "sunset", label: "Coucher de soleil",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "linear-gradient", colors: ["#f97316", "#ec4899", "#8b5cf6"], angle: 135, opacity: 0.9, animated: true, animationSpeed: 20 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "solid", colors: ["#0f172a", ""], opacity: 0.3 },
      ],
    },
  },
  {
    id: "ocean", label: "Océan",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "linear-gradient", colors: ["#0ea5e9", "#1e40af"], angle: 180, opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "pattern", colors: [], pattern: "diagonal", patternSize: 30, patternColor: "rgba(255,255,255,0.06)", opacity: 1 },
      ],
    },
  },
  {
    id: "glass", label: "Glassmorphism",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "solid", colors: ["#f0f0f0", ""], opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p2", type: "radial-gradient", colors: ["rgba(252,212,6,0.12)", "transparent"], stops: [0, 70], shape: "ellipse", posX: "30%", posY: "20%", opacity: 1 },
        { ...BG_LAYER_DEFAULTS, id: "p3", type: "noise", colors: [], noiseOpacity: 0.03, noiseDensity: 30, opacity: 1 },
      ],
    },
  },
  {
    id: "solid-brand", label: "Couleur unie",
    bg: {
      layers: [
        { ...BG_LAYER_DEFAULTS, id: "p1", type: "solid", colors: ["#fcd406", ""], opacity: 1 },
      ],
    },
  },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function autoTextColor(bgColor: string): { primary: string; secondary: string } {
  const lum = luminance(bgColor);
  return lum > 0.4
    ? { primary: "#101014", secondary: "#5b5b66" }
    : { primary: "#ffffff", secondary: "rgba(255,255,255,0.75)" };
}

export function getDominantColor(bg: HeroBackground | null | undefined): string {
  const firstLayer = bg?.layers?.find((l) => l.enabled && l.type === "solid");
  if (firstLayer?.colors?.[0]) return firstLayer.colors[0];
  const gradLayer = bg?.layers?.find((l) => l.enabled && l.type !== "solid" && l.type !== "noise");
  if (gradLayer?.colors?.[0]) return gradLayer.colors[0];
  return "#fcd406";
}

export function generateBgCss(bg: HeroBackground | null | undefined): Record<string, string> | null {
  if (!bg?.layers?.length) return null;
  const enabled = bg.layers.filter((l) => l.enabled);
  if (!enabled.length) return null;

  const bgImages: string[] = [];
  const bgSizes: string[] = [];
  const blendModes: string[] = [];
  let animation: string | undefined;
  let solidColor: string | undefined;

  for (const layer of enabled) {
    switch (layer.type) {
      case "solid": {
        solidColor = layer.colors[0] || "transparent";
        break;
      }
      case "linear-gradient": {
        const angle = layer.angle ?? 135;
        const stops = (layer.colors ?? []).map((c, i) => {
          const pct = layer.stops?.[i] != null ? ` ${layer.stops[i]}%` : "";
          return `${c}${pct}`;
        }).join(", ");
        bgImages.push(`linear-gradient(${angle}deg, ${stops})`);
        bgSizes.push("100% 100%");
        blendModes.push(layer.blendMode || "normal");
        if (layer.animated) animation = `bg-drift ${layer.animationSpeed ?? 20}s ease-in-out infinite alternate`;
        break;
      }
      case "radial-gradient": {
        const shape = layer.shape ?? "ellipse";
        const pos = `${layer.posX ?? "50%"} ${layer.posY ?? "50%"}`;
        const stops = (layer.colors ?? []).map((c, i) => {
          const pct = layer.stops?.[i] != null ? ` ${layer.stops[i]}%` : "";
          return `${c}${pct}`;
        }).join(", ");
        bgImages.push(`radial-gradient(${shape} at ${pos}, ${stops})`);
        bgSizes.push("100% 100%");
        blendModes.push(layer.blendMode || "normal");
        if (layer.animated) animation = `bg-drift ${layer.animationSpeed ?? 20}s ease-in-out infinite alternate`;
        break;
      }
      case "conic-gradient": {
        const angle = layer.angle ?? 0;
        const pos = `${layer.posX ?? "50%"} ${layer.posY ?? "50%"}`;
        const stops = (layer.colors ?? []).map((c, i) => {
          const pct = layer.stops?.[i] != null ? ` ${layer.stops[i]}%` : "";
          return `${c}${pct}`;
        }).join(", ");
        bgImages.push(`conic-gradient(from ${angle}deg at ${pos}, ${stops})`);
        bgSizes.push("100% 100%");
        blendModes.push(layer.blendMode || "normal");
        if (layer.animated) animation = `bg-spin ${layer.animationSpeed ?? 20}s linear infinite`;
        break;
      }
      case "pattern": {
        const img = patternToCss(layer);
        if (img) {
          bgImages.push(img);
          if (layer.pattern === "grid" || layer.pattern === "crosses") {
            bgSizes.push(`${layer.patternSize ?? 20}px ${layer.patternSize ?? 20}px, ${layer.patternSize ?? 20}px ${layer.patternSize ?? 20}px`);
          } else {
            bgSizes.push(`${layer.patternSize ?? 20}px ${layer.patternSize ?? 20}px`);
          }
          blendModes.push(layer.blendMode || "normal");
        }
        break;
      }
      case "noise": {
        bgImages.push(noiseToCss(layer.noiseOpacity ?? 0.05, layer.noiseDensity ?? 50));
        bgSizes.push("auto");
        blendModes.push(layer.blendMode || "normal");
        break;
      }
    }
  }

  const result: Record<string, string> = {};
  if (solidColor && !bgImages.length) {
    result.background = solidColor;
  } else if (bgImages.length) {
    if (solidColor) bgImages.push(solidColor);
    result.backgroundImage = bgImages.join(", ");
    result.backgroundSize = bgSizes.join(", ");
    if (blendModes.some((m) => m !== "normal")) result.backgroundBlendMode = blendModes.join(", ");
  }
  if (animation) result.animation = animation;

  const text = bg.text;
  if (text) {
    const pairing = FONT_PAIRINGS.find((p) => p.id === text.fontPairing) ?? FONT_PAIRINGS[0];
    result["--hs-font-heading"] = pairing.cssHeading;
    result["--hs-font-body"] = pairing.cssBody;

    let colors: { primary: string; secondary: string };
    if (text.colorMode === "manual" && text.primaryColor) {
      colors = { primary: text.primaryColor, secondary: text.secondaryColor ?? text.primaryColor };
    } else {
      colors = autoTextColor(getDominantColor(bg));
    }
    result["--hs-text-primary"] = colors.primary;
    result["--hs-text-secondary"] = colors.secondary;
  }

  return result;
}

function patternToCss(layer: BgLayer): string | null {
  const color = layer.patternColor || "rgba(255,255,255,0.15)";
  const size = layer.patternSize ?? 20;
  const half = size / 2;
  switch (layer.pattern) {
    case "dots":
      return `radial-gradient(circle, ${color} 1px, transparent 1px)`;
    case "grid":
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    case "stripes":
      return `repeating-linear-gradient(${layer.patternAngle ?? 45}deg, ${color}, ${color} 1px, transparent 1px, transparent ${size}px)`;
    case "diagonal":
      return `repeating-linear-gradient(${layer.patternAngle ?? 45}deg, transparent, transparent ${half}px, ${color} ${half}px, ${color} ${size}px)`;
    case "zigzag":
      return `linear-gradient(135deg, ${color} 25%, transparent 25%) -${half}px 0, linear-gradient(225deg, ${color} 25%, transparent 25%) -${half}px 0, linear-gradient(315deg, ${color} 25%, transparent 25%), linear-gradient(45deg, ${color} 25%, transparent 25%)`;
    case "checkerboard":
      return `conic-gradient(${color} 25%, transparent 25%, transparent 75%, ${color} 75%)`;
    case "crosses":
      return `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`;
    case "hexagons":
      return `radial-gradient(circle, ${color} 2px, transparent 2px)`;
    default:
      return null;
  }
}

function noiseToCss(opacity: number, _density: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='${opacity}'/></svg>`;
  return `url("data:image/svg+xml,${svg}")`;
}

export function migrateBgColor(bgColor: string | null | undefined): HeroBackground | null {
  if (!bgColor) return null;
  return {
    layers: [
      { ...BG_LAYER_DEFAULTS, id: crypto.randomUUID(), type: "radial-gradient", colors: [bgColor, "transparent"], stops: [0, 70], shape: "ellipse", posX: "20%", posY: "20%", opacity: 0.2 },
    ],
  };
}

export interface HeroSlide {
  slug: string;
  type?: "hero" | "campaign" | null;
  layout?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  image?: string | null;
  bgColor?: string | null;
  badge?: string | null;
  oldPrice?: number | null;
  price?: number | null;
  brandSlug?: string | null;
  brandLabel?: string | null;
  brandBadge?: string | null;
  products?: HeroProduct[] | null;
  bgConfig?: HeroBackground | null;
  active?: boolean | null;
  styles?: SlideStyle | null;
}

export interface HeroStat {
  label: string;
  value: string;
}

// ---- Per-element style model (editable per device in the Hero Builder) ----
export interface HeroElementStyle {
  show?: boolean;
  fontSize?: number; // px, per device
  fontWeight?: number;
  color?: string; // text color (text elements) or chip/button bg
  bg?: string; // background for chip / button / badge
  textColor?: string; // foreground for chip / button / badge
  align?: "left" | "center" | "right";
  spacing?: number; // margin-bottom in px
  radius?: number; // border-radius in px
  letterSpacing?: number; // in px
  lineHeight?: number; // unitless
  textTransform?: "none" | "uppercase" | "capitalize" | "lowercase";
  maxWidth?: number; // max-width in px (text blocks)
}

export interface DeviceImageStyle {
  side?: "left" | "right";
  width?: number; // % of slide for split
  shape?: "square" | "rounded";
  position?: "center" | "left" | "right" | "top" | "bottom"; // overlay focal point
}
export interface DeviceContentStyle {
  vertical?: "top" | "middle" | "bottom";
  horizontal?: "left" | "center" | "right";
  width?: number; // % of slide
  paddingY?: number; // px
}

export interface SlideStyle {
  image?: PerDevice<DeviceImageStyle>;
  content?: PerDevice<DeviceContentStyle>;
  eyebrow?: PerDevice<HeroElementStyle>;
  heading?: PerDevice<HeroElementStyle>;
  description?: PerDevice<HeroElementStyle>;
  price?: PerDevice<HeroElementStyle>;
  cta?: PerDevice<HeroElementStyle>;
  badge?: PerDevice<HeroElementStyle>;
}

export interface HeroGlobalStyle {
  section?: { maxWidth?: number; paddingY?: number; bg?: string };
  stats?: {
    position?: "below" | "overlay";
    columns?: number;
    valueSize?: number;
    labelSize?: number;
    valueColor?: string;
    labelColor?: string;
  };
  eyebrow?: HeroElementStyle;
  heading?: HeroElementStyle;
  description?: HeroElementStyle;
  price?: HeroElementStyle;
  cta?: HeroElementStyle;
  badge?: HeroElementStyle;
}

export function mergeEl(
  global?: HeroElementStyle,
  slide?: HeroElementStyle,
): HeroElementStyle {
  return { ...(global ?? {}), ...(slide ?? {}) };
}

// Normalize a value that may be a flat (old) style or an explicit PerDevice map.
export function normalizeDevice<T>(v: PerDevice<T> | T | undefined): PerDevice<T> {
  if (!v) return {};
  const any = v as Record<string, unknown>;
  if ("mobile" in any || "tablet" in any || "desktop" in any) return v as PerDevice<T>;
  return { tablet: v as T };
}

// Migrate the legacy flat SlideStyle (fontSize/fontSizeSm/fontSizeLg + flat image/content)
// into the new PerDevice model so old stored data keeps rendering correctly.
export function migrateSlideStyle(old: unknown): SlideStyle {
  if (!old || typeof old !== "object") return {};
  const o = old as Record<string, any>;
  const mapEl = (e: any): PerDevice<HeroElementStyle> => {
    if (!e) return {};
    if (e.mobile || e.tablet || e.desktop) return e as PerDevice<HeroElementStyle>;
    const tablet: HeroElementStyle = {
      show: e.show,
      fontSize: e.fontSize,
      fontWeight: e.fontWeight,
      color: e.color,
      bg: e.bg,
      textColor: e.textColor,
      align: e.align,
      spacing: e.spacing,
      radius: e.radius,
      letterSpacing: e.letterSpacing,
      lineHeight: e.lineHeight,
      textTransform: e.textTransform,
      maxWidth: e.maxWidth,
    };
    const res: PerDevice<HeroElementStyle> = { tablet };
    if (e.fontSizeSm != null) res.mobile = { fontSize: e.fontSizeSm };
    if (e.fontSizeLg != null) res.desktop = { fontSize: e.fontSizeLg };
    return res;
  };
  const mapImg = (im: any): PerDevice<DeviceImageStyle> => {
    if (!im) return {};
    if (im.mobile || im.tablet || im.desktop) return im as PerDevice<DeviceImageStyle>;
    return { tablet: { side: im.side, width: im.width, shape: im.shape, position: im.position } };
  };
  const mapCon = (c: any): PerDevice<DeviceContentStyle> => {
    if (!c) return {};
    if (c.mobile || c.tablet || c.desktop) return c as PerDevice<DeviceContentStyle>;
    return { tablet: { vertical: c.vertical, horizontal: c.horizontal, width: c.width, paddingY: c.paddingY } };
  };
  return {
    image: mapImg(o.image),
    content: mapCon(o.content),
    eyebrow: mapEl(o.eyebrow),
    heading: mapEl(o.heading),
    description: mapEl(o.description),
    price: mapEl(o.price),
    cta: mapEl(o.cta),
    badge: mapEl(o.badge),
  };
}

export interface ElEntry {
  key: string;
  chip: boolean;
  dev: PerDevice<HeroElementStyle>;
}

export interface LayoutEntry {
  type: "split" | "overlay" | "product-grid";
  dev: PerDevice<{ image?: DeviceImageStyle; content?: DeviceContentStyle }>;
}

function elCss(el: HeroElementStyle | undefined, chip: boolean, defaultAlign?: string): string {
  if (!el) return "";
  const p: string[] = [];
  if (el.show === false) p.push("display:none");
  if (el.fontSize != null) p.push(`font-size:${el.fontSize}px`);
  if (el.fontWeight != null) p.push(`font-weight:${el.fontWeight}`);
  const color = chip ? el.textColor : el.color;
  if (color != null) p.push(`color:${color}`);
  if (chip && el.bg != null) p.push(`background:${el.bg}`);
  const align = el.align ?? defaultAlign;
  if (align) p.push(`text-align:${align}`);
  if (el.spacing != null) p.push(`margin-bottom:${el.spacing}px`);
  if (el.radius != null) p.push(`border-radius:${el.radius}px`);
  if (el.letterSpacing != null) p.push(`letter-spacing:${el.letterSpacing}px`);
  if (el.lineHeight != null) p.push(`line-height:${el.lineHeight}`);
  if (el.textTransform) p.push(`text-transform:${el.textTransform}`);
  if (el.maxWidth != null) p.push(`max-width:${el.maxWidth}px`);
  return p.join(";");
}

function layoutDevCss(type: "split" | "overlay" | "product-grid", img?: DeviceImageStyle, con?: DeviceContentStyle, defaultAlign?: string): string[] {
  const rules: string[] = [];
  if (type === "product-grid") {
    const v = con?.vertical;
    if (v) rules.push(`.hero-grid{align-items:${v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center"}}`);
    if (con?.paddingY != null) rules.push(`.hero-grid{padding-top:${con.paddingY}px;padding-bottom:${con.paddingY}px}`);
    if (con?.width != null) rules.push(`.el-text{max-width:${con.width}%}`);
    const h = con?.horizontal ?? defaultAlign;
    if (h) {
      const ta = `text-align:${h}`;
      rules.push(`.el-text{${ta}}`);
    }
  } else if (type === "split") {
    const radius = img?.shape === "square" ? "16px" : img?.shape === "rounded" ? "9999px" : null;
    if (radius) rules.push(`.el-img{border-radius:${radius}}`);
    if (con?.width != null) rules.push(`.el-text{max-width:${con.width}%}`);
    const h = con?.horizontal ?? defaultAlign;
    if (h) {
      const ta = `text-align:${h}`;
      const ma = h === "center" ? "margin-left:auto;margin-right:auto" : h === "right" ? "margin-left:auto;margin-right:0" : "margin-left:0;margin-right:auto";
      rules.push(`.el-text{${ta};${ma}}`);
    }
    const v = con?.vertical;
    if (v) rules.push(`.hero-grid{align-items:${v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center"}}`);
    if (con?.paddingY != null) rules.push(`.hero-grid{padding-top:${con.paddingY}px;padding-bottom:${con.paddingY}px}`);
  } else {
    const pos = img?.position ?? "center";
    rules.push(`.el-img{object-position:${pos}}`);
    const h = con?.horizontal ?? defaultAlign;
    if (h) {
      const ta = `text-align:${h}`;
      const ma = h === "center" ? "margin-left:auto;margin-right:auto" : h === "right" ? "margin-left:auto;margin-right:0" : "margin-left:0;margin-right:auto";
      rules.push(`.el-content{${ta};${ma}}`);
    }
    if (con?.width != null) rules.push(`.el-content{max-width:${con.width}%}`);
    const v = con?.vertical;
    if (v) rules.push(`.el-overlay{align-items:${v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center"}}`);
    if (con?.paddingY != null) rules.push(`.el-content{padding-top:${con.paddingY}px;padding-bottom:${con.paddingY}px}`);
  }
  return rules;
}

// Build a scoped stylesheet for per-device (mobile / tablet / desktop) overrides.
// Base rules target the tablet breakpoint; mobile (<=640) and desktop (>=1024)
// are emitted as media queries so the storefront is fully responsive and the
// builder preview (rendered at the device width) is WYSIWYG.
export function heroStyleSheet(
  slug: string,
  entries: ElEntry[],
  layout: LayoutEntry,
  defaultAlign?: string,
): string {
  const safe = slug.replace(/[^a-z0-9]+/gi, "-");
  const cls = `.hs-${safe}`;
  const lines: string[] = [];

  for (const e of entries) {
    const sel = `${cls} .el-${e.key}`;
    const tablet = e.dev.tablet;
    const mobile = e.dev.mobile;
    const desktop = e.dev.desktop;
    if (tablet) lines.push(`${sel}{${elCss(tablet, e.chip, defaultAlign)}}`);
    if (mobile) lines.push(`@media (max-width:640px){${sel}{${elCss(mobile, e.chip, defaultAlign)}}}`);
    if (desktop) lines.push(`@media (min-width:1024px){${sel}{${elCss(desktop, e.chip, defaultAlign)}}}`);
  }

  const emitLayout = (img?: DeviceImageStyle, con?: DeviceContentStyle) =>
    layoutDevCss(layout.type, img, con, defaultAlign);

  const ld = layout.dev;
  if (ld.tablet) lines.push(...emitLayout(ld.tablet.image, ld.tablet.content));
  if (ld.mobile) lines.push(`@media (max-width:640px){${emitLayout(ld.mobile.image, ld.mobile.content).join("")}}`);
  if (ld.desktop) {
    const d = emitLayout(ld.desktop.image, ld.desktop.content);
    // image width override at >=1024 for split and product-grid
    if (ld.desktop.image?.width != null) {
      const w = Math.max(10, Math.min(90, ld.desktop.image.width));
      const a = 100 - w;
      d.push(`.hero-grid{grid-template-columns:${a}fr ${w}fr}}`);
    } else if (layout.type === "product-grid") {
      d.push(`.hero-grid{grid-template-columns:55fr 45fr}}`);
    }
    lines.push(`@media (min-width:1024px){${d.join("")}}`);
  }

  return lines.join("\n");
}

export const HERO_LAYOUTS: { value: HeroLayout; label: string }[] = [
  { value: "split", label: "Split (texte + image)" },
  { value: "overlay", label: "Pleine largeur (image de fond)" },
  { value: "product-grid", label: "Grille produits (style iris.ma)" },
];

export const HERO_TRANSITIONS: { value: HeroTransition; label: string }[] = [
  { value: "slide", label: "Glissement" },
  { value: "fade", label: "Fondu" },
];

// Build a Cloudinary-optimized URL (auto format, auto quality, width + dpr).
// Passes through non-Cloudinary URLs unchanged (e.g. pngimg.com or data URLs).
export function heroImageUrl(url: string | null | undefined, opts?: { w?: number; dpr?: number }): string {
  if (!url) return "";
  const w = opts?.w ?? 1200;
  const dpr = opts?.dpr ?? 2;
  const m = url.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v[\d]+\/)?(.+)$/);
  if (m) {
    const cloud = m[1];
    const rest = m[2];
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w},dpr_${dpr}/${rest}`;
  }
  return url;
}

// Responsive srcset for Cloudinary URLs; empty for others (single src).
export function heroSrcSet(url: string | null | undefined): string {
  if (!url || !/^https:\/\/res\.cloudinary\.com\//.test(url)) return "";
  return [400, 800, 1200, 1600].map((w) => `${heroImageUrl(url, { w })} ${w}w`).join(", ");
}

function cloudName(): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_CLOUDINARY_CLOUD_NAME || undefined;
}

function uploadPreset(): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_CLOUDINARY_UPLOAD_PRESET || undefined;
}

// Upload a device file to Cloudinary (unsigned preset). Falls back to a
// base64 data URL when Cloudinary is not configured, so the builder always works.
export async function uploadImage(file: File): Promise<string> {
  const cloud = cloudName();
  const preset = uploadPreset();
  if (cloud && preset) {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = (await res.json()) as { secure_url?: string };
        if (data?.secure_url) return data.secure_url;
      }
    } catch {
      // fall through to data URL
    }
  }
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function parseJsonField<T>(val: unknown, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return fallback; } }
  return val as T;
}
