import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FiltersContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { createTournament, rankOfficial } from "@/lib/db";
import { REGIONS, TOURNAMENT_FORMATS } from "@/lib/constants";
import { TournamentCard } from "@/components/common/Cards";
import { EmptyState, Field, PageTitle, ListState } from "@/components/common/States";
import { Seo } from "@/components/common/Seo";
import { Term } from "./Static";
import { GameSelector } from "@/components/common/GameSelector";

const tStatus = (tr) => tr.status === "finished" ? "finished" : tr.status === "ongoing" ? "ongoing" : (tr.registeredTeamIds?.length || 0) >= tr.slots ? "full" : "registration";

export default function Tournaments() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply } = useFilters();
  const [fmt, setFmt] = useState("");
  const [st, setSt] = useState("");
  const { data, loading, error } = useCollection("tournaments");
  const list = rankOfficial(apply(data)).filter((x) => (!fmt || x.format === fmt) && (!st || tStatus(x) === st));
  return (
    <div>
      <Seo title={t("tournaments_title")} description={t("tournaments_seo")} />
      <PageTitle eyebrow={t("nav_tournaments")} title={t("tournaments_title")} right={user && <Link to="/tournaments/new" data-testid="create-tournament-button" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("create_tournament")}</Link>} />
      <div className="flex flex-wrap items-center gap-2 mb-6 card-elysium p-3" data-testid="tournaments-filters">
        <select data-testid="tournaments-format-filter" className="select-elysium" value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="">{t("all_formats")}</option>{TOURNAMENT_FORMATS.map((f) => <option key={f} value={f}>{t(`format_${f}`)}</option>)}</select>
        <select data-testid="tournaments-status-filter" className="select-elysium" value={st} onChange={(e) => setSt(e.target.value)}><option value="">{t("all_statuses")}</option>{["registration", "ongoing", "finished", "full"].map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}</select>
      </div>
      <ListState loading={loading} error={error} count={list.length} empty={<EmptyState title={t("no_tournaments")} description={t("no_tournaments_desc")} action={user ? t("create_tournament") : t("login")} to={user ? "/tournaments/new" : "/login"} testId="empty-tournaments" />}>
        <p className="text-xs text-zinc-400 mb-3" data-testid="tournaments-count">{list.length} {t("results")}</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger" data-testid="tournaments-grid">{list.map((x) => <TournamentCard key={x.id} tournament={x} />)}</div>
      </ListState>
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
          <Field label={<Term k="bracket">{t("format")}</Term>} hint={t(`format_${f.format}_hint`)} required><select data-testid="tournament-format-select" className="input-elysium" value={f.format} onChange={set("format")}>{TOURNAMENT_FORMATS.map((x) => <option key={x} value={x}>{t(`format_${x}`)}</option>)}</select></Field>
          <Field label={t("slots")} required><input data-testid="tournament-slots-input" type="number" min={2} max={512} required className="input-elysium" value={f.slots} onChange={set("slots")} /></Field>
          <Field label={t("start_date")} required><input data-testid="tournament-start-input" type="date" required min={new Date().toISOString().slice(0, 10)} className="input-elysium" value={f.startDate} onChange={set("startDate")} /></Field>
          <Field label={t("end_date")}><input data-testid="tournament-end-input" type="date" min={f.startDate || new Date().toISOString().slice(0, 10)} className="input-elysium" value={f.endDate} onChange={set("endDate")} /></Field>
          <Field label={t("region")} required><select data-testid="tournament-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        </div>
        <Field label={t("game")} required><GameSelector value={f.gameId} onChange={(v) => setF({ ...f, gameId: v })} testId="tournament-game-selector" /></Field>
        <Field label={t("rules")}><textarea data-testid="tournament-rules-input" className="input-elysium min-h-[160px]" value={f.rules} onChange={set("rules")} maxLength={8000} /></Field>
        <button data-testid="tournament-submit-button" disabled={busy} className="btn-gold">{t("create_tournament")}</button>
      </form>
    </div>
  );
}
