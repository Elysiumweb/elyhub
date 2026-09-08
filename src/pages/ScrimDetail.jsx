import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { Calendar, MapPin, Swords, MessageSquare, RefreshCw, Check, X, Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useDocument, useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { findOrCreateConversation, relaunchScrim, updateScrim, getTeam } from "@/lib/db";
import { Avatar } from "@/components/common/Cards";
import { GameBadge, OfficialBadge, StatusBadge } from "@/components/common/Badges";
import { Skeletons } from "@/components/common/States";
import NotFound from "./NotFound";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { Seo } from "@/components/common/Seo";
import { deleteDocById } from "@/lib/db";
import { RankSelect } from "@/components/common/RankSelect";
import { SCRIM_FORMATS } from "@/lib/constants";

const STEPS = ["open", "proposed", "accepted", "played"];

export default function ScrimDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { t, formatDate, relative, tz } = useI18n();
  const { getGame } = useGames();
  const nav = useNavigate();
  const { data: s, loading } = useDocument("scrims", id);
  const myTeams = useCollection("teams", [where("ownerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(null);

  if (loading) return <Skeletons n={2} />;
  if (!s) return <NotFound />;
  const g = getGame(s.gameId);
  const isOwner = user?.uid === s.ownerId;
  const isOpponent = user?.uid === s.opponentOwnerId;
  const involved = isOwner || isOpponent;
  const candidates = myTeams.data.filter((tm) => tm.gameId === s.gameId && tm.id !== s.teamId);
  const stepIdx = s.status === "cancelled" ? -1 : STEPS.indexOf(s.status);
  const iCancelled = s.cancelledBy === user?.uid;
  const showRelaunch = s.status === "cancelled" && involved && !iCancelled && !s.relaunched;

  const run = async (fn, msg) => { setBusy(true); try { await fn(); msg && toast.success(msg); } catch (e) { console.error(e); toast.error(t("err_generic")); } finally { setBusy(false); } };

  const propose = () => run(async () => {
    const team = candidates.find((x) => x.id === (pick || candidates[0]?.id));
    if (!team) throw new Error("no team");
    const owner = await getTeam(s.teamId);
    const cid = await findOrCreateConversation({ me: profile, other: { id: s.ownerId, pseudo: owner?.members?.find((m) => m.uid === s.ownerId)?.pseudo || s.teamName, avatar: s.teamLogo }, type: "scrim", scrimId: s.id, title: `${s.teamName} vs ${team.name}` });
    await updateScrim(s.id, { status: "proposed", opponentTeamId: team.id, opponentTeamName: team.name, opponentTeamLogo: team.logo || null, opponentOwnerId: user.uid, ownerIds: [s.ownerId, user.uid], conversationId: cid });
  }, t("scrim_proposed_ok"));
  const setStatus = (status) => run(() => updateScrim(s.id, { status, ...(status === "cancelled" ? { cancelledBy: user.uid } : {}) }), t("saved"));
  const decline = () => run(() => updateScrim(s.id, { status: "open", opponentTeamId: null, opponentTeamName: null, opponentTeamLogo: null, opponentOwnerId: null, ownerIds: [s.ownerId] }), t("saved"));
  const relaunch = () => run(() => relaunchScrim(s), t("scrim_relaunched"));

  return (
    <div className="max-w-4xl space-y-6" data-testid="scrim-detail-page">
      <Seo title={`Scrim ${g.name} — ${s.teamName}`} description={`${s.teamName} ${t("looking_for_opponent").toLowerCase()} · ${g.name} · ${s.rank || t("all_ranks")} · ${s.format} · ${formatDate(s.date, true)}`} noindex={s.status !== "open"} />
      {s.status === "cancelled" && s.relaunched && <div data-testid="scrim-relaunched-banner" className="border border-[#D8CA82]/50 bg-[#D8CA82]/10 p-3 text-sm text-[#D8CA82] flex items-center gap-2"><RefreshCw className="h-4 w-4" />{t("scrim_relaunched_banner")}</div>}
      {s.relaunchedFrom && <div data-testid="scrim-relaunched-from-banner" className="border border-white/10 bg-[#161616] p-3 text-xs text-zinc-400 flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 text-[#D8CA82]" />{t("scrim_relaunched_from")} <Link className="text-[#D8CA82] hover:underline" to={`/scrims/${s.relaunchedFrom}`}>#{s.relaunchedFrom.slice(0, 6)}</Link></div>}
      {showRelaunch && (
        <div data-testid="scrim-relaunch-prompt" className="border border-yellow-500/40 bg-yellow-500/10 p-4 flex flex-wrap items-center gap-4">
          <RefreshCw className="h-5 w-5 text-yellow-400" />
          <div className="flex-1 min-w-[200px]"><div className="text-sm font-semibold text-white">{t("relaunch_prompt_title")}</div><div className="text-xs text-zinc-400">{t("relaunch_prompt_desc")}</div></div>
          <button data-testid="scrim-relaunch-yes" onClick={relaunch} disabled={busy} className="btn-gold text-xs">{t("yes")}</button>
          <button data-testid="scrim-relaunch-no" onClick={() => run(() => updateScrim(s.id, { relaunched: true, relaunchDeclined: true }))} disabled={busy} className="btn-ghost text-xs">{t("no")}</button>
        </div>
      )}

      <div className={`card-elysium p-6 sm:p-8 ${s.isOfficial ? "card-official" : ""}`} style={{ borderLeftColor: g.color, borderLeftWidth: 3 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <Link to={`/teams/${s.teamId}`} className="flex items-center gap-3"><Avatar src={s.teamLogo} name={s.teamName} size="h-14 w-14" /><div><div className="font-display text-lg uppercase text-white hover:text-[#D8CA82]">{s.teamName}</div>{s.isOfficial && <OfficialBadge />}</div></Link>
            <Swords className="h-6 w-6 text-[#D8CA82]" />
            {s.opponentTeamId ? <Link to={`/teams/${s.opponentTeamId}`} className="flex items-center gap-3"><Avatar src={s.opponentTeamLogo} name={s.opponentTeamName} size="h-14 w-14" /><div className="font-display text-lg uppercase text-white hover:text-[#D8CA82]">{s.opponentTeamName}</div></Link>
              : <div className="h-14 px-4 border border-dashed border-white/20 grid place-items-center text-xs uppercase tracking-widest text-zinc-400" data-testid="scrim-opponent-slot">{t("looking_for_opponent")}</div>}
          </div>
          <StatusBadge status={s.status} testId="scrim-status" />
        </div>

        <ol className="mt-6 grid grid-cols-4 gap-1" data-testid="scrim-progress">
          {STEPS.map((st, i) => <li key={st} className={`h-1.5 ${i <= stepIdx ? "bg-[#D8CA82]" : s.status === "cancelled" ? "bg-red-500/40" : "bg-white/10"}`} title={t(`status_${st}`)} />)}
        </ol>
        <div className="mt-1 grid grid-cols-4 text-[10px] uppercase tracking-wider text-zinc-400">{STEPS.map((st) => <span key={st}>{t(`status_${st}`)}</span>)}</div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          {[[t("game"), <GameBadge game={g} />], [t("date_time"), <span className="flex flex-col gap-0.5"><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" />{formatDate(s.date, true)}</span>{s.tz && s.tz !== tz && <span className="text-xs text-zinc-400" data-testid="scrim-origin-tz">{formatDate(s.date, true, s.tz)}</span>}<span className="text-xs text-[#D8CA82]" data-testid="scrim-relative">{relative(s.date)}</span></span>], [t("region"), <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.region}</span>], [t("rank_wanted"), s.rank || t("all_ranks")], [t("format"), s.format]].map(([k, v], i) => (
            <div key={i} className="bg-[#111111] border border-white/10 p-3"><div className="label mb-1">{k}</div><div className="text-white">{v}</div></div>
          ))}
        </div>
        {s.notes && <p className="mt-5 text-sm text-zinc-300 whitespace-pre-line">{s.notes}</p>}
      </div>

      <div className="card-elysium p-5 space-y-4" data-testid="scrim-actions">
        <h3 className="section-title">{t("actions")}</h3>
        {!user && <Link to="/login" data-testid="scrim-login-cta" className="btn-gold text-xs">{t("login_to_propose")}</Link>}
        {user && s.status === "open" && !isOwner && (candidates.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <select data-testid="scrim-propose-team-select" className="select-elysium h-10 text-sm" value={pick || candidates[0].id} onChange={(e) => setPick(e.target.value)}>{candidates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <button data-testid="scrim-propose-button" onClick={propose} disabled={busy} className="btn-gold text-xs"><Swords className="h-4 w-4" />{t("propose_scrim")}</button>
          </div>
        ) : <p className="text-xs text-zinc-400" data-testid="scrim-no-eligible-team">{t("scrim_no_eligible_team")} <Link to="/teams/new" className="text-[#D8CA82] hover:underline">{t("create_team")}</Link></p>)}
        {user && s.status === "open" && isOwner && <div className="flex flex-wrap gap-2 items-center"><span className="text-xs text-zinc-400">{t("waiting_for_proposals")}</span><button data-testid="scrim-edit-button" onClick={() => setEdit(edit ? null : { date: s.date ? new Date(new Date(s.date).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "", rank: s.rank || "", format: s.format, notes: s.notes || "" })} className="btn-outline text-xs ml-auto">{t("edit")}</button><ConfirmButton testId="scrim-delete-button" onConfirm={async () => { await deleteDocById("scrims", s.id); nav("/scrims"); }} title={t("delete")} description={t("delete_scrim_desc")} className="btn-ghost text-xs text-red-400"><X className="h-4 w-4" aria-hidden="true" />{t("delete")}</ConfirmButton><ConfirmButton testId="scrim-cancel-button" onConfirm={() => setStatus("cancelled")} disabled={busy} title={t("cancel")} description={t("cancel_scrim_desc")} className="btn-danger text-xs"><X className="h-4 w-4" aria-hidden="true" />{t("cancel")}</ConfirmButton></div>}
        {edit && isOwner && (
          <form data-testid="scrim-edit-form" onSubmit={(e) => { e.preventDefault(); run(() => updateScrim(s.id, { ...edit, date: new Date(edit.date).toISOString(), tz }), t("saved")).then(() => setEdit(null)); }} className="grid sm:grid-cols-2 gap-3 border border-white/10 p-4">
            <label className="block"><span className="label">{t("date_time")}</span><input data-testid="scrim-edit-date" type="datetime-local" required className="input-elysium" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></label>
            <label className="block"><span className="label">{t("rank_wanted")}</span><RankSelect gameId={s.gameId} value={edit.rank} onChange={(v) => setEdit({ ...edit, rank: v })} testId="scrim-edit-rank" /></label>
            <label className="block"><span className="label">{t("format")}</span><select data-testid="scrim-edit-format" className="input-elysium" value={edit.format} onChange={(e) => setEdit({ ...edit, format: e.target.value })}>{SCRIM_FORMATS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="block"><span className="label">{t("notes")}</span><input data-testid="scrim-edit-notes" className="input-elysium" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></label>
            <button data-testid="scrim-edit-save" className="btn-gold text-xs sm:col-span-2" disabled={busy}>{t("save")}</button>
          </form>
        )}
        {s.status === "proposed" && isOwner && <div className="flex flex-wrap gap-2"><button data-testid="scrim-accept-button" onClick={() => setStatus("accepted")} disabled={busy} className="btn-gold text-xs"><Check className="h-4 w-4" />{t("accept")}</button><button data-testid="scrim-decline-button" onClick={decline} disabled={busy} className="btn-outline text-xs">{t("decline")}</button></div>}
        {s.status === "proposed" && isOpponent && <p className="text-xs text-zinc-400" data-testid="scrim-waiting-accept">{t("waiting_for_acceptance")}</p>}
        {s.status === "accepted" && involved && <div className="flex flex-wrap gap-2"><button data-testid="scrim-played-button" onClick={() => setStatus("played")} disabled={busy} className="btn-gold text-xs"><Flag className="h-4 w-4" aria-hidden="true" />{t("mark_played")}</button><ConfirmButton testId="scrim-cancel-button" onConfirm={() => setStatus("cancelled")} disabled={busy} title={t("cancel")} description={t("cancel_scrim_desc")} className="btn-danger text-xs"><X className="h-4 w-4" aria-hidden="true" />{t("cancel")}</ConfirmButton></div>}
        {involved && s.conversationId && <Link to={`/messages/${s.conversationId}`} data-testid="scrim-open-chat" className="btn-outline text-xs"><MessageSquare className="h-4 w-4" />{t("open_discussion")}</Link>}
        {s.status === "cancelled" && <p className="text-xs text-red-400" data-testid="scrim-cancelled-note">{t("scrim_cancelled_note")}</p>}
        {s.status === "played" && <p className="text-xs text-zinc-400">{t("scrim_played_note")}</p>}
      </div>
    </div>
  );
}
