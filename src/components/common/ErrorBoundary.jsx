import { Component } from "react";

// Filet de sécurité global : sans lui, la moindre erreur de rendu démonte tout
// l'arbre React et laisse une page vide sans aucune explication.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ElyHub] Erreur de rendu non gérée :", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div data-testid="app-error" className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl border border-red-500/40 bg-[#181818] p-8 sm:p-10">
          <img src="/brand/logo-horizontal-gold.png" alt="Elysium" className="h-8 mb-8" />
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-400 mb-3">Erreur</div>
          <h1 className="font-display text-2xl uppercase">Une erreur est survenue</h1>
          <p className="mt-3 text-sm text-zinc-400">L'application n'a pas pu s'afficher. Rechargez la page ; si le problème persiste, contactez l'équipe Elysium.</p>
          <pre className="mt-5 max-h-48 overflow-auto border border-white/10 bg-[#111111] p-3 text-xs text-red-300 whitespace-pre-wrap break-words">
            {String(error?.message || error)}
          </pre>
          <button type="button" onClick={() => window.location.reload()} className="btn-gold mt-6">Recharger</button>
        </div>
      </div>
    );
  }
}
