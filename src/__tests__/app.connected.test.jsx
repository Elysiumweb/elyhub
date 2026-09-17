/**
 * Test de l'APPLICATION COMPLÈTE (App.js : lazy routes + Layout + providers)
 * avec Firestore factice peuplé et admin connecté — au plus proche de la prod.
 * Rendu + navigation + clics sur les flux clés (admin, cookies, filtres…).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";

// Simule le build de production : ADMIN_UID est injecté par webpack (DefinePlugin).
jest.mock("@/lib/constants", () => {
  process.env.ADMIN_UID = "admin-uid";
  return jest.requireActual("@/lib/constants");
});
jest.mock("firebase/firestore", () => require("../__mocks__/fakeFirestore"));
jest.mock("firebase/storage", () => ({
  getStorage: () => ({}),
  ref: () => ({}),
  uploadString: async () => ({}),
  getDownloadURL: async () => "https://example.com/img.jpg",
}));
jest.mock("firebase/auth", () => ({
  getAuth: () => ({}),
  onAuthStateChanged: (_auth, cb) => { cb({ uid: "admin-uid", email: "admin@elysium.gg" }); return () => {}; },
  signOut: async () => {},
  GoogleAuthProvider: class {},
  OAuthProvider: class { setCustomParameters() {} },
  createUserWithEmailAndPassword: async () => ({ user: { uid: "admin-uid" } }),
  signInWithEmailAndPassword: async () => ({ user: { uid: "admin-uid" } }),
  signInWithPopup: async () => ({ user: { uid: "admin-uid" } }),
  sendPasswordResetEmail: async () => {},
  reauthenticateWithCredential: async () => {},
  EmailAuthProvider: { credential: () => ({}) },
  updateEmail: async () => {},
  updatePassword: async () => {},
}));
jest.mock("@/lib/firebase", () => ({
  ...jest.requireActual("@/lib/firebase"),
  isFirebaseConfigured: true,
  isStorageConfigured: false,
}));

if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false });
}
if (!global.ResizeObserver) global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IS_REACT_ACT_ENVIRONMENT = true;

const { __seed, __store } = require("../__mocks__/fakeFirestore");

const ADMIN_UID = "admin-uid";
const NOW = Date.now();
__seed({
  [`users/${ADMIN_UID}`]: { pseudo: "ElysiumAdmin", email: "admin@elysium.gg", role: "admin", onboarded: true, region: "EU", games: ["valorant"], createdAt: NOW - 9e8 },
  [`profiles/${ADMIN_UID}`]: { pseudo: "ElysiumAdmin", region: "EU", games: ["valorant"], onboarded: true, level: "pro", country: "FR", visibility: { public: true }, createdAt: NOW - 9e8 },
  ["profiles/user2"]: { pseudo: "ninja", region: "EU", games: ["valorant", "lol"], onboarded: true, country: "BE", visibility: { public: true }, createdAt: NOW - 8e8 },
  ["teams/t-off"]: { name: "Elysium One", gameId: "valorant", gameIds: ["valorant"], ownerId: ADMIN_UID, memberIds: [ADMIN_UID], members: [{ uid: ADMIN_UID, pseudo: "ElysiumAdmin", role: "captain" }], isOfficial: true, region: "EU", status: "active", createdAt: NOW - 7e8 },
  ["teams/t2"]: { name: "Wolfpack", gameId: "lol", ownerId: "user2", memberIds: ["user2"], members: [{ uid: "user2", pseudo: "ninja", role: "captain" }], isOfficial: false, region: "EU", status: "active", createdAt: NOW - 6e8 },
  ["offers/of-off"]: { role: "Duelist", teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, isOfficial: true, status: "open", region: "EU", rank: "Immortal", createdBy: ADMIN_UID, createdAt: NOW - 5e8 },
  ["offers/of2"]: { role: "Jungler", teamId: "t2", teamName: "Wolfpack", gameId: "lol", ownerId: "user2", isOfficial: false, status: "open", region: "EU", createdBy: "user2", createdAt: NOW - 4e8 },
  ["scrims/sc-off"]: { teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, ownerIds: [ADMIN_UID], isOfficial: true, status: "open", region: "EU", format: "BO3", date: "2026-09-20T20:00", createdBy: ADMIN_UID, createdAt: NOW - 3e8 },
  ["tournaments/tr-off"]: { name: "Elysium Cup", gameId: "valorant", organizerId: ADMIN_UID, organizerName: "Elysium", isOfficial: true, status: "registration", format: "single_elim", slots: 8, registeredTeamIds: [], registeredTeams: [], region: "EU", startDate: "2026-10-01", createdAt: NOW - 1e8 },
  ["lft/l-off"]: { playerId: ADMIN_UID, playerPseudo: "ElysiumAdmin", gameId: "valorant", rank: "Radiant", roles: ["IGL"], region: "EU", status: "open", isOfficial: true, createdAt: NOW - 8e7 },
  ["games/g-pending"]: { name: "Marvel Rivals", status: "pending", createdBy: "user2", createdAt: NOW - 6e7 },
  ["reports/r-team"]: { targetType: "team", targetId: "t2", targetLabel: "Wolfpack", reportedBy: ADMIN_UID, reason: "spam", status: "open", createdAt: NOW - 3e7 },
  ["reports/r-conv"]: { targetType: "conversation", targetId: "c1", reportedBy: "user2", reason: "abuse", createdAt: NOW - 25e6 },
  ["notifications/n1"]: { recipientId: ADMIN_UID, type: "team_invite_accepted", params: { name: "ninja", team: "Elysium One" }, link: "/teams/t-off", read: false, createdAt: NOW - 2e7 },
  ["conversations/c1"]: { participantIds: [ADMIN_UID, "user2"], participants: { [ADMIN_UID]: { name: "ElysiumAdmin" }, user2: { name: "ninja" } }, type: "player_team", title: "Recrutement", lastMessage: "Salut !", lastAt: NOW - 1e7, lastSenderId: "user2", lastReadAt: {}, blockedBy: [], archivedBy: [], createdAt: NOW - 5e7 },
  ["conversations/c1/messages/m1"]: { senderId: "user2", senderName: "ninja", text: "Salut !", createdAt: NOW - 1e7 },
  ["applications/a1"]: { offerId: "of-off", offerRole: "Duelist", teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, playerId: "user2", playerPseudo: "ninja", message: "Je suis motivé", status: "sent", createdAt: NOW - 9e6 },
  ["news/nw1"]: { title: "Lancement d'ElyHub", excerpt: "La plateforme est en ligne.", body: "Contenu.", authorId: ADMIN_UID, status: "published", publishedAt: NOW - 8e6, createdAt: NOW - 8e6 },
  ["events/ev1"]: { name: "LAN Elysium", location: "Paris", date: "2026-11-01", url: "", ownerId: ADMIN_UID, createdAt: NOW - 7e6 },
});

const flush = async (times = 4) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => { await Promise.resolve(); });
  }
};

const navigate = async (to) => {
  await act(async () => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await flush();
};

const click = async (testId) => {
  const el = document.querySelector(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`élément introuvable : ${testId}`);
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await flush();
  return el;
};

describe("application complète connectée (admin)", () => {
  let container;
  let root;

  beforeAll(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<App />); });
    await flush(8);
  });

  afterAll(async () => {
    await act(async () => root.unmount());
    container.remove();
    delete process.env.ADMIN_UID;
  });

  it("accueil : héro, section officielle et chrome (navbar/footer) rendent", () => {
    expect(container.querySelector('[data-testid="nav-logo"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="hero-scrims-button"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
    expect(container.innerHTML).toContain("Elysium One"); // annonce officielle de l'admin
  });

  it("navigation vers /teams, /players, /admin, /account sans crash", async () => {
    await navigate("/teams");
    expect(container.querySelector('[data-testid="teams-grid"]')).toBeTruthy();
    await navigate("/players");
    expect(container.querySelector('[data-testid="players-grid"]')).toBeTruthy();
    await navigate("/players?tab=lft");
    expect(container.querySelector('[data-testid="lft-grid"]')).toBeTruthy();
    await navigate("/admin");
    expect(container.querySelector('[data-testid="pending-games-list"]')).toBeTruthy();
    await navigate("/account");
    expect(container.querySelector('[data-testid="account-tabs"]')).toBeTruthy();
    await navigate("/dashboard");
    expect(container.innerHTML).toContain("Elysium One");
    await navigate("/messages");
    await navigate("/messages/c1");
    expect(container.querySelector('[data-testid="message-thread"]')).toBeTruthy();
  });

  it("admin : valider un jeu en attente met à jour le statut", async () => {
    await navigate("/admin");
    expect(__store["games/g-pending"].status).toBe("pending");
    await click("validate-game-g-pending");
    expect(__store["games/g-pending"].status).toBe("validated");
  });

  it("admin : gérer les signalements (résoudre, supprimer le contenu signalé)", async () => {
    await navigate("/admin");
    await click("admin-tab-reports");
    expect(container.querySelector('[data-testid="report-row-r-team"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="report-row-r-conv"]')).toBeTruthy();

    // Marquer résolu
    await click("report-resolve-r-team");
    expect(__store["reports/r-team"].status).toBe("resolved");

    // Supprimer la conversation signalée (r-conv), puis le signalement
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      await click("report-delete-content-r-conv");
      expect(__store["conversations/c1"]).toBeUndefined();
      expect(__store["reports/r-conv"].status).toBe("resolved");
      await click("report-delete-r-conv");
      expect(__store["reports/r-conv"]).toBeUndefined();
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it("mise en avant : le contenu du compte administrateur est tout en haut", async () => {
    // Équipes : l'équipe officielle (plus ancienne) passe devant la plus récente.
    await navigate("/teams");
    const firstTeam = container.querySelector('[data-testid="teams-grid"] [data-testid^="team-card-"]');
    expect(firstTeam?.getAttribute("data-testid")).toBe("team-card-t-off");
    expect(firstTeam?.querySelector('[data-testid="official-badge"]')).toBeTruthy();

    // Annuaire joueurs : la fiche du compte administrateur remonte en tête.
    await navigate("/players");
    const firstPlayer = container.querySelector('[data-testid="players-grid"] [data-testid^="player-card-"]');
    expect(firstPlayer?.getAttribute("data-testid")).toBe("player-card-admin-uid");

    // Offres : l'offre officielle en tête de l'onglet recrutement.
    await navigate("/teams?tab=offers");
    const firstOffer = container.querySelector('[data-testid="offers-grid"] [data-testid^="offer-card-"]');
    expect(firstOffer?.getAttribute("data-testid")).toBe("offer-card-of-off");

    // Accueil : la section officielle agrège les annonces du compte admin.
    await navigate("/");
    const officialSection = container.querySelector('[data-testid="official-section"]');
    expect(officialSection).toBeTruthy();
    expect(officialSection.textContent).toContain("Elysium One");
  });

  it("cookie banner : accepter masque le bandeau", async () => {
    await navigate("/");
    if (container.querySelector('[data-testid="cookie-banner"]')) {
      await click("cookie-accept");
      expect(container.querySelector('[data-testid="cookie-banner"]')).toBeNull();
    }
  });

  it("palette ⌘K : ouverture et fermeture sans crash", async () => {
    await navigate("/");
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    await flush();
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    await flush();
    expect(container.querySelector('[data-testid="nav-logo"]')).toBeTruthy();
  });
});
