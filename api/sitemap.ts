// api/sitemap.ts — sitemap.xml dynamique : routes statiques + contenus publics Firestore.
// Fonction Vercel Edge, appelée via robots.txt (`Sitemap: {site}/api/sitemap.xml`).
const REST = "https://firestore.googleapis.com/v1/projects";

const valueOf = (v) => {
  if (!v) return null;
  for (const k of ["stringValue", "integerValue", "doubleValue", "booleanValue", "timestampValue"]) {
    if (v[k] !== undefined) return k === "integerValue" || k === "doubleValue" ? Number(v[k]) : v[k];
  }
  return null;
};

const rows = (body) =>
  (body.documents || []).map((d) => {
    const f = d.fields || {};
    const id = d.name.split("/").pop();
    return {
      id,
      createdAt: valueOf(f.createdAt) || 0,
      status: valueOf(f.status),
      name: valueOf(f.name) || valueOf(f.pseudo) || "",
    };
  });

async function fetchCol(projectId, apiKey, col) {
  try {
    const res = await fetch(`${REST}/${projectId}/databases/(default)/documents/${col}?key=${apiKey}&pageSize=300`);
    if (!res.ok) return [];
    return rows(await res.json());
  } catch {
    return [];
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req) {
  const host = process.env.SITE_URL || `https://${process.env.VERCEL_URL || req.headers.get("host")}`;
  const apiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY || "";
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || "";
  const today = new Date().toISOString().slice(0, 10);

  const statics = [
    "/", "/teams", "/players", "/scrims", "/tournaments", "/glossaire", "/aide", "/guides",
    "/esport", "/a-propos", "/actu", "/carrieres", "/evenements", "/ambassadeurs",
    "/mentions-legales", "/cgu", "/confidentialite", "/cookies", "/contact", "/presse", "/partenaires",
    "/valorant", "/valorant/equipes", "/valorant/scrims", "/valorant/tournois", "/league-of-legends", "/counter-strike-2", "/rocket-league",
  ];

  const urls = statics.map((p) => `  <url><loc>${host}${p}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${p === "/" ? "1.0" : "0.8"}</priority></url>`);

  if (apiKey && projectId) {
    const [teams, tournaments, profiles, news] = await Promise.all([
      fetchCol(projectId, apiKey, "teams"),
      fetchCol(projectId, apiKey, "tournaments"),
      fetchCol(projectId, apiKey, "profiles"),
      fetchCol(projectId, apiKey, "news"),
    ]);
    const lastmod = (ts) => (ts ? new Date(ts).toISOString().slice(0, 10) : today);
    teams.forEach((t) => urls.push(`  <url><loc>${host}/teams/${esc(t.id)}</loc><lastmod>${lastmod(t.createdAt)}</lastmod><changefreq>weekly</changefreq></url>`));
    tournaments.forEach((t) => urls.push(`  <url><loc>${host}/tournaments/${esc(t.id)}</loc><lastmod>${lastmod(t.createdAt)}</lastmod><changefreq>weekly</changefreq></url>`));
    profiles.forEach((p) => urls.push(`  <url><loc>${host}/players/${esc(p.id)}</loc><lastmod>${lastmod(p.createdAt)}</lastmod><changefreq>weekly</changefreq></url>`));
    news
      .filter((n) => n.status !== "draft")
      .forEach((n) => urls.push(`  <url><loc>${host}/actu/${esc(n.id)}</loc><lastmod>${lastmod(n.createdAt)}</lastmod><changefreq>weekly</changefreq></url>`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
