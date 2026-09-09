// api/og-image.ts — image Open Graph générée par fiche (1200×630).
// Usage : /api/og-image?type=team|tournament|player|game|default&name=…&subtitle=…&color=…
//
// Runtime Node.js (PAS Edge) : le bundler Edge de Vercel ne sait pas embarquer les
// assets WASM/polices de @vercel/og hors d'un projet Next.js (erreur connue
// « The Edge Function is referencing unsupported modules »). Sur le runtime Node,
// @vercel/og fonctionne sans binaire natif (satori + resvg-wasm).
// Pas de JSX (createElement) : la compilation TS des fonctions Vercel n'active pas
// --jsx hors Next.js, et un import statique produirait un require() d'un module ESM.
export const config = { runtime: "nodejs" };

const e = (tag, style, children = null) => ({ type: tag, props: { style, children } });

const LABELS = { team: "ÉQUIPE", tournament: "TOURNOI", player: "JOUEUR", game: "JEU", default: "PLATEFORME E-SPORT" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "ElyHub").slice(0, 60);
  const subtitle = (searchParams.get("subtitle") || "Elysium · ElyHub").slice(0, 90);
  const type = searchParams.get("type") || "default";
  const color = searchParams.get("color") || "#D8CA82";
  const logo = searchParams.get("logo");
  const label = LABELS[type] || "ELYHUB";

  const { ImageResponse } = await import("@vercel/og");

  const frame = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, #111111 0%, #1c1c1c 60%, #111111 100%)",
    color: "#fff",
    padding: "64px 72px",
    fontFamily: "Inter, system-ui, sans-serif",
    position: "relative",
  };

  return new ImageResponse(
    e("div", frame, [
      e("div", { position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: color, display: "flex" }),
      e("div", { display: "flex", alignItems: "center", gap: "16px" }, [
        e("span", { fontSize: "28px", letterSpacing: "0.35em", color, textTransform: "uppercase", fontWeight: 700 }, "ELYHUB"),
        e("span", { fontSize: "20px", letterSpacing: "0.3em", color: "#a1a1aa", textTransform: "uppercase" }, `· ${label}`),
      ]),
      e("div", { display: "flex", alignItems: "center", gap: "40px" }, [
        logo
          ? e("img", { src: logo, alt: "", width: 160, height: 160, borderRadius: "8px", border: `2px solid ${color}55`, objectFit: "cover" })
          : null,
        e("div", { display: "flex", flexDirection: "column", gap: "12px" }, [
          e("div", { fontSize: "64px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.05, display: "flex" }, name),
          e("div", { fontSize: "26px", color: "#d4d4d8", display: "flex" }, subtitle),
        ]),
      ]),
      e("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
        e("span", { fontSize: "22px", color: "#71717a" }, "Elysium — la plateforme des structures esport"),
        e("span", { fontSize: "22px", color, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }, "elysium-esport.fr"),
      ]),
    ]),
    { width: 1200, height: 630 },
  );
}
