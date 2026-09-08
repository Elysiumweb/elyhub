import { AlertTriangle } from "lucide-react";
import { missingEnvVars } from "@/lib/firebase";
import { useI18n } from "@/i18n";

/**
 * Bandeau visible quand le build n'a reçu aucune configuration Firebase :
 * le site reste consultable, mais les données Firestore sont vides.
 */
export function ConfigWarning() {
  const { lang } = useI18n();
  const fr = lang !== "en";
  return (
    <div data-testid="config-warning" className="bg-[#2a2410] border-b border-[#D8CA82]/40 text-[#D8CA82]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-2 flex items-start gap-2 text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          {fr
            ? "Configuration Firebase manquante : le site s'affiche mais aucune donnée ne peut être chargée."
            : "Missing Firebase configuration: the site renders but no data can be loaded."}{" "}
          <code className="font-mono">{missingEnvVars.join(", ")}</code> —{" "}
          {fr
            ? "à définir sur Vercel (Project → Settings → Environment Variables, Production + Preview) puis redéployer."
            : "set them on Vercel (Project → Settings → Environment Variables, Production + Preview) then redeploy."}
        </p>
      </div>
    </div>
  );
}

export default ConfigWarning;
