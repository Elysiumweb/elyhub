import { Check, X, ShieldCheck, Flag } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { setGameStatus } from "@/lib/db";
import { PendingBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, PageTitle, Skeletons } from "@/components/common/States";

export default function Admin() {
  const { t, formatDate } = useI18n();
  const games = useCollection("games");
  const reports = useCollection("reports");
  const pending = games.data.filter((g) => g.status === "pending");
  const others = games.data.filter((g) => g.status !== "pending");
  const act = async (id, status) => { await setGameStatus(id, status); toast.success(t("saved")); };

  return (
    <div className="max-w-4xl space-y-10">
      <PageTitle eyebrow={<span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{t("official")}</span>} title={t("nav_admin")} />
      <section>
        <h2 className="section-title">{t("games_pending_validation")} ({pending.length})</h2>
        {games.loading ? <Skeletons n={2} className="h-16" /> : pending.length === 0 ? <EmptyState title={t("no_pending_games")} description={t("no_pending_games_desc")} testId="empty-pending-games" /> : (
          <div className="grid gap-2" data-testid="pending-games-list">
            {pending.map((g) => (
              <div key={g.id} data-testid={`pending-game-${g.id}`} className="card-elysium p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1"><div className="font-display text-sm uppercase text-white">{g.name}</div><div className="text-xs text-zinc-400">{t("proposed_by")} {g.createdBy?.slice(0, 8)}… · {formatDate(g.createdAt, true)}</div></div>
                <PendingBadge mine />
                <button data-testid={`validate-game-${g.id}`} onClick={() => act(g.id, "validated")} className="btn-gold h-8 text-xs"><Check className="h-4 w-4" />{t("validate")}</button>
                <button data-testid={`reject-game-${g.id}`} onClick={() => act(g.id, "rejected")} className="btn-danger h-8 text-xs"><X className="h-4 w-4" />{t("reject")}</button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="section-title">{t("custom_games")} ({others.length})</h2>
        <div className="grid sm:grid-cols-2 gap-2" data-testid="custom-games-list">
          {others.map((g) => <div key={g.id} className="card-elysium p-3 flex items-center justify-between"><span className="text-sm text-white">{g.name}</span><div className="flex items-center gap-2"><StatusBadge status={g.status} />{g.status === "rejected" && <button data-testid={`restore-game-${g.id}`} onClick={() => act(g.id, "validated")} className="btn-ghost h-7 text-xs">{t("validate")}</button>}</div></div>)}
        </div>
      </section>
      <section>
        <h2 className="section-title"><Flag className="h-3.5 w-3.5" />{t("reports")} ({reports.data.length})</h2>
        {reports.data.length === 0 ? <p className="text-xs text-zinc-400">{t("no_reports")}</p> : <div className="grid gap-2">{reports.data.map((r) => <div key={r.id} className="card-elysium p-3 text-xs text-zinc-300">{t("conversation")} <code className="text-[#D8CA82]">{r.conversationId}</code> · {r.reason} · {formatDate(r.createdAt, true)}</div>)}</div>}
      </section>
    </div>
  );
}
