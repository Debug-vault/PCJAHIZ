import { useEffect, useState, type FormEvent } from "react";
import { Wrench, Rocket, Check, Loader2 } from "lucide-react";
import { useStoreSettings } from "@/lib/settings";

type SocialLink = { platform: string; url: string };

const SOCIAL_META: Record<string, { label: string; icon: string }> = {
  facebook: { label: "Facebook", icon: "M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V12c0-2.4 1.5-3.8 3.7-3.8 1 0 2.1.2 2.1.2v2.4h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z" },
  instagram: { label: "Instagram", icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.8.1-1.1.1-1.5.2-1.9.3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.4-.3.8-.3 1.9-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.5.3 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.1.8.3 1.9.3 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.5-.2 1.9-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.4.3-.8.3-1.9.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.5-.3-1.9a2.9 2.9 0 0 0-.7-1.1 2.9 2.9 0 0 0-1.1-.7c-.4-.1-.8-.3-1.9-.3-1.3-.1-1.7-.1-4.8-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" },
  twitter: { label: "X", icon: "M18.2 2.3h3.4l-7.4 8.5 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.8 2.3h7l4.8 6.4 5.6-6.4Zm-1.2 17.7h1.9L6.9 4.2H4.9l12.1 15.8Z" },
  youtube: { label: "YouTube", icon: "M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31.4 31.4 0 0 0 .5 12 31.4 31.4 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.5.5-3 .5-4.5s-.1-3-.5-4.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" },
  tiktok: { label: "TikTok", icon: "M16.6 5.8a5 5 0 0 1-3.5-4.1V.5h-3.1v14.3a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1v-3.2a5.8 5.8 0 1 0 4.9 5.7V8.4a8 8 0 0 0 4.6 1.4V6.7a4.9 4.9 0 0 1-1.1-.1Z" },
  linkedin: { label: "LinkedIn", icon: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5Z" },
  whatsapp: { label: "WhatsApp", icon: "M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4ZM12 2A10 10 0 0 0 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4A10 10 0 1 0 12 2Z" },
};

function SocialIcon({ platform }: { platform: string }) {
  const meta = SOCIAL_META[platform.toLowerCase()];
  if (!meta) return <span className="text-xs opacity-60">{platform}</span>;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d={meta.icon} />
    </svg>
  );
}

function Countdown({ target }: { target: string }) {
  const getRemaining = () => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(getRemaining);
  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  const units: [number, string][] = [
    [t.days, "Days"],
    [t.hours, "Hours"],
    [t.minutes, "Minutes"],
    [t.seconds, "Seconds"],
  ];
  if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) return null;
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {units.map(([v, label]) => (
        <div key={label} className="flex flex-col items-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl border sm:h-20 sm:w-20"
            style={{ borderColor: "var(--sm-accent, #FDD502)", background: "rgba(255,255,255,0.04)" }}
          >
            <span className="font-hud text-2xl font-bold sm:text-3xl" style={{ color: "var(--sm-accent, #FDD502)" }}>
              {String(v).padStart(2, "0")}
            </span>
          </div>
          <span className="mt-2 text-[10px] uppercase tracking-widest opacity-60">{label}</span>
        </div>
      ))}
    </div>
  );
}

function EmailForm({ placeholder, accent }: { placeholder: string; accent: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState("loading");
    setTimeout(() => setState("done"), 700);
  };
  if (state === "done") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-medium"
        style={{ borderColor: accent, color: accent }}>
        <Check className="h-4 w-4" /> Thanks — you'll be the first to know!
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-70"
        style={{ background: accent }}
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify me"}
      </button>
    </form>
  );
}

export default function SiteMode() {
  const { settings } = useStoreSettings();
  const cfg = settings.siteMode;
  const isMaintenance = cfg.mode === "maintenance";
  const accent = cfg.accentColor || "#FDD502";

  useEffect(() => {
    document.documentElement.style.setProperty("--sm-accent", accent);
    document.documentElement.style.setProperty("--sm-bg", cfg.bg);
    let meta = document.querySelector<HTMLMetaElement>("meta[name='robots']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
    if (isMaintenance) {
      let rm = document.querySelector<HTMLMetaElement>("meta[name='refresh']");
      if (!rm) {
        rm = document.createElement("meta");
        rm.httpEquiv = "refresh";
        document.head.appendChild(rm);
      }
      rm.content = "300";
    }
    return () => {
      document.querySelector<HTMLMetaElement>("meta[name='robots']")?.remove();
      document.querySelector<HTMLMetaElement>("meta[name='refresh']")?.remove();
    };
  }, [accent, cfg.bg, isMaintenance]);

  const visibleSocials = (cfg.socialLinks || []).filter((s: SocialLink) => s.platform && s.url);

  return (
    <div
      dir="ltr"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{ background: cfg.bg, color: cfg.textColor }}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: accent, opacity: 0.08 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{ background: accent, opacity: 0.05 }}
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-7 reveal-up">
        {cfg.showLogo && settings.storeLogo ? (
          <img src={settings.storeLogo} alt={settings.storeName} className="h-16 w-auto object-contain sm:h-20" />
        ) : cfg.showLogo ? (
          <span className="font-hud text-3xl font-bold" style={{ color: accent }}>{settings.storeName}</span>
        ) : null}

        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest"
          style={{ borderColor: `${accent}44`, color: accent }}
        >
          {isMaintenance ? <Wrench className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
          {isMaintenance ? "Under Maintenance" : "Coming Soon"}
        </span>

        <h1 className="font-hud text-4xl font-bold leading-tight sm:text-5xl">
          {cfg.title || (isMaintenance ? "Under Maintenance" : "Coming Soon")}
        </h1>

        <p className="max-w-xl text-base leading-relaxed opacity-70">{cfg.message}</p>
        {cfg.submessage && <p className="max-w-xl text-sm opacity-45">{cfg.submessage}</p>}

        {cfg.countdown && cfg.countdownTarget && !isMaintenance && (
          <div className="mt-2">
            <Countdown target={cfg.countdownTarget} />
          </div>
        )}

        {cfg.showEmail && !isMaintenance && (
          <div className="mt-2 w-full">
            <EmailForm placeholder={cfg.emailPlaceholder || "Enter your email address"} accent={accent} />
          </div>
        )}

        {cfg.showSocial && visibleSocials.length > 0 && (
          <div className="mt-2 flex items-center gap-4">
            {visibleSocials.map((s: SocialLink) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_META[s.platform.toLowerCase()]?.label || s.platform}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:scale-110"
                style={{ borderColor: `${accent}33`, color: cfg.textColor, opacity: 0.7 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
          </div>
        )}

        <p className="mt-6 font-mono2 text-[10px] uppercase tracking-widest opacity-30">
          {isMaintenance ? "We'll be right back" : "Launching soon"} · {settings.storeName}
        </p>
      </div>
    </div>
  );
}
