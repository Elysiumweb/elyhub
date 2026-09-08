import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { FilterBar } from "./FilterBar";
import { Footer } from "./Footer";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";

const LIST_ROUTES = ["/", "/teams", "/scrims", "/tournaments", "/players"];

export default function Layout() {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const nav = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    if (!loading && user && !profile?.onboarded && pathname !== "/onboarding") nav("/onboarding", { replace: true });
  }, [loading, user, profile, pathname, nav]);
  const showFilters = LIST_ROUTES.includes(pathname) || pathname.startsWith("/g/");
  return (
    <div className="min-h-screen flex flex-col bg-pattern">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-gold text-xs">{t("skip_to_content")}</a>
      <Navbar />
      {showFilters && <FilterBar />}
      <main id="main" className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8 animate-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
