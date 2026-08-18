import { useParams, Link } from "react-router";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/lib/settings";
import { trpc } from "@/providers/trpc";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function OrderSuccess() {
  const { ref = "" } = useParams();
  const { t, formatPrice } = useI18n();
  const { settings } = useStoreSettings();
  const { data: order } = trpc.shop.orderByRef.useQuery({ ref }, { retry: false });

  const waMessage = t("checkout.orderSuccessWhatsAppMsg", {
    store: settings.storeName,
    order: ref,
  });

  return (
    <div className="nebula-bg flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-[rgba(253,213,2,0.25)] bg-[var(--glass-solid)] p-8 text-center shadow-[var(--glow-gold)]">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--ok)]" />
        <h1 className="mt-5 font-hud text-2xl font-bold text-[var(--text-1)]">{t("checkout.orderSuccessTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{t("checkout.orderSuccessText")}</p>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[rgba(6,11,24,0.6)] p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">Réf.</p>
          <p className="price-mono mt-1 text-xl">{ref}</p>
        </div>

        {order ? (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[rgba(6,11,24,0.6)] p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-2)]">{t("cart.total")}</p>
            <p className="price-mono mt-1 text-xl">{formatPrice(order.total)} MAD</p>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3">
          <a
            href={buildWhatsAppUrl(settings.contactPhone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dock w-full"
          >
            <MessageCircle className="h-4 w-4" /> {t("checkout.orderSuccessWhatsApp")}
          </a>
          <Link to="/" className="btn-ghost2 w-full">
            <Home className="h-4 w-4" /> {t("checkout.orderSuccessCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}