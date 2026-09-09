import { Link } from "react-router-dom";
import { ArrowRight, Swords, Trophy, Users, Briefcase, ShieldCheck, UserSearch } from "lucide-react";
import { useCollection } from "@/hooks/useFirestore";
import { useFilters } from "@/context/FiltersContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { rankOfficial } from "@/lib/db";
import { TeamCard, ScrimCard, TournamentCard, OfferCard } from "@/components/common/Cards";
import { LftCard } from "@/pages/Lft";
import { EmptyState, Skeletons } from "@/components/common/States";
import Seo from "@/components/common/Seo";

const Section = ({ title, to, children, icon: Icon }) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="section-title mb-0"><Icon className="h-3.5 w-3.5" />{title}</h2>
      <Link to={to} className="text-xs text-[#D8CA82] hover:underline inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" /></Link>
    </div>
    {children}
  </section>
);

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apply } = useFilters();
  const teams = useCollection("teams");
  const scrims = useCollection("scrims");
  const tournaments = useCollection("tournaments");
  const offers = useCollection("offers");
  const lft = useCollection("lft");

  const pick = (col, extra = () => true, n = 3) => rankOfficial(apply(col.data).filter(extra)).slice(0, n);
  const official = rankOfficial([...teams.data, ...scrims.data, ...tournaments.data, ...offers.data, ...lft.data].filter((x) => x.isOfficial && x.status !== "closed" && x.status !== "cancelled")).slice(0, 6);

  return (
    <div className="space-y-12">
      <Seo title="ElyHub — Elysium" description={t("home_hero_desc")} path="/" />
      <section className="relative overflow-hidden border border-[#D8CA82]/25 bg-[#141414] p-8 sm:p-12">
        <img src="/brand/pattern.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none" />
        <img src="/brand/accent-blade.png" alt="" className="absolute -right-16 -top-16 w-[420px] opacity-30 pointer-events-none hidden md:block" />
        <div className="relative max-w-2xl">
          <div className="eyebrow mb-3">Elysium · ElyHub</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase leading-[1.05] text-white">{t("home_hero_1")} <span className="text-[#D8CA82]">{t("home_hero_2")}</span></h1>
          <p className="mt-5 text-zinc-400 max-w-lg">{t("home_hero_desc")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!user && <Link to="/register" data-testid="hero-register-button" className="btn-gold">{t("join_now")}</Link>}
            <Link to="/scrims" data-testid="hero-scrims-button" className="btn-outline">{t("find_scrim")}</Link>
            <Link to="/teams" data-testid="hero-teams-button" className="btn-outline">{t("browse_teams")}</Link>
          </div>
        </div>
        <div className="relative mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 max-w-2xl">
          {[[teams.data.length, "nav_teams", Users], [scrims.data.filter((s) => s.status === "open").length, "open_scrims", Swords], [tournaments.data.length, "nav_tournaments", Trophy], [offers.data.filter((o) => o.status === "open").length, "open_offers", Briefcase]].map(([n, k, I]) => (
            <div key={k} className="bg-[#111111] p-4" data-testid={`stat-${k}`}>
              <I className="h-4 w-4 text-[#D8CA82] mb-2" />
              <div className="font-display text-2xl text-white">{n}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t(k)}</div>
            </div>
          ))}
        </div>
      </section>

      {official.length > 0 && (
        <section data-testid="official-section" className="relative border border-[#D8CA82]/40 bg-[#1C1910] p-5 sm:p-6">
          <img src="/brand/accent-brackets-gold.png" alt="" className="absolute right-4 top-4 h-8 opacity-60 pointer-events-none hidden sm:block" />
          <h2 className="section-title text-[#D8CA82]"><ShieldCheck className="h-3.5 w-3.5" />{t("official_announcements")}</h2>
          <div className="grid md:grid-cols-3 gap-3 stagger">
            {official.map((x) => x.slots ? <TournamentCard key={x.id} tournament={x} /> : x.format ? <ScrimCard key={x.id} scrim={x} /> : x.playerId ? <LftCard key={x.id} lft={x} /> : x.role ? <OfferCard key={x.id} offer={x} /> : <TeamCard key={x.id} team={x} />)}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Section title={t("latest_scrims")} to="/scrims" icon={Swords}>
          {scrims.loading ? <Skeletons n={2} className="h-24" /> : pick(scrims, (s) => s.status === "open").length ? <div className="grid gap-3 stagger">{pick(scrims, (s) => s.status === "open").map((s) => <ScrimCard key={s.id} scrim={s} />)}</div> : <EmptyState title={t("no_scrims")} description={t("no_scrims_desc")} action={t("publish_scrim")} to="/scrims/new" testId="empty-scrims-home" />}
        </Section>
        <Section title={t("upcoming_tournaments")} to="/tournaments" icon={Trophy}>
          {tournaments.loading ? <Skeletons n={2} className="h-24" /> : pick(tournaments).length ? <div className="grid gap-3 stagger">{pick(tournaments).map((x) => <TournamentCard key={x.id} tournament={x} />)}</div> : <EmptyState title={t("no_tournaments")} description={t("no_tournaments_desc")} action={t("create_tournament")} to="/tournaments/new" testId="empty-tournaments-home" />}
        </Section>
        <Section title={t("featured_teams")} to="/teams" icon={Users}>
          {teams.loading ? <Skeletons n={2} className="h-24" /> : pick(teams).length ? <div className="grid gap-3 stagger">{pick(teams).map((x) => <TeamCard key={x.id} team={x} />)}</div> : <EmptyState title={t("no_teams")} description={t("no_teams_desc")} action={t("create_team")} to="/teams/new" testId="empty-teams-home" />}
        </Section>
        <Section title={t("lft_title")} to="/players?tab=lft" icon={UserSearch}>
          {lft.loading ? <Skeletons n={2} className="h-24" /> : pick(lft, (x) => x.status === "open").length ? <div className="grid gap-3 stagger">{pick(lft, (x) => x.status === "open").map((x) => <LftCard key={x.id} lft={x} />)}</div> : <EmptyState icon={UserSearch} title={t("no_lft")} description={t("no_lft_desc")} action={user ? t("create_lft") : null} to="/lft/new" testId="empty-lft-home" />}
        </Section>
        <Section title={t("open_offers")} to="/teams?tab=offers" icon={Briefcase}>
          {offers.loading ? <Skeletons n={2} className="h-24" /> : pick(offers, (o) => o.status === "open").length ? <div className="grid gap-3 stagger">{pick(offers, (o) => o.status === "open").map((o) => <OfferCard key={o.id} offer={o} />)}</div> : <EmptyState title={t("no_offers")} description={t("no_offers_desc")} testId="empty-offers-home" />}
        </Section>
      </div>
    </div>
  );
}
