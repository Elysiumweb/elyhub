import { useParams, Link } from "react-router-dom";
import { where } from "firebase/firestore";
import { Users, Briefcase, Swords, Trophy, UserSearch, Medal } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { useCollection } from "@/hooks/useFirestore";
import { useI18n } from "@/i18n";
import { rankOfficial } from "@/lib/db";
import { Seo } from "@/components/common/Seo";
import { TeamCard, OfferCard, ScrimCard, TournamentCard, PlayerCard } from "@/components/common/Cards";
import { LftCard } from "./Lft";
import { EmptyState, Skeletons } from "@/components/common/States";
import NotFound from "./NotFound";

const Block = ({ title, icon: Icon, to, items, render, loading, empty }) => (
  <section>
    <div className="flex items-center justify-between mb-3"><h2 className="section-title mb-0"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{title} <span className="text-zinc-400 font-sans normal-case tracking-normal">({items.length})</span></h2>{to && <Link to={to} className="text-xs text-[#D8CA82] hover:underline">{empty.all}</Link>}</div>
    {loading ? <Skeletons n={2} className="h-24" /> : items.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger">{items.slice(0, 6).map(render)}</div> : <EmptyState title={empty.title} description={empty.desc} testId={`hub-empty-${title}`} />}
  </section>
);

// Public SEO landing page per game: /g/:slug
export default function GameHub() {
  const { slug } = useParams();
  const { bySlug, loading: gl } = useGames();
  const { t } = useI18n();
  const g = bySlug[slug];
  const id = g?.id || "-";
  const teams = useCollection("teams", [where("gameId", "==", id)], [id]);
  const offers = useCollection("offers", [where("gameId", "==", id)], [id]);
  const scrims = useCollection("scrims", [where("gameId", "==", id)], [id]);
  const tournaments = useCollection("tournaments", [where("gameId", "==", id)], [id]);
  const lft = useCollection("lft", [where("gameId", "==", id)], [id]);
  const players = useCollection("users", [where("games", "array-contains", id)], [id]);
  if (gl) return <Skeletons n={3} />;
  if (!g) return <NotFound />;
  const desc = t("hub_desc").replace("{game}", g.name);
  return (
    <div className="space-y-10" data-testid="game-hub-page">
      <Seo title={`${g.name} — ${t("hub_title_suffix")}`} description={desc} jsonLd={{ "@type": "CollectionPage", name: `${g.name} — ElyHub`, description: desc }} />
      <header className="relative overflow-hidden border p-8 sm:p-12 bg-[#141414]" style={{ borderColor: `${g.color}66`, boxShadow: `inset 0 3px 0 ${g.color}` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 10% 0%, ${g.color}22, transparent 55%)` }} aria-hidden="true" />
        <div className="relative">
          <div className="eyebrow mb-2">{t("game_hub")}</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase text-white" style={{ textShadow: `0 0 40px ${g.color}55` }}>{g.name}</h1>
          <p className="mt-3 text-zinc-300 max-w-2xl">{desc}</p>
          {g.ranks && <div className="mt-6"><div className="label flex items-center gap-1"><Medal className="h-3 w-3" aria-hidden="true" />{t("rank_ladder")}</div><ol className="flex flex-wrap gap-1.5" data-testid="hub-rank-ladder">{g.ranks.map((r, i) => <li key={r} className="badge border-white/10 text-zinc-200" style={{ borderColor: `${g.color}${Math.min(99, 25 + i * 8)}` }}>{r}</li>)}</ol></div>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/scrims/new" className="btn-gold text-xs">{t("publish_scrim")}</Link>
            <Link to="/teams/new" className="btn-outline text-xs">{t("create_team")}</Link>
            <Link to="/lft/new" className="btn-outline text-xs">{t("create_lft")}</Link>
          </div>
        </div>
      </header>
      <Block title={t("nav_teams")} icon={Users} to="/teams" items={rankOfficial(teams.data)} loading={teams.loading} render={(x) => <TeamCard key={x.id} team={x} />} empty={{ title: t("no_teams"), desc: t("no_teams_desc"), all: t("see_all") }} />
      <Block title={t("recruitment_offers")} icon={Briefcase} to="/teams?tab=offers" items={rankOfficial(offers.data.filter((o) => o.status === "open"))} loading={offers.loading} render={(x) => <OfferCard key={x.id} offer={x} />} empty={{ title: t("no_offers"), desc: t("no_offers_desc"), all: t("see_all") }} />
      <Block title={t("nav_scrims")} icon={Swords} to="/scrims" items={rankOfficial(scrims.data.filter((s) => s.status === "open"))} loading={scrims.loading} render={(x) => <ScrimCard key={x.id} scrim={x} />} empty={{ title: t("no_scrims"), desc: t("no_scrims_desc"), all: t("see_all") }} />
      <Block title={t("nav_tournaments")} icon={Trophy} to="/tournaments" items={rankOfficial(tournaments.data)} loading={tournaments.loading} render={(x) => <TournamentCard key={x.id} tournament={x} />} empty={{ title: t("no_tournaments"), desc: t("no_tournaments_desc"), all: t("see_all") }} />
      <Block title={t("lft_short")} icon={UserSearch} to="/players?tab=lft" items={rankOfficial(lft.data.filter((x) => x.status === "open"))} loading={lft.loading} render={(x) => <LftCard key={x.id} lft={x} />} empty={{ title: t("no_lft"), desc: t("no_lft_desc"), all: t("see_all") }} />
      <Block title={t("nav_players")} icon={Users} to="/players" items={players.data.filter((p) => p.onboarded && !p.hidden)} loading={players.loading} render={(x) => <PlayerCard key={x.id} player={x} />} empty={{ title: t("no_players"), desc: t("no_players_desc"), all: t("see_all") }} />
    </div>
  );
}
