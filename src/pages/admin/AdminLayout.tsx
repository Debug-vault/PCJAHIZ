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
  Megaphone,
  LayoutTemplate,
  MapPinned,
  FileText,
  Mail,
  LogOut,
  Loader2,
  Settings2,
  BookOpen,
  Upload,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart";

const navGroups: { label: string; items: { to: string; label: string; icon: LucideIcon; end?: boolean }[] }[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Box },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/brands", label: "Brands", icon: BadgeCheck },
      { to: "/admin/bulk-import", label: "Bulk Import", icon: Upload },
    ],
  },
  {
    label: "Sales & Customers",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/quotes", label: "Quote Requests", icon: FileText },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/promos", label: "Promo Codes", icon: TicketPercent },
      { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/admin/hero", label: "Hero Builder", icon: LayoutTemplate },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/blog", label: "Blog", icon: BookOpen },
      { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/shipping", label: "Shipping", icon: Truck },
      { to: "/admin/store-locations", label: "Store Locations", icon: MapPinned },
    ],
  },
  {
    label: "System",
      items: [
        { to: "/admin/legal", label: "Legal Pages", icon: Scale },
        { to: "/admin/settings", label: "Settings", icon: Settings2 },
      ],
  },
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
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">Access Restricted</h1>
        <p className="text-sm text-[var(--text-2)]">Your account does not have admin privileges.</p>
        <Link to="/" className="btn-dock">Back to Store</Link>
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
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[var(--gold-dim)] font-hud text-base font-bold text-[var(--gold)]">
              {settings.storeLogo ? (
                <img src={settings.storeLogo} alt={settings.storeName} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                "J"
              )}
            </span>
            <span className="font-hud text-sm font-bold tracking-wide">{settings.storeName}</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Admin">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-2)]/70">{group.label}</p>
              {group.items.map((item) => (
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
            </div>
          ))}
        </nav>
        <div className="border-t border-[var(--line)] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--alert)] hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}