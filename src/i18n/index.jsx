import { createContext, useContext, useState } from "react";
import { fr } from "./fr";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { pt } from "./pt";
import { it } from "./it";

const dict = { fr, en, de, es, pt, it };
const Ctx = createContext(null);

const LANG_KEY = "elyhub.lang";

// Langue initiale : localStorage (choix explicite) > langue du navigateur > fr.
const detectLang = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && dict[stored]) return stored;
    const nav = (navigator.language || "fr").slice(0, 2).toLowerCase();
    return dict[nav] ? nav : "fr";
  } catch {
    return "fr";
  }
};

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);
  const setLang = (l) => {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* stockage indisponible */
    }
    setLangState(l);
  };
  // t("key") → traduction ; t("key", { n: 3 }) → interpolation {n}
  const t = (key, params) => {
    let s = dict[lang][key] ?? dict.en[key] ?? dict.fr[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
  const formatDate = (v, withTime = false) => {
    if (!v) return "—";
    const d = typeof v === "number" ? new Date(v) : new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString(
      lang === "fr" ? "fr-FR" : lang === "en" ? "en-GB" : lang,
      withTime
        ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "short", year: "numeric" },
    );
  };
  return <Ctx.Provider value={{ lang, setLang, t, formatDate }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
