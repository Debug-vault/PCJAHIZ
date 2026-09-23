import { useState } from "react";
import { Link } from "react-router";
import { Check, Phone, Mail, MapPin, Building2, Clock, Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";
import { trpc } from "@/providers/trpc";

export default function Contact() {
  const { t } = useI18n();
  const { settings } = useStoreSettings();
  const { data: stores } = trpc.shop.storeLocations.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const send = trpc.shop.createQuoteRequest.useMutation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", details: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    send.mutate(form, {
      onSuccess: () => setSent(true),
      onError: () => setError(true),
    });
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto max-w-[var(--store-max-width)] px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="font-hud text-xs font-bold uppercase tracking-[0.25em] text-[var(--gold-hot)]">{t("devis.eyebrow")}</p>
        <h1 className="mt-2 font-hud text-4xl font-extrabold text-[var(--text-1)]">{t("devis.title")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-2)]">{t("devis.subtitle")}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <form onSubmit={submit} className="lg:col-span-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--page)] p-6">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold-dim)]">
                  <Check className="h-7 w-7 text-[var(--gold-hot)]" />
                </span>
                <p className="font-hud text-lg font-bold text-[var(--text-1)]">{t("devis.success")}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="q-name" className="mb-1 block font-hud text-sm font-semibold text-[var(--text-1)]">{t("devis.name")}</label>
                    <input id="q-name" required value={form.name} onChange={set("name")} className="checkout-input" />
                  </div>
                  <div>
                    <label htmlFor="q-email" className="mb-1 block font-hud text-sm font-semibold text-[var(--text-1)]">{t("devis.email")}</label>
                    <input id="q-email" type="email" required value={form.email} onChange={set("email")} className="checkout-input" />
                  </div>
                  <div>
                    <label htmlFor="q-phone" className="mb-1 block font-hud text-sm font-semibold text-[var(--text-1)]">{t("devis.phone")}</label>
                    <input id="q-phone" type="tel" value={form.phone} onChange={set("phone")} className="checkout-input" />
                  </div>
                  <div>
                    <label htmlFor="q-company" className="mb-1 block font-hud text-sm font-semibold text-[var(--text-1)]">{t("devis.company")}</label>
                    <input id="q-company" value={form.company} onChange={set("company")} className="checkout-input" />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="q-details" className="mb-1 block font-hud text-sm font-semibold text-[var(--text-1)]">{t("devis.details")}</label>
                  <textarea id="q-details" required minLength={10} value={form.details} onChange={set("details")} placeholder={t("devis.detailsPlaceholder")} className="checkout-input min-h-32 resize-y" />
                </div>
                {error ? <p role="alert" className="mt-3 font-mono text-xs text-[var(--alert)]">{t("errors.generic")}</p> : null}
                <button type="submit" disabled={send.isPending} className="btn-dock mt-6 w-full">
                  <Quote className="h-4 w-4" /> {t("devis.submit")}
                </button>
              </>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--page-soft)] p-6">
            <h2 className="mb-4 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">{t("nav.contactUs")}</h2>
            <div className="flex flex-col gap-3 text-sm">
              <a href={`tel:${settings.contactPhone ?? ""}`} className="inline-flex items-center gap-3 text-[var(--text-1)] hover:text-[var(--gold-hot)]">
                <Phone className="h-4 w-4 text-[var(--gold-hot)]" /> {settings.contactPhone}
              </a>
              <a href={`mailto:${settings.contactEmail ?? ""}`} className="inline-flex items-center gap-3 text-[var(--text-1)] hover:text-[var(--gold-hot)]">
                <Mail className="h-4 w-4 text-[var(--gold-hot)]" /> {settings.contactEmail}
              </a>
              <p className="inline-flex items-center gap-3 text-[var(--text-2)]">
                <Clock className="h-4 w-4 text-[var(--gold-hot)]" /> Lun – Sam : 9h – 19h
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--page-soft)] p-6">
            <h2 className="mb-4 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">{t("home.b2bEyebrow")}</h2>
            <ul className="flex flex-col gap-2">
              {["devis.benefit1", "devis.benefit2", "devis.benefit3", "devis.benefit4"].map((k) => (
                <li key={k} className="flex items-center gap-2 text-sm text-[var(--text-1)]">
                  <Building2 className="h-4 w-4 shrink-0 text-[var(--gold-hot)]" /> {t(k)}
                </li>
              ))}
            </ul>
          </div>

          {stores && stores.length > 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--page-soft)] p-6">
              <h2 className="mb-4 font-hud text-sm font-bold uppercase tracking-widest text-[var(--text-1)]">{t("nav.stores")}</h2>
              <div className="flex flex-col gap-4">
                {stores.map((s) => (
                  <div key={s.id}>
                    <p className="inline-flex items-center gap-2 font-hud text-sm font-bold text-[var(--text-1)]">
                      <MapPin className="h-4 w-4 text-[var(--gold-hot)]" /> {s.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{s.address}</p>
                    <p className="text-sm text-[var(--text-2)]">{s.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Link to="/shop" className="btn-ghost2">{t("nav.allProducts")}</Link>
        </div>
      </div>
    </div>
  );
}