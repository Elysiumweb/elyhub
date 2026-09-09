import { Suspense, lazy } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FiltersProvider } from "@/context/FiltersContext";
import { GamesProvider } from "@/context/GamesContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { I18nProvider } from "@/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import ConfigWarning from "@/components/common/ConfigWarning";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Skeletons } from "@/components/common/States";
import NotFound from "@/pages/NotFound";

// Découpage du code par route (0 React.lazy avant) : chaque page part dans son
// propre chunk, le bundle initial ne contient plus que le socle (Firebase, layout).
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Account = lazy(() => import("@/pages/Account"));
const Teams = lazy(() => import("@/pages/Teams"));
const TeamCreate = lazy(() => import("@/pages/TeamCreate"));
const TeamDetail = lazy(() => import("@/pages/TeamDetail"));
const TeamDashboard = lazy(() => import("@/pages/TeamDashboard"));
const OfferDetail = lazy(() => import("@/pages/Offers").then((m) => ({ default: m.OfferDetail })));
const OfferCreate = lazy(() => import("@/pages/Offers").then((m) => ({ default: m.OfferCreate })));
const Players = lazy(() => import("@/pages/Players").then((m) => ({ default: m.Players })));
const PlayerProfile = lazy(() => import("@/pages/Players"));
const MyApplications = lazy(() => import("@/pages/MyApplications"));
const Messages = lazy(() => import("@/pages/Messages"));
const Scrims = lazy(() => import("@/pages/Scrims").then((m) => ({ default: m.default })));
const ScrimCreate = lazy(() => import("@/pages/Scrims").then((m) => ({ default: m.ScrimCreate })));
const ScrimDetail = lazy(() => import("@/pages/ScrimDetail"));
const Tournaments = lazy(() => import("@/pages/Tournaments").then((m) => ({ default: m.default })));
const TournamentCreate = lazy(() => import("@/pages/Tournaments").then((m) => ({ default: m.TournamentCreate })));
const TournamentDetail = lazy(() => import("@/pages/TournamentDetail"));
const LftCreate = lazy(() => import("@/pages/Lft").then((m) => ({ default: m.LftCreate })));
const Admin = lazy(() => import("@/pages/Admin"));
const Glossary = lazy(() => import("@/pages/Glossary"));
const Help = lazy(() => import("@/pages/Help"));
const Guides = lazy(() => import("@/pages/Guides"));
const Esport = lazy(() => import("@/pages/Esport"));
const About = lazy(() => import("@/pages/About"));
const News = lazy(() => import("@/pages/News"));
const NewsDetail = lazy(() => import("@/pages/News").then((m) => ({ default: m.NewsDetail })));
const Careers = lazy(() => import("@/pages/Careers"));
const Events = lazy(() => import("@/pages/Events"));
const Ambassadors = lazy(() => import("@/pages/Ambassadors"));
const Legal = lazy(() => import("@/pages/Legal"));
const Contact = lazy(() => import("@/pages/Contact"));
const Press = lazy(() => import("@/pages/Press"));
const Partners = lazy(() => import("@/pages/Partners"));
const GameHub = lazy(() => import("@/pages/GameHub"));

const PageLoader = () => (
  <div className="py-16">
    <Skeletons n={3} />
  </div>
);

const Protected = ({ admin = false }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.onboarded && pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  if (admin && !isAdmin) return <NotFound />;
  return <Outlet />;
};

const PublicOnly = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <Login />;
};

function App() {
  return (
    <I18nProvider>
      <HelmetProvider>
        <AuthProvider>
          <FiltersProvider>
            <GamesProvider>
              <NotificationsProvider>
                <TooltipProvider delayDuration={200}>
                  <BrowserRouter>
                    {!isFirebaseConfigured && <ConfigWarning />}
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/login" element={<PublicOnly />} />
                        <Route path="/register" element={<PublicOnly />} />
                        <Route element={<Layout />}>
                          <Route index element={<Home />} />
                          <Route path="/teams" element={<Teams />} />
                          <Route path="/teams/:id" element={<TeamDetail />} />
                          <Route path="/offers/:id" element={<OfferDetail />} />
                          <Route path="/players" element={<Players />} />
                          <Route path="/players/:id" element={<PlayerProfile />} />
                          <Route path="/scrims" element={<Scrims />} />
                          <Route path="/scrims/:id" element={<ScrimDetail />} />
                          <Route path="/tournaments" element={<Tournaments />} />
                          <Route path="/tournaments/:id" element={<TournamentDetail />} />
                          {/* Hubs par jeu (SEO) : /valorant, /valorant/equipes, /league-of-legends/tournois…
                             Route dynamique : les slugs inconnus retombent sur NotFound (GameHub). */}
                          <Route path="/:slug" element={<GameHub />} />
                          <Route path="/:slug/:section" element={<GameHub />} />
                          {/* Pages grand public */}
                          <Route path="/glossaire" element={<Glossary />} />
                          <Route path="/aide" element={<Help />} />
                          <Route path="/guides" element={<Guides />} />
                          <Route path="/esport" element={<Esport />} />
                          <Route path="/a-propos" element={<About />} />
                          <Route path="/actu" element={<News />} />
                          <Route path="/actu/:id" element={<NewsDetail />} />
                          <Route path="/carrieres" element={<Careers />} />
                          <Route path="/evenements" element={<Events />} />
                          <Route path="/ambassadeurs" element={<Ambassadors />} />
                          {/* Pages légales & institutionnelles */}
                          <Route path="/mentions-legales" element={<Legal kind="legal" />} />
                          <Route path="/cgu" element={<Legal kind="cgu" />} />
                          <Route path="/confidentialite" element={<Legal kind="privacy" />} />
                          <Route path="/cookies" element={<Legal kind="cookies" />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/presse" element={<Press />} />
                          <Route path="/partenaires" element={<Partners />} />
                          <Route element={<Protected />}>
                            <Route path="/onboarding" element={<Onboarding />} />
                            <Route path="/account" element={<Account />} />
                            <Route path="/dashboard" element={<TeamDashboard />} />
                            <Route path="/teams/new" element={<TeamCreate />} />
                            <Route path="/teams/:teamId/offers/new" element={<OfferCreate />} />
                            <Route path="/applications" element={<MyApplications />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/messages/:id" element={<Messages />} />
                            <Route path="/scrims/new" element={<ScrimCreate />} />
                            <Route path="/tournaments/new" element={<TournamentCreate />} />
                            <Route path="/lft/new" element={<LftCreate />} />
                          </Route>
                          <Route element={<Protected admin />}>
                            <Route path="/admin" element={<Admin />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                  <Toaster
                    theme="dark"
                    position="top-right"
                    toastOptions={{ className: "!bg-[#181818] !border-[#D8CA82]/30 !text-white !rounded-none" }}
                  />
                </TooltipProvider>
              </NotificationsProvider>
            </GamesProvider>
          </FiltersProvider>
        </AuthProvider>
      </HelmetProvider>
    </I18nProvider>
  );
}

export default App;
