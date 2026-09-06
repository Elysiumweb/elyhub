import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
const KEY = "elyhub.filters";

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(() => {
    try { return { region: "", language: "", gameId: "", ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return { region: "", language: "", gameId: "" }; }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(filters)), [filters]);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ region: "", language: "", gameId: "" });

  const apply = (items, { regionKey = "region", gameKey = "gameId", langKey = "languages" } = {}) =>
    items.filter((it) =>
      (!filters.region || it[regionKey] === filters.region) &&
      (!filters.gameId || it[gameKey] === filters.gameId) &&
      (!filters.language || !it[langKey] || (Array.isArray(it[langKey]) ? it[langKey].includes(filters.language) : it[langKey] === filters.language))
    );

  return <Ctx.Provider value={{ filters, set, reset, apply }}>{children}</Ctx.Provider>;
}
export const useFilters = () => useContext(Ctx);
