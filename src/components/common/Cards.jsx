import { Link } from "react-router-dom";
import { Users, MapPin, Calendar, Trophy, Swords, Briefcase } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";
import { GameBadge, OfficialBadge, StatusBadge } from "./Badges";
import { cn } from "@/lib/utils";

export const Avatar = ({ src, name, size = "h-10 w-10", round = false, className }) => (
  <div className={cn(size, "shrink-0 overflow-hidden border border-white/10 bg-[#1A1A1A] grid place-items-center font-display text-xs text-[#D8CA82]", round ? "rounded-full" : "rounded-sm", className)}>
    {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : (name || "?").slice(0, 2).toUpperCase()}
  </div>
);

const Shell = ({ to, official, color, children, testId, className }) => (
  <Link to={to} data-testid={testId} className={cn("card-elysium block p-4 relative group", official && "card-official", className)} style={{ "--game": color }}>
    <span className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: official ? "#D8CA82" : color }} />
    {children}
  </Link>
);

export const TeamCard = ({ team }) => {
  const { getGame } = useGames();
  const { t } = useI18n();
  const g = getGame(team.gameId);
  return (
    <Shell to={`/teams/${team.id}`} official={team.isOfficial} color={g.color} testId={`team-card-${team.id}`}>
      <div className="flex items-start gap-3">
        <Avatar src={team.logo} name={team.name} size="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm uppercase tracking-wide text-white truncate group-hover:text-[#D8CA82] transition-colors">{team.name}</h3>
            {team.isOfficial && <OfficialBadge />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <GameBadge game={g} />
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{team.region}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{team.memberIds?.length || 0} {t("members").toLowerCase()}</span>
          </div>
          {team.description && <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{team.description}</p>}
        </div>
      </div>
    </Shell>
  );
};

export const OfferCard = ({ offer }) => {
  const { getGame } = useGames();
  const { t } = useI18n();
  const g = getGame(offer.gameId);
  return (
    <Shell to={`/offers/${offer.id}`} official={offer.isOfficial} color={g.color} testId={`offer-card-${offer.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Briefcase className="h-4 w-4 text-[#D8CA82]" />
            <h3 className="font-display text-sm uppercase tracking-wide text-white truncate">{offer.role}</h3>
            {offer.isOfficial && <OfficialBadge />}
          </div>
          <p className="text-xs text-zinc-400 mt-1">{offer.teamName}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
            <GameBadge game={g} />
            {offer.rank && <span className="badge border-white/10 text-zinc-300">{offer.rank}</span>}
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.region}</span>
            {offer.availability && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{offer.availability}</span>}
          </div>
        </div>
        <StatusBadge status={offer.status} />
      </div>
      <span className="sr-only">{t("offer")}</span>
    </Shell>
  );
};

export const ScrimCard = ({ scrim }) => {
  const { getGame } = useGames();
  const { t, formatDate } = useI18n();
  const g = getGame(scrim.gameId);
  return (
    <Shell to={`/scrims/${scrim.id}`} official={scrim.isOfficial} color={g.color} testId={`scrim-card-${scrim.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Swords className="h-4 w-4 text-[#D8CA82]" />
            <h3 className="font-display text-sm uppercase tracking-wide text-white truncate">{scrim.teamName}</h3>
            {scrim.isOfficial && <OfficialBadge />}
            {scrim.opponentTeamName && <span className="text-xs text-zinc-400">vs <b className="text-white">{scrim.opponentTeamName}</b></span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
            <GameBadge game={g} />
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(scrim.date, true)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{scrim.region}</span>
            <span className="badge border-white/10 text-zinc-300">{t(`level_${scrim.level}`)}</span>
            <span className="badge border-white/10 text-zinc-300">{scrim.format}</span>
          </div>
        </div>
        <StatusBadge status={scrim.status} />
      </div>
    </Shell>
  );
};

export const TournamentCard = ({ tournament: tr }) => {
  const { getGame } = useGames();
  const { t, formatDate } = useI18n();
  const g = getGame(tr.gameId);
  const left = tr.slots - (tr.registeredTeamIds?.length || 0);
  return (
    <Shell to={`/tournaments/${tr.id}`} official={tr.isOfficial} color={g.color} testId={`tournament-card-${tr.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Trophy className="h-4 w-4 text-[#D8CA82]" />
            <h3 className="font-display text-sm uppercase tracking-wide text-white truncate">{tr.name}</h3>
            {tr.isOfficial && <OfficialBadge />}
          </div>
          {tr.organizerName && <p className="text-xs text-zinc-400 mt-1">{t("by")} {tr.organizerName}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
            <GameBadge game={g} />
            <span className="badge border-white/10 text-zinc-300">{t(`format_${tr.format}`)}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(tr.startDate)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{tr.region}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-lg text-[#D8CA82]" data-testid={`tournament-slots-${tr.id}`}>{left}<span className="text-zinc-500 text-xs">/{tr.slots}</span></div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t("slots_left")}</div>
        </div>
      </div>
    </Shell>
  );
};

export const PlayerCard = ({ player }) => {
  const { getGame } = useGames();
  return (
    <Link to={`/players/${player.id}`} data-testid={`player-card-${player.id}`} className="card-elysium p-4 flex items-center gap-3">
      <Avatar src={player.avatar} name={player.pseudo} round size="h-11 w-11" />
      <div className="min-w-0">
        <h3 className="font-display text-sm uppercase tracking-wide text-white truncate">{player.pseudo}</h3>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{player.region}</span>
          {(player.games || []).slice(0, 3).map((id) => <GameBadge key={id} game={getGame(id)} />)}
        </div>
      </div>
    </Link>
  );
};
