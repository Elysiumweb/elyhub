import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Render error", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div data-testid="error-boundary" className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-8">
        <div className="max-w-md border border-red-500/40 bg-[#181818] p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D8CA82] mb-2">ElyHub</div>
          <h1 className="font-display text-xl uppercase">Une erreur est survenue / Something went wrong</h1>
          <p className="text-sm text-zinc-400 mt-2 break-words">{String(this.state.error?.message || this.state.error)}</p>
          <button onClick={() => window.location.assign("/")} className="btn-gold mt-6">Retour à l'accueil / Back home</button>
        </div>
      </div>
    );
  }
}
