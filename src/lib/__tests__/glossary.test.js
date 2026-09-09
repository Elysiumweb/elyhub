import { GLOSSARY, findTerm } from "../glossary";

describe("GLOSSARY", () => {
  it("couvre les termes clés de la plateforme", () => {
    const ids = GLOSSARY.map((g) => g.id);
    for (const expected of ["scrim", "lft", "bracket", "seeding", "checkin", "no-show", "prize-pool"]) {
      expect(ids).toContain(expected);
    }
  });

  it("chaque entrée a une définition dans les deux langues", () => {
    expect(GLOSSARY.every((g) => g.term && g.fr && g.en)).toBe(true);
  });
});

describe("findTerm", () => {
  it("trouve par terme exact sans casse", () => {
    expect(findTerm("scrim").id).toBe("scrim");
    expect(findTerm("SCRIM").id).toBe("scrim");
  });

  it("trouve par alias (normalisation minuscules)", () => {
    expect(findTerm("looking for team").id).toBe("lft");
    expect(findTerm("têtes de série").id).toBe("seeding");
  });

  it("renvoie undefined pour un terme inconnu", () => {
    expect(findTerm("xyzzy")).toBeUndefined();
  });
});
