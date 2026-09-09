// Classement ELO des équipes, calculé depuis les résultats de matchs et de scrims.
export const ELO_INITIAL = 1200;

const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));

// score 1 = victoire A, 0 = défaite A, 0.5 = nul. K dégressif sous 30 matchs joués.
export const eloDelta = (eloA, eloB, scoreA, gamesA = 30, gamesB = 30) => {
  const K = (g) => (g < 10 ? 40 : g < 30 ? 32 : 24);
  const expA = expected(eloA, eloB);
  return {
    deltaA: Math.round(K(gamesA) * (scoreA - expA)),
    deltaB: Math.round(K(gamesB) * ((1 - scoreA) - (1 - expA))),
  };
};

// À partir d'un résultat : renvoie les nouveaux ELO des deux équipes.
export const applyMatchToElo = (teamA, teamB, scoreA, scoreB) => {
  const a = teamA.elo ?? ELO_INITIAL;
  const b = teamB.elo ?? ELO_INITIAL;
  const s = scoreA > scoreB ? 1 : scoreA < scoreB ? 0 : 0.5;
  const { deltaA, deltaB } = eloDelta(a, b, s, teamA.eloGames || 0, teamB.eloGames || 0);
  return {
    teamA: { elo: a + deltaA, delta: deltaA, games: (teamA.eloGames || 0) + 1 },
    teamB: { elo: b + deltaB, delta: deltaB, games: (teamB.eloGames || 0) + 1 },
  };
};

// Ordre de seeding d'une liste d'équipes (ELO décroissant, puis date de création)
export const seedTeams = (teams) =>
  [...teams].sort((a, b) => (b.elo ?? ELO_INITIAL) - (a.elo ?? ELO_INITIAL) || (a.createdAt || 0) - (b.createdAt || 0));
