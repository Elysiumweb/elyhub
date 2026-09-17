import { Info } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";
import {
  REGIONS, LANGUAGES, LEVELS, AGE_RANGES, COUNTRIES, TIMEZONES, WEEKDAYS,
  GAME_HANDLES, SOCIAL_PLATFORMS, isMinorRange,
} from "@/lib/constants";
import { browserTimezone } from "@/lib/time";
import { scheduleToForm } from "@/lib/profile";
import { Field } from "@/components/common/States";
import { GameSelector } from "@/components/common/GameSelector";
import { RankSelect } from "@/components/common/RankSelect";
import { ImageUpload } from "@/components/common/ImageUpload";

// ─────────────────────────────────────────────────────────────────────────────
// Sections de profil partagées entre l'onboarding multi-étapes et la page
// Compte (onglet Profil). Chaque section lit/écrit l'état `f` complet via
// `patch(obj)` — l'état d'un seul formulaire, quelle que soit l'entrée.
// ─────────────────────────────────────────────────────────────────────────────

const chip = (on) =>
  `badge px-3 py-1 text-xs cursor-pointer transition-colors ${on ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10 hover:border-white/30"}`;

export const IdentityFields = ({ f, patch, testPrefix = "profile" }) => {
  const { t } = useI18n();
  const set = (k) => (e) => patch({ [k]: e.target.value });
  const toggleLang = (l) => patch({ languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] });
  return (
    <div className="space-y-6" data-testid={`${testPrefix}-identity`}>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={t("pseudo")} required>
          <input data-testid={`${testPrefix}-pseudo-input`} className="input-elysium" value={f.pseudo} onChange={set("pseudo")} maxLength={40} />
        </Field>
        <Field label={t("region")} required>
          <select data-testid={`${testPrefix}-region-select`} className="input-elysium" value={f.region} onChange={set("region")}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t("avatar")}>
        <ImageUpload value={f.avatar} onChange={(v) => patch({ avatar: v })} testId={`${testPrefix}-avatar-upload`} shape="round" />
      </Field>
      <Field label={t("languages")}>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button type="button" key={l} data-testid={`${testPrefix}-lang-${l}`} onClick={() => toggleLang(l)} className={chip(f.languages.includes(l))}>{t(`lang_${l}`)}</button>
          ))}
        </div>
      </Field>
      <Field label={t("bio")}>
        <textarea data-testid={`${testPrefix}-bio-input`} className="input-elysium" value={f.bio} onChange={set("bio")} maxLength={500} />
      </Field>
    </div>
  );
};

export const GamesFields = ({ f, patch, testPrefix = "profile" }) => {
  const { t } = useI18n();
  const { getGame } = useGames();
  return (
    <div className="space-y-6" data-testid={`${testPrefix}-games`}>
      <Field label={t("your_games")} required>
        <GameSelector multiple value={f.games} onChange={(v) => patch({ games: v, ranksByGame: Object.fromEntries((v || []).map((g) => [g, f.ranksByGame?.[g] || ""])) })} testId={`${testPrefix}-game-selector`} />
      </Field>
      <div>
        <span className="label">{t("rank_for_game")}</span>
        <p className="text-xs text-zinc-500 mb-2">{t("rank_hint")}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(f.games || []).map((gid) => (
            <div key={gid} className="flex items-center gap-2 border border-white/10 p-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D8CA82] w-24 shrink-0 truncate" title={getGame(gid)?.name}>{getGame(gid)?.name}</span>
              <div className="flex-1 [&_select]:h-9 [&_input]:h-9">
                <RankSelect gameId={gid} value={f.ranksByGame?.[gid] || ""} onChange={(v) => patch({ ranksByGame: { ...f.ranksByGame, [gid]: v } })} testId={`${testPrefix}-rank-${gid}`} allowAny />
              </div>
            </div>
          ))}
          {!(f.games || []).length && <p className="text-xs text-zinc-600">{t("err_game_required")}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={t("roles")} hint={t("roles_hint")}>
          <input data-testid={`${testPrefix}-roles-input`} className="input-elysium" value={f.roles} onChange={(e) => patch({ roles: e.target.value })} placeholder="Duelist, IGL, Support" />
        </Field>
        <Field label={t("level")} hint={t("level_hint")}>
          <select data-testid={`${testPrefix}-level-select`} className="input-elysium" value={f.level} onChange={(e) => patch({ level: e.target.value })}>
            <option value="">{t("all_levels")}</option>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`level_${l}`)}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
};

export const ContextFields = ({ f, patch, testPrefix = "profile" }) => {
  const { t } = useI18n();
  const set = (k) => (e) => patch({ [k]: e.target.value });
  const minor = f.ageRange && isMinorRange(f.ageRange);
  return (
    <div className="space-y-6" data-testid={`${testPrefix}-context`}>
      <div className="grid md:grid-cols-2 gap-6">
        <Field label={t("age_range")} hint={t("age_range_hint")} required>
          <select data-testid={`${testPrefix}-age-select`} className="input-elysium" value={f.ageRange} onChange={set("ageRange")}>
            <option value="">—</option>
            {AGE_RANGES.map((a) => <option key={a} value={a}>{t(`age_${a}`)}</option>)}
          </select>
        </Field>
        <Field label={t("country")}>
          <select data-testid={`${testPrefix}-country-select`} className="input-elysium" value={f.country} onChange={set("country")}>
            <option value="">—</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      {minor && (
        <div data-testid={`${testPrefix}-minor-notice`} className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />{t("minor_notice")}
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <Field label={t("city")}>
          <input data-testid={`${testPrefix}-city-input`} className="input-elysium" value={f.city} onChange={set("city")} maxLength={60} />
        </Field>
        <Field label={t("timezone")}>
          <select data-testid={`${testPrefix}-timezone-select`} className="input-elysium" value={f.timezone} onChange={set("timezone")}>
            {TIMEZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
};

export const AvailabilityFields = ({ f, patch, testPrefix = "profile" }) => {
  const { t } = useI18n();
  const s = f.schedule || { days: [], from: "", to: "" };
  const setS = (obj) => patch({ schedule: { ...s, ...obj } });
  const toggleDay = (d) => setS({ days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d] });
  return (
    <Field label={t("availability_schedule")} hint={t("schedule_hint")} >
      <div data-testid={`${testPrefix}-availability`} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <button type="button" key={d.id} data-testid={`${testPrefix}-day-${d.id}`} onClick={() => toggleDay(d.id)} className={chip(s.days.includes(d.id))}>{t(d.key)}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input data-testid={`${testPrefix}-avail-from`} type="time" className="input-elysium w-32" value={s.from} onChange={(e) => setS({ from: e.target.value })} title={t("time_from")} />
          <span className="text-zinc-500 text-xs">→</span>
          <input data-testid={`${testPrefix}-avail-to`} type="time" className="input-elysium w-32" value={s.to} onChange={(e) => setS({ to: e.target.value })} title={t("time_to")} />
        </div>
      </div>
    </Field>
  );
};

export const LinksFields = ({ f, patch, testPrefix = "profile" }) => {
  const { t } = useI18n();
  const setHandle = (id) => (e) => patch({ gameHandles: { ...f.gameHandles, [id]: e.target.value } });
  const setSocial = (id) => (e) => patch({ socials: { ...f.socials, [id]: e.target.value } });
  return (
    <div className="space-y-6" data-testid={`${testPrefix}-links`}>
      <div>
        <span className="label">{t("game_profiles")}</span>
        <p className="text-xs text-zinc-500 mb-2">{t("game_profiles_hint")}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {GAME_HANDLES.map((h) => (
            <div key={h.id}>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500">{h.label}</label>
              <input data-testid={`${testPrefix}-handle-${h.id}`} className="input-elysium h-9 mt-1" value={f.gameHandles?.[h.id] || ""} onChange={setHandle(h.id)} placeholder={h.placeholder} maxLength={120} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="label">{t("social_links")}</span>
        <p className="text-xs text-zinc-500 mb-2">{t("social_hint")}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SOCIAL_PLATFORMS.map((s) => (
            <div key={s.id}>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</label>
              <input data-testid={`${testPrefix}-social-${s.id}`} className="input-elysium h-9 mt-1" value={f.socials?.[s.id] || ""} onChange={setSocial(s.id)} placeholder={s.placeholder} maxLength={200} />
            </div>
          ))}
        </div>
      </div>
      <Field label={t("vod_link")} hint={t("vod_hint")}>
        <input data-testid={`${testPrefix}-vod-input`} type="url" className="input-elysium" value={f.vodLink} onChange={(e) => patch({ vodLink: e.target.value })} placeholder="https://youtube.com/watch/…" />
      </Field>
    </div>
  );
};

// Valeurs par défaut du formulaire profil (état complet des sections ci-dessus).
export const emptyProfileForm = (initial = {}) => ({
  pseudo: "",
  avatar: null,
  games: [],
  roles: "",
  region: "EU",
  languages: ["fr"],
  bio: "",
  ranksByGame: {},
  level: "",
  ageRange: "",
  country: "",
  city: "",
  timezone: browserTimezone(),
  schedule: { days: [], from: "", to: "" },
  gameHandles: {},
  socials: {},
  vodLink: "",
  visibility: { public: true, hideDirectory: false, hideRank: false },
  ...initial,
});

// État formulaire ← document profil Firestore (rôles list → chaîne,
// availabilitySchedule list → créneau UI, etc.)
export const formFromProfile = (p) => {
  if (!p) return emptyProfileForm();
  return {
    ...emptyProfileForm(),
    ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && v !== undefined)),
    roles: Array.isArray(p.roles) ? p.roles.join(", ") : p.roles || "",
    games: p.games || [],
    ranksByGame: p.ranksByGame || {},
    gameHandles: p.gameHandles || {},
    socials: p.socials || {},
    timezone: p.timezone || browserTimezone(),
    schedule: scheduleToForm(p.availabilitySchedule),
    visibility: { public: true, hideDirectory: false, hideRank: false, ...(p.visibility || {}) },
  };
};
