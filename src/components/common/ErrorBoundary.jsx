import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RotateCw } from "lucide-react";
import { isFirebaseConfigured, missingEnvVars } from "@/lib/firebase";
import { useI18n } from "@/i18n";

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

// État d'erreur « par page » : une exception pendant le rendu d'une route
// n'empêche plus tout le site — l'utilisateur voit un message lisible (et non
// un message minifié type « o is not a function »), peut réessayer ou revenir
// à l'accueil, et la navigation reste fonctionnelle.
function RouteErrorState({ error, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="card-elysium flex flex-col items-start gap-4 p-8 border-red-500/40 my-8" role="alert" data-testid="route-error-state">
      <div className="h-10 w-10 grid place-items-center bg-red-500/10 border border-red-500/30">
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>
      <div>
        <h2 className="font-display text-sm uppercase tracking-wider text-white">{t("page_crashed")}</h2>
        <p className="mt-1 text-sm text-zinc-400 max-w-md">{t("page_crashed_desc")}</p>
        {error?.message && (
          <pre className="mt-3 border border-white/10 bg-black/40 p-2 text-[10px] text-red-300 whitespace-pre-wrap break-words font-mono">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" data-testid="route-error-retry" onClick={onRetry} className="btn-gold text-xs">
          <RotateCw className="h-4 w-4" />{t("retry")}
        </button>
        <Link to="/" className="btn-outline text-xs">{t("back_home")}</Link>
      </div>
    </div>
  );
}

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Réinitialise l'erreur quand la route change (nouveau resetKey) :
  // naviguer suffit à « réessayer » la page.
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ElyHub] Erreur de page", error, info?.componentStack);
  }

  render() {
    if (this.state.error) return <RouteErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}
