import {
  teamGames, normalizeTeamGames, profileToPublic, buildProfileSave,
  buildSchedule, scheduleToForm, hasSchedule, isMinorProfile, isVerified,
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
