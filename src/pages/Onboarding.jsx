import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { saveProfileFull } from "@/lib/db";
import { buildProfileSave } from "@/lib/profile";
import { PageTitle } from "@/components/common/States";
import {
  IdentityFields, GamesFields, ContextFields, AvailabilityFields, LinksFields,
  formFromProfile, emptyProfileForm,
} from "@/components/profile/ProfileSections";

// Formulaire profil complet — utilisé par la page Compte (onglet Profil).
export const ProfileForm = ({ initial, onSaved, submitLabel }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [f, setF] = useState(() => formFromProfile(initial));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(formFromProfile(initial)); }, [initial]);
  const patch = (obj) => setF((prev) => ({ ...prev, ...obj }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.pseudo.trim()) return toast.error(t("err_pseudo_required"));
    if (f.games.length === 0) return toast.error(t("err_game_required"));
    setBusy(true);
    try {
      await saveProfileFull(user.uid, buildProfileSave(f, user, initial));
      toast.success(t("profile_saved")); onSaved?.();
    } catch { toast.error(t("err_generic")); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-8" data-testid="profile-form">
      <section>
        <h3 className="section-title mb-4">{t("onb_step_1")}</h3>
        <IdentityFields f={f} patch={patch} />
      </section>
      <section>
        <h3 className="section-title mb-4">{t("onb_step_2")}</h3>
        <GamesFields f={f} patch={patch} />
      </section>
      <section>
        <h3 className="section-title mb-4">{t("onb_step_3")}</h3>
        <ContextFields f={f} patch={patch} />
      </section>
      <section>
        <AvailabilityFields f={f} patch={patch} />
      </section>
      <section>
        <h3 className="section-title mb-4">{t("game_profiles")}</h3>
        <LinksFields f={f} patch={patch} />
      </section>
      <button data-testid="profile-submit-button" disabled={busy} className="btn-gold">{submitLabel || t("save")}</button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding multi-étapes : identité → jeux & rangs → disponibilités.
// Découpé pour réduire l'abandon (un seul long formulaire « Étape 1/1 » avant).
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { key: "onb_step_1", render: (f, patch) => <IdentityFields f={f} patch={patch} testPrefix="onboarding" /> },
  { key: "onb_step_2", render: (f, patch) => <GamesFields f={f} patch={patch} testPrefix="onboarding" /> },
  {
    key: "onb_step_3",
    render: (f, patch) => (
      <div className="space-y-6">
        <ContextFields f={f} patch={patch} testPrefix="onboarding" />
        <AvailabilityFields f={f} patch={patch} testPrefix="onboarding" />
      </div>
    ),
  },
];

export default function Onboarding() {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  // Si l'onboarding a été interrompu, on reprend avec les champs déjà saisis.
  const [f, setF] = useState(() => (profile && !profile.onboarded ? formFromProfile(profile) : emptyProfileForm()));
  const [busy, setBusy] = useState(false);
  const patch = (obj) => setF((prev) => ({ ...prev, ...obj }));

  useEffect(() => { if (profile?.onboarded) nav("/", { replace: true }); }, [profile, nav]);

  const validateStep = (i) => {
    if (i === 0 && !f.pseudo.trim()) { toast.error(t("err_pseudo_required")); return false; }
    if (i === 1 && f.games.length === 0) { toast.error(t("err_game_required")); return false; }
    return true;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    for (let i = 0; i < STEPS.length; i += 1) if (!validateStep(i)) { setStep(i); return; }
    if (!f.ageRange) { toast.error(t("err_age_required")); return; }
    setBusy(true);
    try {
      await saveProfileFull(user.uid, buildProfileSave(f, user, profile));
      toast.success(t("profile_saved")); nav("/", { replace: true });
    } catch { toast.error(t("err_generic")); setBusy(false); }
  };

  const last = step === STEPS.length - 1;

  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={t(`step_${step + 1}`)} title={t("onboarding_title")}><p className="text-sm text-zinc-400 mt-2">{t("onboarding_desc")}</p></PageTitle>
      <div className="card-elysium p-6">
        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-2 mb-6" data-testid="onboarding-steps">
          {STEPS.map((s, i) => (
            <button key={s.key} type="button" data-testid={`onboarding-step-${i + 1}`} onClick={() => i < step && setStep(i)}
              className={`flex-1 text-left px-3 py-2 border text-xs transition-colors ${i === step ? "border-[#D8CA82] bg-[#D8CA82]/10 text-[#D8CA82]" : i < step ? "border-white/20 text-zinc-300 hover:border-[#D8CA82]/40 cursor-pointer" : "border-white/10 text-zinc-600"}`}>
              <span className="font-display uppercase tracking-wider">{i + 1} · {t(s.key)}</span>
            </button>
          ))}
        </div>
        {STEPS[step].render(f, patch)}
        <div className="flex items-center gap-3 mt-8">
          {step > 0 && <button type="button" data-testid="onboarding-back-button" onClick={back} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" />{t("back")}</button>}
          <div className="ml-auto flex gap-2">
            {!last && <button type="button" data-testid="onboarding-next-button" onClick={next} className="btn-gold text-xs">{t("next")}<ArrowRight className="h-4 w-4" /></button>}
            {last && <button type="button" data-testid="onboarding-finish-button" onClick={finish} disabled={busy} className="btn-gold text-xs">{t("finish_onboarding")}<ArrowRight className="h-4 w-4" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
