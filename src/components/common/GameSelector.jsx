import { useMemo, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { createGame } from "@/lib/db";
import { useI18n } from "@/i18n";
import { GameBadge, PendingBadge } from "./Badges";

// Searchable game picker with inline "create game" (pending validation)
export const GameSelector = ({ value, onChange, multiple = false, allowCreate = true, testId = "game-selector" }) => {
  const { games } = useGames();
  const { user } = useAuth();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const selected = multiple ? value || [] : value ? [value] : [];

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return games.filter((g) => !s || g.name.toLowerCase().includes(s));
  }, [games, q]);
  const exact = games.some((g) => g.name.toLowerCase() === q.trim().toLowerCase());

  const toggle = (id) => {
    if (multiple) onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    else onChange(id === value ? "" : id);
  };
  const create = async () => {
    if (!user) return toast.error(t("login_required"));
    const ref = await createGame(q.trim(), user.uid);
    toast.success(t("game_created_pending"));
    toggle(ref.id);
    setQ("");
  };

  return (
    <div data-testid={testId} className="border border-white/10 bg-[#141414]">
      <div className="flex items-center gap-2 px-3 border-b border-white/10">
        <Search className="h-4 w-4 text-zinc-500" />
        <input data-testid={`${testId}-search`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_game")} className="bg-transparent h-10 flex-1 text-sm outline-none placeholder:text-zinc-600" />
      </div>
      <div className="max-h-56 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
        {list.map((g) => {
          const on = selected.includes(g.id);
          const pending = g.status === "pending";
          const mine = g.createdBy === user?.uid;
          const disabled = pending && !mine;
          return (
            <button key={g.id} type="button" disabled={disabled} data-testid={`${testId}-option-${g.id}`} onClick={() => toggle(g.id)}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 text-left text-sm border transition-colors ${on ? "border-[#D8CA82]/60 bg-[#D8CA82]/10" : "border-transparent hover:bg-white/5"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
              <GameBadge game={g} />
              <span className="flex items-center gap-2">
                {pending && <PendingBadge mine={mine} />}
                {on && <Check className="h-4 w-4 text-[#D8CA82]" />}
              </span>
            </button>
          );
        })}
        {allowCreate && q.trim().length >= 2 && !exact && (
          <button type="button" data-testid={`${testId}-create`} onClick={create} className="flex items-center gap-2 px-2.5 py-2 text-sm text-[#D8CA82] border border-dashed border-[#D8CA82]/40 hover:bg-[#D8CA82]/10 sm:col-span-2">
            <Plus className="h-4 w-4" /> {t("create_game")} « {q.trim()} »
          </button>
        )}
        {list.length === 0 && !q && <p className="text-xs text-zinc-500 p-2">{t("no_results")}</p>}
      </div>
    </div>
  );
};
