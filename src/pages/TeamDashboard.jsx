import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { where } from "firebase/firestore";
import { Plus, Trash2, Trophy, Swords, Briefcase, Users, Inbox, Eye, Check, X, Settings, Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { addTeamMember, removeTeamMember, updateApplication, updateTeam, archiveTeam, deleteTeam, findOrCreateConversation } from "@/lib/db";
import { teamGames, buildSchedule, scheduleToForm } from "@/lib/profile";
import { Avatar, OfferCard, ScrimCard, TournamentCard } from "@/components/common/Cards";
import { GameBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, PageTitle, Skeletons, Field } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LANGUAGES, REGIONS, WEEKDAYS, TEAM_TYPES } from "@/lib/constants";

const TABS = [["members", Users], ["offers", Briefcase], ["applications", Inbox], ["scrims", Swords], ["tournaments", Trophy], ["settings", Settings]];

// ─────────────────────────────────────────────────────────────────────────────
// Réglages de l'équipe (capitaine) : édition complète (dont multi-jeux),
// archivage et suppression.
// ─────────────────────────────────────────────────────────────────────────────
function TeamSettings({ team }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    setF({
      name: team.name || "",
      region: team.region || "EU",
      logo: team.logo || null,
      description: team.description || "",
      languages: team.languages || ["fr"],
      gameIds: teamGames(team),
      teamType: team.teamType || "",
      website: team.website || "",
      discord: team.discord || "",
      founded: team.founded || "",
      targetSize: team.targetSize || "",
      training: scheduleToForm(team.trainingSchedule),
    });
  }, [team.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!f) return null;
  const patch = (obj) => setF((prev) => ({ ...prev, ...obj }));
  const toggleLang = (l) => patch({ languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] });
  const toggleTrainDay = (d) => {
    const days = f.training.days.includes(d) ? f.training.days.filter((x) => x !== d) : [...f.training.days, d];
    patch({ training: { ...f.training, days } });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.gameIds.length) return toast.error(t("err_game_required"));
    setBusy(true);
    try {
      await updateTeam(team.id, {
        name: f.name.trim(),
        region: f.region,
        logo: f.logo,
        description: f.description.trim() || null,
        languages: f.languages,
        gameIds: f.gameIds, // updateTeam normalise gameId (principal) + gameIds
        teamType: f.teamType || null,
        website: f.website.trim() || null,
        discord: f.discord.trim() || null,
        founded: f.founded ? Number(f.founded) : null,
        targetSize: f.targetSize ? Number(f.targetSize) : null,
        trainingSchedule: buildSchedule(f.training),
      });
      toast.success(t("saved"));
    } catch { toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  const archived = team.status === "archived";
  const toggleArchive = async () => {
    try {
      await archiveTeam(team.id, !archived);
      toast.success(t(archived ? "team_restored" : "team_archived"));
    } catch { toast.error(t("err_generic")); }
  };

  const doDelete = async () => {
    setBusyDelete(true);
    try {
      await deleteTeam(team.id);
      toast.success(t("team_deleted"));
      nav("/teams", { replace: true });
    } catch { toast.error(t("err_generic")); setBusyDelete(false); setConfirmDelete(false); }
  };

  return (
    <div className="space-y-6" data-testid="team-settings">
      <form onSubmit={save} className="card-elysium p-5 space-y-6">
        <h3 className="section-title"><Settings className="h-3.5 w-3.5" />{t("team_settings")}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("team_name")} required>
            <input data-testid="team-settings-name-input" required maxLength={60} className="input-elysium" value={f.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label={t("region")} required>
            <select data-testid="team-settings-region-select" className="input-elysium" value={f.region} onChange={(e) => patch({ region: e.target.value })}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t("team_games")} hint={t("team_games_hint")} required>
          <GameSelector multiple value={f.gameIds} onChange={(v) => patch({ gameIds: v })} testId="team-settings-game-selector" />
        </Field>
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("logo")}>
            <ImageUpload value={f.logo} onChange={(v) => patch({ logo: v })} testId="team-settings-logo-upload" />
          </Field>
          <Field label={t("languages")}>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button type="button" key={l} onClick={() => toggleLang(l)} className={`badge px-3 py-1 text-xs cursor-pointer ${f.languages.includes(l) ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10 hover:border-white/30"}`}>{t(`lang_${l}`)}</button>
              ))}
            </div>
          </Field>
        </div>
        <Field label={t("description")}>
          <textarea data-testid="team-settings-description-input" className="input-elysium" maxLength={1000} value={f.description} onChange={(e) => patch({ description: e.target.value })} />
        </Field>
        <div className="grid md:grid-cols-3 gap-6">
          <Field label={t("team_type")}>
            <select data-testid="team-settings-type-select" className="input-elysium" value={f.teamType} onChange={(e) => patch({ teamType: e.target.value })}>
              <option value="">—</option>
              {TEAM_TYPES.map((x) => <option key={x.id} value={x.id}>{t(x.key)}</option>)}
            </select>
          </Field>
          <Field label={t("website")}>
            <input data-testid="team-settings-website-input" type="url" className="input-elysium" value={f.website} onChange={(e) => patch({ website: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label={t("discord_server")}>
            <input data-testid="team-settings-discord-input" className="input-elysium" value={f.discord} onChange={(e) => patch({ discord: e.target.value })} placeholder="discord.gg/…" />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("founder_date")}>
            <input data-testid="team-settings-founded-input" type="number" min={1990} max={2100} className="input-elysium" value={f.founded} onChange={(e) => patch({ founded: e.target.value })} placeholder="2021" />
          </Field>
          <Field label={t("target_size")}>
            <input data-testid="team-settings-size-input" type="number" min={2} max={50} className="input-elysium" value={f.targetSize} onChange={(e) => patch({ targetSize: e.target.value })} placeholder="5" />
          </Field>
        </div>
        <div>
          <span className="label">{t("training_schedule")}</span>
          <p className="text-xs text-zinc-500 mb-2">{t("training_schedule_hint")}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {WEEKDAYS.map((d) => (
              <button type="button" key={d.id} onClick={() => toggleTrainDay(d.id)} className={`badge px-3 py-1 text-xs cursor-pointer ${f.training.days.includes(d.id) ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10 hover:border-white/30"}`}>{t(d.key)}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input data-testid="team-settings-train-from" type="time" className="input-elysium w-32" value={f.training.from} onChange={(e) => patch({ training: { ...f.training, from: e.target.value } })} title={t("time_from")} />
            <span className="text-zinc-500 text-xs">→</span>
            <input data-testid="team-settings-train-to" type="time" className="input-elysium w-32" value={f.training.to} onChange={(e) => patch({ training: { ...f.training, to: e.target.value } })} title={t("time_to")} />
          </div>
        </div>
        <button data-testid="team-settings-save-button" disabled={busy} className="btn-gold">{t("save")}</button>
      </form>

      <div className="card-elysium p-5 border-red-500/40" data-testid="team-danger-zone">
        <h3 className="section-title text-red-400 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />{t("danger_zone")}</h3>
        <div className="flex flex-wrap gap-3 mt-2">
          <button data-testid="team-archive-button" onClick={toggleArchive} className="btn-outline text-xs">
            {archived ? <><ArchiveRestore className="h-4 w-4" />{t("restore_team")}</> : <><Archive className="h-4 w-4" />{t("archive_team")}</>}
          </button>
          <button data-testid="team-delete-button" onClick={() => setConfirmDelete(true)} className="btn-danger text-xs">
            <Trash2 className="h-4 w-4" />{t("delete_team")}
          </button>
        </div>
        {archived && <p className="text-xs text-zinc-500 mt-3">{t("archive_team_desc")}</p>}
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[#181818] border-red-500/40">
          <DialogHeader><DialogTitle className="font-display uppercase text-white">{t("delete_team")}</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-300">{t("delete_team_confirm")}</p>
          <DialogFooter className="flex gap-2">
            <button type="button" data-testid="team-delete-cancel" onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs">{t("cancel")}</button>
            <button type="button" data-testid="team-delete-confirm" onClick={doDelete} disabled={busyDelete} className="btn-danger text-xs">{t("delete_team")}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeamDashboard() {
  const { user, profile } = useAuth();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "members";
  const myTeams = useCollection("teams", [where("memberIds", "array-contains", user?.uid || "-")], [user?.uid], !!user);
  const owned = myTeams.data.filter((tm) => tm.ownerId === user?.uid);
  const teamId = params.get("team") || owned[0]?.id;
  const team = myTeams.data.find((x) => x.id === teamId);
  const isOwner = team?.ownerId === user?.uid;

  const offers = useCollection("offers", [where("teamId", "==", teamId || "-")], [teamId], !!teamId);
  // where("ownerId", "==", uid) est exigé par les règles Firestore : la query doit
  // démontrer elle-même le droit d'accès (un list sur `teamId` seul serait refusé).
  const apps = useCollection("applications", [where("ownerId", "==", user?.uid || "-"), where("teamId", "==", teamId || "-")], [teamId, user?.uid], !!teamId && isOwner);
  const scrims = useCollection("scrims", [], [], !!teamId);
  const tournaments = useCollection("tournaments", [where("registeredTeamIds", "array-contains", teamId || "-")], [teamId], !!teamId);
  const teamScrims = scrims.data.filter((s) => s.teamId === teamId || s.opponentTeamId === teamId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const [pal, setPal] = useState({ title: "", place: "", date: "" });
  useEffect(() => { if (!params.get("team") && owned[0]) setParams({ team: owned[0].id, tab }, { replace: true }); }, [owned, params, setParams, tab]);

  if (myTeams.loading) return <Skeletons n={3} />;
  if (myTeams.data.length === 0) return <div><PageTitle eyebrow={t("nav_dashboard")} title={t("team_dashboard")} /><EmptyState title={t("no_team_yet")} description={t("no_team_yet_desc")} action={t("create_team")} to="/teams/new" testId="empty-dashboard" /></div>;

  const decide = async (a, status) => {
    try {
      await updateApplication(a.id, { status });
      if (status === "accepted") await addTeamMember(team.id, { uid: a.playerId, pseudo: a.playerPseudo, avatar: a.playerAvatar || null, role: a.offerRole });
      toast.success(t("saved"));
    } catch { toast.error(t("err_generic")); }
  };
  const message = async (a) => {
    const cid = await findOrCreateConversation({ me: profile, other: { id: a.playerId, pseudo: a.playerPseudo, avatar: a.playerAvatar }, teamId: team.id, teamName: team.name, title: a.playerPseudo });
    nav(`/messages/${cid}`);
  };
  const addPalmares = async (e) => {
    e.preventDefault();
    await updateTeam(team.id, { palmares: [...(team.palmares || []), pal] }); setPal({ title: "", place: "", date: "" }); toast.success(t("saved"));
  };

  const visibleTabs = TABS.filter(([k]) => (k !== "settings" || isOwner) && (k !== "applications" || isOwner));

  return (
    <div>
      <PageTitle eyebrow={t("nav_dashboard")} title={t("team_dashboard")} right={<>
        <select data-testid="dashboard-team-select" className="select-elysium h-10 text-sm" value={teamId || ""} onChange={(e) => setParams({ team: e.target.value, tab })}>
          {myTeams.data.map((x) => <option key={x.id} value={x.id}>{x.name}{x.ownerId !== user.uid ? ` (${t("member")})` : ""}</option>)}
        </select>
        <Link to="/teams/new" data-testid="dashboard-create-team" className="btn-outline text-xs"><Plus className="h-4 w-4" /></Link>
      </>} />
      {team && (
        <div className="card-elysium p-4 mb-6 flex flex-wrap items-center gap-4">
          <Avatar src={team.logo} name={team.name} size="h-12 w-12" />
          <div className="flex-1">
            <Link to={`/teams/${team.id}`} data-testid="dashboard-team-link" className="font-display text-sm uppercase text-white hover:text-[#D8CA82]">{team.name}</Link>
            <div className="mt-1 flex flex-wrap gap-1.5">{teamGames(team).map((gid) => <GameBadge key={gid} game={getGame(gid)} />)}</div>
          </div>
          {isOwner && (
            <label className="flex items-center gap-3 text-xs text-zinc-300">
              <span>{t("accept_messages")}</span>
              <Switch data-testid="team-accept-messages-toggle" checked={team.acceptMessages !== false} onCheckedChange={(v) => updateTeam(team.id, { acceptMessages: v }).catch(() => toast.error(t("err_generic")))} className="data-[state=checked]:bg-[#D8CA82]" />
            </label>
          )}
        </div>
      )}
      <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
        {visibleTabs.map(([k, I]) => <button key={k} data-testid={`dashboard-tab-${k}`} onClick={() => setParams({ team: teamId, tab: k })} className={`tab-btn flex items-center gap-2 ${tab === k ? "tab-btn-active" : ""}`}><I className="h-3.5 w-3.5" />{t(`tab_${k}`)}{k === "applications" && apps.data.filter((a) => a.status === "sent").length > 0 && <span className="badge bg-[#D8CA82] text-black border-0">{apps.data.filter((a) => a.status === "sent").length}</span>}</button>)}
      </div>

      {tab === "members" && team && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-2" data-testid="dashboard-members">
            {(team.members || []).map((m) => (
              <div key={m.uid} className="card-elysium p-3 flex items-center gap-3">
                <Avatar src={m.avatar} name={m.pseudo} round />
                <div className="flex-1 min-w-0"><Link to={`/players/${m.uid}`} className="text-sm font-semibold text-white truncate block hover:text-[#D8CA82]">{m.pseudo}</Link><div className="text-[10px] uppercase tracking-wider text-[#D8CA82]">{m.role}{m.uid === team.ownerId && " · " + t("captain")}</div></div>
                {isOwner && m.uid !== team.ownerId && <button data-testid={`remove-member-${m.uid}`} onClick={() => removeTeamMember(team.id, m).catch(() => toast.error(t("err_generic")))} className="btn-ghost h-8 w-8 p-0 text-red-400"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          {isOwner && (
            <form onSubmit={addPalmares} className="card-elysium p-4 space-y-3" data-testid="palmares-form">
              <h3 className="section-title">{t("add_palmares")}</h3>
              <Field label={t("title")} required><input data-testid="palmares-title-input" required className="input-elysium" value={pal.title} onChange={(e) => setPal({ ...pal, title: e.target.value })} /></Field>
              <Field label={t("placement")}><input data-testid="palmares-place-input" className="input-elysium" value={pal.place} onChange={(e) => setPal({ ...pal, place: e.target.value })} placeholder="1st / Top 4" /></Field>
              <Field label={t("date")}><input data-testid="palmares-date-input" type="date" className="input-elysium" value={pal.date} onChange={(e) => setPal({ ...pal, date: e.target.value })} /></Field>
              <button data-testid="palmares-submit-button" className="btn-outline text-xs w-full">{t("add")}</button>
            </form>
          )}
        </div>
      )}

      {tab === "offers" && (
        <div className="space-y-4">
          {isOwner && <Link to={`/teams/${teamId}/offers/new`} data-testid="dashboard-create-offer" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("create_offer")}</Link>}
          {offers.loading ? <Skeletons n={2} /> : offers.data.length ? <div className="grid md:grid-cols-2 gap-3">{offers.data.map((o) => <OfferCard key={o.id} offer={o} />)}</div> : <EmptyState title={t("no_offers")} description={t("team_no_offers_desc")} testId="empty-dashboard-offers" />}
        </div>
      )}

      {tab === "applications" && isOwner && (
        apps.loading ? <Skeletons n={2} /> : apps.data.length === 0 ? <EmptyState title={t("no_applications")} description={t("no_applications_team_desc")} testId="empty-dashboard-applications" /> : (
          <div className="grid gap-2" data-testid="dashboard-applications">
            {[...apps.data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((a) => (
              <div key={a.id} data-testid={`application-row-${a.id}`} className="card-elysium p-4 flex flex-wrap items-center gap-4">
                <Avatar src={a.playerAvatar} name={a.playerPseudo} round />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2"><Link to={`/players/${a.playerId}`} className="text-sm font-semibold text-white hover:text-[#D8CA82]">{a.playerPseudo}</Link><span className="text-xs text-zinc-500">→ {a.offerRole}</span></div>
                  {a.message && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{a.message}</p>}
                  <p className="text-[10px] text-zinc-600 mt-1">{formatDate(a.createdAt, true)}</p>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex gap-1">
                  {a.status === "sent" && <button data-testid={`app-seen-${a.id}`} title={t("status_seen")} onClick={() => decide(a, "seen")} className="btn-ghost h-8 w-8 p-0"><Eye className="h-4 w-4" /></button>}
                  {["sent", "seen"].includes(a.status) && <><button data-testid={`app-accept-${a.id}`} onClick={() => decide(a, "accepted")} className="btn-ghost h-8 w-8 p-0 text-emerald-400"><Check className="h-4 w-4" /></button><button data-testid={`app-refuse-${a.id}`} onClick={() => decide(a, "refused")} className="btn-ghost h-8 w-8 p-0 text-red-400"><X className="h-4 w-4" /></button></>}
                  <button data-testid={`app-message-${a.id}`} onClick={() => message(a)} className="btn-outline h-8 text-xs px-2">{t("message")}</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "scrims" && (
        <div className="space-y-4">
          {isOwner && <Link to={`/scrims/new?team=${teamId}`} data-testid="dashboard-create-scrim" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("publish_scrim")}</Link>}
          {scrims.loading ? <Skeletons n={2} /> : teamScrims.length ? <div className="grid md:grid-cols-2 gap-3">{teamScrims.map((s) => <ScrimCard key={s.id} scrim={s} />)}</div> : <EmptyState title={t("no_scrims")} description={t("no_scrims_desc")} testId="empty-dashboard-scrims" />}
        </div>
      )}

      {tab === "tournaments" && (
        <div className="space-y-4">
          <Link to="/tournaments" data-testid="dashboard-browse-tournaments" className="btn-outline text-xs"><Trophy className="h-4 w-4" />{t("browse_tournaments")}</Link>
          {tournaments.loading ? <Skeletons n={2} /> : tournaments.data.length ? <div className="grid md:grid-cols-2 gap-3">{tournaments.data.map((x) => <TournamentCard key={x.id} tournament={x} />)}</div> : <EmptyState title={t("no_tournaments_registered")} description={t("no_tournaments_registered_desc")} testId="empty-dashboard-tournaments" />}
        </div>
      )}

      {tab === "settings" && isOwner && team && <TeamSettings team={team} />}
    </div>
  );
}
