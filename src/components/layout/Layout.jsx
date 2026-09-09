import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { FilterBar } from "./FilterBar";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import CookieBanner from "@/components/common/CookieBanner";
import OnboardingTour from "@/components/common/OnboardingTour";

const FOOTER_COLS = [
  {
    title: "footer_about",
    links: [
      ["/esport", "esport_title"],
      ["/a-propos", "about_title"],
      ["/actu", "nav_blog"],
      ["/evenements", "nav_events"],
      ["/carrieres", "nav_careers"],
      ["/ambassadeurs", "ambassadors_title"],
    ],
  },
  {
    title: "footer_help",
    links: [
      ["/glossaire", "nav_glossary"],
      ["/aide", "nav_help"],
      ["/guides", "guides_title"],
      ["/contact", "contact_title"],
    ],
  },
  {
    title: "footer_legal",
    links: [
      ["/mentions-legales", "legal_title"],
      ["/cgu", "legal_cgu_title"],
      ["/confidentialite", "legal_privacy_title"],
      ["/cookies", "legal_cookies_title"],
      ["/presse", "press_title"],
      ["/partenaires", "partners_title"],
    ],
  },
];

export default function Layout() {
  const { t } = useI18n();
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user && !profile?.onboarded && pathname !== "/onboarding") nav("/onboarding", { replace: true });
  }, [loading, user, profile, pathname, nav]);

  return (
    <div className="min-h-screen flex flex-col bg-pattern">
      <Navbar />
      <FilterBar />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8 animate-in">
        <Outlet />
      </main>
      <footer data-testid="footer" className="border-t border-white/10 mt-12 bg-[#0d0d0d]">
        <div className="mx-auto max-w-[1400px] px-6 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-7 opacity-90" />
            <p className="mt-3 text-xs text-zinc-500 max-w-xs leading-relaxed">{t("footer_tagline")} · {t("home_hero_desc")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["valorant", "lol", "cs2", "rocket-league"].map((id) => (
                <Link key={id} to={`/${id === "lol" ? "league-of-legends" : id === "cs2" ? "counter-strike-2" : id}`} className="badge border-white/10 text-zinc-400 hover:border-[#D8CA82]/50 hover:text-[#D8CA82]">
                  {id === "lol" ? "League of Legends" : id === "cs2" ? "CS2" : id === "rocket-league" ? "Rocket League" : "Valorant"}
                </Link>
              ))}
            </div>
          </div>
          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={t(col.title)}>
              <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-[#D8CA82] mb-3">{t(col.title)}</h3>
              <ul className="space-y-2">
                {col.links.map(([to, key]) => (
                  <li key={to}>
                    <Link to={to} data-testid={`footer-link-${to.slice(1)}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-[1400px] px-6 py-4 text-[11px] text-zinc-600 flex flex-wrap gap-4 justify-between">
            <span>© {new Date().getFullYear()} Elysium · ElyHub</span>
            <span>{t("footer_tagline")}</span>
          </div>
        </div>
      </footer>
      <CookieBanner />
      <OnboardingTour />
    </div>
  );
}
