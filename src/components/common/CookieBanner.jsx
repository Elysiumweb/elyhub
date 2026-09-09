import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { useI18n } from "@/i18n";

// Consentement cookies (RGPD) : PostHog (mesure d'audience) n'est initialisé
// qu'après consentement — voir public/index.html. Clé partagée : elyhub.consent.
export const COOKIE_KEY = "elyhub.consent";

export const getConsent = () => {
  try {
    return localStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
};

export const setConsent = (value) => {
  try {
    localStorage.setItem(COOKIE_KEY, value);
  } catch {
    /* stockage indisponible */
  }
  window.dispatchEvent(new CustomEvent("elyhub:consent", { detail: value }));
};

export default function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  return (
    <div
      data-testid="cookie-banner"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D8CA82]/30 bg-[#111111] p-4"
      role="dialog"
      aria-label={t("cookie_prefs")}
    >
      <div className="mx-auto max-w-[1400px] flex flex-wrap items-center gap-4">
        <Cookie className="h-5 w-5 text-[#D8CA82] shrink-0" />
        <p className="flex-1 min-w-[240px] text-xs text-zinc-400">
          {t("cookie_banner")}{" "}
          <Link to="/cookies" className="text-[#D8CA82] hover:underline">
            {t("cookie_more")}
          </Link>
        </p>
        <div className="flex gap-2">
          <button data-testid="cookie-refuse" onClick={() => { setConsent("refused"); setVisible(false); }} className="btn-ghost text-xs h-8 px-3">
            {t("cookie_refuse")}
          </button>
          <button data-testid="cookie-accept" onClick={() => { setConsent("accepted"); setVisible(false); }} className="btn-gold text-xs h-8 px-3">
            {t("cookie_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
