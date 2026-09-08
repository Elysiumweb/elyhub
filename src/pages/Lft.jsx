import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar, MessageSquare, UserSearch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useGames } from "@/hooks/useGames";
import { createLft, updateLft, findOrCreateConversation } from "@/lib/db";
import { REGIONS } from "@/lib/constants";
import { Field, PageTitle } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { RankSelect } from "@/components/common/RankSelect";
import { Avatar } from "@/components/common/Cards";
import { GameBadge, OfficialBadge, StatusBadge } from "@/components/common/Badges";

export const LftCard = ({ lft }) => {
  const { getGame } = useGames();
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const g = getGame(lft.gameId);
  const mine = user?.uid === lft.playerId;
  const contact = async (e) => {
    e.preventDefault();
    const cid = await findOrCreateConversation({ me: profile, other: { id: lft.playerId, pseudo: lft.playerPseudo, avatar: lft.playerAvatar }, title: lft.playerPseudo });
    nav(`/messages/${cid}`);
  };
  return (
    <div data-testid={`lft-card-${lft.id}`} className={`card-elysium hoverable relative p-4 ${lft.isOfficial ? "card-official" : ""}`}>
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: lft.isOfficial ? "#D8CA82" : g.color }} />
      <div className="flex items-start gap-3">
        <Link to={`/players/${lft.playerId}`}><Avatar src={lft.playerAvatar} name={lft.playerPseudo} round size="h-12 w-12" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <UserSearch className="h-4 w-4 text-[#D8CA82]" />
            <Link to={`/players/${lft.playerId}`} className="font-display text-sm uppercase tracking-wide text-white hover:text-[#D8CA82]">{lft.playerPseudo}</Link>
            {lft.isOfficial && <OfficialBadge />}
            <StatusBadge status={lft.status} className="ml-auto" />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-400">
            <GameBadge game={g} />
            {lft.rank && <span className="badge border-white/10 text-zinc-300">{lft.rank}</span>}
            {(lft.roles || []).map((r) => <span key={r} className="badge bg-[#D8CA82]/10 text-[#D8CA82] border-[#D8CA82]/30">{r}</span>)}
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{lft.region}</span>
            {lft.availability && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{lft.availability}</span>}
          </div>
          {lft.message && <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{lft.message}</p>}
          <div className="mt-3 flex gap-2">
            {mine ? <button data-testid={`lft-toggle-${lft.id}`} onClick={() => updateLft(lft.id, { status: lft.status === "open" ? "closed" : "open" })} className="btn-ghost text-xs h-8">{lft.status === "open" ? t("close_lft") : t("reopen_lft")}</button>
              : user && lft.status === "open" && <button data-testid={`lft-contact-${lft.id}`} onClick={contact} className="btn-outline text-xs h-8"><MessageSquare className="h-3.5 w-3.5" />{t("contact")}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export function LftCreate() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [f, setF] = useState({ gameId: profile?.games?.[0] || "", rank: "", roles: (profile?.roles || []).join(", "), region: profile?.region || "EU", availability: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.gameId) return toast.error(t("err_game_required"));
    setBusy(true);
    try { await createLft({ ...f, roles: f.roles.split(",").map((s) => s.trim()).filter(Boolean) }, profile); toast.success(t("lft_published")); nav("/players?tab=lft"); }
    catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("nav_players")} title={t("create_lft")}><p className="text-sm text-zinc-400 mt-2">{t("create_lft_desc")}</p></PageTitle>
      <form onSubmit={submit} className="card-elysium p-6 space-y-6" data-testid="lft-create-form">
        <Field label={t("game")} required><GameSelector value={f.gameId} onChange={(v) => setF({ ...f, gameId: v, rank: "" })} testId="lft-game-selector" allowCreate={false} /></Field>
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("your_rank")}><RankSelect gameId={f.gameId} value={f.rank} onChange={(v) => setF({ ...f, rank: v })} testId="lft-rank-select" /></Field>
          <Field label={t("region")} required><select data-testid="lft-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label={t("roles")} hint={t("roles_hint")}><input data-testid="lft-roles-input" className="input-elysium" value={f.roles} onChange={set("roles")} /></Field>
          <Field label={t("availability")}><input data-testid="lft-availability-input" className="input-elysium" value={f.availability} onChange={set("availability")} placeholder={t("availability_placeholder")} /></Field>
        </div>
        <Field label={t("message")}><textarea data-testid="lft-message-input" className="input-elysium" value={f.message} onChange={set("message")} maxLength={1500} placeholder={t("lft_message_placeholder")} /></Field>
        <button data-testid="lft-submit-button" disabled={busy} className="btn-gold">{t("publish")}</button>
      </form>
    </div>
  );
}
