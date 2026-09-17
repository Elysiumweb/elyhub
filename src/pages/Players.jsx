import { useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { toast } from "sonner";
import { MapPin, Languages, Gamepad2, MessageSquare, Search, UserSearch, Calendar, Link2 } from "lucide-react";
import { useDocument, useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FiltersContext";
import { useI18n } from "@/i18n";
import { findOrCreateConversation, rankOfficial } from "@/lib/db";
import { slugToGameId, LEVELS, WEEKDAYS, GAME_HANDLES, SOCIAL_PLATFORMS, countryLabel } from "@/lib/constants";
import { teamGames, isMinorProfile, isVerified } from "@/lib/profile";
import { LftCard } from "./Lft";
import { Avatar, PlayerCard } from "@/components/common/Cards";
import { GameBadge, VerifiedBadge, LevelBadge, MinorBadge } from "@/components/common/Badges";
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
  const [level, setLevel] = useState("");
  // Annuaire public : projection profiles/{uid} (la collection users est privée,
  // lecture soi/modération uniquement — cf. firestore.rules).
  const { data, loading, error, reload } = useCollection("profiles");
  const lft = useCollection("lft");
  const gameId = urlGame || filters.gameId;
  const list = apply(data.filter((p) => p.onboarded
      && p.visibility?.public !== false
      && p.visibility?.hideDirectory !== false
      && (!q || p.pseudo?.toLowerCase().includes(q.toLowerCase()))
      && (!level || p.level === level)), { gameKey: "__none__" })
    .filter((p) => !gameId || (p.games || []).includes(gameId));
  const lftList = rankOfficial(apply(lft.data, undefined, { gameId: urlGame || undefined })).filter((x) => x.status === "open" && (!q || x.playerPseudo?.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <Seo title={tab === "lft" ? t("lft_title") : t("players_title")} description={tab === "lft" ? t("lft_title") : t("players_title")} path={tab === "lft" ? "/players?tab=lft" : "/players"} />
      <PageTitle eyebrow={t("nav_players")} title={tab === "lft" ? t("lft_title") : t("players_title")} right={<>
        <div className="flex items-center gap-2 w-56"><Search className="h-4 w-4 text-zinc-500" /><input data-testid="players-search-input" className="input-elysium h-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} /></div>
        {user && <Link to="/lft/new" data-testid="create-lft-button" className="btn-gold text-xs"><UserSearch className="h-4 w-4" />{t("create_lft")}</Link>}
      </>} />
      {tab === "players" && (
        <div className="flex items-center gap-2 mb-4" data-testid="players-level-filter">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{t("filter_level")}</span>
          <select data-testid="players-level-select" className="select-elysium h-9 text-xs" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">{t("all_levels")}</option>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`level_${l}`)}</option>)}
          </select>
        </div>
      )}
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

// Affichage du planning hebdo (jours cochés + créneau), dans le fuseau du joueur.
const ScheduleChips = ({ schedule, timezone }) => {
  const { t } = useI18n();
  if (!schedule?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="player-schedule">
      {schedule.map((s, i) => {
        const d = WEEKDAYS.find((w) => w.id === s.day);
        return <span key={i} className="badge border-[#D8CA82]/40 text-[#D8CA82]">{d ? t(d.key) : s.day} {s.from}–{s.to}{timezone && <span className="text-zinc-500 ml-1">{timezone}</span>}</span>;
      })}
    </div>
  );
};

export default function PlayerProfile() {
  const { id } = useParams();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const { user, profile: myProfile } = useAuth();
  const nav = useNavigate();
  const me = user?.uid === id;
  // Moi : profil privé live (users). Autres : projection publique (profiles).
  const { data: pub, loading: pubLoading } = useDocument("profiles", id, !me);
  const p = me ? myProfile : pub;
  const teams = useCollection("teams", [where("memberIds", "array-contains", id)], [id]);
  const [contactBusy, setContactBusy] = useState(false);

  if (!me && pubLoading) return <Skeletons n={2} />;
  if (!p) return <NotFound />;
  // Profil non public : seules les données minimales sont visibles (RGPD/choix utilisateur).
  const hidden = !me && p.visibility?.public === false;
  const byGame = teams.data.reduce((acc, tm) => {
    for (const gid of teamGames(tm)) acc[gid] = [...(acc[gid] || []), tm];
    return acc;
  }, {});

  const contact = async () => {
    if (!myProfile) return nav("/login");
    setContactBusy(true);
    try {
      const cid = await findOrCreateConversation({ me: myProfile, other: { id: p.id, pseudo: p.pseudo, avatar: p.avatar }, title: p.pseudo });
      nav(`/messages/${cid}`);
    } catch { toast.error(t("err_generic")); } finally { setContactBusy(false); }
  };

  if (hidden) {
    return (
      <div className="max-w-xl mx-auto" data-testid="player-profile-private">
        <PageTitle eyebrow={t("nav_players")} title={p.pseudo} />
        <EmptyState title={t("private_profile")} testId="private-profile-state" />
      </div>
    );
  }

  const hideRank = Boolean(p.visibility?.hideRank);
  const minor = isMinorProfile(p);
  const verified = isVerified(p);
  const location = [p.country ? countryLabel(p.country) : null, p.city || null].filter(Boolean).join(" · ");
  const handles = Object.entries(p.gameHandles || {}).filter(([, v]) => v);
  const socials = Object.entries(p.socials || {}).filter(([, v]) => v);

  return (
    <div className="space-y-8" data-testid="player-profile-page">
      <Seo title={`${p.pseudo} — ${t("nav_players")} | ElyHub`} description={p.bio || `${p.pseudo} · ElyHub`} path={`/players/${p.id}`} image={p.avatar || null} jsonLd={ldPerson(p)} />
      <div className="card-elysium relative overflow-hidden p-6 sm:p-8 flex flex-wrap items-start gap-6">
        <img src="/brand/pattern.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <Avatar src={p.avatar} name={p.pseudo} round size="h-24 w-24" className="text-2xl relative" />
        <div className="flex-1 min-w-[240px] relative">
          <h1 data-testid="player-pseudo" className="font-display text-2xl sm:text-3xl uppercase text-white flex items-center gap-3 flex-wrap">
            {p.pseudo}
            {verified && <VerifiedBadge testId="player-verified" />}
            {minor && <MinorBadge testId="player-minor" />}
            <LevelBadge level={p.level} />
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge border-white/10 text-zinc-300"><MapPin className="h-3 w-3" />{p.region}{location && ` · ${location}`}</span>
            {(p.languages || []).map((l) => <span key={l} className="badge border-white/10 text-zinc-300"><Languages className="h-3 w-3" />{t(`lang_${l}`)}</span>)}
            {(p.roles || []).map((r) => <span key={r} className="badge bg-[#D8CA82]/10 text-[#D8CA82] border-[#D8CA82]/30">{r}</span>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="player-games">
            {(p.games || []).map((gid) => (
              <span key={gid} className="flex items-center gap-1.5 border border-white/10 pl-1.5 pr-2 py-1">
                <GameBadge game={getGame(gid)} />
                {p.ranksByGame?.[gid] && !hideRank && <span data-testid={`player-rank-${gid}`} className="text-xs text-zinc-300">{p.ranksByGame[gid]}</span>}
              </span>
            ))}
          </div>
          {p.bio && <p className="mt-4 text-sm text-zinc-300 whitespace-pre-line max-w-2xl">{p.bio}</p>}
          <p className="mt-3 text-xs text-zinc-600">{t("member_since")} {formatDate(p.createdAt)}</p>
        </div>
        <div className="relative flex flex-col gap-2">
          {me ? <Link to="/account" data-testid="player-edit-button" className="btn-outline text-xs">{t("edit_profile")}</Link>
            : user ? <button data-testid="player-contact-button" onClick={contact} disabled={contactBusy} className="btn-gold text-xs"><MessageSquare className="h-4 w-4" />{t("contact")}</button> : null}
        </div>
      </div>

      <section>
        <h2 className="section-title"><Calendar className="h-3.5 w-3.5" />{t("availability_schedule")}</h2>
        <div data-testid="player-availability">
          <ScheduleChips schedule={p.availabilitySchedule} timezone={p.timezone} />
          {!p.availabilitySchedule?.length && <p className="text-xs text-zinc-500">{t("no_schedule")}</p>}
        </div>
      </section>

      {(handles.length > 0 || socials.length > 0 || p.vodLink) && (
        <section className="grid md:grid-cols-2 gap-6">
          {handles.length > 0 && (
            <div>
              <h2 className="section-title"><Gamepad2 className="h-3.5 w-3.5" />{t("game_profiles")}</h2>
              <div className="card-elysium p-4 grid sm:grid-cols-2 gap-2" data-testid="player-handles">
                {handles.map(([hid, val]) => {
                  const h = GAME_HANDLES.find((x) => x.id === hid);
                  return <div key={hid} className="text-xs"><span className="text-zinc-500 block">{h?.label || hid}</span><span className="text-zinc-200">{val}</span></div>;
                })}
              </div>
            </div>
          )}
          {(socials.length > 0 || p.vodLink) && (
            <div>
              <h2 className="section-title"><Link2 className="h-3.5 w-3.5" />{t("social_links")}</h2>
              <div className="card-elysium p-4 grid sm:grid-cols-2 gap-2" data-testid="player-socials">
                {socials.map(([sid, val]) => {
                  const s = SOCIAL_PLATFORMS.find((x) => x.id === sid);
                  return <a key={sid} href={/^https?:\/\//i.test(val) ? val : `https://${val}`} target="_blank" rel="noreferrer" className="text-xs text-[#D8CA82] hover:underline"><span className="text-zinc-500 block">{s?.label || sid}</span>{val}</a>;
                })}
                {p.vodLink && <a href={p.vodLink} target="_blank" rel="noreferrer" data-testid="player-vod-link" className="text-xs text-[#D8CA82] hover:underline sm:col-span-2"><span className="text-zinc-500 block">{t("vod_link")}</span>{p.vodLink}</a>}
              </div>
            </div>
          )}
        </section>
      )}

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
