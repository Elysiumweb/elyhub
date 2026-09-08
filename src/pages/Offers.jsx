import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { where } from "firebase/firestore";
import { MapPin, Calendar, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useDocument, useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { applyToOffer, createOffer, updateOffer } from "@/lib/db";
import { REGIONS } from "@/lib/constants";
import { Field, PageTitle, Skeletons } from "@/components/common/States";
import { RankSelect } from "@/components/common/RankSelect";
import { GameBadge, OfficialBadge, StatusBadge } from "@/components/common/Badges";
import { Avatar } from "@/components/common/Cards";
import NotFound from "./NotFound";
import { Seo, offerLd } from "@/components/common/Seo";
import { ConfirmButton } from "@/components/common/ConfirmButton";

export function OfferCreate() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const { getGame } = useGames();
  const nav = useNavigate();
  const { data: team } = useDocument("teams", teamId);
  const [f, setF] = useState({ role: "", rank: "", region: "EU", availability: "", description: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (!team || team.ownerId !== user.uid) throw new Error("forbidden");
      const ref = await createOffer({ ...f, role: f.role.trim() }, team, user.uid);
      toast.success(t("offer_created")); nav(`/offers/${ref.id}`);
    } catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  const g = team ? getGame(team.gameId) : null;
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("recruitment")} title={t("create_offer")}>{team && <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><span>{team.name}</span><span className="text-zinc-400">·</span><GameBadge game={g} size="lg" /></div>}</PageTitle>
      <form onSubmit={submit} className="card-elysium p-6 space-y-6" data-testid="offer-create-form">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("game")} required><div className="input-elysium flex items-center" data-testid="offer-game-display">{g ? <GameBadge game={g} /> : "…"}</div></Field>
          <Field label={t("role_wanted")} required><input data-testid="offer-role-input" required className="input-elysium" value={f.role} onChange={set("role")} placeholder="Duelist / Jungler / AWPer" /></Field>
          <Field label={t("rank_min")}><RankSelect gameId={team?.gameId} value={f.rank} onChange={(v) => setF({ ...f, rank: v })} testId="offer-rank-select" /></Field>
          <Field label={t("region")} required><select data-testid="offer-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label={t("availability")}><input data-testid="offer-availability-input" className="input-elysium" value={f.availability} onChange={set("availability")} placeholder={t("availability_placeholder")} /></Field>
        </div>
        <Field label={t("description")} hint={`${f.description.length}/2000 ${t("chars")}`}><textarea data-testid="offer-description-input" className="input-elysium" value={f.description} onChange={set("description")} maxLength={2000} /></Field>
        <button data-testid="offer-submit-button" disabled={busy || !team} className="btn-gold">{t("publish")}</button>
      </form>
    </div>
  );
}

export default function OfferDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const nav = useNavigate();
  const { data: offer, loading } = useDocument("offers", id);
  const myApps = useCollection("applications", [where("playerId", "==", user?.uid || "-"), where("offerId", "==", id)], [user?.uid, id], !!user);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Skeletons n={2} />;
  if (!offer) return <NotFound />;
  const g = getGame(offer.gameId);
  const isOwner = user?.uid === offer.ownerId;
  const applied = myApps.data[0];

  const apply = async () => {
    if (!profile) return nav("/login");
    setBusy(true);
    try { await applyToOffer(offer, profile, msg.trim()); toast.success(t("application_sent")); setMsg(""); }
    catch (e) { console.error(e); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  const close = async () => { await updateOffer(offer.id, { status: offer.status === "open" ? "closed" : "open" }); toast.success(t("saved")); };

  return (
    <div className="max-w-3xl space-y-6" data-testid="offer-detail-page">
      <Seo title={`${offer.role} — ${offer.teamName}`} description={offer.description || `${offer.teamName} ${t("recruitment").toLowerCase()} ${offer.role} (${g.name}, ${offer.region})`} image={offer.teamLogo} jsonLd={offerLd(offer, g)} noindex={offer.status !== "open"} />
      <div className={`card-elysium p-6 sm:p-8 ${offer.isOfficial ? "card-official" : ""}`} style={{ borderLeftColor: g.color, borderLeftWidth: 3 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Avatar src={offer.teamLogo} name={offer.teamName} size="h-14 w-14" />
            <div>
              <div className="eyebrow mb-1 flex items-center gap-2"><Briefcase className="h-3 w-3" />{t("recruitment")}</div>
              <h1 data-testid="offer-role" className="font-display text-2xl uppercase text-white">{offer.role}</h1>
              <Link to={`/teams/${offer.teamId}`} data-testid="offer-team-link" className="text-sm text-[#D8CA82] hover:underline">{offer.teamName}</Link>
              {offer.isOfficial && <OfficialBadge className="ml-2" />}
            </div>
          </div>
          <StatusBadge status={offer.status} />
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[[t("game"), <GameBadge game={g} />], [t("rank_min"), offer.rank || "—"], [t("region"), <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.region}</span>], [t("availability"), <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{offer.availability || "—"}</span>]].map(([k, v], i) => (
            <div key={i} className="bg-[#111111] border border-white/10 p-3"><div className="label mb-1">{k}</div><div className="text-white">{v}</div></div>
          ))}
        </div>
        {offer.description && <p className="mt-6 text-sm text-zinc-300 whitespace-pre-line">{offer.description}</p>}
        <p className="mt-4 text-xs text-zinc-400">{t("published_on")} {formatDate(offer.createdAt, true)}</p>
      </div>

      {isOwner ? (
        <div className="flex gap-2">
          <ConfirmButton testId="offer-toggle-status-button" onConfirm={close} title={offer.status === "open" ? t("close_offer") : t("reopen_offer")} className="btn-outline text-xs">{offer.status === "open" ? t("close_offer") : t("reopen_offer")}</ConfirmButton>
          <Link to={`/dashboard?team=${offer.teamId}&tab=applications`} data-testid="offer-view-applications-link" className="btn-ghost text-xs">{t("view_applications")}</Link>
        </div>
      ) : applied ? (
        <div className="card-elysium p-5 flex items-center justify-between gap-4" data-testid="offer-applied-state">
          <div><div className="text-sm text-white font-semibold">{t("you_applied")}</div><div className="text-xs text-zinc-400">{formatDate(applied.createdAt, true)}</div></div>
          <div className="flex items-center gap-3"><StatusBadge status={applied.status} /><Link to="/applications" className="text-xs text-[#D8CA82] hover:underline">{t("my_applications")}</Link></div>
        </div>
      ) : offer.status === "open" ? (
        <div className="card-elysium p-5 space-y-3">
          <h3 className="section-title">{t("apply")}</h3>
          {user ? (<>
            <textarea data-testid="apply-message-input" className="input-elysium" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("apply_placeholder")} maxLength={2000} />
            <button data-testid="apply-submit-button" onClick={apply} disabled={busy} className="btn-gold">{t("send_application")}</button>
          </>) : <Link to="/login" data-testid="apply-login-cta" className="btn-gold">{t("login_to_apply")}</Link>}
        </div>
      ) : null}
    </div>
  );
}
