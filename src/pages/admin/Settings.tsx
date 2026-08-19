import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "boutique" | "marque" | "accueil" | "ia";
const TABS: { id: Tab; label: string }[] = [
  { id: "boutique", label: "Boutique" },
  { id: "marque", label: "Marque & Identité" },
  { id: "accueil", label: "Accueil" },
  { id: "ia", label: "IA" },
];

type MarqueeItem = { fr: string; ar: string };

const DEFAULTS: Record<string, string> = {
  storeName: "PC Jahiz",
  taxRate: "0",
  contactEmail: "",
  contactPhone: "",
  codEnabled: "true",
  storeLogo: "",
  storeFavicon: "",
  themeAccent: "#FDD502",
  themeAccent2: "#7aa2ff",
  marqueeEnabled: "true",
  marqueeBg: "#FDD502",
  marqueeText: "#1b1b1f",
  aiEnabled: "false",
  aiModel: "gemini-3.5-flash-lite\ngemini-3.5-flash\ngemini-3.6-flash",
  aiSystemPrompt: "",
};

const readVal = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("value" in o) return String(o.value ?? "");
    if ("rate" in o) return String(o.rate ?? "");
    return "";
  }
  return "";
};

export default function Settings() {
  const { data, isLoading } = trpc.admin.settings.get.useQuery();
  const update = trpc.admin.settings.update.useMutation();
  const [tab, setTab] = useState<Tab>("boutique");
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([
    { fr: "Livraison 24-48h partout au Maroc", ar: "التوصيل 24-48 ساعة في جميع أنحاء المغرب" },
    { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
    { fr: "Prix en dirham", ar: "الأسعار بالدرهم" },
    { fr: "Échange sous 7 jours", ar: "الإرجاع خلال 7 أيام" },
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = { ...DEFAULTS };
    for (const row of data) {
      if (row.key === "marqueeItems") {
        const arr = (row.value as { value?: unknown } | MarqueeItem[] | null) ?? null;
        const list = Array.isArray(arr) ? arr : Array.isArray((arr as { value?: unknown })?.value) ? (arr as { value: MarqueeItem[] }).value : null;
        if (Array.isArray(list)) setMarqueeItems(list as MarqueeItem[]);
        continue;
      }
      next[row.key] = readVal(row.value);
    }
    setValues(next);
  }, [data]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const payload: Record<string, unknown> = {
      storeName: { value: values.storeName },
      taxRate: { rate: Number(values.taxRate) || 0 },
      contactEmail: { value: values.contactEmail },
      contactPhone: { value: values.contactPhone },
      codEnabled: { value: values.codEnabled === "true" },
      storeLogo: { value: values.storeLogo },
      storeFavicon: { value: values.storeFavicon },
      themeAccent: { value: values.themeAccent },
      themeAccent2: { value: values.themeAccent2 },
      marqueeEnabled: { value: values.marqueeEnabled === "true" },
      marqueeItems: { value: marqueeItems.map((it) => ({ fr: it.fr.trim(), ar: it.ar.trim() })) },
      marqueeBg: { value: values.marqueeBg },
      marqueeText: { value: values.marqueeText },
      aiEnabled: { value: values.aiEnabled === "true" },
      aiModel: { value: values.aiModel },
      aiSystemPrompt: { value: values.aiSystemPrompt },
    };
    await update.mutateAsync({ values: payload });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" /></div>;
  }

  const Checkbox = ({ k, label }: { k: string; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={values[k] === "true"} onChange={(e) => set(k, String(e.target.checked))} />
      {label}
    </label>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-hud text-2xl font-bold">Réglages</h1>
        <p className="text-sm text-[var(--text-2)]">Configuration de la boutique.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={tab === tb.id ? "rounded-lg bg-[var(--gold-dim)] px-3 py-1.5 text-sm font-medium text-[var(--gold)]" : "rounded-lg px-3 py-1.5 text-sm text-[var(--text-2)] hover:bg-white/5"}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-4">
        {tab === "boutique" && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="space-y-1.5"><Label>Nom de la boutique</Label><Input value={values.storeName} onChange={(e) => set("storeName", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email de contact</Label><Input value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Téléphone</Label><Input value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Taxe / TVA (%)</Label><Input type="number" value={values.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></div>
              <div className="flex items-center"><Checkbox k="codEnabled" label="Paiement à la livraison activé" /></div>
            </div>
          </div>
        )}

        {tab === "marque" && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="space-y-1.5"><Label>Logo (URL)</Label><Input value={values.storeLogo} onChange={(e) => set("storeLogo", e.target.value)} placeholder="https://…" /></div>
            <div className="space-y-1.5"><Label>Favicon (URL)</Label><Input value={values.storeFavicon} onChange={(e) => set("storeFavicon", e.target.value)} placeholder="https://…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Couleur principale</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={values.themeAccent} onChange={(e) => set("themeAccent", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
                  <span className="font-mono text-xs text-[var(--text-2)]">{values.themeAccent}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Couleur secondaire</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={values.themeAccent2} onChange={(e) => set("themeAccent2", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" />
                  <span className="font-mono text-xs text-[var(--text-2)]">{values.themeAccent2}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "accueil" && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="flex items-center"><Checkbox k="marqueeEnabled" label="Bandeau défilant activé" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Couleur du bandeau</Label><div className="flex items-center gap-2"><input type="color" value={values.marqueeBg} onChange={(e) => set("marqueeBg", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" /><span className="font-mono text-xs text-[var(--text-2)]">{values.marqueeBg}</span></div></div>
              <div className="space-y-1.5"><Label>Texte du bandeau</Label><div className="flex items-center gap-2"><input type="color" value={values.marqueeText} onChange={(e) => set("marqueeText", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-transparent p-1" /><span className="font-mono text-xs text-[var(--text-2)]">{values.marqueeText}</span></div></div>
            </div>
            <div className="space-y-2">
              <Label>Messages du bandeau</Label>
              {marqueeItems.map((item, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input value={item.fr} onChange={(e) => setMarqueeItems((s) => s.map((m, idx) => (idx === i ? { ...m, fr: e.target.value } : m)))} placeholder="Texte FR" />
                  <Input dir="rtl" value={item.ar} onChange={(e) => setMarqueeItems((s) => s.map((m, idx) => (idx === i ? { ...m, ar: e.target.value } : m)))} placeholder="نص بالعربية" />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setMarqueeItems((s) => [...s, { fr: "", ar: "" }])}>+ Ajouter un message</Button>
            </div>
          </div>
        )}

        {tab === "ia" && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] p-5 space-y-3">
            <div className="flex items-center"><Checkbox k="aiEnabled" label="Activer les fonctionnalités IA" /></div>
            <div className="space-y-1.5">
              <Label>Modèles IA (un par ligne, ordre = priorité)</Label>
              <textarea className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm" value={values.aiModel} onChange={(e) => set("aiModel", e.target.value)} />
            </div>
            <div className="space-y-1.5"><Label>Prompt système</Label><textarea className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={values.aiSystemPrompt} onChange={(e) => set("aiSystemPrompt", e.target.value)} /></div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={save}>Enregistrer</Button>
          {saved && <span className="text-sm text-emerald-400">Enregistré ✓</span>}
        </div>
      </div>
    </div>
  );
}