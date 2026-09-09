import { applyMatchToElo, ELO_INITIAL, eloDelta, seedTeams } from "../elo";

describe("applyMatchToElo", () => {
  it("démarre à 1200 et fait gagner des points au vainqueur", () => {
    const { teamA, teamB } = applyMatchToElo({}, {}, 2, 0);
    expect(teamA.elo).toBeGreaterThan(1200);
    expect(teamB.elo).toBeLessThan(1200);
    expect(teamA.games).toBe(1);
    expect(teamB.games).toBe(1);
    expect(teamA.delta).toBe(-teamB.delta);
  });

  it("un nul rapporte moins qu'une victoire", () => {
    const draw = applyMatchToElo({}, {}, 1, 1);
    const win = applyMatchToElo({}, {}, 1, 0);
    expect(Math.abs(draw.teamA.delta)).toBeLessThan(Math.abs(win.teamA.delta));
  });

  it("respecte le K dégressif (40 < 10 matchs, 32 < 30, 24 après)", () => {
    const d = eloDelta(1200, 1200, 1, 5, 5);
    const d2 = eloDelta(1200, 1200, 1, 15, 15);
    const d3 = eloDelta(1200, 1200, 1, 40, 40);
    expect(d.deltaA).toBe(20);
    expect(d2.deltaA).toBe(16);
    expect(d3.deltaA).toBe(12);
  });

  it("le favori gagne moins de points que l'outsider", () => {
    const fav = applyMatchToElo({ elo: 1600, eloGames: 30 }, { elo: 1000, eloGames: 30 }, 1, 0);
    const dog = applyMatchToElo({ elo: 1000, eloGames: 30 }, { elo: 1600, eloGames: 30 }, 1, 0);
    expect(fav.teamA.delta).toBeLessThan(dog.teamA.delta);
  });

  it("seedTeams trie par ELO décroissant", () => {
    const sorted = seedTeams([{ id: "a" }, { id: "b", elo: 1300 }, { id: "c", elo: 1100 }]);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(ELO_INITIAL).toBe(1200);
  });
});
