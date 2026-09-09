import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { useNotifications } from "@/context/NotificationsContext";
import { relTime } from "@/lib/time";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const NotificationBell = () => {
  const { t } = useI18n();
  const { items, unread, markRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button data-testid="notification-bell" className="btn-ghost h-9 w-9 p-0 relative grid place-items-center" aria-label={t("notifications")}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span data-testid="notification-badge" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D8CA82] text-[#111111] text-[10px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-display text-xs uppercase tracking-widest text-zinc-400">{t("notif_center")}</span>
          {unread > 0 && (
            <button data-testid="mark-all-read" onClick={markAllRead} className="text-[10px] text-[#D8CA82] hover:underline inline-flex items-center gap-1">
              <CheckCheck className="h-3 w-3" />
              {t("mark_all_read")}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-zinc-500">{t("no_notifications")}</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                to={n.link || "#"}
                data-testid={`notification-${n.id}`}
                onClick={() => markRead(n.id)}
                className={`!py-2 !px-2 border-b border-white/5 last:border-0 ${n.read ? "opacity-60" : "bg-[#D8CA82]/5"}`}
              >
                <div className="min-w-0">
                  <div className="text-xs text-white leading-snug">{t(`notif_${n.type}`, n.params || {})}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{relTime(n.createdAt, t)}</div>
                </div>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#D8CA82] shrink-0" />}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
