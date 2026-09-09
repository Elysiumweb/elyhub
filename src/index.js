import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import ErrorBoundary, { ErrorScreen } from "@/components/common/ErrorBoundary";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

let mounted = false;
const renderFatal = (error) => root.render(<ErrorScreen error={error} />);

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  mounted = true;
} catch (error) {
  // Erreur synchrone au montage : sans ce filet, #root restait vide (écran noir).
  renderFatal(error);
}

// Une exception levée avant le montage (module, bundle corrompu…) ne peut pas être
// attrapée par l'ErrorBoundary : on affiche alors l'écran d'erreur à la place du vide.
window.addEventListener("error", (event) => {
  if (!mounted || !container.hasChildNodes()) renderFatal(event.error || event.message);
});

// PWA : enregistrement du service worker uniquement en production (le dev server
// ne sert pas /sw.js, et le cache gênerait le hot reload).
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* hors-ligne indisponible — non bloquant */
    });
  });
}
