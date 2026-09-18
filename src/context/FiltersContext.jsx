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
  useEffect(() => {
    // Corps de bloc : ne jamais renvoyer la valeur d'une API tiers comme
    // cleanup (React 19 l'invoquerait tel quel si ce n'est pas une fonction).
    localStorage.setItem(KEY, JSON.stringify(filters));
  }, [filters]);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ region: "", language: "", gameId: "", country: "" });

  // `overrides` permet d'appliquer des filtres ponctuels (ex. ?game= dans l'URL)
  // sans modifier les filtres globaux persistés.
  const apply = (items, { regionKey = "region", gameKey = "gameId", langKey = "languages", countryKey = "country" } = {}, overrides = {}) => {
    const f = { ...filters, ...overrides };
    // Match de jeu : champ unique (gameId) OU liste multi-jeux d'une équipe
    // (gameIds) — une équipe multijeu apparaît dans l'annuaire de chacun de ses jeux.
    const gameMatch = (it) => !f.gameId || it[gameKey] === f.gameId || (Array.isArray(it.gameIds) && it.gameIds.includes(f.gameId));
    return items.filter(
      (it) =>
        (!f.region || it[regionKey] === f.region) &&
        gameMatch(it) &&
        (!f.country || it[countryKey] === f.country) &&
        (!f.language || !it[langKey] || (Array.isArray(it[langKey]) ? it[langKey].includes(f.language) : it[langKey] === f.language)),
    );
  };

  return <Ctx.Provider value={{ filters, set, reset, apply }}>{children}</Ctx.Provider>;
}
export const useFilters = () => useContext(Ctx);
