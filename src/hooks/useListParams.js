import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useFilters } from "@/context/FiltersContext";

// URL de recherche partageable : tous les filtres d'une liste vivent dans l'URL
// (?game=&region=&country=&language=&level=&rank=&q=&tab=&sort=&weekend=).
// Les 4 filtres globaux (region/language/gameId/country) restent synchronisés
// avec FiltersContext (barre de filtres globale + persistance localStorage).
const SHARED = ["region", "language", "gameId", "country"];

export function useListParams() {
  const [sp, setSp] = useSearchParams();
  const { filters, set: setCtx, reset: resetCtx } = useFilters();

  const params = useMemo(() => {
    const out = { ...filters };
    for (const [k, v] of sp.entries()) out[k] = v;
    return out;
  }, [sp, filters]);

  const set = (patch) => {
    const ctxPatch = {};
    for (const k of SHARED) if (k in patch) ctxPatch[k] = patch[k];
    if (Object.keys(ctxPatch).length) setCtx(ctxPatch);
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      }
      return next;
    });
  };

  const reset = () => {
    resetCtx();
    setSp(new URLSearchParams());
  };

  const hasActive = Object.keys(params).some((k) => params[k] && params[k] !== "");

  return { params, set, reset, hasActive };
}
