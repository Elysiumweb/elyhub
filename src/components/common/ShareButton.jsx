import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

// Copie le lien dans le presse-papiers (+ Web Share API quand disponible).
export const ShareButton = ({ title, className = "", testId = "share-button" }) => {
  const { t } = useI18n();
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("share"));
    } catch {
      /* annulé par l'utilisateur */
    }
  };
  return (
    <button type="button" data-testid={testId} onClick={share} className={`btn-ghost text-xs inline-flex items-center gap-1.5 ${className}`} title={t("share")}>
      <Share2 className="h-3.5 w-3.5" />
      {t("share")}
    </button>
  );
};
