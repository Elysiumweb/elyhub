import { createContext, useContext, useState } from "react";
import { fr } from "./fr";
import { en } from "./en";

const dict = { fr, en };
const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("elyhub.lang") || "fr");
  const setLang = (l) => { localStorage.setItem("elyhub.lang", l); setLangState(l); };
  const t = (key) => dict[lang][key] ?? dict.fr[key] ?? key;
  const formatDate = (v, withTime = false) => {
    if (!v) return "—";
    const d = typeof v === "number" ? new Date(v) : new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", withTime ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", year: "numeric" });
  };
  return <Ctx.Provider value={{ lang, setLang, t, formatDate }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
