import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FiltersProvider } from "@/context/FiltersContext";
import { I18nProvider } from "@/i18n";
import Layout from "@/components/layout/Layout";
import { Skeletons } from "@/components/common/States";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Account from "@/pages/Account";
import Teams from "@/pages/Teams";
import TeamCreate from "@/pages/TeamCreate";
import TeamDetail from "@/pages/TeamDetail";
import TeamDashboard from "@/pages/TeamDashboard";
import OfferDetail, { OfferCreate } from "@/pages/Offers";
import PlayerProfile, { Players } from "@/pages/Players";
import MyApplications from "@/pages/MyApplications";
import Messages from "@/pages/Messages";
import Scrims, { ScrimCreate } from "@/pages/Scrims";
import ScrimDetail from "@/pages/ScrimDetail";
import Tournaments, { TournamentCreate } from "@/pages/Tournaments";
import TournamentDetail from "@/pages/TournamentDetail";
import { LftCreate } from "@/pages/Lft";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const Protected = ({ admin = false }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Skeletons n={3} />;
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
      <AuthProvider>
        <FiltersProvider>
          <BrowserRouter>
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
          </BrowserRouter>
          <Toaster theme="dark" position="top-right" toastOptions={{ className: "!bg-[#181818] !border-[#D8CA82]/30 !text-white !rounded-none" }} />
        </FiltersProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
