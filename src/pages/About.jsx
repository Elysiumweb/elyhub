import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

export default function About() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("about_title")} description={t("about_desc")} path="/a-propos" />
      <StaticPage eyebrow="Elysium" title={t("about_title")} description={t("about_desc")}>
        <Section title={t("about_mission")} testId="about-mission">
          <P>{t("about_mission_text")}</P>
        </Section>
        <Section title={t("about_values")} testId="about-values">
          <ul className="mt-3 space-y-2">
            {["about_v1", "about_v2", "about_v3"].map((v) => (
              <li key={v} className="flex gap-2 text-sm text-zinc-400">
                <span className="text-[#D8CA82]">◆</span>
                {t(v)}
              </li>
            ))}
          </ul>
        </Section>
        <Section title={t("about_elysium")} testId="about-elysium">
          <P>{t("about_elysium_text")}</P>
          <Link to="/esport" className="btn-outline text-xs mt-4">
            {t("esport_title")}
          </Link>
        </Section>
      </StaticPage>
    </>
  );
}
