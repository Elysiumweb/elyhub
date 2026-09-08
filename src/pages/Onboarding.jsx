import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { saveProfile } from "@/lib/db";
import { REGIONS, LANGUAGES, LEVELS } from "@/lib/constants";
import { RankSelect } from "@/components/common/RankSelect";
import { useGames } from "@/hooks/useGames";
import { Field, PageTitle } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { ImageUpload } from "@/components/common/ImageUpload";

export const ProfileForm = ({ initial, onSaved, submitLabel }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { getGame } = useGames();
  const [f, setF] = useState({ pseudo: "", avatar: null, games: [], ranks: {}, level: "amateur", hidden: false, roles: "", region: "EU", languages: ["fr"], bio: "", ...initial });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (initial) setF((p) => ({ ...p, ...initial, roles: Array.isArray(initial.roles) ? initial.roles.join(", ") : initial.roles || "" })); }, [initial]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleLang = (l) => setF({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.pseudo.trim()) return toast.error(t("err_pseudo_required"));
    if (f.games.length === 0) return toast.error(t("err_game_required"));
    setBusy(true);
    try {
      await saveProfile(user.uid, { ...f, pseudo: f.pseudo.trim(), roles: f.roles.split(",").map((s) => s.trim()).filter(Boolean), email: user.email, onboarded: true, createdAt: initial?.createdAt || Date.now() });
      toast.success(t("profile_saved")); onSaved?.();
    } catch (err) { console.error(err); toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="profile-form">
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={t("pseudo")} required><input data-testid="profile-pseudo-input" className="input-elysium" value={f.pseudo} onChange={set("pseudo")} maxLength={40} /></Field>
        <Field label={t("region")} required>
          <select data-testid="profile-region-select" className="input-elysium" value={f.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        </Field>
      </div>
      <Field label={t("avatar")}><ImageUpload value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} testId="profile-avatar-upload" shape="round" /></Field>
      <Field label={t("your_games")} required><GameSelector multiple value={f.games} onChange={(v) => setF({ ...f, games: v })} testId="profile-game-selector" /></Field>
      {f.games.length > 0 && <Field label={t("your_rank")} hint={t("rank_per_game_hint")}>
        <div className="grid sm:grid-cols-2 gap-3" data-testid="profile-ranks">
          {f.games.map((gid) => <div key={gid} className="flex items-center gap-2"><span className="text-xs text-zinc-200 w-32 truncate">{getGame(gid).name}</span><div className="flex-1"><RankSelect gameId={gid} value={f.ranks?.[gid] || ""} onChange={(v) => setF({ ...f, ranks: { ...(f.ranks || {}), [gid]: v } })} testId={`profile-rank-${gid}`} /></div></div>)}
        </div>
      </Field>}
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={t("level")} hint={t("level_hint")}><select data-testid="profile-level-select" className="input-elysium" value={f.level || "amateur"} onChange={set("level")}>{LEVELS.map((l) => <option key={l} value={l}>{t(`level_${l}`)}</option>)}</select></Field>
        <label className="flex items-center gap-3 mt-7 text-sm text-zinc-200 cursor-pointer"><input data-testid="profile-hidden-checkbox" type="checkbox" checked={!!f.hidden} onChange={(e) => setF({ ...f, hidden: e.target.checked })} className="accent-[#D8CA82] h-4 w-4" />{t("hide_from_directory")}</label>
      </div>
      <Field label={t("roles")} hint={t("roles_hint")}><input data-testid="profile-roles-input" className="input-elysium" value={f.roles} onChange={set("roles")} placeholder="Duelist, IGL, Support" /></Field>
      <Field label={t("languages")}>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button type="button" key={l} data-testid={`profile-lang-${l}`} onClick={() => toggleLang(l)} className={`badge px-3 py-1 text-xs cursor-pointer transition-colors ${f.languages.includes(l) ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10 hover:border-white/30"}`}>{t(`lang_${l}`)}</button>
          ))}
        </div>
      </Field>
      <Field label={t("bio")} hint={`${(f.bio || "").length}/500 ${t("chars")}`}><textarea data-testid="profile-bio-input" className="input-elysium" value={f.bio} onChange={set("bio")} maxLength={500} /></Field>
      <button data-testid="profile-submit-button" disabled={busy} className="btn-gold">{submitLabel || t("save")}</button>
    </form>
  );
};

export default function Onboarding() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const { t } = useI18n();
  useEffect(() => { if (profile?.onboarded) nav("/", { replace: true }); }, [profile, nav]);
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t("nav_account")} title={t("onboarding_title")}><p className="text-sm text-zinc-400 mt-2">{t("onboarding_desc")}</p></PageTitle>
      <div className="card-elysium p-6"><ProfileForm submitLabel={t("finish_onboarding")} onSaved={() => nav("/")} /></div>
    </div>
  );
}
