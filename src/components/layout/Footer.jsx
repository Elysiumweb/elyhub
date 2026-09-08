import { Link } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";

export const Footer = () => {
  const { t, lang, setLang } = useI18n();
  const { games } = useGames();
  const col = "flex flex-col gap-2 text-sm text-zinc-300";
  const link = "hover:text-[#D8CA82] transition-colors";
  return (
    <footer className="border-t border-white/10 mt-12 bg-[#0e0e0e]" data-testid="footer">
      <div className="mx-auto max-w-[1400px] px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-7" width="222" height="70" loading="lazy" />
          <p className="text-sm text-zinc-300 mt-4 max-w-xs">{t("footer_tagline")}</p>
          <button data-testid="footer-lang-toggle" onClick={() => setLang(lang === "fr" ? "en" : "fr")} className="btn-ghost text-xs mt-4 px-0" aria-label="Changer de langue / Switch language">{lang === "fr" ? "Switch to English" : "Passer en français"}</button>
        </div>
        <nav aria-label={t("games")} className={col}><span className="label">{t("games")}</span>{games.filter((g) => g.status === "validated").slice(0, 10).map((g) => <Link key={g.id} to={`/g/${g.slug}`} className={link}>{g.name}</Link>)}</nav>
        <nav aria-label={t("explore")} className={col}><span className="label">{t("explore")}</span>
          <Link to="/teams" className={link}>{t("nav_teams")}</Link><Link to="/teams?tab=offers" className={link}>{t("recruitment_offers")}</Link><Link to="/scrims" className={link}>{t("nav_scrims")}</Link><Link to="/tournaments" className={link}>{t("nav_tournaments")}</Link><Link to="/players" className={link}>{t("nav_players")}</Link><Link to="/players?tab=lft" className={link}>{t("lft_title")}</Link>
        </nav>
        <nav aria-label={t("help")} className={col}><span className="label">{t("help")} & {t("legal")}</span>
          <Link to="/glossary" className={link}>{t("glossary")}</Link><Link to="/p/about" className={link}>{PAGE_LABELS[lang].about}</Link><Link to="/p/contact" className={link}>{PAGE_LABELS[lang].contact}</Link><Link to="/p/legal" className={link}>{PAGE_LABELS[lang].legal}</Link><Link to="/p/terms" className={link}>{PAGE_LABELS[lang].terms}</Link><Link to="/p/privacy" className={link}>{PAGE_LABELS[lang].privacy}</Link>
        </nav>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-400">© {new Date().getFullYear()} Elysium · ElyHub</div>
    </footer>
  );
};

const PAGE_LABELS = {
  fr: { about: "À propos", contact: "Contact", legal: "Mentions légales", terms: "CGU", privacy: "Confidentialité" },
  en: { about: "About", contact: "Contact", legal: "Legal notice", terms: "Terms", privacy: "Privacy" },
};
