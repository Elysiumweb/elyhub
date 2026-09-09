import { Link, useParams, Navigate } from "react-router-dom";
import { where, limit } from "firebase/firestore";
import { Swords, Trophy, UserSearch } from "lucide-react";
import Seo, { ldBreadcrumb } from "@/components/common/Seo";
import { useI18n } from "@/i18n";
import { useGames } from "@/hooks/useGames";
import { useCollection } from "@/hooks/useFirestore";
import { TeamCard, ScrimCard, TournamentCard, PlayerCard, OfferCard, Avatar } from "@/components/common/Cards";
import { EmptyState } from "@/components/common/States";
import { slugToGameId } from "@/lib/constants";
import NotFound from "./NotFound";

const SECTION_MAP = {
  equipes: "teams",
  scrims: "scrims",
  tournois: "tournaments",
  joueurs: "players",
  offres: "offers",
  lft: "lft",
};

const TITLES = {
  teams: ["hub_teams", "hub_all_teams", "/teams"],
  scrims: ["hub_scrims", "hub_all_scrims", "/scrims"],
  tournaments: ["hub_tournaments", "hub_all_tournaments", "/tournaments"],
  players: ["hub_players", "hub_all_players", "/players"],
  offers: ["hub_offers", "hub_all_offers", "/offers"],
  lft: ["hub_lft", "hub_all_lft", "/players?lft=1"],
};

export default function GameHub() {
  const { slug, section: rawSection } = useParams();
  const { t } = useI18n();
  const { getGame } = useGames();
  const gameId = slugToGameId(slug);
  const game = getGame(gameId);
  const section = SECTION_MAP[rawSection] || "teams";

  // Un seul abonnement à la fois : la section active uniquement.
  const { data, loading } = useCollection(
    section === "players" ? "users" : section === "lft" ? "lft" : section,
    section === "players" ? [where("games", "array-contains", gameId), limit(24)] : [where("gameId", "==", gameId), limit(24)],
    [section, gameId],
  );

  if (!game) return <NotFound />;
  if (game.id !== gameId) return <Navigate to={`/${slug}`} replace />;

  const [titleKey, allKey, base] = TITLES[section];
  const list = section === "players" ? data.filter((p) => p.onboarded) : data;

  const renderCard = (item) => {
    switch (section) {
      case "teams": return <TeamCard key={item.id} team={item} />;
      case "scrims": return <ScrimCard key={item.id} scrim={item} />;
      case "tournaments": return <TournamentCard key={item.id} tournament={item} />;
      case "players": return <PlayerCard key={item.id} player={item} />;
      case "offers": return <OfferCard key={item.id} offer={item} />;
      case "lft":
        return (
          <Link key={item.id} to={`/players/${item.playerId}`} data-testid={`lft-card-${item.id}`} className="card-elysium p-4 flex items-center gap-3">
            <Avatar src={item.avatar} name={item.playerPseudo} round />
            <div className="min-w-0">
              <h3 className="font-display text-sm uppercase text-white truncate">{item.playerPseudo}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-400">
                <span className="badge border-white/10 text-zinc-300">{item.rank || t("all_ranks")}</span>
                <span className="inline-flex items-center gap-1"><UserSearch className="h-3 w-3" />{item.roles?.join(", ") || t("lft_short")}</span>
              </div>
            </div>
          </Link>
        );
      default: return null;
    }
  };

  const emptyIcon = section === "scrims" ? Swords : section === "tournaments" ? Trophy : null;

  return (
    <>
      <Seo
        title={`${game.name} — ${t(titleKey)} | ElyHub`}
        description={t("hub_desc", { game: game.name })}
        path={`/${slug}${rawSection ? `/${rawSection}` : ""}`}
        image={`/api/og-image?type=game&game=${encodeURIComponent(game.name)}`}
        jsonLd={ldBreadcrumb([{ name: "Accueil", path: "/" }, { name: game.name, path: `/${slug}` }])}
      />
      <div className="space-y-6">
        {/* Bandeau identité du jeu */}
        <div className="card-elysium p-6 relative overflow-hidden" data-testid="game-hub-hero" style={{ borderTop: `3px solid ${game.color}` }}>
          <div className="eyebrow">ElyHub · {t("nav_teams").replace("s", "")} / Hub</div>
          <h1 className="section-title !text-3xl" style={{ color: game.color }}>{game.name}</h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">{t("hub_desc", { game: game.name })}</p>
        </div>

        {/* Navigation des sections */}
        <nav className="flex flex-wrap gap-1" data-testid="game-hub-nav" aria-label={game.name}>
          {Object.entries(SECTION_MAP).map(([slugKey, s]) => {
            const active = section === s;
            return (
              <Link
                key={s}
                to={`/${slug}/${slugKey}`}
                data-testid={`hub-nav-${s}`}
                className={`btn-ghost text-xs capitalize ${active ? "!border-[#D8CA82] !text-[#D8CA82]" : ""}`}
              >
                {t(TITLES[s][0])}
              </Link>
            );
          })}
        </nav>

        {/* Contenu de la section */}
        <div className="flex items-end justify-between gap-3">
          <h2 className="section-title">{t(titleKey)}</h2>
          <Link to={`${base}?game=${gameId}`} data-testid="hub-see-all" className="text-xs text-[#D8CA82] hover:underline">
            {t("hub_see_all")} →
          </Link>
        </div>
        {!loading && list.length === 0 ? (
          <EmptyState icon={emptyIcon} title={t(`no_${section}`)} description={t(allKey)} testId={`hub-empty-${section}`} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid={`hub-grid-${section}`}>
            {list.map(renderCard)}
          </div>
        )}
      </div>
    </>
  );
}
