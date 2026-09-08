import { createContext, useContext, useState } from "react";
import { fr } from "./fr";
import { en } from "./en";

const dict = { fr, en };
const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("elyhub.lang") || (navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en"));
  const setLang = (l) => { localStorage.setItem("elyhub.lang", l); setLangState(l); };
  const t = (key) => dict[lang][key] ?? dict.fr[key] ?? key;
  const formatDate = (v, withTime = false, tz) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    const opts = withTime ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : { day: "2-digit", month: "short", year: "numeric" };
    try { return d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", tz ? { ...opts, timeZone: tz } : opts); } catch { return d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", opts); }
  };
  const relative = (v) => {
    const diff = new Date(v).getTime() - Date.now(), abs = Math.abs(diff), rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const [u, n] = abs < 3.6e6 ? ["minute", diff / 6e4] : abs < 8.64e7 ? ["hour", diff / 3.6e6] : ["day", diff / 8.64e7];
    return rtf.format(Math.round(n), u);
  };
  return <Ctx.Provider value={{ lang, setLang, t, formatDate, relative, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
