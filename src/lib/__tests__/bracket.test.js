import { generateSingleElim, generateRoundRobin, generateSwissRound, standings } from "../bracket";

const T = (n) => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}`, ownerId: `u${i + 1}` }));

describe("generateSingleElim", () => {
  it("génère un bracket complet de 8 équipes en 3 rondes", () => {
    const { matches, rounds } = generateSingleElim("trn", T(8));
    expect(rounds).toBe(3);
    expect(matches.length).toBe(7);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1.length).toBe(4);
    expect(r1.every((m) => m.status === "ready")).toBe(true);
  });

  it("attribue un bye quand le nombre d'équipes n'est pas une puissance de 2", () => {
    const { matches } = generateSingleElim("trn", T(5));
    const byes = matches.filter((m) => m.isBye);
    expect(byes.length).toBe(1);
    expect(byes.every((m) => m.winnerId && m.status === "done")).toBe(true);
  });

  it("chaîne les matchs vers le match suivant", () => {
    const { matches } = generateSingleElim("trn", T(4));
    const finals = matches.filter((m) => m.round === 2);
    expect(finals.length).toBe(1);
    expect(finals[0].nextMatchId).toBeNull();
    const semi = matches.filter((m) => m.round === 1);
    expect(semi.every((m) => m.nextMatchId === finals[0].id && m.nextSlot !== null)).toBe(true);
  });
});

describe("generateRoundRobin", () => {
  it("chaque équipe affronte toutes les autres une fois", () => {
    const { matches, rounds } = generateRoundRobin("trn", T(4));
    expect(rounds).toBe(3);
    expect(matches.length).toBe(6);
    const pairs = matches.map((m) => [m.teamA.id, m.teamB.id].sort().join("|"));
    expect(new Set(pairs).size).toBe(6);
  });

  it("gère un nombre impair avec un bye", () => {
    const { matches } = generateRoundRobin("trn", T(3));
    expect(matches.length).toBe(3);
  });
});

describe("generateSwissRound", () => {
  it("apparie sans rematch les équipes", () => {
    const first = generateSwissRound("trn", T(4), []);
    expect(first.matches.length).toBe(2);
    const second = generateSwissRound("trn", T(4), first.matches);
    expect(second.round).toBe(2);
    expect(second.matches.every((m) => m.status === "ready")).toBe(true);
  });

  it("donne un bye à l'équipe seule", () => {
    const { matches } = generateSwissRound("trn", T(3), []);
    expect(matches.filter((m) => m.isBye).length).toBe(1);
  });
});

describe("standings", () => {
  it("classe par points puis par différence", () => {
    const teams = T(3);
    const matches = [
      { teamA: { id: "t1" }, teamB: { id: "t2" }, scoreA: 2, scoreB: 1, winnerId: "t1", status: "done" },
      { teamA: { id: "t1" }, teamB: { id: "t3" }, scoreA: 1, scoreB: 2, winnerId: "t3", status: "done" },
      { teamA: { id: "t2" }, teamB: { id: "t3" }, scoreA: 1, scoreB: 1, winnerId: null, status: "done" },
    ];
    const { table } = standings(teams, matches);
    expect(table.map((r) => r.id)).toEqual(["t3", "t1", "t2"]);
    expect(table[0].points).toBe(4);
    expect(table[1].points).toBe(3);
  });
});
