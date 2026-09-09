import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Upload, Flag, Check, Gavel, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { reportMatch, disputeMatch, resolveMatch, createMatchConversation } from "@/lib/db";
import { fileToBase64 } from "@/lib/image";
import { Avatar } from "@/components/common/Cards";
import { StatusBadge } from "@/components/common/Badges";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/States";

const TeamRow = ({ team, score, winner, testId }) => (
  <div data-testid={testId} className={`flex items-center gap-2 px-2 py-1.5 ${winner ? "bg-[#D8CA82]/10" : ""}`}>
    {team ? <Avatar src={team.logo} name={team.name} size="h-6 w-6" /> : <div className="h-6 w-6 border border-dashed border-white/20" />}
    <span className={`text-xs truncate flex-1 ${team ? "text-white" : "text-zinc-600 italic"} ${winner ? "font-bold text-[#D8CA82]" : ""}`}>{team?.name || "TBD"}</span>
    <span className="font-display text-xs w-5 text-right text-zinc-300">{score ?? "–"}</span>
  </div>
);

export const MatchCard = ({ match: m, compact = false, onOpen }) => (
  <button type="button" data-testid={`match-card-${m.id}`} onClick={() => onOpen(m)} className={`card-elysium hoverable w-full text-left ${compact ? "w-56" : ""} ${m.status === "disputed" ? "border-red-500/50" : m.status === "ready" ? "border-[#D8CA82]/40" : ""}`}>
    <div className="flex items-center justify-between px-2 pt-1.5"><span className="text-[10px] uppercase tracking-wider text-zinc-500">R{m.round} · M{m.index + 1}{m.isBye && " · BYE"}</span><StatusBadge status={m.status} testId={`match-status-${m.id}`} /></div>
    <TeamRow team={m.teamA} score={m.scoreA} winner={m.winnerId && m.winnerId === m.teamA?.id} testId={`match-${m.id}-teamA`} />
    <div className="h-px bg-white/5 mx-2" />
    <TeamRow team={m.teamB} score={m.scoreB} winner={m.winnerId && m.winnerId === m.teamB?.id} testId={`match-${m.id}-teamB`} />
  </button>
);

export const MatchDialog = ({ match: m, tournament, onClose }) => {
  const { user, profile } = useAuth();
  const { t, formatDate } = useI18n();
  const [sa, setSa] = useState(""); const [sb, setSb] = useState(""); const [proof, setProof] = useState(null); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  if (!m) return null;
  const isOrg = user?.uid === tournament.organizerId;
  const myTeam = [m.teamA, m.teamB].find((x) => x && x.ownerId === user?.uid);
  const canAct = m.teamA && m.teamB && m.status !== "done";
  const run = async (fn, msg) => { setBusy(true); try { await fn(); msg && toast.success(msg); } catch { toast.error(t("err_generic")); } finally { setBusy(false); } };
  const openChat = () => run(async () => { const cid = m.conversationId || (await createMatchConversation(m, tournament, profile)); window.location.assign(`/messages/${cid}`); });

  return (
    <Dialog open={!!m} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#181818] border-white/10 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="match-dialog">
        <DialogHeader><DialogTitle className="font-display uppercase text-white flex items-center gap-3">{t("match")} R{m.round}·M{m.index + 1} <StatusBadge status={m.status} /></DialogTitle></DialogHeader>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
          {[m.teamA, m.teamB].map((tm, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 p-3 border ${m.winnerId && m.winnerId === tm?.id ? "border-[#D8CA82] bg-[#D8CA82]/10" : "border-white/10"} ${i === 1 ? "order-3" : ""}`}>
              <Avatar src={tm?.logo} name={tm?.name || "?"} size="h-14 w-14" />
              <span className="text-sm text-white font-semibold text-center">{tm?.name || "TBD"}</span>
              <span className="font-display text-2xl text-[#D8CA82]">{i === 0 ? m.scoreA ?? "–" : m.scoreB ?? "–"}</span>
            </div>
          ))}
          <span className="order-2 font-display text-zinc-600">VS</span>
        </div>

        {Object.entries(m.reports || {}).length > 0 && (
          <div className="space-y-2" data-testid="match-reports">
            <div className="section-title">{t("score_reports")}</div>
            {Object.entries(m.reports).map(([teamId, r]) => (
              <div key={teamId} className="border border-white/10 p-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-white font-semibold">{[m.teamA, m.teamB].find((x) => x?.id === teamId)?.name}</span>
                <span className="font-display text-[#D8CA82]">{r.scoreA} – {r.scoreB}</span>
                <span className="text-zinc-500">{formatDate(r.at, true)}</span>
                {r.proof && <a href={r.proof} target="_blank" rel="noreferrer" data-testid={`proof-link-${teamId}`} className="ml-auto inline-flex items-center gap-1 text-[#D8CA82] hover:underline"><ImageIcon className="h-3 w-3" />{t("view_proof")}</a>}
              </div>
            ))}
          </div>
        )}
        {m.dispute && <div data-testid="match-dispute-banner" className="border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2"><Flag className="h-4 w-4 shrink-0" /><span><b>{t("dispute_open")}</b> — {m.dispute.reason === "score_mismatch" ? t("dispute_score_mismatch") : m.dispute.reason} · {formatDate(m.dispute.at, true)}</span></div>}

        {canAct && m.conversationId !== undefined && (m.teamA.ownerId === user?.uid || m.teamB.ownerId === user?.uid || isOrg) && (
          <button data-testid="match-open-chat" onClick={openChat} disabled={busy} className="btn-outline text-xs w-full"><MessageSquare className="h-4 w-4" />{t("match_discussion")}</button>
        )}

        {canAct && myTeam && !isOrg && (
          <div className="border border-white/10 p-4 space-y-3" data-testid="match-report-form">
            <div className="section-title">{t("report_score")}</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={m.teamA.name}><input data-testid="report-score-a" type="number" min={0} className="input-elysium" value={sa} onChange={(e) => setSa(e.target.value)} /></Field>
              <Field label={m.teamB.name}><input data-testid="report-score-b" type="number" min={0} className="input-elysium" value={sb} onChange={(e) => setSb(e.target.value)} /></Field>
            </div>
            <div className="flex items-center gap-3">
              <label className="btn-ghost text-xs cursor-pointer"><Upload className="h-4 w-4" />{proof ? t("proof_attached") : t("attach_proof")}<input type="file" accept="image/*" className="hidden" data-testid="report-proof-input" onChange={async (e) => e.target.files[0] && setProof(await fileToBase64(e.target.files[0], 720))} /></label>
              {proof && <img src={proof} alt="" className="h-10 border border-white/10" />}
              <button data-testid="report-submit" disabled={busy || sa === "" || sb === ""} onClick={() => run(() => reportMatch(m, myTeam.id, Number(sa), Number(sb), proof, user.uid), t("score_reported"))} className="btn-gold text-xs ml-auto"><Check className="h-4 w-4" />{t("submit_score")}</button>
            </div>
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <input data-testid="dispute-reason-input" className="input-elysium h-9" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("dispute_reason_placeholder")} />
              <button data-testid="dispute-submit" disabled={busy || !reason.trim()} onClick={() => run(() => disputeMatch(m, user.uid, reason.trim()), t("dispute_sent"))} className="btn-danger text-xs h-9"><Flag className="h-4 w-4" />{t("appeal")}</button>
            </div>
          </div>
        )}

        {isOrg && m.teamA && m.teamB && (
          <div className="border border-[#D8CA82]/30 bg-[#1C1910] p-4 space-y-3" data-testid="match-organizer-panel">
            <div className="section-title"><Gavel className="h-3.5 w-3.5" />{t("organizer_decision")}</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={m.teamA.name}><input data-testid="org-score-a" type="number" min={0} className="input-elysium" value={sa} onChange={(e) => setSa(e.target.value)} /></Field>
              <Field label={m.teamB.name}><input data-testid="org-score-b" type="number" min={0} className="input-elysium" value={sb} onChange={(e) => setSb(e.target.value)} /></Field>
            </div>
            <button data-testid="org-resolve-submit" disabled={busy || sa === "" || sb === "" || sa === sb} onClick={() => run(() => resolveMatch(m, Number(sa), Number(sb), user.uid), t("match_resolved"))} className="btn-gold text-xs w-full"><Gavel className="h-4 w-4" />{t("set_result")}</button>
          </div>
        )}
        {m.status === "done" && <p className="text-xs text-zinc-500 text-center">{t("match_done_note")}{m.resolvedBy && m.resolvedBy !== "auto" && ` · ${t("resolved_by_organizer")}`}</p>}
        {tournament && <Link to={`/tournaments/${tournament.id}`} className="sr-only">{tournament.name}</Link>}
      </DialogContent>
    </Dialog>
  );
};
