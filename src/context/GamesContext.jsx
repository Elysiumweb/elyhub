import { createContext, useContext, useMemo } from "react";
import { useCollection } from "@/hooks/useFirestore";
import { DEFAULT_GAMES, GAME_PALETTE } from "@/lib/constants";

// Un seul abonnement Firestore pour la collection `games`, partagé par toutes les
// cartes, filtres et formulaires (avant : un onSnapshot par appel de useGames).
const Ctx = createContext(null);

const hashColor = (id) => GAME_PALETTE[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % GAME_PALETTE.length];

export function GamesProvider({ children }) {
  const { data, loading } = useCollection("games");
  const value = useMemo(() => {
    const custom = data
      .filter((g) => g.status !== "rejected")
      .map((g) => ({ ...g, color: g.color || hashColor(g.id), ranks: null }));
    const games = [...DEFAULT_GAMES, ...custom];
    const byId = Object.fromEntries(games.map((g) => [g.id, g]));
    const getGame = (id) => byId[id] || { id, name: id || "?", color: "#D8CA82", ranks: null, status: "validated" };
    return { games, byId, loading, getGame };
  }, [data, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useGamesContext = () => useContext(Ctx);
