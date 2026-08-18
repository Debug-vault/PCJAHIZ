import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal, clear } = useCartStore();
  const { t, locale, formatPrice } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    city: "",
    region: "",
    address: "",
    notes: "",
    payment: "cod" as "cod" | "cmi",
    promoCode: "",
  });
  const [discount, setDiscount] = useState(0);
  const [promoReason, setPromoReason] = useState<string | null>(null);

  const { data: zones } = trpc.shop.shipping.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: paymentConfig } = trpc.shop.paymentConfig.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const validatePromo = trpc.shop.validatePromo.useQuery(
    { code: form.promoCode, subtotal: subtotal() },
    { enabled: false },
  );
  const createOrder = trpc.shop.createOrder.useMutation();

  const zone = useMemo(() => {
    if (!zones) return undefined;
    const norm = form.city.trim().toLowerCase();
    return (
      zones.find((z) => {
        if (z.name.toLowerCase() === norm) return true;
        return Array.isArray(z.cities) && z.cities.some((c) => String(c).toLowerCase() === norm);
      }) ?? zones.find((z) => z.name.toLowerCase() === "autres villes")
    );
  }, [zones, form.city]);

  const shippingFee = useMemo(() => {
    if (!zone) return null;
    if (zone.freeThreshold != null && subtotal() >= zone.freeThreshold) return 0;
    return zone.fee;
  }, [zone, subtotal]);

  const total = subtotal() + (shippingFee ?? 0) - discount;

  if (items.length === 0) {
    return (
      <div className="nebula-bg flex min-h-[55vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("cart.empty")}</h1>
        <Link to="/shop" className="btn-dock">{t("cart.emptyCta")}</Link>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyPromo = () => {
    if (!form.promoCode.trim()) return;
    validatePromo.refetch().then((res) => {
      const d = res.data;
      if (d?.ok) {
        setDiscount(d.discount ?? 0);
        setPromoReason(null);
        toast.success(t("promo.applied"));
      } else {
        setDiscount(0);
        const reason = d?.reason;
        setPromoReason(reason === "expired" ? t("promo.expired") : reason === "min_order" ? t("promo.minNotMet") : t("promo.invalid"));
        toast.error(t("promo.invalid"));
      }
    });
  };

  const placeOrder = () => {
    if (form.customerName.trim().length < 2) return toast.error(t("checkout.required"));
    if (form.phone.trim().length < 8) return toast.error(t("checkout.required"));
    if (form.city.trim().length < 2) return toast.error(t("checkout.required"));
    if (form.address.trim().length < 5) return toast.error(t("checkout.required"));
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return toast.error(t("checkout.invalidEmail"));

    createOrder.mutate(
      {
        customerName: form.customerName,
        email: form.email || undefined,
        phone: form.phone,
        city: form.city,
        region: form.region || undefined,
        address: form.address,
        notes: form.notes || undefined,
        payment: form.payment,
        promoCode: form.promoCode || undefined,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      },
      {
        onSuccess: (res) => {
          clear();
          if (res.cmiParams) {
            const formEl = document.createElement("form");
            formEl.method = "POST";
            formEl.action = paymentConfig?.cmiApiUrl ?? "";
            Object.entries(res.cmiParams).forEach(([k, v]) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = k;
              input.value = String(v);
              formEl.appendChild(input);
            });
            document.body.appendChild(formEl);
            formEl.submit();
          } else {
            navigate(`/order-success/${res.ref}`);
          }
        },
        onError: () => toast.error(t("errors.serverError")),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-hud text-3xl font-bold text-[var(--text-1)]">{t("checkout.title")}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-4 font-hud text-lg font-bold text-[var(--text-1)]">{t("checkout.contact")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.customerName} onChange={set("customerName")} placeholder={t("checkout.fullName")} className="checkout-input" />
              <input value={form.email} onChange={set("email")} placeholder={t("checkout.email")} type="email" className="checkout-input" />
              <input value={form.phone} onChange={set("phone")} placeholder={t("checkout.phone")} type="tel" className="checkout-input sm:col-span-2" />
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-hud text-lg font-bold text-[var(--text-1)]">{t("checkout.address")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <select value={form.city} onChange={set("city")} className="checkout-input">
                <option value="">{t("checkout.city")}</option>
                {(zones ?? []).flatMap((z) => (Array.isArray(z.cities) && z.cities.length ? z.cities : [z.name])).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input value={form.region} onChange={set("region")} placeholder={t("checkout.region")} className="checkout-input" />
              <input value={form.address} onChange={set("address")} placeholder={t("checkout.line1")} className="checkout-input sm:col-span-2" />
              <textarea value={form.notes} onChange={set("notes")} placeholder={t("checkout.notes")} className="checkout-input sm:col-span-2" />
            </div>
            {shippingFee != null ? (
              <p className="mt-3 font-mono text-xs text-[var(--text-2)]">
                {t("checkout.shippingZone")}: <span className="text-[var(--gold)]">{shippingFee === 0 ? t("checkout.freeShipping") : `${formatPrice(shippingFee)} MAD`}</span>
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="mb-4 font-hud text-lg font-bold text-[var(--text-1)]">{t("checkout.paymentMethod")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payment: "cod" }))}
                className={`checkout-radio ${form.payment === "cod" ? "checkout-radio-active" : ""}`}
              >
                <span className="font-hud text-sm font-bold text-[var(--text-1)]">{t("checkout.cod")}</span>
                <span className="mt-1 block font-mono text-xs text-[var(--text-2)]">{t("checkout.codDesc")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!paymentConfig?.cmi) {
                    toast.info(t("checkout.cmiSoon"));
                    return;
                  }
                  setForm((f) => ({ ...f, payment: "cmi" }));
                }}
                className={`checkout-radio ${form.payment === "cmi" ? "checkout-radio-active" : ""}`}
              >
                <span className="font-hud text-sm font-bold text-[var(--text-1)]">{t("checkout.cmi")}</span>
                <span className="mt-1 block font-mono text-xs text-[var(--text-2)]">{paymentConfig?.cmi ? t("checkout.cmiDesc") : t("checkout.cmiSoon")}</span>
              </button>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--glass)] p-6 lg:sticky lg:top-[calc(var(--nav-h)+1rem)]">
          <h2 className="font-hud text-lg font-bold text-[var(--text-1)]">{t("checkout.orderSummary")}</h2>

          <div className="mt-4 flex gap-2">
            <input
              value={form.promoCode}
              onChange={set("promoCode")}
              placeholder={t("cart.promoPlaceholder")}
              className="checkout-input"
            />
            <button type="button" onClick={applyPromo} className="btn-ghost2 shrink-0 !px-4 !py-2 text-xs">
              {t("cart.applyPromo")}
            </button>
          </div>
          {promoReason ? <p className="mt-2 font-mono text-xs text-[var(--alert)]">{promoReason}</p> : null}

          <ul className="mt-5 flex max-h-56 flex-col gap-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                {i.img ? <img src={i.img} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-[#0a1020]" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{locale === "ar" ? i.nameAr : i.nameFr}</p>
                  <p className="font-mono text-xs text-[var(--text-2)]">× {i.qty}</p>
                </div>
                <span className="price-mono text-sm">{formatPrice(i.price * i.qty)} MAD</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2.5 border-t border-[var(--line)] pt-5 font-mono text-sm">
            <div className="flex justify-between text-[var(--text-2)]">
              <dt>{t("cart.subtotal")}</dt>
              <dd className="text-[var(--text-1)]">{formatPrice(subtotal())} MAD</dd>
            </div>
            <div className="flex justify-between text-[var(--text-2)]">
              <dt>{t("cart.shipping")}</dt>
              <dd className="text-[var(--text-1)]">{shippingFee == null ? t("checkout.shippingCalculated") : shippingFee === 0 ? t("checkout.freeShipping") : `${formatPrice(shippingFee)} MAD`}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-[var(--ok)]">
                <dt>{t("cart.discount")}</dt>
                <dd>-{formatPrice(discount)} MAD</dd>
              </div>
            ) : null}
          </dl>
          <div className="my-4 border-t border-[var(--line)]" />
          <div className="flex items-center justify-between">
            <span className="font-hud text-sm font-bold text-[var(--text-1)]">{t("cart.total")}</span>
            <span className="price-mono text-2xl">{formatPrice(Math.max(0, total))} MAD</span>
          </div>

          <button type="button" onClick={placeOrder} disabled={createOrder.isPending} className="btn-dock mt-6 w-full">
            {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t("checkout.placeOrder")}
          </button>
        </aside>
      </div>
    </div>
  );
}