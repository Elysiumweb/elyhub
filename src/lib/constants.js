export const ADMIN_UID = process.env.ADMIN_UID;

export const REGIONS = ["EU", "NA", "ASIA", "LATAM", "OCE", "MENA"];
export const LANGUAGES = ["fr", "en", "de", "es", "pt", "it"];
export const LEVELS = ["amateur", "semi-pro", "pro"];
export const SCRIM_FORMATS = ["BO1", "BO2", "BO3", "BO5", "Custom"];
export const TOURNAMENT_FORMATS = ["single_elim", "double_elim", "round_robin", "swiss", "league"];
export const RANKS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant", "Master", "Grandmaster", "Challenger", "Global Elite", "SSL"];

export const DEFAULT_GAMES = [
  { id: "valorant", name: "Valorant", color: "#FF4655", status: "validated", short: "VAL" },
  { id: "lol", name: "League of Legends", color: "#00C8C8", status: "validated", short: "LOL" },
  { id: "cs2", name: "Counter-Strike 2", color: "#F59E0B", status: "validated", short: "CS2" },
  { id: "rocket-league", name: "Rocket League", color: "#3B82F6", status: "validated", short: "RL" },
  { id: "apex", name: "Apex Legends", color: "#EF4444", status: "validated", short: "APEX" },
  { id: "overwatch-2", name: "Overwatch 2", color: "#F97316", status: "validated", short: "OW2" },
  { id: "fortnite", name: "Fortnite", color: "#EC4899", status: "validated", short: "FN" },
  { id: "ea-fc", name: "EA FC", color: "#22C55E", status: "validated", short: "FC" },
  { id: "r6", name: "Rainbow Six Siege", color: "#A855F7", status: "validated", short: "R6" },
  { id: "dota2", name: "Dota 2", color: "#B91C1C", status: "validated", short: "DOTA" },
];

export const GAME_PALETTE = ["#D8CA82", "#14B8A6", "#8B5CF6", "#F43F5E", "#0EA5E9", "#84CC16", "#FB923C"];

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
  ongoing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  finished: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
};
