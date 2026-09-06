import { useMemo } from "react";
import { useCollection } from "./useFirestore";
import { DEFAULT_GAMES, GAME_PALETTE } from "@/lib/constants";

const hashColor = (id) => GAME_PALETTE[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % GAME_PALETTE.length];

export function useGames() {
  const { data, loading } = useCollection("games");
  const games = useMemo(() => {
    const custom = data.filter((g) => g.status !== "rejected").map((g) => ({ ...g, color: g.color || hashColor(g.id), short: g.name.slice(0, 4).toUpperCase() }));
    return [...DEFAULT_GAMES, ...custom];
  }, [data]);
  const byId = useMemo(() => Object.fromEntries(games.map((g) => [g.id, g])), [games]);
  return { games, byId, loading, getGame: (id) => byId[id] || { id, name: id || "?", color: "#D8CA82", short: "?", status: "validated" } };
}
