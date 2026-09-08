import { useGames } from "@/hooks/useGames";
import { useI18n } from "@/i18n";

// Rank picker bound to a game: select when the game has a known ladder, free text otherwise
export const RankSelect = ({ gameId, value, onChange, testId = "rank-select", allowAny = false }) => {
  const { getGame } = useGames();
  const { t } = useI18n();
  const ranks = getGame(gameId)?.ranks;
  if (!ranks) return <input data-testid={testId} className="input-elysium" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={t("rank_placeholder")} />;
  return (
    <select data-testid={testId} className="input-elysium" value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allowAny ? t("all_ranks") : t("choose_rank")}</option>
      {ranks.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
};
