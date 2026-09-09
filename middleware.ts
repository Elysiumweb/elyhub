// Vercel Edge Middleware — routage SPA explicite + vraies 404.
// Les URLs inconnues sont servies par /404.html avec un statut HTTP 404
// (le rewrite catch-all de vercel.json ne s'applique qu'aux routes connues).
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

const STATIC_EXTS = /\.(png|jpe?g|gif|svg|webp|ico|txt|xml|webmanifest|json|css|js|woff2?|map)$/i;

export default function middleware(request) {
  const { pathname } = new URL(request.url);

  if (
    pathname === "/index.html" ||
    pathname === "/404.html" ||
    pathname === "/sw.js" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/brand/") ||
    STATIC_EXTS.test(pathname)
  ) {
    return new Response(null, { status: 200 }); // laisser passer tel quel
  }

  const seg = pathname.split("/").filter(Boolean);
  const isKnown =
    SPA_ROUTES.has(pathname) ||
    (seg[0] === "game" && seg.length >= 2 && seg.length <= 3) ||
    (seg.length >= 1 && GAME_SLUGS.has(seg[0]) && seg.length <= 2) ||
    PREFIX_ROUTES.some((re) => re.test(pathname));

  const target = isKnown ? "/index.html" : "/404.html";
  return new Response(null, { headers: { "x-middleware-rewrite": target } });
}
