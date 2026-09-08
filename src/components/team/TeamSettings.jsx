import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { updateTeam, deleteDocById } from "@/lib/db";
import { REGIONS, LANGUAGES, LEVELS } from "@/lib/constants";
import { Field } from "@/components/common/States";
import { ImageUpload } from "@/components/common/ImageUpload";
import { RankSelect } from "@/components/common/RankSelect";
import { ConfirmButton } from "@/components/common/ConfirmButton";

// Owner-only team settings: edit identity, transfer captaincy, delete
export const TeamSettings = ({ team }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: team.name, logo: team.logo || null, description: team.description || "", region: team.region, languages: team.languages || [], level: team.level || "amateur", rank: team.rank || "" });
  const [newOwner, setNewOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const others = (team.members || []).filter((m) => m.uid !== team.ownerId);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await updateTeam(team.id, { ...f, name: f.name.trim() }); toast.success(t("saved")); } catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };
  const transfer = async () => {
    const m = others.find((x) => x.uid === newOwner); if (!m) return;
    const members = team.members.map((x) => ({ ...x, role: x.uid === m.uid ? "Captain" : x.uid === user.uid ? t("player") : x.role }));
    try { await updateTeam(team.id, { ownerId: m.uid, members }); toast.success(t("captaincy_transferred")); } catch (err) { console.error(err); toast.error(t("err_generic")); }
  };
  const remove = async () => { try { await deleteDocById("teams", team.id); toast.success(t("team_deleted")); nav("/dashboard"); } catch (err) { console.error(err); toast.error(t("err_generic")); } };

  return (
    <div className="grid lg:grid-cols-3 gap-6" data-testid="team-settings">
      <form onSubmit={save} className="lg:col-span-2 card-elysium p-5 space-y-5">
        <h3 className="section-title">{t("edit_team")}</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label={t("team_name")} required><input data-testid="settings-name-input" required maxLength={60} className="input-elysium" value={f.name} onChange={set("name")} /></Field>
          <Field label={t("region")} required><select data-testid="settings-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label={t("level")}><select data-testid="settings-level-select" className="input-elysium" value={f.level} onChange={set("level")}>{LEVELS.map((l) => <option key={l} value={l}>{t(`level_${l}`)}</option>)}</select></Field>
          <Field label={t("team_rank")}><RankSelect gameId={team.gameId} value={f.rank} onChange={(v) => setF({ ...f, rank: v })} testId="settings-rank-select" /></Field>
        </div>
        <Field label={t("logo")}><ImageUpload value={f.logo} onChange={(v) => setF({ ...f, logo: v })} testId="settings-logo-upload" /></Field>
        <Field label={t("languages")}><div className="flex flex-wrap gap-2">{LANGUAGES.map((l) => <button type="button" key={l} data-testid={`settings-lang-${l}`} aria-pressed={f.languages.includes(l)} onClick={() => setF({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] })} className={`badge px-3 py-1 text-xs cursor-pointer ${f.languages.includes(l) ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-300 border-white/10"}`}>{t(`lang_${l}`)}</button>)}</div></Field>
        <Field label={t("description")} hint={`${f.description.length}/1000`}><textarea data-testid="settings-description-input" className="input-elysium" maxLength={1000} value={f.description} onChange={set("description")} /></Field>
        <button data-testid="settings-save-button" disabled={busy} className="btn-gold">{t("save")}</button>
      </form>
      <div className="space-y-4">
        <div className="card-elysium p-5 space-y-3">
          <h3 className="section-title"><Crown className="h-3.5 w-3.5" aria-hidden="true" />{t("transfer_captaincy")}</h3>
          {others.length === 0 ? <p className="text-xs text-zinc-400">{t("no_other_members")}</p> : (<>
            <select data-testid="transfer-owner-select" aria-label={t("transfer_captaincy")} className="input-elysium" value={newOwner} onChange={(e) => setNewOwner(e.target.value)}><option value="">—</option>{others.map((m) => <option key={m.uid} value={m.uid}>{m.pseudo}</option>)}</select>
            <ConfirmButton testId="transfer-owner-button" disabled={!newOwner} onConfirm={transfer} title={t("transfer_captaincy")} description={t("transfer_desc")} className="btn-outline text-xs w-full">{t("transfer")}</ConfirmButton>
          </>)}
        </div>
        <div className="card-elysium p-5 border-red-500/30">
          <h3 className="section-title text-red-400">{t("danger_zone")}</h3>
          <ConfirmButton testId="delete-team-button" onConfirm={remove} title={t("delete_team")} description={t("delete_team_desc")} className="btn-danger text-xs w-full"><Trash2 className="h-4 w-4" aria-hidden="true" />{t("delete_team")}</ConfirmButton>
        </div>
      </div>
    </div>
  );
};
