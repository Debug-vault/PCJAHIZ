import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Box,
  ShoppingBag,
  Users,
  FolderTree,
  BadgeCheck,
  TicketPercent,
  Truck,
  Star,
  Settings2,
  LogOut,
  Loader2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart";

const navItems = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Produits", icon: Box },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingBag },
  { to: "/admin/customers", label: "Clients", icon: Users },
  { to: "/admin/categories", label: "Catégories", icon: FolderTree },
  { to: "/admin/brands", label: "Marques", icon: BadgeCheck },
  { to: "/admin/promos", label: "Codes promo", icon: TicketPercent },
  { to: "/admin/shipping", label: "Livraison", icon: Truck },
  { to: "/admin/reviews", label: "Avis", icon: Star },
  { to: "/admin/settings", label: "Réglages", icon: Settings2 },
];

export default function AdminLayout() {
  const { data: me, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const logout = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();
  const clearCart = useCartStore((s) => s.clear);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--void)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!me) {
    return <Navigate to="/login" replace />;
  }

  if (me.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">Accès réservé</h1>
        <p className="text-sm text-[var(--text-2)]">Votre compte n'a pas les droits administrateur.</p>
        <Link to="/" className="btn-dock">Retour à la boutique</Link>
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
    <div className="flex min-h-screen bg-[var(--void)] text-[var(--text-1)]" dir="ltr">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--line)] bg-[var(--void-2)]">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--line)] px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gold-dim)] font-hud text-sm font-bold text-[var(--gold)]">
              {settings.storeLogo ? (
                <img src={settings.storeLogo} alt={settings.storeName} className="h-8 w-8 rounded object-cover" />
              ) : (
                "J"
              )}
            </span>
            <span className="font-hud text-sm font-bold tracking-wide">{settings.storeName}</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--gold-dim)] font-semibold text-[var(--gold)]"
                    : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--line)] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--alert)] hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}