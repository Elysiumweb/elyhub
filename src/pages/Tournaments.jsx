import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { Plus, Calendar, MapPin, Trophy, Users, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FiltersContext";
import { useI18n } from "@/i18n";
import { useCollection, useDocument } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { createTournament, rankOfficial, registerTeamToTournament } from "@/lib/db";
import { REGIONS, TOURNAMENT_FORMATS } from "@/lib/constants";
import { Avatar, TournamentCard } from "@/components/common/Cards";
import { GameBadge, OfficialBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, Field, PageTitle, Skeletons } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotFound from "./NotFound";

const tStatus = (tr) => { const n = Date.now(), a = new Date(tr.startDate).getTime(), b = new Date(tr.endDate || tr.startDate).getTime() + 86400000; return n < a ? ((tr.registeredTeamIds?.length || 0) >= tr.slots ? "full" : "upcoming") : n > b ? "finished" : "ongoing"; };

export default function Tournaments() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply } = useFilters();
  const [fmt, setFmt] = useState("");
  const [st, setSt] = useState("");
  const { data, loading } = useCollection("tournaments");
  const list = rankOfficial(apply(data)).filter((x) => (!fmt || x.format === fmt) && (!st || tStatus(x) === st));
  return (
    <div>
      <PageTitle eyebrow={t("nav_tournaments")} title={t("tournaments_title")} right={user && <Link to="/tournaments/new" data-testid="create-tournament-button" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("create_tournament")}</Link>} />
      <div className="flex flex-wrap items-center gap-2 mb-6 card-elysium p-3" data-testid="tournaments-filters">
        <select data-testid="tournaments-format-filter" className="select-elysium" value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="">{t("all_formats")}</option>{TOURNAMENT_FORMATS.map((f) => <option key={f} value={f}>{t(`format_${f}`)}</option>)}</select>
        <select data-testid="tournaments-status-filter" className="select-elysium" value={st} onChange={(e) => setSt(e.target.value)}><option value="">{t("all_statuses")}</option>{["upcoming", "ongoing", "finished", "full"].map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}</select>
      </div>
      {loading ? <Skeletons n={4} /> : list.length === 0 ? <EmptyState title={t("no_tournaments")} description={t("no_tournaments_desc")} action={user ? t("create_tournament") : t("login")} to={user ? "/tournaments/new" : "/login"} testId="empty-tournaments" /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger" data-testid="tournaments-grid">{list.map((x) => <TournamentCard key={x.id} tournament={x} />)}</div>
      )}
    </div>
  );
}

export function TournamentCreate() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const teams = useCollection("teams", [where("ownerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const [f, setF] = useState({ name: "", gameId: "", format: "single_elim", startDate: "", endDate: "", region: profile?.region || "EU", slots: 16, rules: "", organizerTeamId: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.gameId) return toast.error(t("err_game_required"));
    setBusy(true);
    try {
      const org = teams.data.find((x) => x.id === f.organizerTeamId);
      const { organizerTeamId, ...rest } = f;
      const ref = await createTournament({ ...rest, name: f.name.trim(), slots: Number(f.slots) }, user.uid, org);
      toast.success(t("tournament_created")); nav(`/tournaments/${ref.id}`);
    } catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("nav_tournaments")} title={t("create_tournament")} />
      <form onSubmit={submit} className="card-elysium p-6 space-y-6" data-testid="tournament-create-form">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("tournament_name")} required><input data-testid="tournament-name-input" required maxLength={80} className="input-elysium" value={f.name} onChange={set("name")} /></Field>
          <Field label={t("organizer_team")}><select data-testid="tournament-organizer-select" className="input-elysium" value={f.organizerTeamId} onChange={set("organizerTeamId")}><option value="">{profile?.pseudo} ({t("individual")})</option>{teams.data.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          <Field label={t("format")} required><select data-testid="tournament-format-select" className="input-elysium" value={f.format} onChange={set("format")}>{TOURNAMENT_FORMATS.map((x) => <option key={x} value={x}>{t(`format_${x}`)}</option>)}</select></Field>
          <Field label={t("slots")} required><input data-testid="tournament-slots-input" type="number" min={2} max={512} required className="input-elysium" value={f.slots} onChange={set("slots")} /></Field>
          <Field label={t("start_date")} required><input data-testid="tournament-start-input" type="date" required className="input-elysium" value={f.startDate} onChange={set("startDate")} /></Field>
          <Field label={t("end_date")}><input data-testid="tournament-end-input" type="date" className="input-elysium" value={f.endDate} onChange={set("endDate")} /></Field>
          <Field label={t("region")} required><select data-testid="tournament-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        </div>
        <Field label={t("game")} required><GameSelector value={f.gameId} onChange={(v) => setF({ ...f, gameId: v })} testId="tournament-game-selector" /></Field>
        <Field label={t("rules")}><textarea data-testid="tournament-rules-input" className="input-elysium min-h-[160px]" value={f.rules} onChange={set("rules")} maxLength={8000} /></Field>
        <button data-testid="tournament-submit-button" disabled={busy} className="btn-gold">{t("create_tournament")}</button>
      </form>
    </div>
  );
}

export function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const { data: tr, loading } = useDocument("tournaments", id);
  const myTeams = useCollection("teams", [where("ownerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const memberTeams = useCollection("teams", [where("memberIds", "array-contains", user?.uid || "-")], [user?.uid], !!user);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Skeletons n={2} />;
  if (!tr) return <NotFound />;
  const g = getGame(tr.gameId);
  const left = tr.slots - (tr.registeredTeamIds?.length || 0);
  const status = tStatus(tr);
  const eligible = myTeams.data.filter((x) => x.gameId === tr.gameId && !tr.registeredTeamIds?.includes(x.id));
  const alreadyIn = memberTeams.data.filter((x) => tr.registeredTeamIds?.includes(x.id));
  const hasAnyTeam = memberTeams.data.length > 0;

  const register = async () => {
    const team = eligible.find((x) => x.id === (pick || eligible[0]?.id));
    if (!team) return;
    setBusy(true);
    try { await registerTeamToTournament(tr.id, team); toast.success(t("team_registered")); setOpen(false); }
    catch (e) { console.error(e); toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8" data-testid="tournament-detail-page">
      <div className={`card-elysium relative overflow-hidden p-6 sm:p-8 ${tr.isOfficial ? "card-official" : ""}`} style={{ borderTopColor: g.color, borderTopWidth: 3 }}>
        <img src="/brand/pattern.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="eyebrow mb-2 flex items-center gap-2"><Trophy className="h-3 w-3" />{t("tournament")} {tr.organizerName && `· ${t("by")} ${tr.organizerName}`}</div>
            <div className="flex items-center gap-3 flex-wrap"><h1 data-testid="tournament-name" className="font-display text-2xl sm:text-3xl uppercase text-white">{tr.name}</h1>{tr.isOfficial && <OfficialBadge />}<StatusBadge status={status} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <GameBadge game={g} size="lg" />
              <span className="badge border-white/10 text-zinc-300">{t(`format_${tr.format}`)}</span>
              <span className="badge border-white/10 text-zinc-300"><Calendar className="h-3 w-3" />{formatDate(tr.startDate)}{tr.endDate && ` → ${formatDate(tr.endDate)}`}</span>
              <span className="badge border-white/10 text-zinc-300"><MapPin className="h-3 w-3" />{tr.region}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl text-[#D8CA82]" data-testid="tournament-slots-left">{left}<span className="text-zinc-500 text-base">/{tr.slots}</span></div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">{t("slots_left")}</div>
            {user ? (
              alreadyIn.length ? <span className="badge bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1" data-testid="tournament-already-registered">{t("registered_with")} {alreadyIn.map((x) => x.name).join(", ")}</span>
                : left <= 0 ? <span className="badge bg-red-500/15 text-red-400 border-red-500/30 px-3 py-1">{t("status_full")}</span>
                  : !hasAnyTeam ? <Link to="/teams" data-testid="tournament-join-team-cta" className="btn-outline text-xs"><Users className="h-4 w-4" />{t("join_a_team")}</Link>
                    : eligible.length ? <button data-testid="tournament-register-button" onClick={() => setOpen(true)} className="btn-gold text-xs"><Trophy className="h-4 w-4" />{t("register_team")}</button>
                      : <span className="text-xs text-zinc-500" data-testid="tournament-not-captain">{t("only_captain_can_register")}</span>
            ) : <Link to="/login" data-testid="tournament-login-cta" className="btn-gold text-xs">{t("login_to_register")}</Link>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <h2 className="section-title"><ScrollText className="h-3.5 w-3.5" />{t("rules")}</h2>
          <div className="card-elysium p-5 text-sm text-zinc-300 whitespace-pre-line" data-testid="tournament-rules">{tr.rules || t("no_rules")}</div>
        </section>
        <aside>
          <h2 className="section-title"><Users className="h-3.5 w-3.5" />{t("registered_teams")} ({tr.registeredTeams?.length || 0})</h2>
          {tr.registeredTeams?.length ? (
            <div className="space-y-2" data-testid="tournament-registered-teams">
              {tr.registeredTeams.map((x, i) => <Link key={x.id} to={`/teams/${x.id}`} data-testid={`registered-team-${x.id}`} className="card-elysium p-2.5 flex items-center gap-3"><span className="font-display text-xs text-[#D8CA82] w-5">{i + 1}</span><Avatar src={x.logo} name={x.name} size="h-8 w-8" /><span className="text-sm text-white truncate">{x.name}</span><span className="ml-auto text-[10px] text-zinc-500">{x.region}</span></Link>)}
            </div>
          ) : <p className="text-xs text-zinc-500" data-testid="empty-registered-teams">{t("no_registered_teams")}</p>}
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#181818] border-white/10 rounded-none" data-testid="register-team-dialog">
          <DialogHeader><DialogTitle className="font-display uppercase text-white">{t("choose_team_to_register")}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {eligible.map((x) => <button key={x.id} data-testid={`register-team-option-${x.id}`} onClick={() => setPick(x.id)} className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${(pick || eligible[0].id) === x.id ? "border-[#D8CA82] bg-[#D8CA82]/10" : "border-white/10 hover:border-white/30"}`}><Avatar src={x.logo} name={x.name} size="h-9 w-9" /><div><div className="text-sm text-white font-semibold">{x.name}</div><div className="text-[10px] text-zinc-500 uppercase">{x.region} · {x.memberIds?.length} {t("members")}</div></div></button>)}
          </div>
          <button data-testid="register-team-confirm" onClick={register} disabled={busy} className="btn-gold w-full">{t("confirm_registration")}</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
