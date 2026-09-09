import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import Seo from "@/components/common/Seo";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-[60vh] grid place-items-center text-center p-8" data-testid="not-found">
      <Seo title={t("not_found_title")} path={null} noindex />
      <div>
        <div className="font-display text-7xl text-[#D8CA82]">404</div>
        <h1 className="font-display text-xl uppercase text-white mt-4">{t("not_found_title")}</h1>
        <p className="text-sm text-zinc-400 mt-2">{t("not_found_desc")}</p>
        <Link to="/" className="btn-gold text-xs mt-6" data-testid="back-home">
          {t("back_home")}
        </Link>
      </div>
    </div>
  );
}
