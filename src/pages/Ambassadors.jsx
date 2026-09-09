import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

export default function Ambassadors() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("ambassadors_title")} description={t("ambassadors_desc")} path="/ambassadeurs" />
      <StaticPage eyebrow="Elysium" title={t("ambassadors_title")} description={t("ambassadors_desc")}>
        <Section testId="ambassadors-body">
          <P>{t("ambassadors_text")}</P>
          <Link to="/contact" className="btn-gold text-xs mt-4">
            {t("contact_title")}
          </Link>
        </Section>
      </StaticPage>
    </>
  );
}
