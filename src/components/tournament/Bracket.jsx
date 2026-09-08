import { useI18n } from "@/i18n";
import { standings } from "@/lib/bracket";
import { Avatar } from "@/components/common/Cards";
import { MatchCard } from "./Match";

export const EliminationBracket = ({ matches, rounds, tournament, onOpen }) => {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto pb-4" data-testid="bracket-elimination">
      <div className="flex gap-8 min-w-max">
        {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
          const list = matches.filter((m) => m.round === r).sort((a, b) => a.index - b.index);
          return (
            <div key={r} className="flex flex-col justify-around gap-4" data-testid={`bracket-round-${r}`}>
              <div className="eyebrow text-center">{r === rounds ? t("final") : r === rounds - 1 ? t("semi_final") : `${t("round")} ${r}`}</div>
              {list.map((m) => <MatchCard key={m.id} match={m} tournament={tournament} compact onOpen={onOpen} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RoundsList = ({ matches, tournament, onOpen }) => {
  const { t } = useI18n();
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  return (
    <div className="space-y-6" data-testid="bracket-rounds">
      {rounds.map((r) => (
        <div key={r}>
          <div className="section-title">{t("round")} {r}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{matches.filter((m) => m.round === r).sort((a, b) => a.index - b.index).map((m) => <MatchCard key={m.id} match={m} tournament={tournament} onOpen={onOpen} />)}</div>
        </div>
      ))}
    </div>
  );
};

export const Standings = ({ teams, matches }) => {
  const { t } = useI18n();
  const { table } = standings(teams, matches);
  return (
    <div className="card-elysium overflow-hidden" data-testid="standings-table">
      <table className="w-full text-xs">
        <thead className="bg-[#111111] text-zinc-500 uppercase tracking-wider text-[10px]"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">{t("team")}</th><th className="p-2">J</th><th className="p-2">V</th><th className="p-2">N</th><th className="p-2">D</th><th className="p-2">+/-</th><th className="p-2 text-[#D8CA82]">Pts</th></tr></thead>
        <tbody>{table.map((row, i) => (
          <tr key={row.id} data-testid={`standing-row-${row.id}`} className={`border-t border-white/5 ${i === 0 ? "bg-[#D8CA82]/5" : ""}`}>
            <td className="p-2 font-display text-[#D8CA82]">{i + 1}</td>
            <td className="p-2"><span className="flex items-center gap-2"><Avatar src={row.logo} name={row.name} size="h-6 w-6" /><span className="text-white">{row.name}</span></span></td>
            <td className="p-2 text-center text-zinc-300">{row.played}</td><td className="p-2 text-center text-emerald-400">{row.wins}</td><td className="p-2 text-center text-zinc-300">{row.draws}</td><td className="p-2 text-center text-red-400">{row.losses}</td><td className="p-2 text-center text-zinc-300">{row.diff > 0 ? `+${row.diff}` : row.diff}</td><td className="p-2 text-center font-display text-white">{row.points}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};
