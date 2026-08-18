import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          utils.auth.me.invalidate();
          toast.success(t("auth.loginTitle"));
          navigate("/account");
        },
        onError: () => toast.error(t("auth.invalidCredentials")),
      },
    );
  };

  return (
    <div className="nebula-bg flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--glass-solid)] p-8">
        <h1 className="font-hud text-2xl font-bold text-[var(--text-1)]">{t("auth.loginTitle")}</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            required
            className="checkout-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
            required
            className="checkout-input"
          />
          <button type="submit" disabled={login.isPending} className="btn-dock w-full">
            {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("auth.login")}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-2)]">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-[var(--gold)] hover:underline">
            {t("auth.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}