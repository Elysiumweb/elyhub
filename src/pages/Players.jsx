import { useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { MapPin, Languages, Gamepad2, MessageSquare, Search, UserSearch } from "lucide-react";
import { useDocument, useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FiltersContext";
import { useI18n } from "@/i18n";
import { findOrCreateConversation, rankOfficial } from "@/lib/db";
import { slugToGameId } from "@/lib/constants";
import { LftCard } from "./Lft";
import { Avatar, PlayerCard } from "@/components/common/Cards";
import { GameBadge } from "@/components/common/Badges";
import { EmptyState, PageTitle, Skeletons } from "@/components/common/States";
import { ErrorState } from "@/components/common/ErrorState";
import Seo, { ldPerson } from "@/components/common/Seo";
import NotFound from "./NotFound";

export function Players() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply, filters } = useFilters();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "players";
  const urlGame = slugToGameId(params.get("game") || "");
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useCollection("users");
  const lft = useCollection("lft");
  const gameId = urlGame || filters.gameId;
  const list = apply(data.filter((p) => p.onboarded && (!q || p.pseudo?.toLowerCase().includes(q.toLowerCase()))), { gameKey: "__none" })
    .filter((p) => !gameId || (p.games || []).includes(gameId));
  const lftList = rankOfficial(apply(lft.data, undefined, { gameId: urlGame || undefined })).filter((x) => x.status === "open" && (!q || x.playerPseudo?.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <Seo title={tab === "lft" ? t("lft_title") : t("players_title")} description={tab === "lft" ? t("lft_title") : t("players_title")} path={tab === "lft" ? "/players?tab=lft" : "/players"} />
      <PageTitle eyebrow={t("nav_players")} title={tab === "lft" ? t("lft_title") : t("players_title")} right={<>
        <div className="flex items-center gap-2 w-56"><Search className="h-4 w-4 text-zinc-500" /><input data-testid="players-search-input" className="input-elysium h-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} /></div>
        {user && <Link to="/lft/new" data-testid="create-lft-button" className="btn-gold text-xs"><UserSearch className="h-4 w-4" />{t("create_lft")}</Link>}
      </>} />
      <div className="flex border-b border-white/10 mb-6">
        <button data-testid="players-tab-players" onClick={() => setParams({ tab: "players" })} className={`tab-btn ${tab === "players" ? "tab-btn-active" : ""}`}>{t("nav_players")} <span className="text-zinc-600 ml-1">{list.length}</span></button>
        <button data-testid="players-tab-lft" onClick={() => setParams({ tab: "lft" })} className={`tab-btn ${tab === "lft" ? "tab-btn-active" : ""}`}>{t("lft_short")} <span className="text-zinc-600 ml-1">{lftList.length}</span></button>
      </div>
      {tab === "lft" ? (
        lft.error ? <ErrorState error={lft.error} onRetry={lft.reload} testId="error-lft" /> : lft.loading ? <Skeletons n={4} className="h-24" /> : lftList.length === 0 ? <EmptyState icon={UserSearch} title={t("no_lft")} description={t("no_lft_desc")} action={user ? t("create_lft") : t("login")} to={user ? "/lft/new" : "/login"} testId="empty-lft" />
          : <div className="grid md:grid-cols-2 gap-3 stagger" data-testid="lft-grid">{lftList.map((x) => <LftCard key={x.id} lft={x} />)}</div>
      ) : error ? <ErrorState error={error} onRetry={reload} testId="error-players" /> : loading ? <Skeletons n={4} className="h-20" /> : list.length === 0 ? <EmptyState title={t("no_players")} description={t("no_players_desc")} testId="empty-players" /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger" data-testid="players-grid">{list.map((p) => <PlayerCard key={p.id} player={p} />)}</div>
      )}
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const { data: p, loading } = useDocument("users", id);
  const teams = useCollection("teams", [where("memberIds", "array-contains", id)], [id]);

  if (loading) return <Skeletons n={2} />;
  if (!p) return <NotFound />;
  const byGame = teams.data.reduce((acc, tm) => ({ ...acc, [tm.gameId]: [...(acc[tm.gameId] || []), tm] }), {});
  const me = user?.uid === id;

  const contact = async () => {
    const cid = await findOrCreateConversation({ me: profile, other: { id: p.id, pseudo: p.pseudo, avatar: p.avatar }, title: p.pseudo });
    nav(`/messages/${cid}`);
  };

  return (
    <div className="space-y-8" data-testid="player-profile-page">
      <Seo title={`${p.pseudo} — ${t("nav_players")} | ElyHub`} description={p.bio || `${p.pseudo} · ElyHub`} path={`/players/${p.id}`} image={p.avatar || null} jsonLd={ldPerson(p)} />
      <div className="card-elysium relative overflow-hidden p-6 sm:p-8 flex flex-wrap items-start gap-6">
        <img src="/brand/pattern.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <Avatar src={p.avatar} name={p.pseudo} round size="h-24 w-24" className="text-2xl relative" />
        <div className="flex-1 min-w-[240px] relative">
          <h1 data-testid="player-pseudo" className="font-display text-2xl sm:text-3xl uppercase text-white">{p.pseudo}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge border-white/10 text-zinc-300"><MapPin className="h-3 w-3" />{p.region}</span>
            {(p.languages || []).map((l) => <span key={l} className="badge border-white/10 text-zinc-400"><Languages className="h-3 w-3" />{t(`lang_${l}`)}</span>)}
            {(p.roles || []).map((r) => <span key={r} className="badge bg-[#D8CA82]/10 text-[#D8CA82] border-[#D8CA82]/30">{r}</span>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{(p.games || []).map((g) => <GameBadge key={g} game={getGame(g)} />)}</div>
          {p.bio && <p className="mt-4 text-sm text-zinc-300 whitespace-pre-line max-w-2xl">{p.bio}</p>}
          <p className="mt-3 text-xs text-zinc-600">{t("member_since")} {formatDate(p.createdAt)}</p>
        </div>
        <div className="relative flex flex-col gap-2">
          {me ? <Link to="/account" data-testid="player-edit-button" className="btn-outline text-xs">{t("edit_profile")}</Link>
            : user ? <button data-testid="player-contact-button" onClick={contact} className="btn-gold text-xs"><MessageSquare className="h-4 w-4" />{t("contact")}</button> : null}
        </div>
      </div>
      <section>
        <h2 className="section-title"><Gamepad2 className="h-3.5 w-3.5" />{t("teams_by_game")}</h2>
        {teams.loading ? <Skeletons n={1} className="h-20" /> : Object.keys(byGame).length === 0 ? <EmptyState title={t("no_team_yet")} description={me ? t("no_team_yet_desc") : t("player_no_team_desc")} action={me ? t("browse_teams") : null} to="/teams" testId="empty-player-teams" /> : (
          <div className="grid md:grid-cols-2 gap-4" data-testid="player-teams-by-game">
            {Object.entries(byGame).map(([gid, list]) => {
              const g = getGame(gid);
              return (
                <div key={gid} className="card-elysium p-4" style={{ borderTopColor: g.color, borderTopWidth: 2 }}>
                  <GameBadge game={g} size="lg" />
                  <div className="mt-3 space-y-2">
                    {list.map((tm) => (
                      <Link key={tm.id} to={`/teams/${tm.id}`} data-testid={`player-team-${tm.id}`} className="flex items-center gap-3 p-2 border border-white/5 hover:border-[#D8CA82]/40 transition-colors">
                        <Avatar src={tm.logo} name={tm.name} size="h-9 w-9" />
                        <div><div className="text-sm font-semibold text-white">{tm.name}</div><div className="text-[10px] uppercase tracking-wider text-[#D8CA82]">{tm.members?.find((m) => m.uid === id)?.role || t("player")}{tm.ownerId === id && " · " + t("captain")}</div></div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
