import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Swords, Trophy, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";

const TOUR_KEY = "elyhub.tour.done";

const STEPS = [
  { icon: Users, title: "tour_1_title", desc: "tour_1_desc", to: "/teams", cta: "browse_teams" },
  { icon: Swords, title: "tour_2_title", desc: "tour_2_desc", to: "/scrims", cta: "find_scrim" },
  { icon: Trophy, title: "tour_3_title", desc: "tour_3_desc", to: "/tournaments", cta: "browse_tournaments" },
];

// Visite guidée du premier lancement (onboarding produit) : 3 étapes clés
// mettant en avant la recherche d'équipe, le scrim et le tournoi.
export default function OnboardingTour() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!user || !profile?.onboarded) return;
    let done = false;
    try {
      done = localStorage.getItem(TOUR_KEY) === "1";
    } catch {
      done = true;
    }
    if (!done) setStep(0);
  }, [user, profile]);

  const close = (finish = true) => {
    setStep(-1);
    if (finish) {
      try {
        localStorage.setItem(TOUR_KEY, "1");
      } catch {
        /* stockage indisponible */
      }
    }
  };

  if (step < 0) return null;
  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div data-testid="onboarding-tour" className="fixed bottom-20 right-4 z-40 w-80 border border-[#D8CA82]/40 bg-[#181818] p-5 shadow-2xl">
      <button type="button" data-testid="tour-close" onClick={() => close(false)} className="absolute right-3 top-3 text-zinc-500 hover:text-white" aria-label={t("tour_skip")}>
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30 shrink-0">
          <Icon className="h-5 w-5 text-[#D8CA82]" />
        </div>
        <div>
          <div className="eyebrow">
            {t("tour_title")} · {step + 1}/3
          </div>
          <h3 className="font-display text-sm uppercase text-white">{t(s.title)}</h3>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{t(s.desc)}</p>
      <div className="mt-4 flex items-center gap-2">
        <Link to={s.to} data-testid="tour-cta" onClick={() => close()} className="btn-gold text-xs flex-1 justify-center">
          {t(s.cta)}
        </Link>
        {step < STEPS.length - 1 ? (
          <button type="button" data-testid="tour-next" onClick={() => setStep(step + 1)} className="btn-outline text-xs">
            {t("tour_next")}
          </button>
        ) : (
          <button type="button" data-testid="tour-done" onClick={() => close()} className="btn-outline text-xs">
            {t("tour_done")}
          </button>
        )}
      </div>
    </div>
  );
}
