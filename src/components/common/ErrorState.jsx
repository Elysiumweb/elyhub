import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n";

// Erreur de lecture Firestore : les règles de sécurité peuvent refuser une lecture —
// afficher une erreur explicite plutôt qu'un trompeur « Aucune équipe ».
export const ErrorState = ({ error, onRetry, testId = "error-state" }) => {
  const { t } = useI18n();
  return (
    <div data-testid={testId} className="card-elysium flex flex-col items-start gap-3 border-red-500/40 p-8" role="alert">
      <div className="h-10 w-10 grid place-items-center bg-red-500/10 border border-red-500/30">
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>
      <h3 className="font-display text-sm uppercase tracking-wider text-white">{t("error_loading")}</h3>
      <p className="text-sm text-zinc-400 max-w-md">
        {error?.code === "permission-denied" ? t("error_loading_desc") : t("error_loading_desc")}
      </p>
      {onRetry && (
        <button type="button" data-testid="error-retry" onClick={onRetry} className="btn-outline mt-1">
          {t("retry")}
        </button>
      )}
    </div>
  );
};
