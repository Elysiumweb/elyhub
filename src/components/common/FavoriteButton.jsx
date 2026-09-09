import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { isFavorite, toggleFavorite } from "@/lib/db";
import { cn } from "@/lib/utils";

// Suivre / ne plus suivre une équipe, un tournoi, un organisateur.
export const FavoriteButton = ({ kind, id, className = "", testId = "favorite-button" }) => {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  if (!user) return null;
  const fav = isFavorite(profile, kind, id);

  const toggle = async () => {
    const next = await toggleFavorite(profile, kind, id);
    toast.success(next?.includes(id) ? t("following") : t("unfollow"));
  };

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={toggle}
      className={cn("btn-ghost text-xs inline-flex items-center gap-1.5", fav && "!text-[#D8CA82]", className)}
      title={fav ? t("unfollow") : t("follow")}
    >
      <Heart className={cn("h-3.5 w-3.5", fav && "fill-[#D8CA82]")} />
      {fav ? t("following") : t("follow")}
    </button>
  );
};
