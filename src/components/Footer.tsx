import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  Facebook, Instagram, Youtube, Linkedin, MessageCircle, Phone, Mail, MapPin, ExternalLink,
  CreditCard, Banknote, BanknoteIcon, Wallet, Landmark, Coins, Building2, Check, Smartphone, ShieldCheck, Truck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";

const PAY_ICON_MAP: Record<string, LucideIcon> = {
  CreditCard, Banknote, BanknoteIcon, Wallet, Landmark, Coins, Building2, Check, Smartphone, ShieldCheck, Truck,
};

export function Footer() {
  const { t } = useI18n();
  const { settings } = useStoreSettings();
  const phone = settings.contactPhone || "+212 6 00 00 00 00";
  const phoneClean = phone.replace(/[^0-9+]/g, "");
  const h = settings.header;
  const footerBg = h?.bottomNav?.bg || "#1a1a2e";

  return (
    <footer className="text-white" style={{ background: footerBg }}>
      {/* Contact + Store */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[var(--section-footer-max-width)] px-6 py-10 sm:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Contact */}
            <div>
              <h3 className="mb-2 font-hud text-sm font-bold uppercase tracking-wider text-white">{t("footer.contactTitle")}</h3>
              <p className="mb-5 text-sm leading-relaxed text-white/60">{t("footer.contactDesc")}</p>

              <div className="mb-5 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${phoneClean.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("footer.whatsappTitle")}
                </a>
                <a
                  href={`tel:${phoneClean}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/40"
                >
                  <Phone className="h-4 w-4" />
                  {t("footer.phoneTitle")}
                </a>
              </div>

              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />{t("footer.emailLabel")}</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />{t("footer.quoteLabel")}</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />{t("footer.trackingLabel")}</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />{t("footer.allContactsLabel")}</li>
              </ul>
            </div>

            {/* Store */}
            <div>
              <h3 className="mb-2 font-hud text-sm font-bold uppercase tracking-wider text-white">{t("footer.storeTitle")}</h3>
              <p className="flex items-center gap-1.5 text-sm font-bold text-white"><MapPin className="h-3.5 w-3.5 text-[var(--gold)]" />{t("footer.storeAgadirTitle")}</p>
              <p className="mt-1 text-sm text-white/60">{t("footer.storeAgadirAddr")}</p>
              <p className="mt-0.5 text-sm text-white/60">{t("footer.storeAgadirHours")}</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white">
                {t("footer.storeMap")} <ExternalLink className="h-3 w-3" />
              </a>
              <div className="mt-4 overflow-hidden rounded-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3440.9481794393946!2d-9.5709428!3d30.409212099999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdb3b7cf55ae0e0d%3A0xb657d0fb841ee7c!2sDigiDis!5e0!3m2!1sen!2sma!4v1787994032116!5m2!1sen!2sma"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={t("footer.storeAgadirTitle")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo + Links columns */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[var(--section-footer-max-width)] px-6 py-10 sm:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className={settings.footerAlign === "center" ? "text-center" : settings.footerAlign === "right" ? "text-right" : ""}>
              <div className={`mb-3 ${settings.footerAlign === "center" ? "flex justify-center" : settings.footerAlign === "right" ? "flex justify-end" : ""}`}>
                {settings.storeLogo ? (
                  <img src={settings.storeLogo} alt={settings.storeName} className="w-auto object-contain brightness-0 invert" style={{ height: settings.footerLogoSize }} />
                ) : (
                  <span className="flex items-center justify-center rounded-full bg-[var(--gold)] font-hud text-2xl font-bold text-black" style={{ width: settings.footerLogoSize, height: settings.footerLogoSize }}>J</span>
                )}
              </div>
              <p className="mb-4 max-w-xs text-sm leading-relaxed text-white/60">{t("footer.taglineDesc")}</p>

              {/* Social */}
              <div className={`flex gap-2 ${settings.footerAlign === "center" ? "justify-center" : settings.footerAlign === "right" ? "justify-end" : ""}`}>
                {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-[var(--gold)] hover:text-black">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Acheter */}
            <div>
              <h3 className="mb-4 font-hud text-xs font-bold uppercase tracking-wider text-[var(--gold)]">{t("footer.buyTitle")}</h3>
              <ul className="space-y-2.5">
                {[
                  { label: t("footer.buyDeals"), to: "/shop?sort=discount" },
                  { label: t("footer.buyBestSellers"), to: "/shop?sort=popular" },
                  { label: t("footer.buyNewArrivals"), to: "/shop?sort=newest" },
                  { label: t("footer.buyAllBrands"), to: "/brands" },
                  { label: t("footer.buyGuides"), to: "/blog" },
                  { label: t("footer.buyCartridges"), to: "/shop" },
                  { label: t("footer.buyVideos"), to: "/shop" },
                  { label: t("footer.buySitemap"), to: "/sitemap" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Aide & commande */}
            <div>
              <h3 className="mb-4 font-hud text-xs font-bold uppercase tracking-wider text-[var(--gold)]">{t("footer.helpTitle")}</h3>
              <ul className="space-y-2.5">
                {[
                  { label: t("footer.helpDelivery") },
                  { label: t("footer.helpTracking") },
                  { label: t("footer.helpWarranty") },
                  { label: t("footer.helpPayments") },
                  { label: t("footer.helpSupport") },
                  { label: t("footer.helpShipment") },
                ].map((item) => (
                  <li key={item.label}>
                    <span className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white cursor-pointer">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PC Jahiz */}
            <div>
              <h3 className="mb-4 font-hud text-xs font-bold uppercase tracking-wider text-[var(--gold)]">{t("footer.brandTitle")}</h3>
              <ul className="space-y-2.5">
                {[
                  { label: t("footer.brandAbout") },
                  { label: t("footer.brandNews") },
                  { label: t("footer.brandPro"), to: "/contact" },
                  { label: t("footer.brandLoyalty") },
                  { label: t("footer.brandAffiliate") },
                  { label: t("footer.brandAccount"), to: "/account" },
                  { label: t("footer.brandCommerce") },
                ].map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                        {item.label}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white cursor-pointer">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment */}
      {settings.footerPayments.enabled && settings.footerPayments.items.filter((it) => it.enabled && it.title.trim()).length > 0 && (
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-[var(--section-footer-max-width)] px-6 py-10 sm:px-8">
            <h3 className="mb-5 font-hud text-sm font-bold uppercase tracking-wider text-white">{settings.footerPayments.title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {settings.footerPayments.items
                .filter((it) => it.enabled && it.title.trim())
                .map((method) => {
                  const Icon = PAY_ICON_MAP[method.icon] ?? CreditCard;
                  const badges = method.cards.filter(Boolean);
                  return (
                    <div key={method.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[var(--gold)]" />
                        <span className="font-hud text-xs font-bold uppercase tracking-wider text-white">{method.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-white/50">{method.desc}</p>
                      {badges.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {badges.map((c) => (
                            <span key={c} className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white/70">{c}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Legal */}
      {settings.footerLegal.enabled && (
        <div className="py-5">
          <div className="mx-auto flex max-w-[var(--section-footer-max-width)] flex-col items-center justify-between gap-3 px-6 text-center text-xs text-white/40 sm:flex-row sm:px-8 sm:text-left">
            <p>{settings.footerLegal.legalText}</p>
            <div className="flex flex-wrap items-center gap-4">
              {settings.footerLegal.links.filter((l) => l.label.trim()).map((l) => (
                <a key={l.label} href={l.url || "#"} className="transition-colors hover:text-white">{l.label}</a>
              ))}
              <span>© {new Date().getFullYear()} {settings.storeName}. {settings.footerLegal.rightsText}</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
