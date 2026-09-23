import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";

function waNumber(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  return digits.startsWith("0") ? "212" + digits.slice(1) : digits;
}

export function WhatsAppWidget() {
  const { t } = useI18n();
  const { settings } = useStoreSettings();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const number = waNumber(settings.contactPhone);
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(t("whatsapp.greeting"))}`;

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-[80] w-72 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--glass-solid)] shadow-2xl sm:right-6">
          <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[#25d366] px-4 py-3 text-white">
            <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden fill="currentColor">
              <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.7 6L4 29l8.2-1.6c1.2.6 2.5.9 3.8.9 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-4.9 1 1-4.8-.2-.4A9.9 9.9 0 1 1 16 25zm5.5-7.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
            </svg>
            <div className="flex-1">
              <p className="font-hud text-sm font-bold">{t("whatsapp.title")}</p>
              <p className="text-xs opacity-90">{t("whatsapp.online")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("whatsapp.close")}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-[var(--page-soft)] px-4 py-3">
            <p className="text-sm leading-relaxed text-[var(--text-2)]">{t("whatsapp.cta")}</p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="block bg-[#25d366] px-4 py-3 text-center font-hud text-sm font-bold text-white transition-colors hover:bg-[#1fb459]"
          >
            {t("whatsapp.start")}
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("whatsapp.label")}
        className={`fixed bottom-4 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition-all hover:scale-105 sm:bottom-6 sm:right-6 ${
          mounted ? "animate-whatsapp-in" : ""
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden fill="currentColor">
            <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.7 6L4 29l8.2-1.6c1.2.6 2.5.9 3.8.9 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-4.9 1 1-4.8-.2-.4A9.9 9.9 0 1 1 16 25zm5.5-7.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
          </svg>
        )}
      </button>
    </>
  );
}