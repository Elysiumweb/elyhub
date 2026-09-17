import { isMinorRange } from "./constants";

// ─────────────────────────── Équipes multi-jeux ───────────────────────────
// Une équipe joue à un ou plusieurs jeux. `gameId` reste le jeu PRINCIPAL
// (compatible avec les données existantes et les requêtes serveur), `gameIds`
// liste tous les jeux. Les équipes créées avant la migration n'ont que `gameId`.
export const teamGames = (team) => {
  if (!team) return [];
  if (Array.isArray(team.gameIds) && team.gameIds.length) return team.gameIds;
  return team.gameId ? [team.gameId] : [];
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
export const scheduleToForm = (schedule = []) => {
  const list = Array.isArray(schedule) ? schedule : [];
  const first = list[0];
  return {
    days: list.map((s) => s?.day).filter(Boolean),
    from: first?.from || "",
    to: first?.to || "",
  };
};

export const hasSchedule = (schedule = []) =>
  Array.isArray(schedule) && schedule.length > 0 && schedule.every((s) => s.day && s.from && s.to);

const cleanMap = (m = {}) =>
  Object.fromEntries(Object.entries(m).filter(([k, v]) => typeof k === "string" && typeof v === "string" && v.trim() !== "" && k.trim() !== ""));

// État formulaire → données stockées (users/{uid}). Les valeurs vides sont
// purgées pour ne pas encombrer le document (règles : ≤ 60 champs).
export const buildProfileSave = (f = {}, user = {}, existing = {}) => {
  const gameHandles = cleanMap(f.gameHandles);
  const socials = cleanMap(f.socials);
  const ranksByGame = cleanMap(f.ranksByGame);
  const vodLink = (f.vodLink || "").trim();
  return {
    pseudo: (f.pseudo || "").trim(),
    avatar: f.avatar || null,
    games: Array.isArray(f.games) ? f.games : [],
    roles: typeof f.roles === "string" ? f.roles.split(",").map((s) => s.trim()).filter(Boolean) : f.roles || [],
    region: f.region || "EU",
    languages: Array.isArray(f.languages) ? f.languages : [],
    bio: (f.bio || "").trim() || null,
    ranksByGame: Object.keys(ranksByGame).length ? ranksByGame : null,
    level: f.level || null,
    ageRange: f.ageRange || null,
    country: f.country || null,
    city: (f.city || "").trim() || null,
    timezone: f.timezone || "UTC",
    availabilitySchedule: buildSchedule(f.schedule),
    gameHandles: Object.keys(gameHandles).length ? gameHandles : null,
    socials: Object.keys(socials).length ? socials : null,
    vodLink: vodLink || null,
    verified: isVerified({ verified: undefined, gameHandles }),
    visibility: { public: true, hideDirectory: false, hideRank: false, ...(f.visibility || {}) },
    email: user.email || existing?.email || null,
    onboarded: true,
    createdAt: existing?.createdAt || Date.now(),
  };
};
