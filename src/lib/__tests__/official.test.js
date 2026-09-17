// Mise en avant des contenus officiels (compte administrateur) :
// isOfficialItem + rankOfficial + toEpoch (tolérance Timestamp Firestore).

describe("isOfficialItem / rankOfficial (avec ADMIN_UID)", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ADMIN_UID = "boss-uid";
  });
  afterEach(() => {
    delete process.env.ADMIN_UID;
    jest.resetModules();
  });

  const load = () => import("../db");

  it("marque officiel tout contenu appartenant au compte administrateur", async () => {
    const { isOfficialItem } = await load();
    expect(isOfficialItem({ id: "x", ownerId: "boss-uid" })).toBe(true);
    expect(isOfficialItem({ id: "x", createdBy: "boss-uid" })).toBe(true);
    expect(isOfficialItem({ id: "x", playerId: "boss-uid" })).toBe(true);
    expect(isOfficialItem({ id: "x", organizerId: "boss-uid" })).toBe(true);
    expect(isOfficialItem({ id: "boss-uid" })).toBe(true); // fiche joueur (profiles/{uid})
    expect(isOfficialItem({ id: "x", isOfficial: true })).toBe(true);
    expect(isOfficialItem({ id: "x", ownerId: "someone-else" })).toBe(false);
    expect(isOfficialItem(null)).toBe(false);
  });

  it("rankOfficial place les contenus officiels en tête, puis les plus récents", async () => {
    const { rankOfficial } = await load();
    const list = [
      { id: "community-recent", ownerId: "u1", createdAt: 900 },
      { id: "admin-old", ownerId: "boss-uid", createdAt: 100 },
      { id: "flagged", isOfficial: true, createdAt: 500 },
      { id: "community-old", ownerId: "u2", createdAt: 50 },
    ];
    expect(rankOfficial(list).map((x) => x.id)).toEqual([
      "flagged", // officiel le plus récent
      "admin-old", // contenu du compte admin, même ancien
      "community-recent",
      "community-old",
    ]);
  });

  it("rankOfficial tolère un createdAt Timestamp Firestore ({ seconds })", async () => {
    const { rankOfficial } = await load();
    const list = [
      { id: "a", createdAt: { seconds: 1 } },
      { id: "b", createdAt: { seconds: 5 } },
      { id: "c" },
    ];
    expect(() => rankOfficial(list)).not.toThrow();
    expect(rankOfficial(list)[0].id).toBe("b");
  });
});

describe("toEpoch", () => {
  // Pas de dépendance à ADMIN_UID ici : import direct.
  const { toEpoch } = require("../time");

  it("accepte epoch ms, ISO string et Timestamp Firestore", () => {
    expect(toEpoch(1700000000000)).toBe(1700000000000);
    expect(toEpoch("2026-01-02T00:00:00.000Z")).toBe(Date.parse("2026-01-02T00:00:00.000Z"));
    expect(toEpoch({ seconds: 170 })).toBe(170000);
    expect(toEpoch({ toMillis: () => 42000 })).toBe(42000);
  });

  it("renvoie null pour l'inexploitable (jamais de NaN)", () => {
    expect(toEpoch(null)).toBeNull();
    expect(toEpoch("")).toBeNull();
    expect(toEpoch("pas une date")).toBeNull();
    expect(toEpoch({ foo: 1 })).toBeNull();
    expect(toEpoch(NaN)).toBeNull();
  });
});
