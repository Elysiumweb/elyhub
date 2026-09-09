// API de useGames conservée (games, byId, getGame, loading) — branchée sur le
// contexte partagé au lieu d'un abonnement par consommateur.
export { useGamesContext as useGames } from "@/context/GamesContext";
