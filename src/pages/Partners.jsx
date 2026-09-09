import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

export default function Partners() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("partners_title")} description={t("partners_desc")} path="/partenaires" />
      <StaticPage eyebrow="Elysium" title={t("partners_title")} description={t("partners_desc")}>
        <Section testId="partners-body">
          <P>{t("partners_desc")}</P>
          <Link to="/contact" className="btn-gold text-xs mt-4">
            {t("partners_cta")}
          </Link>
        </Section>
      </StaticPage>
    </>
  );
}
