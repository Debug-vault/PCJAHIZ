import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const register = trpc.auth.register.useMutation();
  const utils = trpc.useUtils();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("auth.newPasswordConfirm"));
      return;
    }
    register.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          utils.auth.me.invalidate();
          toast.success(t("auth.registerTitle"));
          navigate("/account");
        },
        onError: (err) => {
          const msg = err.message.includes("already exists") ? t("auth.emailExists") : t("errors.generic");
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="nebula-bg flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--glass-solid)] p-8">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("auth.registerTitle")}</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.namePlaceholder")} required className="checkout-input" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")} required className="checkout-input" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")} required minLength={8} className="checkout-input" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t("auth.newPasswordConfirm")} required minLength={8} className="checkout-input" />
          <button type="submit" disabled={register.isPending} className="btn-dock w-full">
            {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("auth.register")}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-2)]">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-[var(--gold)] hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}