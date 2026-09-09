import { localSearch, normalize, isSearchConfigured } from "../search";

const ITEMS = [
  { name: "Elysium Academy", region: "France" },
  { name: "Team Élite", region: "France" },
  { name: "Nordic Legends", region: "Suède" },
];

describe("localSearch", () => {
  it("trouve sans tenir compte de la casse", () => {
    expect(localSearch(ITEMS, "elysium", ["name"])).toHaveLength(1);
    expect(localSearch(ITEMS, "ELYSIUM", ["name"])[0].name).toBe("Elysium Academy");
  });

  it("gère les accents (normalisation NFD)", () => {
    expect(localSearch(ITEMS, "elite", ["name"])[0].name).toBe("Team Élite");
    expect(localSearch(ITEMS, "élite", ["name"])).toHaveLength(1);
  });

  it("cherche dans plusieurs champs", () => {
    expect(localSearch(ITEMS, "suède", ["name", "region"])[0].name).toBe("Nordic Legends");
  });

  it("renvoie la liste complète pour une requête vide", () => {
    expect(localSearch(ITEMS, "", ["name"])).toEqual(ITEMS);
    expect(localSearch(ITEMS, "   ", ["name"])).toEqual(ITEMS);
  });
});

describe("normalize", () => {
  it("supprime les diacritiques", () => {
    expect(normalize("éàçù")).toBe("eacu");
  });
});

describe("isSearchConfigured", () => {
  it("est false sans variables d'env (fallback local)", () => {
    expect(isSearchConfigured).toBe(false);
  });
});
