import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/i18n";

const SITE = "ElyHub";
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

// Per-route title / description / canonical / Open Graph / JSON-LD
export const Seo = ({ title, description, image, jsonLd, noindex = false }) => {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const full = title ? `${title} — ${SITE}` : `${SITE} by Elysium`;
  const desc = description || (lang === "fr" ? "Recrutement, scrims et tournois esport : trouvez votre équipe, vos adversaires et vos prochaines compétitions." : "Esports recruitment, scrims and tournaments: find your team, opponents and next competitions.");
  const url = `${ORIGIN}${pathname}`;
  return (
    <Helmet>
      <html lang={lang} />
      <title>{full}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || `${ORIGIN}/brand/logo-horizontal-gold.png`} />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={desc} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", ...jsonLd })}</script>}
    </Helmet>
  );
};

export const teamLd = (team, game) => ({ "@type": "SportsTeam", name: team.name, sport: game?.name, description: team.description, logo: team.logo || undefined, url: `${ORIGIN}/teams/${team.id}`, memberOf: team.isOfficial ? { "@type": "Organization", name: "Elysium" } : undefined, athlete: (team.members || []).map((m) => ({ "@type": "Person", name: m.pseudo })) });
export const tournamentLd = (tr, game) => ({ "@type": "SportsEvent", name: tr.name, description: tr.rules?.slice(0, 300), startDate: tr.startDate, endDate: tr.endDate || undefined, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", location: { "@type": "VirtualLocation", url: `${ORIGIN}/tournaments/${tr.id}` }, organizer: { "@type": "Organization", name: tr.organizerName || "ElyHub" }, sport: game?.name, maximumAttendeeCapacity: tr.slots });
export const playerLd = (p) => ({ "@type": "Person", name: p.pseudo, description: p.bio, image: p.avatar || undefined, url: `${ORIGIN}/players/${p.id}` });
export const offerLd = (o, game) => ({ "@type": "JobPosting", title: `${o.role} — ${o.teamName}`, description: o.description || `${o.role} (${game?.name})`, datePosted: new Date(o.createdAt).toISOString(), employmentType: "VOLUNTEER", hiringOrganization: { "@type": "SportsTeam", name: o.teamName }, jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Place", name: o.region } });
