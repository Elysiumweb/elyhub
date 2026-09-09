import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
const KEY = "elyhub.filters";

// Filtres globaux (region / langue / jeu / pays), persistés en localStorage.
// Sur les pages de liste, useListParams synchronise ces valeurs avec l'URL
// pour produire des liens de recherche partageables (?game=&region=&country=&level=).
export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(() => {
    try {
      return { region: "", language: "", gameId: "", country: "", ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { region: "", language: "", gameId: "", country: "" };
    }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(filters)), [filters]);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ region: "", language: "", gameId: "", country: "" });

  // `overrides` permet d'appliquer des filtres ponctuels (ex. ?game= dans l'URL)
  // sans modifier les filtres globaux persistés.
  const apply = (items, { regionKey = "region", gameKey = "gameId", langKey = "languages", countryKey = "country" } = {}, overrides = {}) => {
    const f = { ...filters, ...overrides };
    return items.filter(
      (it) =>
        (!f.region || it[regionKey] === f.region) &&
        (!f.gameId || it[gameKey] === f.gameId) &&
        (!f.country || it[countryKey] === f.country) &&
        (!f.language || !it[langKey] || (Array.isArray(it[langKey]) ? it[langKey].includes(f.language) : it[langKey] === f.language)),
    );
  };

  return <Ctx.Provider value={{ filters, set, reset, apply }}>{children}</Ctx.Provider>;
}
export const useFilters = () => useContext(Ctx);
