import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
const KEY = "elyhub.filters";
const KEYS = ["region", "language", "gameId", "level"];
const EMPTY = { region: "", language: "", gameId: "", level: "" };

// Filters: URL query (?region=EU&language=fr&gameId=valorant&level=pro) wins, then localStorage
export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(() => {
    const fromUrl = Object.fromEntries(new URLSearchParams(window.location.search));
    const urlPart = Object.fromEntries(KEYS.filter((k) => fromUrl[k]).map((k) => [k, fromUrl[k]]));
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}"), ...urlPart }; } catch { return { ...EMPTY, ...urlPart }; }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(filters)), [filters]);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(EMPTY);

  const apply = (items, { regionKey = "region", gameKey = "gameId", langKey = "languages", levelKey = "level" } = {}) =>
    items.filter((it) =>
      (!filters.region || it[regionKey] === filters.region) &&
      (!filters.gameId || it[gameKey] === filters.gameId) &&
      (!filters.level || !it[levelKey] || it[levelKey] === filters.level) &&
      (!filters.language || !it[langKey] || (Array.isArray(it[langKey]) ? it[langKey].includes(filters.language) : it[langKey] === filters.language))
    );

  return <Ctx.Provider value={{ filters, set, reset, apply, KEYS }}>{children}</Ctx.Provider>;
}
export const useFilters = () => useContext(Ctx);
