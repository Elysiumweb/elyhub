import { FIREBASE_ENV, missingFirebaseEnv } from "@/lib/firebase";

// Affiché à la place de l'application quand Firebase ne peut pas démarrer
// (variables FIREBASE_* absentes au moment du build).
export default function SetupRequired() {
  return (
    <div data-testid="setup-required" className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border border-[#D8CA82]/40 bg-[#181818] p-8 sm:p-10">
        <img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-8 mb-8" />
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D8CA82] mb-3">Configuration requise</div>
        <h1 className="font-display text-2xl sm:text-3xl uppercase leading-tight">
          Firebase n'est pas <span className="text-[#D8CA82]">configuré</span>
        </h1>
        <p className="mt-4 text-sm text-zinc-400">
          Le site a été compilé sans les variables d'environnement Firebase. Ajoutez-les dans
          <span className="text-white"> Vercel → Settings → Environment Variables</span> (environnement <em>Production</em>,
          et <em>Preview</em> si besoin), puis <span className="text-white">redéployez</span> : ces valeurs ne sont
          injectées qu'au moment du build.
        </p>

        <ul className="mt-6 grid gap-1.5 font-mono text-xs">
          {FIREBASE_ENV.map((v) => (
            <li key={v.name} className="flex items-center gap-3">
              <span className={`h-2 w-2 shrink-0 ${v.present ? "bg-emerald-400" : v.required ? "bg-red-500" : "bg-zinc-600"}`} />
              <span className={v.present ? "text-zinc-300" : v.required ? "text-red-300" : "text-zinc-500"}>{v.name}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500">
                {v.present ? "ok" : v.required ? "manquante" : "optionnelle"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-zinc-500">
          Les valeurs se trouvent dans la console Firebase : <span className="text-zinc-300">Paramètres du projet → Vos applications → Configuration du SDK</span>.
          Pensez aussi à ajouter votre domaine Vercel dans <span className="text-zinc-300">Authentication → Settings → Authorized domains</span>.
        </p>
        <p className="mt-2 text-[11px] text-zinc-600">Manquantes : {missingFirebaseEnv.join(", ")}</p>
      </div>
    </div>
  );
}
