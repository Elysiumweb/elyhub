import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

export default function Esport() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("esport_title")} description={t("esport_desc")} path="/esport" />
      <StaticPage eyebrow="Elysium · ElyHub" title={t("esport_title")} description={t("esport_desc")}>
        <Section title={t("esport_what")} testId="esport-what">
          <P>{t("esport_what_text")}</P>
        </Section>
        <Section title={t("esport_who")} testId="esport-who">
          <P>{t("esport_who_text")}</P>
        </Section>
        <Section title={t("esport_careers")} testId="esport-careers">
          <P>{t("esport_careers_text")}</P>
          <Link to="/carrieres" className="btn-gold text-xs mt-4">
            {t("nav_careers")}
          </Link>
        </Section>
        <Section title={t("glossary_title")} testId="esport-glossary">
          <P>{t("glossary_desc")}</P>
          <Link to="/glossaire" className="btn-outline text-xs mt-4">
            {t("nav_glossary")}
          </Link>
        </Section>
      </StaticPage>
    </>
  );
}
