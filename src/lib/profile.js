import { isMinorRange } from "./constants";

// ─────────────────────────── Tolérance aux données legacy ─────────────────
// Les documents écrits par les anciennes versions de l'app (ou modifiés à la
// main dans la console) peuvent porter des champs au mauvais format : une
// chaîne « fr,en » à la place d'un tableau, un objet à la place d'un tableau,
// etc. Appeler .map()/.filter()/.includes() sur ces valeurs faisait crasher le
// rendu avec des erreurs minifiées du type « o.map is not a function » /
// « o is not a function ». Ces helpers normalisent SANS jamais jeter : tout
// champ de document Firestore lu pour l'affichage doit passer par eux.
export const asList = (v) => {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined);
  if (typeof v === "string") return v.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  if (v && typeof v === "object") return Object.values(v).filter((x) => x !== null && x !== undefined);
  return [];
};
export const asMap = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const asString = (v) => (v === null || v === undefined ? "" : typeof v === "string" ? v : String(v));
// Tableau de chaînes uniquement (les entrées non-string sont converties).
export const asStringList = (v) => asList(v).map(asString).filter(Boolean);

// ─────────────────────────── Équipes multi-jeux ───────────────────────────
// Une équipe joue à un ou plusieurs jeux. `gameId` reste le jeu PRINCIPAL
// (compatible avec les données existantes et les requêtes serveur), `gameIds`
// liste tous les jeux. Les équipes créées avant la migration n'ont que `gameId`.
export const teamGames = (team) => {
  if (!team) return [];
  const ids = asStringList(team.gameIds);
  return ids.length ? ids : team.gameId ? [team.gameId] : [];
};

// Normalise un patch de création/mise à jour d'équipe : garantit que
// `gameIds` existe toujours et que `gameId` pointe sur le premier jeu.
export const normalizeTeamGames = (data) => {
  const ids = Array.isArray(data.gameIds) && data.gameIds.length
    ? [...new Set(data.gameIds)]
    : data.gameId ? [data.gameId] : [];
  return { ...data, gameIds: ids, gameId: ids[0] || "" };
};

// ─────────────────────────── Projection publique ───────────────────────────
// Les données privées vivent dans users/{uid} (lecture: soi ou modération) ;
// l'annuaire lit profiles/{uid} (public). Seul ce sous-ensemble est publié.
const PUBLIC_FIELDS = [
  "pseudo", "avatar", "games", "roles", "region", "languages", "bio",
  "ranksByGame", "level", "ageRange", "country", "city", "timezone",
  "availabilitySchedule", "gameHandles", "verified", "socials", "vodLink",
  "visibility", "onboarded", "createdAt",
];

export const profileToPublic = (p = {}) => {
  const out = {};
  for (const k of PUBLIC_FIELDS) if (p[k] !== undefined) out[k] = p[k];
  return out;
};

// ─────────────────────────── Mineurs ───────────────────────────
export const isMinorProfile = (p) => Boolean(p?.ageRange) && isMinorRange(p.ageRange);

// ─────────────────────────── Vérification ───────────────────────────
// Le badge « compte vérifié » est obtenu dès qu'au moins un profil de jeu
// officiel est lié (GAME_HANDLES : Riot ID, Steam, Faceit…).
export const isVerified = (p) => {
  if (typeof p?.verified === "boolean") return p.verified;
  const handles = p?.gameHandles || {};
  return Object.values(handles).some((v) => typeof v === "string" && v.trim() !== "");
};

// ─────────────────────────── Disponibilités récurrentes ───────────────────────────
// L'UI édite un seul créneau horaire appliqué aux jours cochés ; le profil stocke
// un tableau structuré [{ day, from, to }] (un élément par jour coché).
export const buildSchedule = ({ days = [], from = "", to = "" } = {}) => {
  if (!Array.isArray(days) || !days.length || !from || !to) return [];
  return days.map((day) => ({ day, from, to }));
};

// Reconstitue l'état UI (days/from/to) à partir du tableau stocké.
// Tolérance aux données legacy : un champ malformé (map au lieu de list,
// chaîne…) ne doit jamais faire crasher le rendu (« o.map is not a function »).
// Deux formes tolérées : [{ day, from, to }] OU { mon: { from, to }, … }.
export const scheduleToForm = (schedule) => {
  if (Array.isArray(schedule)) {
    const list = schedule.filter((s) => s && typeof s === "object");
    const first = list[0];
    return {
      days: list.map((s) => s.day).filter(Boolean),
      from: first?.from || "",
      to: first?.to || "",
    };
  }
  if (schedule && typeof schedule === "object") {
    const days = Object.keys(schedule);
    const first = Object.values(schedule)[0] || {};
    return { days, from: first.from || "", to: first.to || "" };
  }
  return { days: [], from: "", to: "" };
};

export const hasSchedule = (schedule = []) =>
  Array.isArray(schedule) && schedule.length > 0 && schedule.every((s) => s.day && s.from && s.to);

const cleanMap = (m = {}) =>
  Object.fromEntries(Object.entries(m).filter(([k, v]) => typeof k === "string" && typeof v === "string" && v.trim() !== "" && k.trim() !== ""));

// État formulaire → données stockées (users/{uid}). Les valeurs vides sont
// purgées pour ne pas encombrer le document (règles : ≤ 60 champs).
// Normalisation défensive : un champ legacy malformé (string au lieu de list,
// number au lieu de string…) est converti plutôt que de faire crasher l'écriture.
export const buildProfileSave = (f = {}, user = {}, existing = {}) => {
  const gameHandles = cleanMap(asMap(f.gameHandles));
  const socials = cleanMap(asMap(f.socials));
  const ranksByGame = cleanMap(asMap(f.ranksByGame));
  const vodLink = asString(f.vodLink).trim();
  return {
    pseudo: asString(f.pseudo).trim(),
    avatar: f.avatar || null,
    games: asStringList(f.games),
    roles: asStringList(f.roles),
    region: f.region || "EU",
    languages: asStringList(f.languages),
    bio: asString(f.bio).trim() || null,
    ranksByGame: Object.keys(ranksByGame).length ? ranksByGame : null,
    level: f.level || null,
    ageRange: f.ageRange || null,
    country: f.country || null,
    city: asString(f.city).trim() || null,
    timezone: f.timezone || "UTC",
    availabilitySchedule: buildSchedule(f.schedule),
    gameHandles: Object.keys(gameHandles).length ? gameHandles : null,
    socials: Object.keys(socials).length ? socials : null,
    vodLink: vodLink || null,
    verified: isVerified({ verified: undefined, gameHandles }),
    visibility: { public: true, hideDirectory: false, hideRank: false, ...asMap(f.visibility) },
    email: user.email || existing?.email || null,
    onboarded: true,
    createdAt: existing?.createdAt || Date.now(),
  };
};
