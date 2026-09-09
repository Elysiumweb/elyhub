import { DEFAULT_GAMES, gameSlug, slugToGameId, CAN_MANAGE_ROLES, isMinorRange, AGE_RANGES, TOURNAMENT_FORMATS } from "../constants";

describe("DEFAULT_GAMES", () => {
  it("couvre les jeux principaux avec rangs et couleurs", () => {
    expect(DEFAULT_GAMES.length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_GAMES.every((g) => g.id && g.name && g.color && Array.isArray(g.ranks) && g.ranks.length > 0)).toBe(true);
    expect(DEFAULT_GAMES.every((g) => g.status === "validated")).toBe(true);
  });
});

describe("slugs de jeu", () => {
  it("slugToGameId(gameSlug(id)) === id pour tous les jeux", () => {
    for (const g of DEFAULT_GAMES) {
      expect(slugToGameId(gameSlug(g.id))).toBe(g.id);
    }
  });

  it("les slugs sont lisibles (SEO)", () => {
    expect(gameSlug("lol")).toBe("league-of-legends");
    expect(slugToGameId("counter-strike-2")).toBe("cs2");
  });
});

describe("rôles d'équipe", () => {
  it("seuls certains rôles peuvent gérer l'équipe", () => {
    expect(CAN_MANAGE_ROLES).toContain("captain");
    expect(CAN_MANAGE_ROLES).toContain("coach");
    expect(CAN_MANAGE_ROLES).not.toContain("substitute");
  });
});

describe("protection des mineurs", () => {
  it("détecte les tranches mineures", () => {
    expect(isMinorRange(AGE_RANGES[0])).toBe(true);
    expect(isMinorRange("18+")).toBe(false);
  });
});

describe("formats de tournoi", () => {
  it("contient les formats supportés par le générateur de bracket", () => {
    expect(TOURNAMENT_FORMATS).toEqual(expect.arrayContaining(["single_elim", "round_robin", "swiss"]));
  });
});
