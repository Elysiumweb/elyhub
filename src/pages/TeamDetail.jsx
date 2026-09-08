import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { MapPin, Users, Trophy, Briefcase, MessageSquare, Settings } from "lucide-react";
import { toast } from "sonner";
import { useDocument, useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { findOrCreateConversation, rankOfficial } from "@/lib/db";
import { Avatar, OfferCard } from "@/components/common/Cards";
import { GameBadge, OfficialBadge } from "@/components/common/Badges";
import { EmptyState, Skeletons } from "@/components/common/States";
import NotFound from "./NotFound";
import { Seo, teamLd } from "@/components/common/Seo";

export default function TeamDetail() {
  const { id } = useParams();
  const { t, formatDate } = useI18n();
  const { user, profile } = useAuth();
  const { getGame } = useGames();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data: team, loading } = useDocument("teams", id);
  const offers = useCollection("offers", [where("teamId", "==", id)], [id]);
  const myApps = useCollection("applications", [where("playerId", "==", user?.uid || "-"), where("teamId", "==", id)], [user?.uid, id], !!user);

  if (loading) return <Skeletons n={3} />;
  if (!team) return <NotFound />;
  const g = getGame(team.gameId);
  const isOwner = user?.uid === team.ownerId;
  const isMember = team.memberIds?.includes(user?.uid);
  const openOffers = rankOfficial(offers.data.filter((o) => o.status === "open"));
  const canContact = user && !isMember && (team.acceptMessages !== false || myApps.data.length > 0);

  const contact = async () => {
    setBusy(true);
    try {
      const owner = team.members?.find((m) => m.uid === team.ownerId) || { uid: team.ownerId, pseudo: team.name };
      const cid = await findOrCreateConversation({ me: profile, other: { id: team.ownerId, pseudo: owner.pseudo, avatar: team.logo }, teamId: team.id, teamName: team.name, title: team.name });
      nav(`/messages/${cid}`);
    } catch (e) { console.error(e); toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8" data-testid="team-detail-page">
      <Seo title={`${team.name} — ${g.name} ${team.region}`} description={team.description || `${team.name}, ${t("team")} ${g.name} (${team.region})`} image={team.logo} jsonLd={teamLd(team, g)} />
      <div className={`card-elysium relative overflow-hidden p-6 sm:p-8 ${team.isOfficial ? "card-official" : ""}`} style={{ borderTopColor: g.color, borderTopWidth: 3 }}>
        <div className="relative flex flex-wrap items-start gap-6">
          <Avatar src={team.logo} name={team.name} size="h-24 w-24" className="text-2xl" />
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 data-testid="team-name" className="font-display text-2xl sm:text-3xl uppercase text-white">{team.name}</h1>
              {team.isOfficial && <OfficialBadge />}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
              <GameBadge game={g} size="lg" />
              <span className="badge border-white/10 text-zinc-300"><MapPin className="h-3 w-3" />{team.region}</span>
              <span className="badge border-white/10 text-zinc-300"><Users className="h-3 w-3" aria-hidden="true" />{team.memberIds?.length || 0} {t("members")}</span>
              {team.level && <span className="badge bg-[#D8CA82] text-[#111111] border-[#D8CA82]" data-testid="team-level">{t(`level_${team.level}`)}</span>}
              {team.rank && <span className="badge border-white/10 text-zinc-200" data-testid="team-rank">{team.rank}</span>}
              {(team.languages || []).map((l) => <span key={l} className="badge border-white/10 text-zinc-400">{t(`lang_${l}`)}</span>)}
            </div>
            {team.description && <p className="mt-4 text-sm text-zinc-300 max-w-2xl whitespace-pre-line">{team.description}</p>}
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {isOwner && <Link to={`/dashboard?team=${team.id}`} data-testid="team-dashboard-button" className="btn-gold text-xs"><Settings className="h-4 w-4" />{t("nav_dashboard")}</Link>}
            {!isMember && openOffers.length > 0 && <a href="#offers" data-testid="team-apply-button" className="btn-gold text-xs"><Briefcase className="h-4 w-4" />{t("apply")}</a>}
            {canContact && <button data-testid="team-contact-button" onClick={contact} disabled={busy} className="btn-outline text-xs"><MessageSquare className="h-4 w-4" />{t("contact")}</button>}
            {!user && <Link to="/login" data-testid="team-login-cta" className="btn-outline text-xs">{t("login_to_apply")}</Link>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="section-title"><Users className="h-3.5 w-3.5" />{t("roster")}</h2>
            <div className="grid sm:grid-cols-2 gap-2" data-testid="team-roster">
              {(team.members || []).map((m) => (
                <Link key={m.uid} to={`/players/${m.uid}`} data-testid={`roster-member-${m.uid}`} className="card-elysium p-3 flex items-center gap-3">
                  <Avatar src={m.avatar} name={m.pseudo} round />
                  <div className="min-w-0"><div className="text-sm font-semibold text-white truncate">{m.pseudo}</div><div className="text-[10px] uppercase tracking-wider text-[#D8CA82]">{m.role || t("player")}{m.uid === team.ownerId && " · " + t("captain")}</div></div>
                </Link>
              ))}
            </div>
          </div>
          <div id="offers">
            <h2 className="section-title"><Briefcase className="h-3.5 w-3.5" />{t("open_offers")}</h2>
            {offers.loading ? <Skeletons n={1} className="h-20" /> : openOffers.length ? <div className="grid gap-3">{openOffers.map((o) => <OfferCard key={o.id} offer={o} />)}</div> : <EmptyState title={t("no_offers")} description={t("team_no_offers_desc")} testId="empty-team-offers" />}
          </div>
        </section>
        <aside>
          <h2 className="section-title"><Trophy className="h-3.5 w-3.5" />{t("palmares")}</h2>
          {team.palmares?.length ? (
            <ol className="relative border-l border-[#D8CA82]/30 ml-2 space-y-4" data-testid="team-palmares">
              {team.palmares.map((p, i) => (
                <li key={i} className="pl-4 relative"><span className="absolute -left-[5px] top-1.5 h-2 w-2 bg-[#D8CA82]" />
                  <div className="text-sm font-semibold text-white">{p.title}</div>
                  <div className="text-xs text-zinc-400">{p.place}{p.date && ` · ${formatDate(p.date)}`}</div></li>
              ))}
            </ol>
          ) : <p className="text-xs text-zinc-400" data-testid="empty-palmares">{t("no_palmares")}</p>}
        </aside>
      </div>
    </div>
  );
}
