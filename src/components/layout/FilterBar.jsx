import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useFilters } from "@/context/FiltersContext";
import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";
import { REGIONS, LANGUAGES, LEVELS } from "@/lib/constants";

const Sel = ({ value, onChange, children, testId, label }) => (
  <select data-testid={testId} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="select-elysium">{children}</select>
);

export const FilterBar = () => {
  const { filters, set, reset, KEYS } = useFilters();
  const { games } = useGames();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const active = KEYS.some((k) => filters[k]);
  const game = games.find((g) => g.id === filters.gameId);

  // Mirror active filters into the URL so a search is shareable
  useEffect(() => {
    const next = new URLSearchParams(params);
    let changed = false;
    KEYS.forEach((k) => { const cur = next.get(k) || ""; if (cur !== (filters[k] || "")) { changed = true; filters[k] ? next.set(k, filters[k]) : next.delete(k); } });
    if (changed) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const share = () => { navigator.clipboard?.writeText(window.location.href); toast.success(t("link_copied")); };

  return (
    <div data-testid="filter-bar" className="sticky top-16 z-30 bg-[#161616] border-b border-white/10" style={{ boxShadow: game ? `inset 0 -2px 0 ${game.color}` : undefined }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center gap-2 overflow-x-auto">
        <SlidersHorizontal className="h-4 w-4 text-[#D8CA82] shrink-0" aria-hidden="true" />
        <span className="eyebrow hidden sm:inline shrink-0">{t("filters")}</span>
        <Sel testId="filter-region" label={t("region")} value={filters.region} onChange={(v) => set({ region: v })}><option value="">{t("all_regions")}</option>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</Sel>
        <Sel testId="filter-language" label={t("languages")} value={filters.language} onChange={(v) => set({ language: v })}><option value="">{t("all_languages")}</option>{LANGUAGES.map((l) => <option key={l} value={l}>{t(`lang_${l}`)}</option>)}</Sel>
        <Sel testId="filter-game" label={t("game")} value={filters.gameId} onChange={(v) => set({ gameId: v })}><option value="">{t("all_games")}</option>{games.filter((g) => g.status === "validated").map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Sel>
        <Sel testId="filter-level" label={t("level")} value={filters.level} onChange={(v) => set({ level: v })}><option value="">{t("all_levels")}</option>{LEVELS.map((l) => <option key={l} value={l}>{t(`level_${l}`)}</option>)}</Sel>
        {game && <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: game.color }} title={game.name} aria-label={game.name} role="img" />}
        {active && <button data-testid="filter-reset" onClick={reset} className="btn-ghost text-xs shrink-0"><X className="h-3 w-3" aria-hidden="true" />{t("reset")}</button>}
        {active && <button data-testid="filter-share" onClick={share} className="btn-ghost text-xs shrink-0" aria-label={t("copy_link")}><Link2 className="h-3 w-3" aria-hidden="true" /><span className="hidden sm:inline">{t("copy_link")}</span></button>}
      </div>
    </div>
  );
};
