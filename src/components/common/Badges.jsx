import { ShieldCheck, Clock } from "lucide-react";
import { STATUS_STYLES } from "@/lib/constants";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status, className, testId }) => {
  const { t } = useI18n();
  return (
    <span data-testid={testId || `status-badge-${status}`} className={cn("badge", STATUS_STYLES[status] || STATUS_STYLES.closed, className)}>
      {t(`status_${status}`)}
    </span>
  );
};

export const GameBadge = ({ game, className, size = "sm" }) => {
  if (!game) return null;
  const pending = game.status === "pending";
  return (
    <span
      data-testid={`game-badge-${game.id}`}
      className={cn("badge gap-1.5", size === "lg" && "text-xs px-3 py-1", pending && "opacity-60", className)}
      style={{ color: game.color, borderColor: `${game.color}55`, backgroundColor: `${game.color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: game.color }} />
      {game.name}
      {pending && <Clock className="h-3 w-3" />}
    </span>
  );
};

export const OfficialBadge = ({ className }) => {
  const { t } = useI18n();
  return (
    <span data-testid="official-badge" className={cn("badge bg-[#D8CA82] text-[#111111] border-[#D8CA82] gap-1 font-bold", className)}>
      <ShieldCheck className="h-3 w-3" /> {t("official")}
    </span>
  );
};

export const PendingBadge = ({ mine }) => {
  const { t } = useI18n();
  return (
    <span data-testid="pending-validation-badge" className={cn("badge gap-1", mine ? STATUS_STYLES.pending : "bg-zinc-700/40 text-zinc-500 border-zinc-600/40")}>
      <Clock className="h-3 w-3" /> {t("pending_validation")}
    </span>
  );
};
