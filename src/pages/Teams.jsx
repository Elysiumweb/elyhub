import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import { useCollection } from "@/hooks/useFirestore";
import { useFilters } from "@/context/FiltersContext";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { rankOfficial } from "@/lib/db";
import { slugToGameId } from "@/lib/constants";
import { TeamCard, OfferCard } from "@/components/common/Cards";
import { EmptyState, PageTitle, Skeletons } from "@/components/common/States";
import { ErrorState } from "@/components/common/ErrorState";
import Seo from "@/components/common/Seo";

export default function Teams() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply } = useFilters();
  const { getGame } = useGames();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "teams";
  const urlGame = slugToGameId(params.get("game") || "");
  const urlGameName = getGame(urlGame)?.name || "";
  const [q, setQ] = useState("");
  const teams = useCollection("teams");
  const offers = useCollection("offers");

  const s = q.toLowerCase();
  const overrides = { gameId: urlGame || undefined };
  const teamList = rankOfficial(apply(teams.data, undefined, overrides)).filter((x) => !s || x.name.toLowerCase().includes(s));
  const offerList = rankOfficial(apply(offers.data, undefined, overrides)).filter((o) => o.status === "open" && (!s || o.role.toLowerCase().includes(s) || o.teamName.toLowerCase().includes(s)));
  const loading = tab === "teams" ? teams.loading : offers.loading;
  const error = tab === "teams" ? teams.error : offers.error;
  const reload = tab === "teams" ? teams.reload : offers.reload;
  const list = tab === "teams" ? teamList : offerList;

  return (
    <div>
      <Seo title={tab === "teams" ? t("teams_title") : t("offers_title")} description={t("teams_title")} path={tab === "teams" ? "/teams" : "/teams?tab=offers"} />
      <PageTitle eyebrow={t("nav_teams")} title={tab === "teams" ? t("teams_title") : t("offers_title")} right={user && <Link to="/teams/new" data-testid="create-team-button" className="btn-gold text-xs"><Plus className="h-4 w-4" />{t("create_team")}</Link>} />
      <div className="flex flex-wrap items-center gap-4 border-b border-white/10 mb-6">
        <button data-testid="teams-tab-teams" onClick={() => setParams({ tab: "teams" })} className={`tab-btn ${tab === "teams" ? "tab-btn-active" : ""}`}>{t("nav_teams")} <span className="text-zinc-600 ml-1">{teamList.length}</span></button>
        <button data-testid="teams-tab-offers" onClick={() => setParams({ tab: "offers" })} className={`tab-btn ${tab === "offers" ? "tab-btn-active" : ""}`}>{t("recruitment_offers")} <span className="text-zinc-600 ml-1">{offerList.length}</span></button>
        <div className="ml-auto flex items-center gap-2 pb-2 w-full sm:w-64">
          <Search className="h-4 w-4 text-zinc-500" />
          <input data-testid="teams-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="input-elysium h-9" />
        </div>
      </div>
      {urlGame && (
        <div className="mb-4" data-testid="teams-url-game-chip">
          <span className="badge border-[#D8CA82]/40 text-[#D8CA82] inline-flex items-center gap-1.5">
            {urlGameName || urlGame}
            <button
              type="button"
              aria-label={t("reset")}
              data-testid="teams-url-game-clear"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("game");
                setParams(next);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
      {error ? <ErrorState error={error} onRetry={reload} testId="error-teams" /> : loading ? <Skeletons n={4} /> : list.length === 0 ? (
        tab === "teams" ? <EmptyState title={t("no_teams")} description={t("no_teams_desc")} action={user ? t("create_team") : t("login")} to={user ? "/teams/new" : "/login"} testId="empty-teams" />
          : <EmptyState title={t("no_offers")} description={t("no_offers_desc")} testId="empty-offers" />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger" data-testid={`${tab}-grid`}>
          {tab === "teams" ? list.map((x) => <TeamCard key={x.id} team={x} />) : list.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}
    </div>
  );
}
