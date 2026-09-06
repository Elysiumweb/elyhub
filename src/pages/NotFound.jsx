import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div data-testid="not-found-page" className="relative overflow-hidden card-elysium p-12 sm:p-20 text-left">
      <img src="/brand/accent-blade.png" alt="" className="absolute -right-24 -bottom-24 w-[480px] opacity-20 pointer-events-none" />
      <div className="eyebrow mb-3">Error</div>
      <h1 className="font-display text-6xl sm:text-8xl text-[#D8CA82] leading-none">404</h1>
      <p className="mt-4 text-lg text-white font-display uppercase">{t("not_found_title")}</p>
      <p className="mt-2 text-sm text-zinc-400 max-w-md">{t("not_found_desc")}</p>
      <Link to="/" data-testid="not-found-home-link" className="btn-gold mt-8">{t("back_home")}</Link>
    </div>
  );
}
