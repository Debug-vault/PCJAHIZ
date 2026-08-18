import { Link, NavLink } from "react-router";
import { ShoppingCart, User, Menu, Moon, Store, Languages, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useCartCount, useCartStore } from "@/lib/cart";
import { useCompare } from "@/components/compare-provider";
import { useStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const cartCount = useCartCount();
  const setCartOpen = useCartStore((s) => s.setOpen);
  const compare = useCompare();
  const { settings } = useStoreSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/shop", label: t("nav.products"), end: false },
    { to: "/brands", label: t("nav.brands"), end: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(2,4,10,0.82)] backdrop-blur-xl">
      <nav className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center gap-4 px-4 sm:px-6" aria-label={t("nav.menu")}>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-white/5 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t("nav.menu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5" aria-label={settings.storeName}>
          {settings.storeLogo ? (
            <img src={settings.storeLogo} alt={settings.storeName} className="h-9 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-dim)] font-hud text-lg font-bold text-[var(--gold)] ring-1 ring-[rgba(253,213,2,0.35)]">
              J
            </span>
          )}
          <span className="hidden font-hud text-lg font-bold tracking-wide text-[var(--text-1)] sm:block">
            {settings.storeName}
          </span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2 font-hud text-sm font-medium transition-colors",
                  isActive ? "text-[var(--gold)]" : "text-[var(--text-2)] hover:text-[var(--text-1)]",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link
            to="/compare"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--ice)]"
            aria-label={t("product.compare")}
          >
            <GitCompareArrows className="h-5 w-5" />
            {compare.ids.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-1 font-mono text-[10px] font-bold text-black">
                {compare.ids.length}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setLocale(locale === "fr" ? "ar" : "fr")}
            className="inline-flex h-10 items-center gap-1 rounded-lg px-2 font-hud text-xs font-bold uppercase tracking-wider text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            aria-label="Français / العربية"
          >
            <Languages className="h-4 w-4" />
            {locale === "fr" ? "عربية" : "FR"}
          </button>

          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            aria-label={theme === "void" ? t("palette.placeholder") : "Void"}
          >
            {theme === "void" ? <Store className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link
            to="/account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
            aria-label={t("nav.account")}
          >
            <User className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] px-3 font-hud text-sm font-semibold text-[var(--text-1)] transition-all hover:border-[rgba(253,213,2,0.4)] hover:text-[var(--gold)]"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">{t("nav.cart")}</span>
            {cartCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 font-mono text-[10px] font-bold text-black">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-[var(--line)] bg-[rgba(6,11,24,0.96)] px-4 py-3 lg:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2.5 font-hud text-sm font-medium",
                  isActive ? "text-[var(--gold)]" : "text-[var(--text-2)]",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </header>
  );
}