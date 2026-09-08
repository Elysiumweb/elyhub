import { Link } from "react-router-dom";
import { where } from "firebase/firestore";
import { Inbox } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { GameBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, PageTitle, Skeletons } from "@/components/common/States";

export default function MyApplications() {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const { getGame } = useGames();
  const { data, loading } = useCollection("applications", [where("playerId", "==", user?.uid || "-")], [user?.uid], !!user);
  const list = [...data].sort((a, b) => b.createdAt - a.createdAt);
  const counts = ["sent", "seen", "accepted", "refused"].map((s) => [s, data.filter((a) => a.status === s).length]);

  return (
    <div className="max-w-4xl">
      <PageTitle eyebrow={t("nav_players")} title={t("my_applications")} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {counts.map(([s, n]) => <div key={s} className="card-elysium p-3 flex items-center justify-between" data-testid={`applications-count-${s}`}><StatusBadge status={s} /><span className="font-display text-lg text-white">{n}</span></div>)}
      </div>
      {loading ? <Skeletons n={3} className="h-20" /> : list.length === 0 ? <EmptyState icon={Inbox} title={t("no_applications")} description={t("no_applications_desc")} action={t("browse_offers")} to="/teams?tab=offers" testId="empty-applications" /> : (
        <div className="grid gap-2" data-testid="applications-list">
          {list.map((a) => (
            <Link key={a.id} to={`/offers/${a.offerId}`} data-testid={`application-item-${a.id}`} className="card-elysium p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="font-display text-sm uppercase text-white">{a.offerRole} <span className="text-zinc-500 font-sans normal-case text-xs">@ {a.teamName}</span></div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500"><GameBadge game={getGame(a.gameId)} /><span>{formatDate(a.createdAt, true)}</span></div>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
