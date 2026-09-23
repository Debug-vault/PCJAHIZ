import { useI18n, type TaxMode } from "@/lib/i18n";

export function TaxModeToggle() {
  const { taxMode, setTaxMode } = useI18n();

  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-[var(--line)] text-[10px] font-bold">
      <button
        type="button"
        onClick={() => setTaxMode("ht")}
        className={`px-2 py-0.5 transition-colors ${
          taxMode === "ht" ? "bg-[var(--text-1)] text-white" : "bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)]"
        }`}
      >
        HT
      </button>
      <button
        type="button"
        onClick={() => setTaxMode("ttc")}
        className={`px-2 py-0.5 transition-colors ${
          taxMode === "ttc" ? "bg-[var(--text-1)] text-white" : "bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)]"
        }`}
      >
        TTC
      </button>
    </div>
  );
}
