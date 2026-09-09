import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

const ASSETS = [
  { name: "Logo horizontal (or)", href: "/brand/logo-horizontal-gold.svg" },
  { name: "Logo horizontal (blanc)", href: "/brand/logo-horizontal-white.svg" },
  { name: "Icône (or)", href: "/brand/logo-icon-gold.svg" },
  { name: "Icône (blanc)", href: "/brand/logo-icon-white.svg" },
  { name: "Motif", href: "/brand/pattern.svg" },
];

export default function Press() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t("press_title")} description={t("press_desc")} path="/presse" />
      <StaticPage eyebrow="Elysium" title={t("press_title")} description={t("press_desc")}>
        <Section title={t("press_download_kit")} testId="press-assets">
          <div className="grid sm:grid-cols-2 gap-2">
            {ASSETS.map((a) => (
              <a key={a.href} href={a.href} download className="card-elysium p-3 text-xs text-zinc-300 hover:border-[#D8CA82]/50 flex items-center justify-between">
                {a.name}
                <span className="text-[#D8CA82]">↓ SVG</span>
              </a>
            ))}
          </div>
          <P>
            {t("about_elysium_text")}{" "}
            <Link to="/a-propos" className="text-[#D8CA82] hover:underline">
              {t("about_title")} →
            </Link>
          </P>
        </Section>
      </StaticPage>
    </>
  );
}
