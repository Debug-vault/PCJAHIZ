import { Routes, Route, useLocation } from "react-router";
import { Navbar } from "@/components/Navbar";
import { CargoDrawer } from "@/components/CargoDrawer";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function Shell() {
  const { pathname } = useLocation();
  const bare = pathname === "/login";
  return (
    <>
      {!bare && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!bare && <Footer />}
      <CargoDrawer />
      <div className="cosmos-overlay" aria-hidden />
      <Toaster theme="dark" position="bottom-center" />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
