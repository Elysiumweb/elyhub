import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { createTeam } from "@/lib/db";
import { REGIONS, LANGUAGES } from "@/lib/constants";
import { Field, PageTitle } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { ImageUpload } from "@/components/common/ImageUpload";

export default function TeamCreate() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", gameId: "", region: profile?.region || "EU", logo: null, description: "", languages: profile?.languages || ["fr"] });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.gameId) return toast.error(t("err_game_required"));
    setBusy(true);
    try {
      const ref = await createTeam({ ...f, name: f.name.trim(), members: [{ uid: user.uid, pseudo: profile.pseudo, avatar: profile.avatar || null, role: "Captain" }] }, user.uid);
      toast.success(t("team_created")); nav(`/teams/${ref.id}`);
    } catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("nav_teams")} title={t("create_team")} />
      <form onSubmit={submit} className="card-elysium p-6 space-y-6" data-testid="team-create-form">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label={t("team_name")} required><input data-testid="team-name-input" required maxLength={60} className="input-elysium" value={f.name} onChange={set("name")} /></Field>
          <Field label={t("region")} required><select data-testid="team-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        </div>
        <Field label={t("game")} required><GameSelector value={f.gameId} onChange={(v) => setF({ ...f, gameId: v })} testId="team-game-selector" /></Field>
        <Field label={t("logo")}><ImageUpload value={f.logo} onChange={(v) => setF({ ...f, logo: v })} testId="team-logo-upload" /></Field>
        <Field label={t("languages")}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => <button type="button" key={l} data-testid={`team-lang-${l}`} onClick={() => setF({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] })} className={`badge px-3 py-1 text-xs cursor-pointer ${f.languages.includes(l) ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10"}`}>{t(`lang_${l}`)}</button>)}
          </div>
        </Field>
        <Field label={t("description")}><textarea data-testid="team-description-input" className="input-elysium" maxLength={1000} value={f.description} onChange={set("description")} /></Field>
        <button data-testid="team-submit-button" disabled={busy} className="btn-gold">{t("create_team")}</button>
      </form>
    </div>
  );
}
