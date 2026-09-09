import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n";

const SITE = "ElyHub";
const DEFAULT_DESC = "ElyHub · la plateforme esport d'Elysium : équipes, recrutement, scrims et tournois en France et en Europe.";
const BASE = process.env.SITE_URL || process.env.REACT_APP_SITE_URL || "";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// SEO par route : titre, description, canonical, Open Graph, Twitter Card, JSON-LD.
// Chaque page publique doit fournir un <Seo title=… description=… />.
// image : /api/og-image?type=team&name=… (générée par fiche) — défaut : carte générique.
export default function Seo({ title, description = DEFAULT_DESC, path = null, image = null, type = "website", jsonLd = null, noindex = false }) {
  const { lang } = useI18n();
  const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — Elysium Esports`;
  const canonical = BASE ? `${BASE}${path || ""}` : null;
  const ogImage = image || `${BASE}/api/og-image?type=default&name=${encodeURIComponent(SITE)}`;
  const ogType = type === "article" ? "article" : "website";
  const ogLocale = lang === "fr" ? "fr_FR" : "en_GB";
  const ld = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={esc(description)} />
      {noindex && <meta name="robots" content="noindex" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {BASE && <link rel="alternate" hrefLang={lang} href={canonical || BASE} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={esc(fullTitle)} />
      <meta property="og:description" content={esc(description)} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={ogLocale} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={esc(fullTitle)} />
      <meta name="twitter:description" content={esc(description)} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD (résultats enrichis Google) */}
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

// ── Blocs JSON-LD par entité ─────────────────────────────────────────────────
export const ldOrg = (name, url, logo) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name,
  url,
  logo: logo || `${BASE}/brand/logo-icon-gold.png`,
});

export const ldTeam = (team, g) => ({
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  name: team.name,
  url: `${BASE}/teams/${team.id}`,
  sport: g?.name || "Esports",
  logo: team.logo || null,
  member: (team.members || []).map((m) => ({ "@type": "Person", name: m.pseudo })),
  ...(team.founded && { foundingDate: String(team.founded) }),
  ...(team.country && { location: { "@type": "Country", name: team.country } }),
});

export const ldTournament = (tr, g, startDate) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: tr.name,
  url: `${BASE}/tournaments/${tr.id}`,
  sport: g?.name || "Esports",
  eventStatus: tr.status === "finished" ? "https://schema.org/EventCompleted" : tr.status === "ongoing" ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  organizer: tr.organizerName ? { "@type": "Organization", name: tr.organizerName } : undefined,
  ...(startDate && { startDate }),
  ...(tr.prizePool && { offers: { "@type": "Offer", price: String(tr.prizePool), priceCurrency: "EUR" } }),
});

export const ldPerson = (p) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: p.pseudo,
  url: `${BASE}/players/${p.id}`,
  ...(p.bio && { description: p.bio }),
  ...(p.country && { nationality: { "@type": "Country", name: p.country } }),
});

export const ldJobPosting = (offer) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: offer.role,
  description: offer.description || "",
  datePosted: new Date(offer.createdAt || Date.now()).toISOString(),
  hiringOrganization: { "@type": "Organization", name: offer.teamName, url: `${BASE}/teams/${offer.teamId}` },
  employmentType: "VOLUNTEER",
  ...(offer.rank && { qualifications: `Rang minimum : ${offer.rank}` }),
});

export const ldBreadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${BASE}${it.path}`,
  })),
});
