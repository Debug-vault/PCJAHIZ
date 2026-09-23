import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, RotateCcw, Trash2, Zap, Type } from "lucide-react";
import {
  generateBgCss,
  migrateBgColor,
  luminance,
  getDominantColor,
  autoTextColor,
  BG_PRESETS,
  BG_LAYER_DEFAULTS,
  FONT_PAIRINGS,
  DEFAULT_TEXT_CONFIG,
  type BgLayer,
  type BgLayerType,
  type BgPattern,
  type BgBlend,
  type HeroBackground,
  type TextConfig,
  type FontPairingId,
} from "@/lib/hero";

interface BackgroundMakerProps {
  value: HeroBackground | null;
  onChange: (bg: HeroBackground | null) => void;
  fallbackColor?: string;
}

const LAYER_TYPES: { value: BgLayerType; label: string }[] = [
  { value: "solid", label: "Couleur unie" },
  { value: "linear-gradient", label: "Dégradé linéaire" },
  { value: "radial-gradient", label: "Dégradé radial" },
  { value: "conic-gradient", label: "Dégradé conique" },
  { value: "pattern", label: "Motif" },
  { value: "noise", label: "Bruit / Texture" },
];

const PATTERNS: { value: BgPattern; label: string }[] = [
  { value: "dots", label: "Points" },
  { value: "grid", label: "Grille" },
  { value: "stripes", label: "Rayures" },
  { value: "diagonal", label: "Diagonales" },
  { value: "zigzag", label: "Zigzag" },
  { value: "checkerboard", label: "Échiquier" },
  { value: "crosses", label: "Croix" },
  { value: "hexagons", label: "Hexagones" },
];

const BLENDS: { value: BgBlend; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft Light" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
];

const DEFAULT_COLORS = ["#fcd406", "#1a3a6e", "#0ea5e9", "#ec4899", "#8b5cf6", "#10b981", "#f97316", "#000000", "#ffffff"];
const inputCls = "w-full rounded-lg border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[var(--gold)]";

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function getEffectiveBg(val: HeroBackground | null, fallbackColor?: string): HeroBackground | null {
  if (val?.layers?.length) return val;
  if (fallbackColor) return migrateBgColor(fallbackColor);
  return BG_PRESETS[0].bg;
}

export default function BackgroundMaker({ value, onChange, fallbackColor }: BackgroundMakerProps) {
  const effective = getEffectiveBg(value, fallbackColor);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [textExpanded, setTextExpanded] = useState(false);

  const cssProps = generateBgCss(effective);
  const bgStyle: React.CSSProperties = cssProps
    ? { ...cssProps, width: "100%", height: "100%", position: "absolute", inset: 0 }
    : { background: fallbackColor || "var(--page-soft)", width: "100%", height: "100%", position: "absolute", inset: 0 };

  const textCfg = effective?.text ?? DEFAULT_TEXT_CONFIG;
  const pairing = FONT_PAIRINGS.find((p) => p.id === textCfg.fontPairing) ?? FONT_PAIRINGS[0];
  const autoColors = autoTextColor(getDominantColor(effective));
  const textColor = textCfg.colorMode === "manual" && textCfg.primaryColor
    ? { primary: textCfg.primaryColor, secondary: textCfg.secondaryColor ?? textCfg.primaryColor }
    : autoColors;

  const previewTextStyle: React.CSSProperties = {
    fontFamily: pairing.cssHeading,
    color: textColor.primary,
  };

  const updateText = (patch: Partial<TextConfig>) => {
    onChange({ ...(effective ?? { layers: [] }), text: { ...(effective?.text ?? DEFAULT_TEXT_CONFIG), ...patch } });
  };

  const applyPreset = (preset: typeof BG_PRESETS[number]) => {
    onChange({ layers: preset.bg.layers.map((l) => ({ ...l, id: uid() })), text: effective?.text });
  };

  const addLayer = (type: BgLayerType = "solid") => {
    const newLayer: BgLayer = {
      ...BG_LAYER_DEFAULTS,
      id: uid(),
      type,
      colors: type === "solid" ? ["#fcd406", ""] : ["#fcd406", "transparent"],
      enabled: true,
    };
    onChange({ layers: [...(effective?.layers ?? []), newLayer], text: effective?.text });
    setExpanded(newLayer.id);
  };

  const updateLayer = (id: string, patch: Partial<BgLayer>) => {
    onChange({
        layers: (effective?.layers ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)),
      text: effective?.text,
    });
  };

  const removeLayer = (id: string) => {
    onChange({ layers: (effective?.layers ?? []).filter((l) => l.id !== id), text: effective?.text });
  };

  const moveLayer = (id: string, dir: -1 | 1) => {
    const layers = [...(effective?.layers ?? [])];
    const idx = layers.findIndex((l) => l.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= layers.length) return;
    [layers[idx], layers[newIdx]] = [layers[newIdx], layers[idx]];
    onChange({ layers, text: effective?.text });
  };

  return (
    <div className="space-y-3">
      {/* Preview with sample text */}
      <div className="relative h-36 w-full overflow-hidden rounded-xl border border-[var(--line)]">
        <div style={bgStyle} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
          <span style={previewTextStyle} className="text-lg font-bold leading-tight drop-shadow-sm">
            PC JAHIZ
          </span>
          <span style={{ fontFamily: pairing.cssBody, color: textColor.secondary }} className="text-xs leading-snug drop-shadow-sm">
            Promo Gaming · Jusqu'à -40%
          </span>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[var(--text-2)]">Préréglages</h4>
        <div className="grid grid-cols-4 gap-2">
          {BG_PRESETS.map((p) => {
            const pCss = generateBgCss(p.bg);
            const pStyle: React.CSSProperties = pCss
              ? { ...pCss, width: "100%", height: "100%", position: "absolute", inset: 0 }
              : { background: "#fcd406", width: "100%", height: "100%", position: "absolute", inset: 0 };
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="group relative h-12 overflow-hidden rounded-lg border border-[var(--line)] transition hover:border-[var(--gold)]"
              >
                <div style={pStyle} />
                <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[9px] font-medium text-white opacity-0 transition group-hover:opacity-100">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[var(--text-2)]">Couches ({effective?.layers?.length ?? 0})</h4>
          <button onClick={() => addLayer("solid")} className="flex items-center gap-1 rounded-lg border border-dashed border-[var(--line)] px-2 py-1 text-xs text-[var(--text-2)] hover:border-[var(--gold)] hover:text-[var(--text-1)]">
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        </div>

        {(effective?.layers ?? []).map((layer, i) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            index={i}
            total={effective?.layers?.length ?? 0}
            expanded={expanded === layer.id}
            onToggle={() => setExpanded(expanded === layer.id ? null : layer.id)}
            onUpdate={(patch) => updateLayer(layer.id, patch)}
            onRemove={() => removeLayer(layer.id)}
            onMove={(dir) => moveLayer(layer.id, dir)}
          />
        ))}
      </div>

      {/* Typography */}
      <div className="space-y-2">
        <button onClick={() => setTextExpanded(!textExpanded)} className="flex w-full items-center gap-2 text-left">
          <Type className="h-3.5 w-3.5 text-[var(--gold)]" />
          <span className="text-xs font-bold text-[var(--text-2)]">Typographie & Couleur du texte</span>
          {textExpanded ? <ChevronUp className="ml-auto h-3 w-3 text-[var(--text-2)]" /> : <ChevronDown className="ml-auto h-3 w-3 text-[var(--text-2)]" />}
        </button>

        {textExpanded ? (
          <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
            {/* Font pairing */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)]">Police</label>
              <div className="grid grid-cols-1 gap-1.5">
                {FONT_PAIRINGS.map((fp) => (
                  <button
                    key={fp.id}
                    onClick={() => updateText({ fontPairing: fp.id })}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      textCfg.fontPairing === fp.id
                        ? "border-[var(--gold)] bg-[var(--gold)]/10"
                        : "border-[var(--line)] hover:border-[var(--gold)]/50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text-1)]">{fp.label}</span>
                      <div className="mt-0.5 flex gap-2 text-[10px] text-[var(--text-2)]">
                        <span>Titre: {fp.heading}</span>
                        <span>·</span>
                        <span>Corps: {fp.body}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ fontFamily: fp.cssHeading }} className="block text-sm font-bold text-[var(--text-1)]">Aa</span>
                      <span style={{ fontFamily: fp.cssBody }} className="block text-[10px] text-[var(--text-2)]">Bonjour</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-2)]">Couleur du texte</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateText({ colorMode: "auto" })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    textCfg.colorMode === "auto"
                      ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--text-1)]"
                      : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--gold)]/50"
                  }`}
                >
                  Auto (selon fond)
                </button>
                <button
                  onClick={() => updateText({ colorMode: "manual" })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    textCfg.colorMode === "manual"
                      ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--text-1)]"
                      : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--gold)]/50"
                  }`}
                >
                  Manuel
                </button>
              </div>
            </div>

            {/* Auto preview colors */}
            {textCfg.colorMode === "auto" ? (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--page)] px-3 py-2">
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-full border border-[var(--line)]" style={{ backgroundColor: autoColors.primary }} />
                  <div className="h-5 w-5 rounded-full border border-[var(--line)]" style={{ backgroundColor: autoColors.secondary }} />
                </div>
                <span className="text-[10px] text-[var(--text-2)]">
                  Fond {luminance(getDominantColor(effective)) > 0.4 ? "clair" : "sombre"} → texte {luminance(getDominantColor(effective)) > 0.4 ? "sombre" : "clair"}
                </span>
              </div>
            ) : null}

            {/* Manual color pickers */}
            {textCfg.colorMode === "manual" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="color" className="h-8 w-10 rounded border border-[var(--line)] bg-transparent" value={textCfg.primaryColor ?? "#101014"} onChange={(e) => updateText({ primaryColor: e.target.value })} />
                  <div>
                    <label className="text-[10px] font-medium text-[var(--text-2)]">Texte principal</label>
                    <input className={inputCls + " mt-0.5"} value={textCfg.primaryColor ?? "#101014"} onChange={(e) => updateText({ primaryColor: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-8 w-10 rounded border border-[var(--line)] bg-transparent" value={textCfg.secondaryColor ?? "#5b5b66"} onChange={(e) => updateText({ secondaryColor: e.target.value })} />
                  <div>
                    <label className="text-[10px] font-medium text-[var(--text-2)]">Texte secondaire</label>
                    <input className={inputCls + " mt-0.5"} value={textCfg.secondaryColor ?? "#5b5b66"} onChange={(e) => updateText({ secondaryColor: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange(null)}
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-2)] hover:border-red-400 hover:text-red-500"
      >
        <RotateCcw className="h-3 w-3" /> Réinitialiser
      </button>
    </div>
  );
}

function LayerCard({ layer, index, total, expanded, onToggle, onUpdate, onRemove, onMove }: {
  layer: BgLayer;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<BgLayer>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--page-soft)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="h-3.5 w-3.5 cursor-grab text-[var(--text-2)]" />
        <button onClick={() => onUpdate({ enabled: !layer.enabled })} className="flex-shrink-0">
          {layer.enabled ? <Eye className="h-3.5 w-3.5 text-[var(--gold)]" /> : <EyeOff className="h-3.5 w-3.5 text-[var(--text-2)]" />}
        </button>
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="truncate text-xs font-medium text-[var(--text-1)]">
            {LAYER_TYPES.find((t) => t.value === layer.type)?.label ?? layer.type}
          </span>
          {layer.pattern ? <span className="text-[10px] text-[var(--text-2)]">({layer.pattern})</span> : null}
          {expanded ? <ChevronUp className="h-3 w-3 flex-shrink-0 text-[var(--text-2)]" /> : <ChevronDown className="h-3 w-3 flex-shrink-0 text-[var(--text-2)]" />}
        </button>
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-[var(--text-2)] hover:text-[var(--text-1)] disabled:opacity-30">
          <ChevronUp className="h-3 w-3" />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-[var(--text-2)] hover:text-[var(--text-1)] disabled:opacity-30">
          <ChevronDown className="h-3 w-3" />
        </button>
        <button onClick={onRemove} className="text-[var(--text-2)] hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Expanded controls */}
      {expanded ? (
        <div className="space-y-3 border-t border-[var(--line)] px-3 py-3">
          {/* Type */}
          <Field label="Type">
            <select className={inputCls} value={layer.type} onChange={(e) => onUpdate({ type: e.target.value as BgLayerType })}>
              {LAYER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          {/* Colors */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-2)]">Couleurs</label>
            {layer.colors.map((c, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <input type="color" className="h-8 w-10 rounded border border-[var(--line)] bg-transparent" value={c.startsWith("var(") ? "#888888" : c} onChange={(e) => {
                  const colors = [...layer.colors]; colors[ci] = e.target.value; onUpdate({ colors });
                }} />
                <input className={inputCls} value={c} onChange={(e) => {
                  const colors = [...layer.colors]; colors[ci] = e.target.value; onUpdate({ colors });
                }} />
                {layer.colors.length > 1 ? (
                  <button onClick={() => onUpdate({ colors: layer.colors.filter((_, j) => j !== ci) })} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                ) : null}
              </div>
            ))}
            <button onClick={() => onUpdate({ colors: [...layer.colors, "#ffffff"] })} className="flex items-center gap-1 text-[10px] text-[var(--text-2)] hover:text-[var(--text-1)]">
              <Plus className="h-3 w-3" /> Ajouter une couleur
            </button>
          </div>

          {/* Stops */}
          {layer.type !== "solid" && layer.type !== "noise" ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-2)]">Stops (%)</label>
              {layer.colors.map((_, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-2)] w-12">Couleur {ci + 1}</span>
                  <input type="number" className={inputCls + " w-20"} value={layer.stops?.[ci] ?? ""} min={0} max={100} onChange={(e) => {
                    const stops = [...(layer.stops ?? [])]; stops[ci] = e.target.value === "" ? undefined! : Number(e.target.value); onUpdate({ stops });
                  }} />
                  <span className="text-[10px] text-[var(--text-2)]">%</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Gradient geometry */}
          {layer.type === "linear-gradient" || layer.type === "conic-gradient" ? (
            <NumberField label="Angle (deg)" value={layer.angle ?? 135} min={0} max={360} onChange={(n) => onUpdate({ angle: n ?? 135 })} />
          ) : null}
          {layer.type === "radial-gradient" || layer.type === "conic-gradient" ? (
            <>
              <Field label="Forme">
                <select className={inputCls} value={layer.shape ?? "ellipse"} onChange={(e) => onUpdate({ shape: e.target.value as "ellipse" | "circle" })}>
                  <option value="ellipse">Ellipse</option>
                  <option value="circle">Cercle</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Position X">
                  <input className={inputCls} value={layer.posX ?? "50%"} onChange={(e) => onUpdate({ posX: e.target.value })} />
                </Field>
                <Field label="Position Y">
                  <input className={inputCls} value={layer.posY ?? "50%"} onChange={(e) => onUpdate({ posY: e.target.value })} />
                </Field>
              </div>
            </>
          ) : null}

          {/* Pattern */}
          {layer.type === "pattern" ? (
            <>
              <Field label="Motif">
                <select className={inputCls} value={layer.pattern ?? "dots"} onChange={(e) => onUpdate({ pattern: e.target.value as BgPattern })}>
                  {PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Taille (px)" value={layer.patternSize ?? 20} min={4} max={200} onChange={(n) => onUpdate({ patternSize: n ?? 20 })} />
                <Field label="Couleur motif">
                  <input className={inputCls} value={layer.patternColor ?? "rgba(255,255,255,0.15)"} onChange={(e) => onUpdate({ patternColor: e.target.value })} />
                </Field>
              </div>
            </>
          ) : null}

          {/* Noise */}
          {layer.type === "noise" ? (
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Opacité bruit" value={layer.noiseOpacity ?? 0.05} min={0} max={1} onChange={(n) => onUpdate({ noiseOpacity: n ?? 0.05 })} />
              <NumberField label="Densité" value={layer.noiseDensity ?? 50} min={1} max={100} onChange={(n) => onUpdate({ noiseDensity: n ?? 50 })} />
            </div>
          ) : null}

          {/* FX controls */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Opacité" value={layer.opacity} min={0} max={1} onChange={(n) => onUpdate({ opacity: n ?? 1 })} />
            <Field label="Blend mode">
              <select className={inputCls} value={layer.blendMode} onChange={(e) => onUpdate({ blendMode: e.target.value as BgBlend })}>
                {BLENDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Animation */}
          {layer.type !== "solid" && layer.type !== "noise" ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--page)] px-3 py-2">
              <Zap className={`h-3.5 w-3.5 ${layer.animated ? "text-[var(--gold)]" : "text-[var(--text-2)]"}`} />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={layer.animated ?? false} onChange={(e) => onUpdate({ animated: e.target.checked })} />
                <span>Animation lente</span>
              </label>
              {layer.animated ? (
                <NumberField label="" value={layer.animationSpeed ?? 20} min={5} max={60} onChange={(n) => onUpdate({ animationSpeed: n ?? 20 })} />
              ) : null}
              {layer.animated ? <span className="text-[10px] text-[var(--text-2)]">sec</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value?: number | null; onChange: (v: number | null) => void; min?: number; max?: number }) {
  return (
    <Field label={label}>
      <input type="number" className={inputCls} value={value ?? ""} min={min} max={max} step="any" onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
    </Field>
  );
}
