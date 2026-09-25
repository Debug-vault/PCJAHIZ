import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import { Navbar } from "@/components/Navbar";
import { TrustBar } from "@/components/TrustBar";
import { CargoDrawer } from "@/components/CargoDrawer";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { useStoreSettings } from "@/lib/settings";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import { CompareTray } from "@/components/storefront/compare-tray";
import { WhatsAppWidget } from "@/components/storefront/whatsapp-widget";
import { HeroProvider } from "@/lib/hero-context";

const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Brands = lazy(() => import("./pages/Brands"));
const Category = lazy(() => import("./pages/Category"));
const Compare = lazy(() => import("./pages/Compare"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminBrands = lazy(() => import("./pages/admin/Brands"));
const AdminPromos = lazy(() => import("./pages/admin/Promos"));
const AdminShipping = lazy(() => import("./pages/admin/Shipping"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminCampaigns = lazy(() => import("./pages/admin/Campaigns"));
const AdminStoreLocations = lazy(() => import("./pages/admin/StoreLocations"));
const AdminQuoteRequests = lazy(() => import("./pages/admin/QuoteRequests"));
const AdminNewsletter = lazy(() => import("./pages/admin/Newsletter"));
const AdminHeroBuilder = lazy(() => import("./pages/admin/hero-builder"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminBulkImport = lazy(() => import("./pages/admin/BulkImport"));
const AdminLegalPages = lazy(() => import("./pages/admin/LegalPages"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const SiteMode = lazy(() => import("./pages/SiteMode"));

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="promos" element={<AdminPromos />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="store-locations" element={<AdminStoreLocations />} />
        <Route path="quotes" element={<AdminQuoteRequests />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="blog" element={<AdminBlog />} />
        <Route path="legal" element={<AdminLegalPages />} />
        <Route path="bulk-import" element={<AdminBulkImport />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="hero" element={<AdminHeroBuilder />} />
      </Route>
    </Routes>
  );
}

function PageFallback() {
  return <div className="flex min-h-[40vh] items-center justify-center font-mono text-sm text-[var(--text-2)]">…</div>;
}

function Shell() {
  const { pathname } = useLocation();
  const { settings } = useStoreSettings();
  const bare = pathname === "/login" || pathname === "/register";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty("--store-max-width", `${settings.storeMaxWidth}px`);
    const s = settings.sectionMaxWidths;
    const map: [string, number][] = [
      ["section-header-max-width", s.header],
      ["section-hero-max-width", s.hero],
      ["section-promos-max-width", s.promos],
      ["section-categories-max-width", s.categories],
      ["section-deals-max-width", s.deals],
      ["section-new-arrivals-max-width", s.newArrivals],
      ["section-best-sellers-max-width", s.bestSellers],
      ["section-marquee-max-width", s.marquee],
      ["section-value-props-max-width", s.valueProps],
      ["section-newsletter-max-width", s.newsletter],
      ["section-footer-max-width", s.footer],
    ];
    for (const [k, v] of map) {
      document.documentElement.style.setProperty(`--${k}`, v === 0 ? "100%" : `${v}px`);
    }
  }, [settings.storeMaxWidth, settings.sectionMaxWidths]);

  useEffect(() => {
    if (!settings.storeFavicon) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.storeFavicon;
  }, [settings.storeFavicon]);

  if (isAdmin) {
    return (
      <div dir="ltr">
        <Suspense fallback={<PageFallback />}>
          <AdminRoutes />
        </Suspense>
        <Toaster position="bottom-center" />
      </div>
    );
  }

  const siteModeActive = settings.siteMode.enabled && !bare;
  if (siteModeActive) {
    return (
      <div dir="ltr">
        <Suspense fallback={<PageFallback />}>
          <SiteMode />
        </Suspense>
        <Toaster position="bottom-center" />
      </div>
    );
  }

  return (
    <div dir="ltr">
      {!bare && <Navbar />}
      {!bare && <TrustBar />}
      <main id="main-content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:ref" element={<OrderSuccess />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!bare && <Footer />}
      {!bare && <WhatsAppWidget />}
      <CargoDrawer />
      <CompareTray />
      <Toaster position="bottom-center" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <HeroProvider>
          <Shell />
        </HeroProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}