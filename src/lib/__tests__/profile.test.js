import {
  teamGames, normalizeTeamGames, profileToPublic, buildProfileSave,
  buildSchedule, scheduleToForm, hasSchedule, isMinorProfile, isVerified,
  asList, asMap, asString, asStringList,
} from "../profile";

describe("teamGames — équipes multi-jeux", () => {
  it("équipe historique : uniquement gameId", () => {
    expect(teamGames({ id: "t1", gameId: "valorant" })).toEqual(["valorant"]);
  });

  it("équipe multi-jeux : gameIds (premier = principal)", () => {
    expect(teamGames({ id: "t1", gameId: "valorant", gameIds: ["valorant", "league-of-legends"] })).toEqual(["valorant", "league-of-legends"]);
  });

  it("jeu manquant : liste vide", () => {
    expect(teamGames({ id: "t1" })).toEqual([]);
    expect(teamGames(null)).toEqual([]);
  });
});

describe("normalizeTeamGames", () => {
  it("dérive gameId (principal) du premier de gameIds", () => {
    expect(normalizeTeamGames({ name: "T", gameIds: ["rocket-league", "valorant"] })).toEqual({
      name: "T", gameIds: ["rocket-league", "valorant"], gameId: "rocket-league",
    });
  });

  it("garde l'historique gameId si gameIds absent", () => {
    expect(normalizeTeamGames({ gameId: "valorant" })).toEqual({ gameId: "valorant", gameIds: ["valorant"] });
  });

  it("dédouble les jeux", () => {
    expect(normalizeTeamGames({ gameIds: ["valorant", "valorant"] })).toEqual({ gameIds: ["valorant"], gameId: "valorant" });
  });
});

describe("profileToPublic — projection publique", () => {
  it("expose uniquement les champs publics", () => {
    const pub = profileToPublic({
      pseudo: "ninja", level: "pro", ageRange: "18+", country: "fr", ranksByGame: { valorant: "Immortal" },
      email: "a@b.c", banned: true, role: "admin", fav_teams: ["t1"],
    });
    expect(pub).toMatchObject({ pseudo: "ninja", level: "pro", ageRange: "18+", country: "fr", ranksByGame: { valorant: "Immortal" } });
    expect(pub).not.toHaveProperty("email");
    expect(pub).not.toHaveProperty("role");
    expect(pub).not.toHaveProperty("fav_teams");
  });
});

describe("buildProfileSave", () => {
  const user = { uid: "u1", email: "player@elysium-esport.fr" };

  it("structure le profil complet (rangs par jeu, niveau, tranche d'âge, pays…)", () => {
    const out = buildProfileSave({
      pseudo: "  Ninja  ", games: ["valorant", "rocket-league"], roles: "Duelist, IGL",
      ranksByGame: { valorant: "Immortal", "rocket-league": "" },
      level: "semi-pro", ageRange: "18+", country: "fr", city: "  Lyon  ",
      timezone: "Europe/Paris", schedule: { days: ["sat", "sun"], from: "20:00", to: "23:00" },
      gameHandles: { riotId: "Ninja#FR", steam: "   " }, socials: { discord: "ninja#0001" }, vodLink: "https://youtu.be/x",
    }, user, {});
    expect(out.pseudo).toBe("Ninja");
    expect(out.roles).toEqual(["Duelist", "IGL"]);
    expect(out.ranksByGame).toEqual({ valorant: "Immortal" });
    expect(out.level).toBe("semi-pro");
    expect(out.ageRange).toBe("18+");
    expect(out.country).toBe("fr");
    expect(out.city).toBe("Lyon");
    expect(out.availabilitySchedule).toEqual([
      { day: "sat", from: "20:00", to: "23:00" },
      { day: "sun", from: "20:00", to: "23:00" },
    ]);
    expect(out.gameHandles).toEqual({ riotId: "Ninja#FR" });
    expect(out.socials).toEqual({ discord: "ninja#0001" });
    expect(out.verified).toBe(true);
    expect(out.email).toBe("player@elysium-esport.fr");
    expect(out.onboarded).toBe(true);
    expect(out.visibility).toEqual({ public: true, hideDirectory: false, hideRank: false });
  });

  it("purgée les valeurs vides (null) pour garder le document léger", () => {
    const out = buildProfileSave({ pseudo: "n", games: [], level: "", country: "" }, user, {});
    expect(out.level).toBeNull();
    expect(out.country).toBeNull();
    expect(out.verified).toBe(false);
  });

  it("conserve createdAt existant (membre depuis)", () => {
    const out = buildProfileSave({ pseudo: "n", games: [] }, user, { createdAt: 1234 });
    expect(out.createdAt).toBe(1234);
  });
});

describe("disponibilités récurrentes", () => {
  it("construit le planning depuis l'UI (jours + créneau)", () => {
    expect(buildSchedule({ days: ["mon", "wed"], from: "19:00", to: "22:00" })).toEqual([
      { day: "mon", from: "19:00", to: "22:00" },
      { day: "wed", from: "19:00", to: "22:00" },
    ]);
  });

  it("sans jours ni heure : planning vide", () => {
    expect(buildSchedule({ days: [], from: "", to: "" })).toEqual([]);
    expect(buildSchedule({ days: ["mon"], from: "19:00", to: "" })).toEqual([]);
  });

  it("retourne l'état UI depuis le tableau stocké", () => {
    expect(scheduleToForm([{ day: "fri", from: "20:00", to: "23:00" }, { day: "sat", from: "20:00", to: "23:00" }]))
      .toEqual({ days: ["fri", "sat"], from: "20:00", to: "23:00" });
    expect(scheduleToForm([])).toEqual({ days: [], from: "", to: "" });
  });

  it("hasSchedule", () => {
    expect(hasSchedule([{ day: "mon", from: "1", to: "2" }])).toBe(true);
    expect(hasSchedule([{ day: "mon", from: "1", to: "" }])).toBe(false);
    expect(hasSchedule([])).toBe(false);
  });
});

describe("mineurs & vérification", () => {
  it("isMinorProfile", () => {
    expect(isMinorProfile({ ageRange: "u16" })).toBe(true);
    expect(isMinorProfile({ ageRange: "16-17" })).toBe(true);
    expect(isMinorProfile({ ageRange: "18+" })).toBe(false);
    expect(isMinorProfile({})).toBe(false);
  });

  it("isVerified : au moins un profil de jeu lié", () => {
    expect(isVerified({ gameHandles: { riotId: "X#FR" } })).toBe(true);
    expect(isVerified({ gameHandles: { riotId: "  " } })).toBe(false);
    expect(isVerified({})).toBe(false);
    // la valeur stockée l'emporte (pas de recalcul surprise)
    expect(isVerified({ verified: true, gameHandles: {} })).toBe(true);
  });
});

describe("helpers de tolérance aux données legacy (asList/asMap/asString)", () => {
  // C'est la famille d'erreurs qui produisait « o is not a function » /
  // « o.map is not a function » en prod : des .map()/.filter() sur un champ
  // Firestore au mauvais format (chaîne, objet, undefined).
  it("asList normalise n'importe quelle valeur en tableau sans jeter", () => {
    expect(asList(["a", "b"])).toEqual(["a", "b"]);
    expect(asList("fr,en")).toEqual(["fr", "en"]);
    expect(asList("fr, en , de")).toEqual(["fr", "en", "de"]);
    expect(asList(null)).toEqual([]);
    expect(asList(undefined)).toEqual([]);
    expect(asList("")).toEqual([]);
    expect(asList("solo")).toEqual(["solo"]);
    expect(asList(42)).toEqual([]);
    expect(asList({ a: 1, b: 2 })).toEqual([1, 2]);
    expect(asList([1, null, 2])).toEqual([1, 2]); // les null sont purgées
  });

  it("asMap n'accepte qu'un objet (pas un tableau)", () => {
    expect(asMap({ a: 1 })).toEqual({ a: 1 });
    expect(asMap(["a"])).toEqual({});
    expect(asMap("str")).toEqual({});
    expect(asMap(null)).toEqual({});
  });

  it("asString convertit sans jeter", () => {
    expect(asString("x")).toBe("x");
    expect(asString(42)).toBe("42");
    expect(asString(null)).toBe("");
    expect(asString(undefined)).toBe("");
  });

  it("asStringList : tableau de chaînes propres", () => {
    expect(asStringList("fr,en")).toEqual(["fr", "en"]);
    expect(asStringList([1, "2", null, "3"])).toEqual(["1", "2", "3"]);
    expect(asStringList(null)).toEqual([]);
  });

  it("teamGames tolère un gameIds legacy malformé", () => {
    expect(teamGames({ gameIds: "valorant,lol" })).toEqual(["valorant", "lol"]);
    expect(teamGames({ gameIds: null, gameId: "apex" })).toEqual(["apex"]);
    expect(teamGames({ gameIds: {} })).toEqual([]);
  });

  it("scheduleToForm tolère la forme objet legacy { day: {from,to} }", () => {
    expect(scheduleToForm({ mon: { from: "18:00", to: "21:00" }, tue: { from: "18:00", to: "21:00" } }))
      .toEqual({ days: ["mon", "tue"], from: "18:00", to: "21:00" });
    // forme tableau + entrée malformée : ne jette pas
    expect(scheduleToForm([{ day: "fri", from: "20:00", to: "23:00" }, "junk", null]))
      .toEqual({ days: ["fri"], from: "20:00", to: "23:00" });
    expect(scheduleToForm("pas un planning")).toEqual({ days: [], from: "", to: "" });
    expect(scheduleToForm(undefined)).toEqual({ days: [], from: "", to: "" });
  });

  it("buildProfileSave normalise les champs legacy au lieu de crasher", () => {
    const out = buildProfileSave(
      { pseudo: 123, games: "valorant,apex", roles: "Duelist, IGL", languages: "fr,en", bio: 7, city: 8, vodLink: null, schedule: { days: ["mon"], from: "1", to: "2" }, ranksByGame: ["wrong"], gameHandles: "riotId", socials: null },
      { email: "a@b.c" },
      {}
    );
    expect(out.pseudo).toBe("123");
    expect(out.games).toEqual(["valorant", "apex"]);
    expect(out.roles).toEqual(["Duelist", "IGL"]);
    expect(out.languages).toEqual(["fr", "en"]);
    expect(out.bio).toBe("7");
    expect(out.city).toBe("8");
    expect(out.ranksByGame).toBeNull(); // pas une map → purgée
    expect(out.gameHandles).toBeNull();
    expect(out.socials).toBeNull();
    expect(out.availabilitySchedule).toEqual([{ day: "mon", from: "1", to: "2" }]);
  });
});
