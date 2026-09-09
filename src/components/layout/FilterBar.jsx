import { SlidersHorizontal, X } from "lucide-react";
import { useFilters } from "@/context/FiltersContext";
import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";
import { REGIONS, LANGUAGES, COUNTRIES } from "@/lib/constants";

const Sel = ({ value, onChange, children, testId }) => (
  <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} className="select-elysium">
    {children}
  </select>
);

export const FilterBar = () => {
  const { filters, set, reset } = useFilters();
  const { games } = useGames();
  const { t } = useI18n();
  const active = filters.region || filters.language || filters.gameId || filters.country;
  const game = games.find((g) => g.id === filters.gameId);
  return (
    <div
      data-testid="filter-bar"
      className="sticky top-16 z-30 bg-[#161616] border-b border-white/10"
      style={{ boxShadow: game ? `inset 0 -2px 0 ${game.color}` : undefined }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center gap-2 overflow-x-auto">
        <SlidersHorizontal className="h-4 w-4 text-[#D8CA82] shrink-0" />
        <span className="eyebrow hidden sm:inline shrink-0">{t("filters")}</span>
        <Sel testId="filter-region" value={filters.region} onChange={(v) => set({ region: v })}>
          <option value="">{t("all_regions")}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Sel>
        <Sel testId="filter-country" value={filters.country} onChange={(v) => set({ country: v })}>
          <option value="">{t("any_country")}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </Sel>
        <Sel testId="filter-language" value={filters.language} onChange={(v) => set({ language: v })}>
          <option value="">{t("all_languages")}</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {t(`lang_${l}`)}
            </option>
          ))}
        </Sel>
        <Sel testId="filter-game" value={filters.gameId} onChange={(v) => set({ gameId: v })}>
          <option value="">{t("all_games")}</option>
          {games
            .filter((g) => g.status === "validated")
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
        </Sel>
        {game && <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: game.color }} />}
        {active && (
          <button data-testid="filter-reset" onClick={reset} className="btn-ghost text-xs shrink-0">
            <X className="h-3 w-3" />
            {t("reset")}
          </button>
        )}
      </div>
    </div>
  );
};
