import { createContext, useContext, useMemo } from "react";
import { useCollection } from "./useFirestore";
import { DEFAULT_GAMES, GAME_PALETTE } from "@/lib/constants";

const hashColor = (id) => GAME_PALETTE[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % GAME_PALETTE.length];
export const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Ctx = createContext(null);

// Single Firestore subscription for games, shared by every card / filter / form
export function GamesProvider({ children }) {
  const { data, loading } = useCollection("games");
  const value = useMemo(() => {
    const custom = data.filter((g) => g.status !== "rejected").map((g) => ({ ...g, color: g.color || hashColor(g.id), ranks: null, slug: slugify(g.name) }));
    const games = [...DEFAULT_GAMES.map((g) => ({ ...g, slug: slugify(g.name) })), ...custom];
    const byId = Object.fromEntries(games.map((g) => [g.id, g]));
    const bySlug = Object.fromEntries(games.map((g) => [g.slug, g]));
    return { games, byId, bySlug, loading, getGame: (id) => byId[id] || { id, name: id || "?", color: "#D8CA82", ranks: null, status: "validated", slug: id } };
  }, [data, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useGames = () => useContext(Ctx);
