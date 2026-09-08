import { Component } from "react";
import { isFirebaseConfigured, missingEnvVars } from "@/lib/firebase";

const isFr = () => {
  try {
    return (localStorage.getItem("elyhub.lang") || "fr") !== "en";
  } catch {
    return true;
  }
};

/**
 * Écran affiché quand React ne peut pas monter l'application.
 * Sans lui, une simple exception laissait l'utilisateur devant un écran noir.
 */
export function ErrorScreen({ error, title, hint }) {
  const fr = isFr();
  const message = error?.message || String(error || "");
  const heading = title || (fr ? "L'application n'a pas pu démarrer" : "The app failed to start");
  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-xl border border-[#D8CA82]/25 bg-[#141414] p-8">
        <div className="eyebrow mb-3">Elysium · ElyHub</div>
        <h1 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-white flex items-center gap-3">
          <span className="text-[#D8CA82]">&lt;</span>{heading}<span className="text-[#D8CA82]">&gt;</span>
        </h1>
        {message && (
          <pre className="mt-4 border border-white/10 bg-black/40 p-3 text-xs text-red-300 whitespace-pre-wrap break-words font-mono">
            {message}
          </pre>
        )}
        {!isFirebaseConfigured && (
          <p className="mt-4 text-sm text-zinc-400">
            {fr ? "Configuration Firebase absente : " : "Missing Firebase configuration: "}
            <code className="text-[#D8CA82]">{missingEnvVars.join(", ")}</code>
            <br />
            {fr
              ? "Renseignez ces variables sur Vercel (Project → Settings → Environment Variables, Production + Preview) puis redéployez."
              : "Set these variables on Vercel (Project → Settings → Environment Variables, Production + Preview), then redeploy."}
          </p>
        )}
        {hint && <p className="mt-4 text-sm text-zinc-400">{hint}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-gold">
            {fr ? "Recharger" : "Reload"}
          </button>
          <a href="/" className="btn-outline">
            {fr ? "Accueil" : "Home"}
          </a>
        </div>
        <p className="mt-4 text-[11px] text-zinc-600">
          {fr
            ? "Le détail de l'erreur est disponible dans la console du navigateur."
            : "Full error details are available in the browser console."}
        </p>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ElyHub] Erreur de rendu", error, info?.componentStack);
  }

  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}
