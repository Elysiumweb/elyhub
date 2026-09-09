import { Link } from "react-router-dom";
import { Briefcase, GraduationCap, HeartHandshake } from "lucide-react";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

export default function Careers() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("careers_title")} description={t("careers_desc")} path="/carrieres" />
      <StaticPage eyebrow={t("nav_careers")} title={t("careers_title")} description={t("careers_desc")}>
        <div className="grid md:grid-cols-3 gap-4">
          <Section testId="careers-roles">
            <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30">
              <Briefcase className="h-5 w-5 text-[#D8CA82]" />
            </div>
            <h3 className="section-title mt-3">{t("careers_roles")}</h3>
            <P>{t("careers_roles_text")}</P>
          </Section>
          <Section testId="careers-formations">
            <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30">
              <GraduationCap className="h-5 w-5 text-[#D8CA82]" />
            </div>
            <h3 className="section-title mt-3">{t("careers_formations")}</h3>
            <P>{t("careers_formations_text")}</P>
          </Section>
          <Section testId="careers-volunteer">
            <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30">
              <HeartHandshake className="h-5 w-5 text-[#D8CA82]" />
            </div>
            <h3 className="section-title mt-3">{t("careers_volunteer")}</h3>
            <P>{t("careers_volunteer_text")}</P>
          </Section>
        </div>
        <Link to="/evenements" className="btn-outline text-xs">
          {t("nav_events")}
        </Link>
      </StaticPage>
    </>
  );
}
