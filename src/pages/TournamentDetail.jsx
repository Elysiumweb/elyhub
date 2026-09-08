import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { Calendar, MapPin, Trophy, Users, ScrollText, Play, Flag, GitBranch, Swords, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection, useDocument } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { registerTeamToTournament, startTournament, addMatches, finishTournament, unregisterTeamFromTournament, deleteDocById, updateTournamentStatus } from "@/lib/db";
import { useNavigate } from "react-router-dom";
import { generateSingleElim, generateRoundRobin, generateSwissRound, shuffle, standings } from "@/lib/bracket";
import { Avatar } from "@/components/common/Cards";
import { GameBadge, OfficialBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, Skeletons } from "@/components/common/States";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EliminationBracket, RoundsList, Standings } from "@/components/tournament/Bracket";
import { MatchDialog, MatchCard } from "@/components/tournament/Match";
import NotFound from "./NotFound";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { Seo, tournamentLd } from "@/components/common/Seo";
import { TournamentEdit } from "@/components/tournament/TournamentEdit";

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const tab = params.get("tab") || "info";
  const { data: tr, loading } = useDocument("tournaments", id);
  const matches = useCollection("matches", [where("tournamentId", "==", id)], [id]);
  const myTeams = useCollection("teams", [where("ownerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const memberTeams = useCollection("teams", [where("memberIds", "array-contains", user?.uid || "-")], [user?.uid], !!user);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);

  if (loading) return <Skeletons n={2} />;
  if (!tr) return <NotFound />;
  const g = getGame(tr.gameId);
  const left = tr.slots - (tr.registeredTeamIds?.length || 0);
  const status = tr.status === "cancelled" ? "cancelled" : tr.status === "finished" ? "finished" : tr.status === "ongoing" ? "ongoing" : left <= 0 ? "full" : "registration";
  const isOrg = user?.uid === tr.organizerId;
  const eligible = myTeams.data.filter((x) => x.gameId === tr.gameId && !tr.registeredTeamIds?.includes(x.id));
  const alreadyIn = memberTeams.data.filter((x) => tr.registeredTeamIds?.includes(x.id));
  const hasAnyTeam = memberTeams.data.length > 0;
  const liveMatch = activeMatch ? matches.data.find((m) => m.id === activeMatch.id) || activeMatch : null;
  const disputes = matches.data.filter((m) => m.status === "disputed");
  const allDone = matches.data.length > 0 && matches.data.every((m) => m.status === "done");
  const run = async (fn, msg) => { setBusy(true); try { await fn(); msg && toast.success(msg); } catch (e) { console.error(e); toast.error(t("err_generic")); } finally { setBusy(false); } };

  const register = () => run(async () => { const team = eligible.find((x) => x.id === (pick || eligible[0]?.id)); if (!team) return; await registerTeamToTournament(tr.id, team); setOpen(false); }, t("team_registered"));
  const start = () => run(async () => {
    const teams = shuffle(tr.registeredTeams);
    const gen = tr.format === "single_elim" ? generateSingleElim(tr.id, teams) : tr.format === "round_robin" ? generateRoundRobin(tr.id, teams) : (() => { const r = generateSwissRound(tr.id, teams, []); return { matches: r.matches, rounds: 1 }; })();
    await startTournament(tr, gen.matches, gen.rounds);
    setParams({ tab: "bracket" });
  }, t("tournament_started"));
  const nextSwiss = () => run(async () => { const r = generateSwissRound(tr.id, tr.registeredTeams, matches.data); await addMatches(tr, r.matches, r.round); }, t("round_generated"));
  const finish = () => run(async () => {
    const winner = tr.format === "single_elim" ? (() => { const f = matches.data.find((m) => m.round === tr.rounds); return [f?.teamA, f?.teamB].find((x) => x?.id === f?.winnerId) || null; })() : (() => { const s = standings(tr.registeredTeams, matches.data).table[0]; return s ? { id: s.id, name: s.name, logo: s.logo || null } : null; })();
    await finishTournament(tr.id, winner);
  }, t("tournament_finished"));

  const TABS = [["info", ScrollText], ["bracket", GitBranch], ["matches", Swords], ...(isOrg ? [["manage", Flag]] : [])];

  return (
    <div className="space-y-8" data-testid="tournament-detail-page">
      <Seo title={`${tr.name} — ${t("tournament")} ${g.name}`} description={`${t(`format_${tr.format}`)} · ${tr.region} · ${formatDate(tr.startDate)} · ${tr.slots} ${t("slots").toLowerCase()}`} jsonLd={tournamentLd(tr, g)} />
      <div className={`card-elysium relative overflow-hidden p-6 sm:p-8 ${tr.isOfficial ? "card-official" : ""}`} style={{ borderTopColor: g.color, borderTopWidth: 3 }}>
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="eyebrow mb-2 flex items-center gap-2"><Trophy className="h-3 w-3" />{t("tournament")} {tr.organizerName && `· ${t("by")} ${tr.organizerName}`}</div>
            <div className="flex items-center gap-3 flex-wrap"><h1 data-testid="tournament-name" className="font-display text-2xl sm:text-3xl uppercase text-white">{tr.name}</h1>{tr.isOfficial && <OfficialBadge />}<StatusBadge status={status} testId="tournament-status" /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <GameBadge game={g} size="lg" />
              <span className="badge border-white/10 text-zinc-300">{t(`format_${tr.format}`)}</span>
              <span className="badge border-white/10 text-zinc-300"><Calendar className="h-3 w-3" />{formatDate(tr.startDate)}{tr.endDate && ` → ${formatDate(tr.endDate)}`}</span>
              <span className="badge border-white/10 text-zinc-300"><MapPin className="h-3 w-3" />{tr.region}</span>
            </div>
            {tr.winner && <div data-testid="tournament-winner" className="mt-4 inline-flex items-center gap-3 border border-[#D8CA82] bg-[#D8CA82]/10 px-4 py-2"><Crown className="h-5 w-5 text-[#D8CA82]" /><Avatar src={tr.winner.logo} name={tr.winner.name} size="h-8 w-8" /><span className="font-display text-sm uppercase text-white">{t("winner")} : {tr.winner.name}</span></div>}
          </div>
          <div className="text-right">
            <div className="font-display text-4xl text-[#D8CA82]" data-testid="tournament-slots-left">{left}<span className="text-zinc-400 text-base">/{tr.slots}</span></div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">{t("slots_left")}</div>
            {tr.status === "registration" && (user ? (
              <div className="flex flex-col items-end gap-2">
                {alreadyIn.length > 0 && <span className="badge bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1" data-testid="tournament-already-registered">{t("registered_with")} {alreadyIn.map((x) => x.name).join(", ")}</span>}
                {alreadyIn.filter((x) => x.ownerId === user.uid).map((x) => <ConfirmButton key={x.id} testId={`unregister-team-${x.id}`} onConfirm={() => run(() => unregisterTeamFromTournament(tr.id, tr.registeredTeams.find((r) => r.id === x.id)), t("team_unregistered"))} title={t("unregister")} description={`${x.name} — ${t("unregister_desc")}`} className="btn-ghost text-xs text-red-400">{t("unregister")} · {x.name}</ConfirmButton>)}
                {left <= 0 ? (alreadyIn.length === 0 && <span className="badge bg-red-500/15 text-red-400 border-red-500/30 px-3 py-1">{t("status_full")}</span>)
                  : eligible.length ? <button data-testid="tournament-register-button" onClick={() => setOpen(true)} className="btn-gold text-xs"><Trophy className="h-4 w-4" />{t("register_team")}</button>
                    : !hasAnyTeam ? <Link to="/teams" data-testid="tournament-join-team-cta" className="btn-outline text-xs"><Users className="h-4 w-4" />{t("join_a_team")}</Link>
                      : alreadyIn.length === 0 && <span className="text-xs text-zinc-400" data-testid="tournament-not-captain">{t("only_captain_can_register")}</span>}
              </div>
            ) : <Link to="/login" data-testid="tournament-login-cta" className="btn-gold text-xs">{t("login_to_register")}</Link>)}
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10 overflow-x-auto">
        {TABS.map(([k, I]) => <button key={k} data-testid={`tournament-tab-${k}`} onClick={() => setParams({ tab: k })} className={`tab-btn flex items-center gap-2 ${tab === k ? "tab-btn-active" : ""}`}><I className="h-3.5 w-3.5" />{t(`ttab_${k}`)}{k === "manage" && disputes.length > 0 && <span className="badge bg-red-500 text-white border-0">{disputes.length}</span>}</button>)}
      </div>

      {tab === "info" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <h2 className="section-title"><ScrollText className="h-3.5 w-3.5" />{t("rules")}</h2>
            <div className="card-elysium p-5 text-sm text-zinc-300 whitespace-pre-line" data-testid="tournament-rules">{tr.rules || t("no_rules")}</div>
          </section>
          <aside>
            <h2 className="section-title"><Users className="h-3.5 w-3.5" />{t("registered_teams")} ({tr.registeredTeams?.length || 0})</h2>
            {tr.registeredTeams?.length ? <div className="space-y-2" data-testid="tournament-registered-teams">{tr.registeredTeams.map((x, i) => <Link key={x.id} to={`/teams/${x.id}`} data-testid={`registered-team-${x.id}`} className="card-elysium p-2.5 flex items-center gap-3"><span className="font-display text-xs text-[#D8CA82] w-5">{i + 1}</span><Avatar src={x.logo} name={x.name} size="h-8 w-8" /><span className="text-sm text-white truncate">{x.name}</span><span className="ml-auto text-[10px] text-zinc-400">{x.region}</span></Link>)}</div>
              : <p className="text-xs text-zinc-400" data-testid="empty-registered-teams">{t("no_registered_teams")}</p>}
          </aside>
        </div>
      )}

      {(tab === "bracket" || tab === "matches") && (
        matches.loading ? <Skeletons n={2} /> : matches.data.length === 0 ? <EmptyState icon={GitBranch} title={t("bracket_not_generated")} description={isOrg ? t("bracket_not_generated_org") : t("bracket_not_generated_desc")} testId="empty-bracket" />
          : tab === "bracket" ? (
            <div className="space-y-8">
              {tr.format === "single_elim" ? <EliminationBracket matches={matches.data} rounds={tr.rounds} tournament={tr} onOpen={setActiveMatch} /> : <Standings teams={tr.registeredTeams} matches={matches.data} />}
              {tr.format !== "single_elim" && <RoundsList matches={matches.data} tournament={tr} onOpen={setActiveMatch} />}
            </div>
          ) : <RoundsList matches={matches.data} tournament={tr} onOpen={setActiveMatch} />
      )}

      {tab === "manage" && isOrg && (
        <div className="space-y-6" data-testid="organizer-panel">
          <div className="card-elysium card-official p-5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]"><div className="font-display text-sm uppercase text-white">{t("organizer_tools")}</div><p className="text-xs text-zinc-400 mt-1">{t("organizer_tools_desc")}</p></div>
            {tr.status === "registration" && <ConfirmButton testId="delete-tournament-button" onConfirm={async () => { await deleteDocById("tournaments", tr.id); nav("/tournaments"); }} title={t("delete_tournament")} description={t("delete_tournament_desc")} className="btn-danger text-xs">{t("delete")}</ConfirmButton>}
            {tr.status !== "finished" && tr.status !== "cancelled" && <ConfirmButton testId="cancel-tournament-button" onConfirm={() => run(() => finishTournament(tr.id, null).then(() => updateTournamentStatus(tr.id, "cancelled")), t("saved"))} title={t("cancel_tournament")} description={t("cancel_tournament_desc")} className="btn-ghost text-xs text-red-400">{t("cancel_tournament")}</ConfirmButton>}
            {tr.status === "registration" && <button data-testid="start-tournament-button" onClick={start} disabled={busy || (tr.registeredTeams?.length || 0) < 2} className="btn-gold text-xs"><Play className="h-4 w-4" />{t("start_tournament")} ({tr.registeredTeams?.length || 0})</button>}
            {tr.status === "ongoing" && tr.format === "swiss" && allDone && <button data-testid="next-round-button" onClick={nextSwiss} disabled={busy} className="btn-outline text-xs">{t("generate_next_round")}</button>}
            {tr.status === "ongoing" && allDone && <button data-testid="finish-tournament-button" onClick={finish} disabled={busy} className="btn-gold text-xs"><Crown className="h-4 w-4" />{t("finish_tournament")}</button>}
          </div>
          {tr.status === "registration" && <TournamentEdit tournament={tr} />}
          <div>
            <h2 className="section-title"><Flag className="h-3.5 w-3.5" />{t("disputes")} ({disputes.length})</h2>
            {disputes.length === 0 ? <p className="text-xs text-zinc-400" data-testid="no-disputes">{t("no_disputes")}</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{disputes.map((m) => <MatchCard key={m.id} match={m} tournament={tr} onOpen={setActiveMatch} />)}</div>}
          </div>
          <div>
            <h2 className="section-title"><Swords className="h-3.5 w-3.5" />{t("all_matches")} ({matches.data.length})</h2>
            {matches.data.length ? <RoundsList matches={matches.data} tournament={tr} onOpen={setActiveMatch} /> : <p className="text-xs text-zinc-400">{t("bracket_not_generated")}</p>}
          </div>
        </div>
      )}

      <MatchDialog match={liveMatch} tournament={tr} onClose={() => setActiveMatch(null)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#181818] border-white/10 rounded-none" data-testid="register-team-dialog">
          <DialogHeader><DialogTitle className="font-display uppercase text-white">{t("choose_team_to_register")}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {eligible.map((x) => <button key={x.id} data-testid={`register-team-option-${x.id}`} onClick={() => setPick(x.id)} className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${(pick || eligible[0].id) === x.id ? "border-[#D8CA82] bg-[#D8CA82]/10" : "border-white/10 hover:border-white/30"}`}><Avatar src={x.logo} name={x.name} size="h-9 w-9" /><div><div className="text-sm text-white font-semibold">{x.name}</div><div className="text-[10px] text-zinc-400 uppercase">{x.region} · {x.memberIds?.length} {t("members")}</div></div></button>)}
          </div>
          <button data-testid="register-team-confirm" onClick={register} disabled={busy} className="btn-gold w-full">{t("confirm_registration")}</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
