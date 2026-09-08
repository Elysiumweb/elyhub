import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FiltersContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { createScrim, rankOfficial } from "@/lib/db";
import { REGIONS, SCRIM_FORMATS } from "@/lib/constants";
import { ScrimCard } from "@/components/common/Cards";
import { GameBadge } from "@/components/common/Badges";
import { RankSelect } from "@/components/common/RankSelect";
import { useGames } from "@/hooks/useGames";
import { EmptyState, Field, PageTitle, ListState } from "@/components/common/States";
import { Seo } from "@/components/common/Seo";
import { Term } from "./Static";

const STATUSES = ["all", "open", "proposed", "accepted", "played", "cancelled"];

export default function Scrims() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply, filters } = useFilters();
  const [status, setStatus] = useState("open");
  const [rank, setRank] = useState("");
  const [date, setDate] = useState("");
  const { data, loading, error } = useCollection("scrims");
  const list = rankOfficial(apply(data)).filter((s) => (status === "all" || s.status === status) && (!rank || s.rank === rank) && (!date || (s.date || "").startsWith(date)));

  return (
    <div>
      <Seo title={t("scrims_title")} description={t("scrims_seo")} />
      <PageTitle eyebrow={t("nav_scrims")} title={<Term k="scrim">{t("scrims_title")}</Term>} right={user && <Link to="/scrims/new" data-testid="create-scrim-button" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("publish_scrim")}</Link>} />
      <div className="flex flex-wrap items-center gap-2 mb-6 card-elysium p-3" data-testid="scrims-filters">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => <button key={s} data-testid={`scrims-status-${s}`} onClick={() => setStatus(s)} className={`badge px-3 py-1 text-xs cursor-pointer transition-colors ${status === s ? "bg-[#D8CA82] text-black border-[#D8CA82]" : "text-zinc-400 border-white/10 hover:border-white/30"}`}>{s === "all" ? t("all") : t(`status_${s}`)}</button>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {filters.gameId ? <div className="w-44 [&_select]:h-8 [&_select]:text-xs [&_input]:h-8 [&_input]:text-xs"><RankSelect gameId={filters.gameId} value={rank} onChange={setRank} testId="scrims-rank-filter" allowAny /></div> : <span className="text-[10px] uppercase tracking-wider text-zinc-400">{t("pick_game_for_rank")}</span>}
          <input data-testid="scrims-date-filter" type="date" className="select-elysium" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <ListState loading={loading} error={error} count={list.length} empty={<EmptyState title={t("no_scrims")} description={t("no_scrims_desc")} action={user ? t("publish_scrim") : t("login")} to={user ? "/scrims/new" : "/login"} testId="empty-scrims" />}>
        <p className="text-xs text-zinc-400 mb-3" data-testid="scrims-count">{list.length} {t("results")}</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger" data-testid="scrims-grid">{list.map((s) => <ScrimCard key={s.id} scrim={s} />)}</div>
      </ListState>
    </div>
  );
}

export function ScrimCreate() {
  const { user, profile } = useAuth();
  const { t, tz } = useI18n();
  const { getGame } = useGames();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const teams = useCollection("teams", [where("ownerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const [f, setF] = useState({ teamId: params.get("team") || "", date: "", rank: "", region: profile?.region || "EU", format: "BO3", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const teamId = f.teamId || teams.data[0]?.id;
  const team = teams.data.find((x) => x.id === teamId);
  const g = team ? getGame(team.gameId) : null;

  if (!teams.loading && teams.data.length === 0) return <div className="max-w-3xl"><PageTitle eyebrow={t("nav_scrims")} title={t("publish_scrim")} /><EmptyState title={t("no_team_yet")} description={t("scrim_need_team_desc")} action={t("create_team")} to="/teams/new" testId="empty-scrim-create" /></div>;

  const submit = async (e) => {
    e.preventDefault();
    const team = teams.data.find((x) => x.id === teamId);
    if (!team) return;
    setBusy(true);
    try { const ref = await createScrim({ ...f, teamId, date: new Date(f.date).toISOString(), tz }, team, user.uid); toast.success(t("scrim_published")); nav(`/scrims/${ref.id}`); }
    catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("nav_scrims")} title={t("publish_scrim")} />
      <form onSubmit={submit} className="card-elysium p-6 space-y-6" data-testid="scrim-create-form">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("team")} required><select data-testid="scrim-team-select" className="input-elysium" value={teamId || ""} onChange={(e) => setF({ ...f, teamId: e.target.value, rank: "" })}>{teams.data.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          <Field label={t("game")}><div className="input-elysium flex items-center" data-testid="scrim-game-display">{g ? <GameBadge game={g} /> : "…"}</div></Field>
          <Field label={t("date_time")} required><input data-testid="scrim-date-input" type="datetime-local" required min={new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)} className="input-elysium" value={f.date} onChange={set("date")} /><span className="text-xs text-zinc-400 mt-1 block">{t("timezone")}: {tz}</span></Field>
          <Field label={t("rank_wanted")}><RankSelect gameId={team?.gameId} value={f.rank} onChange={(v) => setF({ ...f, rank: v })} testId="scrim-rank-select" /></Field>
          <Field label={t("region")} required><select data-testid="scrim-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label={<Term k="BO1">{t("format")}</Term>} required><select data-testid="scrim-format-select" className="input-elysium" value={f.format} onChange={set("format")}>{SCRIM_FORMATS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label={t("notes")}><textarea data-testid="scrim-notes-input" className="input-elysium" value={f.notes} onChange={set("notes")} maxLength={1000} /></Field>
        <button data-testid="scrim-submit-button" disabled={busy || !teamId} className="btn-gold">{t("publish")}</button>
      </form>
    </div>
  );
}
