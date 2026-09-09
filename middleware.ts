// Vercel Edge Middleware — routage SPA explicite + vraies 404.
// Les URLs inconnues sont servies par /404.html avec un statut HTTP 404
// (le rewrite catch-all de vercel.json ne s'applique qu'aux routes connues).
//
// ⚠️ Le `matcher` ci-dessous n'exécute le middleware QUE pour les routes « page »
// (sans extension) : /static, /brand, /api, manifest, robots.txt, sw.js… sont
// servis DIRECTEMENT par Vercel avec leur bon Content-Type. Un middleware ne doit
// jamais répondre lui-même aux fichiers statiques (une Response vide serait servie
// telle quelle → « MIME type ('') » + X-Content-Type-Options: nosniff → écran noir).
export const config = {
  matcher: ["/((?!api/|static/|brand/|_next/|favicon\\.ico|.*\\..*).*)"],
};

const SPA_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/account",
  "/dashboard",
  "/applications",
  "/admin",
  "/glossaire",
  "/aide",
  "/guides",
  "/esport",
  "/a-propos",
  "/actu",
  "/carrieres",
  "/evenements",
  "/ambassadeurs",
  "/mentions-legales",
  "/cgu",
  "/confidentialite",
  "/cookies",
  "/contact",
  "/presse",
  "/partenaires",
]);

// Hubs par jeu (SEO) : /valorant, /league-of-legends/tournois…
const GAME_SLUGS = new Set([
  "valorant",
  "league-of-legends",
  "counter-strike-2",
  "rocket-league",
  "apex-legends",
  "overwatch-2",
  "fortnite",
  "ea-fc",
  "rainbow-six-siege",
  "dota2",
]);

const PREFIX_ROUTES = [
  /^\/teams(?:\/|$)/,
  /^\/offers\/[^/]+$/,
  /^\/players(?:\/|$)/,
  /^\/scrims(?:\/|$)/,
  /^\/tournaments(?:\/|$)/,
  /^\/messages(?:\/|$)/,
  /^\/actu\/[^/]+$/,
];

export default function middleware(request) {
  const { pathname } = new URL(request.url);
  const seg = pathname.split("/").filter(Boolean);

  const isKnown =
    SPA_ROUTES.has(pathname) ||
    (seg.length >= 1 && GAME_SLUGS.has(seg[0]) && seg.length <= 2) ||
    PREFIX_ROUTES.some((re) => re.test(pathname));

  const target = isKnown ? "/index.html" : "/404.html";
  return new Response(null, { headers: { "x-middleware-rewrite": target } });
}
