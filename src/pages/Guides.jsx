import { Link } from "react-router-dom";
import { UserRound, Shield, Trophy } from "lucide-react";
import Seo, { ldBreadcrumb } from "@/components/common/Seo";
import StaticPage from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";

const GUIDES = [
  {
    icon: UserRound,
    title: "guide_player_title",
    desc: "guide_player_desc",
    steps: ["guide_player_s1", "guide_player_s2", "guide_player_s3"],
    cta: ["create_lft", "/lft/new"],
    testId: "guide-player",
  },
  {
    icon: Shield,
    title: "guide_captain_title",
    desc: "guide_captain_desc",
    steps: ["guide_captain_s1", "guide_captain_s2", "guide_captain_s3"],
    cta: ["create_team", "/teams/new"],
    testId: "guide-captain",
  },
  {
    icon: Trophy,
    title: "guide_organizer_title",
    desc: "guide_organizer_desc",
    steps: ["guide_organizer_s1", "guide_organizer_s2", "guide_organizer_s3"],
    cta: ["create_tournament", "/tournaments/new"],
    testId: "guide-organizer",
  },
];

export default function Guides() {
  const { t } = useI18n();
  return (
    <>
      <Seo
        title={t("guides_title")}
        description={t("guides_desc")}
        path="/guides"
        jsonLd={ldBreadcrumb([{ name: "Accueil", path: "/" }, { name: t("guides_title"), path: "/guides" }])}
      />
      <StaticPage eyebrow={t("footer_help")} title={t("guides_title")} description={t("guides_desc")}>
        <div className="grid md:grid-cols-3 gap-4" data-testid="guides-grid">
          {GUIDES.map((g) => (
            <div key={g.testId} data-testid={g.testId} className="card-elysium p-5 flex flex-col">
              <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30">
                <g.icon className="h-5 w-5 text-[#D8CA82]" />
              </div>
              <h3 className="font-display text-sm uppercase text-white mt-3">{t(g.title)}</h3>
              <p className="text-xs text-zinc-500 mt-1">{t(g.desc)}</p>
              <ol className="mt-3 space-y-2 flex-1">
                {g.steps.map((s, i) => (
                  <li key={s} className="flex gap-2 text-xs text-zinc-400">
                    <span className="font-display text-[#D8CA82] shrink-0">{i + 1}.</span>
                    {t(s)}
                  </li>
                ))}
              </ol>
              <Link to={g.cta[1]} className="btn-gold text-xs mt-4 justify-center">
                {t(g.cta[0])}
              </Link>
            </div>
          ))}
        </div>
      </StaticPage>
    </>
  );
}
