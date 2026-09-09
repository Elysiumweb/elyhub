// Même règle que firebase.js : les deux formes de nom sont acceptées (accès littéraux,
// remplacés par webpack au build — une clé calculée ne serait jamais injectée).
// ⚠️ ADMIN_UID n'est qu'un *bootstrap* (premier admin) : l'autorisation réelle repose sur
// le champ `role` du document users/{uid} (admin | moderator), contrôlé par firestore.rules.
export const ADMIN_UID = process.env.REACT_APP_ADMIN_UID || process.env.ADMIN_UID || "";

export const REGIONS = ["EU", "NA", "ASIA", "LATAM", "OCE", "MENA"];
export const LANGUAGES = ["fr", "en", "de", "es", "pt", "it"];
export const SCRIM_FORMATS = ["BO1", "BO2", "BO3", "BO5", "BO7", "Custom"];
export const TOURNAMENT_FORMATS = ["single_elim", "double_elim", "round_robin", "swiss", "league", "groups_playoffs"];

export const DEFAULT_GAMES = [
  { id: "valorant", name: "Valorant", color: "#FF4655", status: "validated", ranks: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"] },
  { id: "lol", name: "League of Legends", color: "#00C8C8", status: "validated", ranks: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"] },
  { id: "cs2", name: "Counter-Strike 2", color: "#F59E0B", status: "validated", ranks: ["Faceit Lvl 1-3", "Faceit Lvl 4-6", "Faceit Lvl 7-8", "Faceit Lvl 9-10", "Premier 5k-10k", "Premier 10k-15k", "Premier 15k-20k", "Premier 20k-25k", "Premier 25k+"] },
  { id: "rocket-league", name: "Rocket League", color: "#3B82F6", status: "validated", ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Grand Champion", "Supersonic Legend"] },
  { id: "apex", name: "Apex Legends", color: "#EF4444", status: "validated", ranks: ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Apex Predator"] },
  { id: "overwatch-2", name: "Overwatch 2", color: "#F97316", status: "validated", ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion", "Top 500"] },
  { id: "fortnite", name: "Fortnite", color: "#EC4899", status: "validated", ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Champion", "Unreal"] },
  { id: "ea-fc", name: "EA FC", color: "#22C55E", status: "validated", ranks: ["Division 10-7", "Division 6-4", "Division 3-2", "Division 1", "Elite"] },
  { id: "r6", name: "Rainbow Six Siege", color: "#A855F7", status: "validated", ranks: ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"] },
  { id: "dota2", name: "Dota 2", color: "#B91C1C", status: "validated", ranks: ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"] },
];

// Slugs lisibles pour les hubs par jeu (SEO) : /valorant, /league-of-legends/tournois…
export const GAME_SLUGS = {
  valorant: "valorant",
  lol: "league-of-legends",
  cs2: "counter-strike-2",
  "rocket-league": "rocket-league",
  apex: "apex-legends",
  "overwatch-2": "overwatch-2",
  fortnite: "fortnite",
  "ea-fc": "ea-fc",
  r6: "rainbow-six-siege",
  dota2: "dota2",
};
export const gameSlug = (id) => GAME_SLUGS[id] || id;
export const slugToGameId = (slug) => Object.entries(GAME_SLUGS).find(([, s]) => s === slug)?.[0] || slug;

export const GAME_PALETTE = ["#D8CA82", "#14B8A6", "#8B5CF6", "#F43F5E", "#0EA5E9", "#84CC16", "#FB923C"];

// Niveaux d'ambition (clés i18n : level_amateur / level_semi-pro / level_pro)
export const LEVELS = ["amateur", "semi-pro", "pro"];

// Tranches d'âge (protection des mineurs — §2.H)
export const AGE_RANGES = ["u16", "16-17", "18+"];
export const isMinorRange = (r) => r === "u16" || r === "16-17";

// Rôles structurés d'équipe (remplace la chaîne libre « role »)
export const TEAM_ROLES = [
  { id: "captain", key: "role_captain" },
  { id: "coach", key: "role_coach" },
  { id: "manager", key: "role_manager" },
  { id: "starter", key: "role_starter" },
  { id: "substitute", key: "role_substitute" },
];
export const CAN_MANAGE_ROLES = ["captain", "coach", "manager"];

// Types de structure
export const TEAM_TYPES = [
  { id: "association", key: "team_type_association" },
  { id: "school", key: "team_type_school" },
  { id: "company", key: "team_type_company" },
  { id: "collective", key: "team_type_collective" },
  { id: "club", key: "team_type_club" },
];

// Profils externes de jeu + réseaux (joueurs & équipes)
export const GAME_HANDLES = [
  { id: "riotId", label: "Riot ID", placeholder: "Pseudo#TAG" },
  { id: "steam", label: "Steam", placeholder: "steamcommunity.com/id/…" },
  { id: "faceit", label: "Faceit", placeholder: "faceit.com/…" },
  { id: "epic", label: "Epic Games", placeholder: "Pseudo" },
  { id: "psn", label: "PlayStation", placeholder: "PSN ID" },
  { id: "xbox", label: "Xbox", placeholder: "Gamertag" },
  { id: "tracker", label: "Tracker.gg", placeholder: "tracker.gg/…" },
];
export const SOCIAL_PLATFORMS = [
  { id: "discord", label: "Discord", placeholder: "discord.gg/… ou serveur" },
  { id: "twitter", label: "X / Twitter", placeholder: "@pseudo" },
  { id: "twitch", label: "Twitch", placeholder: "twitch.tv/…" },
  { id: "youtube", label: "YouTube", placeholder: "youtube.com/@…" },
  { id: "instagram", label: "Instagram", placeholder: "@pseudo" },
];

// Jours de disponibilité récurrente (créneaux structurés)
export const WEEKDAYS = [
  { id: "mon", key: "day_mon" },
  { id: "tue", key: "day_tue" },
  { id: "wed", key: "day_wed" },
  { id: "thu", key: "day_thu" },
  { id: "fri", key: "day_fri" },
  { id: "sat", key: "day_sat" },
  { id: "sun", key: "day_sun" },
];

// Fuseaux horaires courants (affichage + stockage des horaires)
export const TIMEZONES = [
  "Europe/Paris", "Europe/London", "Europe/Berlin", "Europe/Madrid", "Europe/Lisbon", "Europe/Rome",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
  "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Dubai", "Australia/Sydney", "UTC",
];

// Pays (géolocalisation fine §2.A) — ISO 3166-1 alpha-2, triés par nom FR approximatif
export const COUNTRIES = [
  { code: "FR", label: "France" }, { code: "BE", label: "Belgique" }, { code: "CH", label: "Suisse" }, { code: "CA", label: "Canada" },
  { code: "LU", label: "Luxembourg" }, { code: "MC", label: "Monaco" }, { code: "DZ", label: "Algérie" }, { code: "MA", label: "Maroc" },
  { code: "TN", label: "Tunisie" }, { code: "SN", label: "Sénégal" }, { code: "CI", label: "Côte d'Ivoire" }, { code: "CM", label: "Cameroun" },
  { code: "DE", label: "Allemagne" }, { code: "GB", label: "Royaume-Uni" }, { code: "ES", label: "Espagne" }, { code: "IT", label: "Italie" },
  { code: "PT", label: "Portugal" }, { code: "NL", label: "Pays-Bas" }, { code: "AT", label: "Autriche" }, { code: "PL", label: "Pologne" },
  { code: "US", label: "États-Unis" }, { code: "MX", label: "Mexique" }, { code: "BR", label: "Brésil" }, { code: "AR", label: "Argentine" },
  { code: "CL", label: "Chili" }, { code: "CO", label: "Colombie" }, { code: "JP", label: "Japon" }, { code: "KR", label: "Corée du Sud" },
  { code: "CN", label: "Chine" }, { code: "IN", label: "Inde" }, { code: "AU", label: "Australie" }, { code: "NZ", label: "Nouvelle-Zélande" },
  { code: "SA", label: "Arabie saoudite" }, { code: "AE", label: "Émirats arabes unis" }, { code: "TR", label: "Turquie" }, { code: "GR", label: "Grèce" },
  { code: "SE", label: "Suède" }, { code: "NO", label: "Norvège" }, { code: "DK", label: "Danemark" }, { code: "FI", label: "Finlande" },
  { code: "IE", label: "Irlande" }, { code: "CZ", label: "Tchéquie" }, { code: "RO", label: "Roumanie" }, { code: "UA", label: "Ukraine" },
  { code: "RU", label: "Russie" }, { code: "EG", label: "Égypte" }, { code: "ZA", label: "Afrique du Sud" }, { code: "SG", label: "Singapour" },
  { code: "MY", label: "Malaisie" }, { code: "ID", label: "Indonésie" }, { code: "TH", label: "Thaïlande" }, { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" }, { code: "OTHER", label: "Autre" },
];
export const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.label || code;

// Modèles de règlement par jeu (§2.F) — texte de départ pour les organisateurs débutants
export const RULES_TEMPLATES = {
  valorant: {
    fr: "1. Format : BO1 en poules, BO3 en phase finale.\n2. Map pool officielle : Ascent, Bind, Haven, Split, Lotus, Sunset, Pearl, Abyss.\n3. Veto : chaque équipe bannit 2 maps, la dernière restante est jouée (ban A, ban B, ban A, ban B, pick A, pick B).\n4. Check-in 15 minutes avant le début de chaque match ; au-delà, l'équipe adverse gagne par forfait (1-0).\n5. En cas de litige, fournir des preuves (screenshot/stream) à l'organisation dans les 24 h.\n6. Comportement toxique interdit — sanction pouvant aller jusqu'à l'exclusion du tournoi.",
    en: "1. Format: BO1 in groups, BO3 in playoffs.\n2. Official map pool: Ascent, Bind, Haven, Split, Lotus, Sunset, Pearl, Abyss.\n3. Veto: each team bans 2 maps, last remaining map is played.\n4. Check-in 15 minutes before each match; beyond that the opposing team wins by forfeit (1-0).\n5. For disputes, provide proof (screenshot/stream) to the organisation within 24h.\n6. Toxic behaviour is forbidden — sanctions up to tournament exclusion.",
  },
  lol: {
    fr: "1. Format : BO1 en phase de ligue, BO3 en playoffs.\n2. Matchs sur la Faille de l'invocateur (SR 5v5, mode draft).\n3. Check-in 15 minutes avant le match ; forfait au-delà (1-0).\n4. Toute preuve de triche entraîne la disqualification immédiate.\n5. Litiges : contacter l'organisation avec preuves sous 24 h.",
    en: "1. Format: BO1 in league phase, BO3 in playoffs.\n2. Matches on Summoner's Rift (SR 5v5 draft mode).\n3. Check-in 15 minutes before the match; forfeit beyond (1-0).\n4. Any proof of cheating leads to immediate disqualification.\n5. Disputes: contact the organisation with proof within 24h.",
  },
  cs2: {
    fr: "1. Format : BO1 / BO3 selon la phase.\n2. Map pool officielle : Mirage, Inferno, Nuke, Ancient, Anubis, Overpass, Dust2.\n3. Veto standard : ban ban, pick pick, ban ban, dernière map jouée.\n4. Check-in 15 minutes avant le match ; forfait au-delà.\n5. Anti-triche : les admins peuvent demander un partage d'écran ou une démo.",
    en: "1. Format: BO1 / BO3 depending on the phase.\n2. Official map pool: Mirage, Inferno, Nuke, Ancient, Anubis, Overpass, Dust2.\n3. Standard veto: ban ban, pick pick, ban ban, last map played.\n4. Check-in 15 minutes before the match; forfeit beyond.\n5. Anti-cheat: admins may request screen share or demos.",
  },
  default: {
    fr: "1. Check-in 15 minutes avant chaque match ; au-delà, victoire de l'adversaire par forfait.\n2. Les scores doivent être déclarés avec preuve (screenshot/stream) par les deux capitaines.\n3. En cas de désaccord, l'organisation tranche après examen des preuves.\n4. Fair-play obligatoire : toute insulte ou tricherie peut mener à l'exclusion.\n5. Les horaires sont affichés dans le fuseau de l'organisateur ; les capitaines sont responsables de la coordination.",
    en: "1. Check-in 15 minutes before each match; beyond that, the opponent wins by forfeit.\n2. Scores must be reported with proof (screenshot/stream) by both captains.\n3. In case of disagreement, the organisation decides after reviewing the evidence.\n4. Fair play is mandatory: insults or cheating may lead to exclusion.\n5. Times are displayed in the organiser's timezone; captains are responsible for coordination.",
  },
};

export const STATUS_STYLES = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  validated: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  seen: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  refused: "bg-red-500/15 text-red-400 border-red-500/30",
  open: "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/30",
  proposed: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  played: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  closed: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  full: "bg-red-500/15 text-red-400 border-red-500/30",
  upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  registration: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ongoing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  finished: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  ready: "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/30",
  reported: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  disputed: "bg-red-500/15 text-red-400 border-red-500/30",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-zinc-700/40 text-zinc-500 border-zinc-600/40",
  "in-test": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};
