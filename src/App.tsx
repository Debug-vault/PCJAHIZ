import { Routes, Route, useLocation } from "react-router";
import { Navbar } from "@/components/Navbar";
import { CargoDrawer } from "@/components/CargoDrawer";
import { Footer } from "@/components/Footer";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Brands from "./pages/Brands";
import Category from "./pages/Category";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";
import { ChatWidget } from "@/components/storefront/chat-widget";
import { CompareTray } from "@/components/storefront/compare-tray";

function Shell() {
  const { pathname } = useLocation();
  const { dir } = useI18n();
  const bare = pathname === "/login" || pathname === "/register";

  return (
    <div dir={dir}>
      {!bare && <Navbar />}
      <main>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!bare && <Footer />}
      <CargoDrawer />
      <ChatWidget />
      <CompareTray />
      <div className="cosmos-overlay" aria-hidden />
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Shell />
      </I18nProvider>
    </ThemeProvider>
  );
}