import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { FilterBar } from "./FilterBar";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";

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
      <footer className="border-t border-white/10 mt-12">
        <div className="mx-auto max-w-[1400px] px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-6 opacity-80" />
          <span>ElyHub · {t("footer_tagline")}</span>
        </div>
      </footer>
    </div>
  );
}
