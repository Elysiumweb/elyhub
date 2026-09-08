import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { updateTournament } from "@/lib/db";
import { REGIONS, TOURNAMENT_FORMATS } from "@/lib/constants";
import { Field } from "@/components/common/States";

// Organizer edits tournament details while registrations are open
export const TournamentEdit = ({ tournament: tr }) => {
  const { t } = useI18n();
  const [f, setF] = useState({ name: tr.name, format: tr.format, startDate: tr.startDate, endDate: tr.endDate || "", region: tr.region, slots: tr.slots, rules: tr.rules || "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await updateTournament(tr.id, { ...f, name: f.name.trim(), slots: Math.max(Number(f.slots), tr.registeredTeamIds?.length || 2) }); toast.success(t("saved")); }
    catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="card-elysium p-5 space-y-4" data-testid="tournament-edit-form">
      <h3 className="section-title">{t("edit_tournament")}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label={t("tournament_name")} required><input data-testid="tedit-name" required maxLength={80} className="input-elysium" value={f.name} onChange={set("name")} /></Field>
        <Field label={t("format")} hint={t(`format_${f.format}_hint`)}><select data-testid="tedit-format" className="input-elysium" value={f.format} onChange={set("format")}>{TOURNAMENT_FORMATS.map((x) => <option key={x} value={x}>{t(`format_${x}`)}</option>)}</select></Field>
        <Field label={t("start_date")} required><input data-testid="tedit-start" type="date" required className="input-elysium" value={f.startDate} onChange={set("startDate")} /></Field>
        <Field label={t("end_date")}><input data-testid="tedit-end" type="date" min={f.startDate} className="input-elysium" value={f.endDate} onChange={set("endDate")} /></Field>
        <Field label={t("region")}><select data-testid="tedit-region" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label={t("slots")}><input data-testid="tedit-slots" type="number" min={tr.registeredTeamIds?.length || 2} max={512} className="input-elysium" value={f.slots} onChange={set("slots")} /></Field>
      </div>
      <Field label={t("rules")} hint={`${f.rules.length}/8000`}><textarea data-testid="tedit-rules" className="input-elysium min-h-[120px]" maxLength={8000} value={f.rules} onChange={set("rules")} /></Field>
      <button data-testid="tedit-save" disabled={busy} className="btn-gold text-xs">{t("save")}</button>
    </form>
  );
};
