/**
 * Fumée de rendu (SSR) de toutes les pages : attrape les crashes du type
 * « X is not a function » (import manquant, fonction undefined au rendu,
 * déstructuration d'un contexte absent) qui, en production minifiée,
 * laissaient l'utilisateur sur un écran d'erreur « o is not a function ».
 *
 * Firebase n'est pas configuré dans l'environnement de test : les hooks de
 * données (useCollection/useDocument) ne s'abonnent pas — les pages rendent
 * leurs états vides (EmptyState/NotFound), ce qui est exactement ce qu'on teste.
 */
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
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
import { LftCard, LftCreate } from "@/pages/Lft";
import MyApplications from "@/pages/MyApplications";
import Messages from "@/pages/Messages";
import Onboarding, { ProfileForm } from "@/pages/Onboarding";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import GameHub from "@/pages/GameHub";
import Glossary from "@/pages/Glossary";
import News from "@/pages/News";

// Route de chaque page dans son contexte d'URL (params optionnels).
const ROUTES = [
  ["/", <Home key="home" />],
  ["/teams", <Teams key="teams" />],
  ["/teams/new", <TeamCreate key="team-create" />],
  ["/teams/t1", <TeamDetail key="team-detail" />],
  ["/dashboard", <TeamDashboard key="dashboard" />],
  ["/offers/o1", <Offers key="offer" />],
  ["/teams/t1/offers/new", <OfferCreate key="offer-create" />],
  ["/players", <PlayersPage.Players key="players" />],
  ["/players/p1", <PlayersPage.default key="player" />],
  ["/scrims", <Scrims key="scrims" />],
  ["/scrims/new", <ScrimCreate key="scrim-create" />],
  ["/scrims/s1", <ScrimDetail key="scrim-detail" />],
  ["/tournaments", <Tournaments key="tournaments" />],
  ["/tournaments/new", <TournamentCreate key="tournament-create" />],
  ["/tournaments/tr1", <TournamentDetail key="tournament-detail" />],
  ["/lft/new", <LftCreate key="lft-create" />],
  ["/applications", <MyApplications key="applications" />],
  ["/messages", <Messages key="messages" />],
  ["/onboarding", <Onboarding key="onboarding" />],
  ["/account", <Account key="account" />],
  ["/admin", <Admin key="admin" />],
  ["/valorant", <GameHub key="game-hub" />],
  ["/glossaire", <Glossary key="glossary" />],
  ["/actu", <News key="news" />],
];

const renderPage = (path, element) => renderToString(
  <HelmetProvider>
  <I18nProvider>
    <AuthProvider>
      <FiltersProvider>
        <GamesProvider>
          <NotificationsProvider>
            <TooltipProvider>
              <MemoryRouter initialEntries={[path]}>
                {element}
              </MemoryRouter>
            </TooltipProvider>
          </NotificationsProvider>
        </GamesProvider>
      </FiltersProvider>
    </AuthProvider>
  </I18nProvider>
  </HelmetProvider>,
);

describe("smoke : rendu de toutes les pages sans crash", () => {
  it.each(ROUTES)("%s rend sans exception", (path, element) => {
    expect(() => renderPage(path, element)).not.toThrow();
  });
});

// Le formulaire profil (complet, multi-sections) rend aussi seul, y compris
// pré-rempli avec un profil existant (rangs par jeu, planning, visibilités).
describe("smoke : ProfileForm", () => {
  it("rend sans exception (vide et pré-rempli)", () => {
    expect(() => renderPage("/account", <ProfileForm initial={null} />)).not.toThrow();
    expect(() => renderPage("/account",
      <ProfileForm initial={{
        pseudo: "ninja", games: ["valorant", "rocket-league"],
        ranksByGame: { valorant: "Immortal" }, level: "pro", ageRange: "18+",
        country: "fr", city: "Lyon", availabilitySchedule: [{ day: "sat", from: "20:00", to: "23:00" }],
        gameHandles: { riotId: "N#FR" }, socials: { discord: "ninja#0" }, vodLink: "https://youtu.be/x",
        visibility: { public: true, hideDirectory: false, hideRank: true },
      }} />,
    )).not.toThrow();
  });
});

// La fiche publique d'un joueur rend (projection profiles).
describe("smoke : fiche publique enrichie", () => {
  it("renderPage joueur rend sans exception", () => {
    expect(() => renderPage("/players/p1", <LftCard lft={{ id: "l1", playerId: "p1", playerPseudo: "ninja", gameId: "valorant", rank: "Immortal" }} />)).not.toThrow();
  });
});
