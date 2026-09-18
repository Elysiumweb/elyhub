/**
 * Rendu « connecté » de toutes les pages : Firebase factice peuplé de données
 * réalistes, utilisateur ADMIN connecté. Complément du smoke test (qui rend
 * sans données) : il attrape les crashes dépendantes des données — le fameux
 * « o is not a function » minifié — que le rendu à vide ne déclenche pas.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { FiltersProvider } from "@/context/FiltersContext";
import { GamesProvider } from "@/context/GamesContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Teams from "@/pages/Teams";
import TeamCreate from "@/pages/TeamCreate";
import TeamDetail from "@/pages/TeamDetail";
import TeamDashboard from "@/pages/TeamDashboard";
import Offers, { OfferCreate } from "@/pages/Offers";
import * as PlayersPage from "@/pages/Players";
import Scrims, { ScrimCreate } from "@/pages/Scrims";
import ScrimDetail from "@/pages/ScrimDetail";
import Tournaments, { TournamentCreate } from "@/pages/Tournaments";
import TournamentDetail from "@/pages/TournamentDetail";
import { LftCreate } from "@/pages/Lft";
import MyApplications from "@/pages/MyApplications";
import Messages from "@/pages/Messages";
import Onboarding from "@/pages/Onboarding";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import GameHub from "@/pages/GameHub";
import News, { NewsDetail } from "@/pages/News";
import Events from "@/pages/Events";
import Glossary from "@/pages/Glossary";
import { Navbar } from "@/components/layout/Navbar";

// ── Mocks Firebase (hoistés par babel-jest avant les imports ci-dessus) ─────
// Simule le build de production : ADMIN_UID est injecté par webpack (DefinePlugin).
jest.mock("@/lib/constants", () => {
  process.env.ADMIN_UID = "admin-uid";
  return jest.requireActual("@/lib/constants");
});
jest.mock("firebase/firestore", () => require("../../__mocks__/fakeFirestore"));
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

// Polyfills jsdom manquants (navigateur réel : présents).
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false });
}
if (!global.ResizeObserver) global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IS_REACT_ACT_ENVIRONMENT = true;

// ── Données réalistes : contenus officiels (admin) + communauté ────────────
const { __seed } = require("../../__mocks__/fakeFirestore");

const ADMIN_UID = "admin-uid";
const NOW = Date.now();
__seed({
  [`users/${ADMIN_UID}`]: { pseudo: "ElysiumAdmin", email: "admin@elysium.gg", role: "admin", onboarded: true, region: "EU", games: ["valorant"], createdAt: NOW - 9e8 },
  [`profiles/${ADMIN_UID}`]: { pseudo: "ElysiumAdmin", region: "EU", games: ["valorant"], onboarded: true, level: "pro", country: "FR", visibility: { public: true }, createdAt: NOW - 9e8 },
  ["profiles/user2"]: { pseudo: "ninja", region: "EU", games: ["valorant", "lol"], onboarded: true, level: "amateur", country: "BE", visibility: { public: true }, createdAt: NOW - 8e8 },
  ["teams/t-off"]: { name: "Elysium One", gameId: "valorant", gameIds: ["valorant"], ownerId: ADMIN_UID, memberIds: [ADMIN_UID], members: [{ uid: ADMIN_UID, pseudo: "ElysiumAdmin", role: "captain" }], isOfficial: true, region: "EU", status: "active", createdAt: NOW - 7e8 },
  ["teams/t2"]: { name: "Wolfpack", gameId: "lol", ownerId: "user2", memberIds: ["user2"], members: [{ uid: "user2", pseudo: "ninja", role: "captain" }], isOfficial: false, region: "EU", status: "active", createdAt: NOW - 6e8 },
  ["offers/of-off"]: { role: "Duelist", teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, isOfficial: true, status: "open", region: "EU", rank: "Immortal", createdBy: ADMIN_UID, createdAt: NOW - 5e8 },
  ["offers/of2"]: { role: "Jungler", teamId: "t2", teamName: "Wolfpack", gameId: "lol", ownerId: "user2", isOfficial: false, status: "open", region: "EU", createdBy: "user2", createdAt: NOW - 4e8 },
  ["scrims/sc-off"]: { teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, ownerIds: [ADMIN_UID], isOfficial: true, status: "open", region: "EU", format: "BO3", date: "2026-09-20T20:00", createdBy: ADMIN_UID, createdAt: NOW - 3e8 },
  ["scrims/sc2"]: { teamId: "t2", teamName: "Wolfpack", gameId: "lol", ownerId: "user2", ownerIds: ["user2"], isOfficial: false, status: "open", region: "EU", format: "BO1", date: "2026-09-21T19:00", createdBy: "user2", createdAt: NOW - 2e8 },
  ["tournaments/tr-off"]: { name: "Elysium Cup", gameId: "valorant", organizerId: ADMIN_UID, organizerName: "Elysium", isOfficial: true, status: "registration", format: "single_elim", slots: 8, registeredTeamIds: [], registeredTeams: [], region: "EU", startDate: "2026-10-01", createdAt: NOW - 1e8 },
  ["tournaments/tr2"]: { name: "Community Clash", gameId: "lol", organizerId: "user2", organizerName: "ninja", isOfficial: false, status: "registration", format: "round_robin", slots: 4, registeredTeamIds: ["t2"], registeredTeams: [{ id: "t2", name: "Wolfpack", ownerId: "user2" }], region: "EU", startDate: "2026-10-15", createdAt: NOW - 9e7 },
  ["lft/l-off"]: { playerId: ADMIN_UID, playerPseudo: "ElysiumAdmin", gameId: "valorant", rank: "Radiant", roles: ["IGL"], region: "EU", status: "open", isOfficial: true, createdAt: NOW - 8e7 },
  ["lft/l2"]: { playerId: "user2", playerPseudo: "ninja", gameId: "lol", rank: "Diamond", roles: ["Mid"], region: "EU", status: "open", isOfficial: false, createdAt: NOW - 7e7 },
  ["games/g-pending"]: { name: "Marvel Rivals", status: "pending", createdBy: "user2", createdAt: NOW - 6e7 },
  ["games/g-validated"]: { name: "Street Fighter 6", status: "validated", createdBy: "user2", createdAt: NOW - 5e7 },
  ["reports/r-conv"]: { targetType: "conversation", targetId: "c1", reportedBy: "user2", reason: "abuse", createdAt: NOW - 4e7 },
  ["reports/r-team"]: { targetType: "team", targetId: "t2", targetLabel: "Wolfpack", reportedBy: ADMIN_UID, reason: "spam", status: "open", createdAt: NOW - 3e7 },
  ["notifications/n1"]: { recipientId: ADMIN_UID, type: "team_invite_accepted", params: { name: "ninja", team: "Elysium One" }, link: "/teams/t-off", read: false, createdAt: NOW - 2e7 },
  ["conversations/c1"]: { participantIds: [ADMIN_UID, "user2"], participants: { [ADMIN_UID]: { name: "ElysiumAdmin" }, user2: { name: "ninja" } }, type: "player_team", title: "Recrutement", lastMessage: "Salut !", lastAt: NOW - 1e7, lastSenderId: "user2", lastReadAt: {}, blockedBy: [], archivedBy: [], createdAt: NOW - 5e7 },
  ["conversations/c1/messages/m1"]: { senderId: "user2", senderName: "ninja", text: "Salut !", createdAt: NOW - 1e7 },
  ["applications/a1"]: { offerId: "of-off", offerRole: "Duelist", teamId: "t-off", teamName: "Elysium One", gameId: "valorant", ownerId: ADMIN_UID, playerId: "user2", playerPseudo: "ninja", message: "Je suis motivé", status: "sent", createdAt: NOW - 9e6 },
  ["news/nw1"]: { title: "Lancement d'ElyHub", excerpt: "La plateforme est en ligne.", body: "Contenu complet.", authorId: ADMIN_UID, status: "published", publishedAt: NOW - 8e6, createdAt: NOW - 8e6 },
  ["events/ev1"]: { name: "LAN Elysium", location: "Paris", date: "2026-11-01", url: "", ownerId: ADMIN_UID, createdAt: NOW - 7e6 },
  ["invites/i1"]: { teamId: "t-off", teamName: "Elysium One", gameId: "valorant", inviteeId: "user2", inviteePseudo: "ninja", byUid: ADMIN_UID, status: "pending", createdAt: NOW - 6e6 },
});

// [URL rendue, pattern de route (comme dans App.js), élément]
const ROUTES = [
  ["/", "/", <Home key="home" />],
  ["/teams", "/teams", <Teams key="teams" />],
  ["/teams?tab=offers", "/teams", <Teams key="teams-offers" />],
  ["/teams/new", "/teams/new", <TeamCreate key="team-create" />],
  ["/teams/t-off", "/teams/:id", <TeamDetail key="team-detail" />],
  ["/dashboard", "/dashboard", <TeamDashboard key="dashboard" />],
  ["/offers/of-off", "/offers/:id", <Offers key="offer" />],
  ["/teams/t-off/offers/new", "/teams/:teamId/offers/new", <OfferCreate key="offer-create" />],
  ["/players", "/players", <PlayersPage.Players key="players" />],
  ["/players?tab=lft", "/players", <PlayersPage.Players key="players-lft" />],
  ["/players/admin-uid", "/players/:id", <PlayersPage.default key="player-me" />],
  ["/players/user2", "/players/:id", <PlayersPage.default key="player-other" />],
  ["/scrims", "/scrims", <Scrims key="scrims" />],
  ["/scrims/new", "/scrims/new", <ScrimCreate key="scrim-create" />],
  ["/scrims/sc2", "/scrims/:id", <ScrimDetail key="scrim-detail" />],
  ["/tournaments", "/tournaments", <Tournaments key="tournaments" />],
  ["/tournaments/new", "/tournaments/new", <TournamentCreate key="tournament-create" />],
  ["/tournaments/tr-off", "/tournaments/:id", <TournamentDetail key="tournament-detail-off" />],
  ["/tournaments/tr2", "/tournaments/:id", <TournamentDetail key="tournament-detail" />],
  ["/lft/new", "/lft/new", <LftCreate key="lft-create" />],
  ["/applications", "/applications", <MyApplications key="applications" />],
  ["/messages", "/messages", <Messages key="messages" />],
  ["/messages/c1", "/messages/:id", <Messages key="messages-thread" />],
  ["/onboarding", "/onboarding", <Onboarding key="onboarding" />],
  ["/account", "/account", <Account key="account" />],
  ["/admin", "/admin", <Admin key="admin" />],
  ["/valorant", "/:slug", <GameHub key="hub" />],
  ["/valorant/equipes", "/:slug/:section", <GameHub key="hub-teams" />],
  ["/valorant/joueurs", "/:slug/:section", <GameHub key="hub-players" />],
  ["/valorant/lft", "/:slug/:section", <GameHub key="hub-lft" />],
  ["/valorant/offres", "/:slug/:section", <GameHub key="hub-offers" />],
  ["/valorant/scrims", "/:slug/:section", <GameHub key="hub-scrims" />],
  ["/valorant/tournois", "/:slug/:section", <GameHub key="hub-tournaments" />],
  ["/actu", "/actu", <News key="news" />],
  ["/actu/nw1", "/actu/:id", <NewsDetail key="news-detail" />],
  ["/evenements", "/evenements", <Events key="events" />],
  ["/glossaire", "/glossaire", <Glossary key="glossary" />],
];

const renderPage = async (path, pattern, element) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <HelmetProvider>
        <I18nProvider>
          <AuthProvider>
            <FiltersProvider>
              <GamesProvider>
                <NotificationsProvider>
                  <TooltipProvider>
                    <MemoryRouter initialEntries={[path]}>
                      <Routes>
                        <Route path={pattern} element={element} />
                        {/* Après une redirection interne (ex. /messages → /messages/:id),
                            la route testée ne correspond plus : on marque le redirectionnel
                            plutôt que de rendre du vide. */}
                        <Route path="*" element={<div data-testid="redirected" />} />
                      </Routes>
                    </MemoryRouter>
                  </TooltipProvider>
                </NotificationsProvider>
              </GamesProvider>
            </FiltersProvider>
          </AuthProvider>
        </I18nProvider>
      </HelmetProvider>,
    );
  });
  const html = container.innerHTML;
  await act(async () => root.unmount());
  container.remove();
  return html;
};

describe("rendu connecté (données Firestore factices, admin connecté)", () => {
  it.each(ROUTES)("%s rend sans exception", async (path, pattern, element) => {
    await expect(renderPage(path, pattern, element)).resolves.toBeTruthy();
  });
});

// ── Régressions : crash « o is not a function » + règles conversations ──────
describe("messagerie : robustesse (régression « o is not a function »)", () => {
  const renderMessages = async (path) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <I18nProvider>
          <AuthProvider>
            <GamesProvider>
              <MemoryRouter initialEntries={[path]}>
                <Routes>
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:id" element={<Messages />} />
                </Routes>
              </MemoryRouter>
            </GamesProvider>
          </AuthProvider>
        </I18nProvider>,
      );
    });
    await act(async () => { await Promise.resolve(); });
    return { container, root };
  };

  it("Thread : scrollIntoView renvoyant une Promise (polyfill/extension) ne casse plus la page", async () => {
    // Environnement hostile : une extension/un polyfill fait renvoyer une
    // Promise par scrollIntoView(). Avant le correctif, l'effet Thread renvoyait
    // cette valeur EN L'ÉTAT comme cleanup : React 19 l'invoquait tel quel au
    // démontage → TypeError « … is not a function » → ErrorBoundary.
    const hostile = jest.fn(() => Promise.resolve());
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = hostile;
    const errors = [];
    const spy = jest.spyOn(console, "error").mockImplementation((...a) => {
      errors.push(a.map((x) => String(x)).join(" "));
    });
    let ctx;
    try {
      ctx = await renderMessages("/messages/c1");
      expect(ctx.container.querySelector('[data-testid="message-thread"]')).toBeTruthy();
      expect(hostile).toHaveBeenCalled();
      // Démontage (ou changement de conversation) : l'ancien code appelait
      // ici la Promise comme cleanup et crashait.
      await act(async () => { ctx.root.unmount(); });
    } finally {
      Element.prototype.scrollIntoView = original;
      spy.mockRestore();
    }
    await act(async () => { await Promise.resolve(); });
    const crash = errors.filter((e) => e.includes("not a function") || e.includes("The above error occurred"));
    expect(crash).toEqual([]);
  });

  it("Navbar : le compteur de messages non lus ne liste QUE les conversations de l'utilisateur", async () => {
    const { __subs } = require("../../__mocks__/fakeFirestore");
    __subs.length = 0;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <I18nProvider>
          <AuthProvider>
            <FiltersProvider>
              <GamesProvider>
                <NotificationsProvider>
                  <TooltipProvider>
                    <MemoryRouter>
                      <Navbar />
                    </MemoryRouter>
                  </TooltipProvider>
                </NotificationsProvider>
              </GamesProvider>
            </FiltersProvider>
          </AuthProvider>
        </I18nProvider>,
      );
    });
    await act(async () => { await Promise.resolve(); });
    await act(async () => { root.unmount(); });
    container.remove();

    // Les règles Firestore refusent tout list de conversations sans filtre
    // participant : chaque abonnement `conversations` doit donc porter la
    // contrainte where(participantIds, array-contains, uid).
    const convSubs = __subs.filter((s) => s.path === "conversations");
    expect(convSubs.length).toBeGreaterThan(0);
    for (const s of convSubs) {
      expect(s.constraints).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "where", field: "participantIds" })]),
      );
    }
  });
});
