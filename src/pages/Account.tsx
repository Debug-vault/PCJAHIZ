import { Link, useNavigate } from "react-router";
import { Loader2, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/lib/cart";

export default function Account() {
  const { t, formatPrice } = useI18n();
  const navigate = useNavigate();
  const { data: me, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: orders, isLoading: ordersLoading } = trpc.shop.myOrders.useQuery(undefined, {
    enabled: !!me,
    retry: false,
  });
  const { data: wishlist } = trpc.shop.myWishlist.useQuery(undefined, { enabled: !!me, retry: false });
  const logout = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();
  const clearCart = useCartStore((s) => s.clear);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</div>;
  }

  if (!me) {
    return (
      <div className="nebula-bg flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("nav.login")}</h1>
        <Link to="/login" className="btn-dock">{t("nav.login")}</Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        clearCart();
        utils.auth.me.invalidate();
        navigate("/");
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">{t("account.title")}</p>
          <h1 className="mt-1 font-hud text-3xl font-bold text-[var(--text-1)]">
            {t("account.welcome")}, {me.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{me.email}</p>
        </div>
        <button type="button" onClick={handleLogout} disabled={logout.isPending} className="btn-ghost2 !py-2 text-sm">
          {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {t("nav.logout")}
        </button>
      </div>

      <section className="mt-10">
        <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("account.orders")}</h2>
        {ordersLoading ? (
          <p className="mt-4 font-mono text-sm text-[var(--text-2)]">{t("common.loading")}</p>
        ) : orders && orders.length ? (
          <div className="mt-4 flex flex-col gap-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="price-mono text-lg">{o.ref}</p>
                    <p className="mt-0.5 font-mono text-xs text-[var(--text-2)]">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--gold)]">
                      {t(`status.${o.status}`)}
                    </span>
                    <span className="price-mono">{formatPrice(o.total)} MAD</span>
                  </div>
                </div>
                {o.items && o.items.length ? (
                  <ul className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-4">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between font-mono text-xs text-[var(--text-2)]">
                        <span>× {it.quantity} — {it.nameFr}</span>
                        <span>{formatPrice(it.total)} MAD</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-2)]">{t("account.noOrders")}</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-hud text-xl font-bold text-[var(--text-1)]">{t("account.wishlist")}</h2>
        {wishlist && wishlist.length ? (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {wishlist.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group rounded-xl border border-[var(--line)] bg-[var(--glass)] p-3">
                {p.img ? <img src={p.img} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div className="aspect-square w-full rounded-lg bg-[#0a1020]" />}
                <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--text-1)] group-hover:text-[var(--gold)]">
                  {p.nameFr}
                </p>
                <p className="price-mono mt-1 text-sm">{formatPrice(p.price)} MAD</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-2)]">{t("account.noOrders")}</p>
        )}
      </section>
    </div>
  );
}