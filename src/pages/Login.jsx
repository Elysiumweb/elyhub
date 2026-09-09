import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { auth, googleProvider } from "@/lib/firebase";
import { useI18n } from "@/i18n";
import { Field } from "@/components/common/States";
import Seo from "@/components/common/Seo";

const authError = (e, t) => {
  const map = { "auth/invalid-credential": "err_invalid_credentials", "auth/user-not-found": "err_invalid_credentials", "auth/wrong-password": "err_invalid_credentials",
    "auth/email-already-in-use": "err_email_in_use", "auth/weak-password": "err_weak_password", "auth/invalid-email": "err_invalid_email", "auth/popup-closed-by-user": "err_popup_closed",
    "auth/unauthorized-domain": "err_unauthorized_domain" };
  return t(map[e.code] || "err_generic");
};

export default function Login() {
  const { pathname } = useLocation();
  const [mode, setMode] = useState(pathname === "/register" ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { t } = useI18n();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "register") await createUserWithEmailAndPassword(auth, form.email, form.password);
      else await signInWithEmailAndPassword(auth, form.email, form.password);
      nav("/onboarding");
    } catch (err) { toast.error(authError(err, t)); } finally { setBusy(false); }
  };
  const google = async () => {
    setBusy(true);
    try { await signInWithPopup(auth, googleProvider); nav("/onboarding"); }
    catch (err) { toast.error(authError(err, t)); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!form.email) return toast.error(t("err_invalid_email"));
    try { await sendPasswordResetEmail(auth, form.email); toast.success(t("reset_sent")); } catch (err) { toast.error(authError(err, t)); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#111111]">
      <Seo title={t("login")} path="/login" noindex />
      <div className="hidden lg:flex relative flex-col justify-between p-12 border-r border-[#D8CA82]/20 overflow-hidden">
        <img src="/brand/pattern.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.07]" />
        <img src="/brand/accent-blade.png" alt="" className="absolute -right-20 -bottom-24 w-[560px] opacity-40 pointer-events-none" />
        <Link to="/" data-testid="login-logo-link"><img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-10 relative" /></Link>
        <div className="relative">
          <div className="eyebrow mb-4">ElyHub</div>
          <h1 className="font-display text-4xl xl:text-5xl uppercase leading-[1.05] text-white">{t("login_hero_1")}<br /><span className="text-[#D8CA82]">{t("login_hero_2")}</span></h1>
          <p className="mt-6 text-zinc-400 max-w-md">{t("login_hero_desc")}</p>
        </div>
        <p className="text-xs text-zinc-600 relative">© Elysium — {t("footer_tagline")}</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-block mb-8"><img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-8" /></Link>
          <div className="flex border-b border-white/10 mb-8">
            <button data-testid="auth-tab-login" onClick={() => setMode("login")} className={`tab-btn ${mode === "login" ? "tab-btn-active" : ""}`}>{t("login")}</button>
            <button data-testid="auth-tab-register" onClick={() => setMode("register")} className={`tab-btn ${mode === "register" ? "tab-btn-active" : ""}`}>{t("register")}</button>
          </div>
          <h2 className="font-display text-xl uppercase text-white mb-6">{mode === "login" ? t("welcome_back") : t("create_account")}</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("email")} required><input data-testid="auth-email-input" type="email" required className="input-elysium" value={form.email} onChange={set("email")} placeholder="player@elysium-esport.fr" /></Field>
            <Field label={t("password")} required><input data-testid="auth-password-input" type="password" required minLength={6} className="input-elysium" value={form.password} onChange={set("password")} placeholder="••••••••" /></Field>
            <button data-testid="auth-submit-button" disabled={busy} className="btn-gold w-full">{mode === "login" ? t("login") : t("register")}</button>
          </form>
          {mode === "login" && <button data-testid="auth-forgot-button" onClick={reset} className="text-xs text-zinc-500 hover:text-[#D8CA82] mt-3">{t("forgot_password")}</button>}
          <div className="flex items-center gap-3 my-6"><span className="h-px flex-1 bg-white/10" /><span className="text-xs text-zinc-500 uppercase">{t("or")}</span><span className="h-px flex-1 bg-white/10" /></div>
          <button data-testid="auth-google-button" onClick={google} disabled={busy} className="btn-outline w-full">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4a6.4 6.4 0 1 1 0-12.8c1.85 0 3.1.8 3.8 1.45l2.6-2.5A10 10 0 0 0 12 2a10 10 0 1 0 0 20c5.75 0 9.55-4.05 9.55-9.75 0-.65-.05-1.15-.2-1.15Z" /></svg>
            {t("continue_google")}
          </button>
        </div>
      </div>
    </div>
  );
}
