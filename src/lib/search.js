// Recherche serveur (Meilisearch par défaut, Typesense/Algolia via le même contrat).
// Tant que SEARCH_HOST/SEARCH_KEY ne sont pas configurés, l'app retombe sur la
// recherche locale (`localSearch`) — cf. README, section Recherche.
const HOST = process.env.SEARCH_HOST || process.env.REACT_APP_SEARCH_HOST || "";
const KEY = process.env.SEARCH_KEY || process.env.REACT_APP_SEARCH_KEY || "";

export const isSearchConfigured = Boolean(HOST && KEY);

export async function serverSearch(index, q, { limit = 10 } = {}) {
  if (!isSearchConfigured || !q?.trim()) return null;
  try {
    const res = await fetch(`${HOST}/indexes/${index}/search`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ q, limit }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.hits || []).map((h) => ({ ...h, _id: h.id ?? h._id }));
  } catch {
    return null;
  }
}

// Fallback local : recherche insensible à la casse/accents sur les champs donnés.
export const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function localSearch(items, q, fields) {
  const s = normalize(q).trim();
  if (!s) return items;
  return items.filter((it) => fields.some((f) => normalize(it[f]).includes(s)));
}

// Renvoie les résultats serveur si configurés, sinon la recherche locale.
export async function search(index, q, items, fields, opts) {
  const remote = await serverSearch(index, q, opts);
  if (remote) return remote;
  return localSearch(items, q, fields);
}
