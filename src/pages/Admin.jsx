import { useState } from "react";
import { Check, X, ShieldCheck, Flag, Trash2, AlertTriangle, Gamepad2, Users, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import {
  setGameStatus, deleteGame, resolveReport, deleteReport, deleteContentByRef, deleteConversation,
  setUserRole, banUser, deleteAccount, logModAction, isOfficialUid,
} from "@/lib/db";
import { asString } from "@/lib/profile";
import { OfficialBadge, PendingBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, PageTitle, Skeletons } from "@/components/common/States";

// Types de signalement dont le contenu peut être supprimé par la modération
// (même mapping que deleteContentByRef dans lib/db + conversations).
const DELETABLE_TARGETS = ["team", "offer", "scrim", "tournament", "lft", "comment", "news", "conversation"];

const ROLES = ["", "moderator", "admin"];

export default function Admin() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const [tab, setTab] = useState("games");
  const [reportFilter, setReportFilter] = useState("open");
  const [userQ, setUserQ] = useState("");
  const games = useCollection("games");
  const reports = useCollection("reports");
  // Lecture de l'annuaire des comptes (règles : isMod) — requise pour l'onglet Utilisateurs.
  const users = useCollection("users");

  const pending = games.data.filter((g) => g.status === "pending");
  const others = games.data.filter((g) => g.status !== "pending");
  const isOpen = (r) => !r.status || r.status === "open";
  const openReports = reports.data.filter(isOpen);
  const treatedReports = reports.data.filter((r) => !isOpen(r));
  const reportList = (reportFilter === "all" ? reports.data : reportFilter === "open" ? openReports : treatedReports)
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const uq = userQ.trim().toLowerCase();
  const userList = users.data
    .filter((p) => !uq || asString(p.pseudo).toLowerCase().includes(uq) || p.id.toLowerCase().includes(uq) || asString(p.email).toLowerCase().includes(uq))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const actGame = async (id, status) => {
    try {
      await setGameStatus(id, status);
      await logModAction(user?.uid, `game_${status}`, "game", id).catch(() => {});
      toast.success(t("saved"));
    } catch { toast.error(t("err_generic")); }
  };
  const removeGame = async (g) => {
    if (!window.confirm(t("delete_game_confirm"))) return;
    try {
      await deleteGame(g.id);
      await logModAction(user?.uid, "game_deleted", "game", g.id).catch(() => {});
      toast.success(t("game_deleted"));
    } catch { toast.error(t("err_generic")); }
  };
  const actReport = async (r, resolution) => {
    try {
      await resolveReport(r.id, resolution);
      await logModAction(user?.uid, `report_${resolution}`, r.targetType, r.targetId).catch(() => {});
      toast.success(t(resolution === "resolved" ? "report_resolved" : "report_dismissed"));
    } catch { toast.error(t("err_generic")); }
  };
  const removeReportedContent = async (r) => {
    if (!window.confirm(t("delete_reported_content_confirm"))) return;
    try {
      if (r.targetType === "conversation") await deleteConversation(r.targetId);
      else await deleteContentByRef(r.targetType, r.targetId);
      await resolveReport(r.id, "resolved").catch(() => {});
      await logModAction(user?.uid, "content_deleted", r.targetType, r.targetId).catch(() => {});
      toast.success(t("content_deleted"));
    } catch { toast.error(t("err_generic")); }
  };
  const removeReport = async (id) => {
    try { await deleteReport(id); toast.success(t("report_deleted")); } catch { toast.error(t("err_generic")); }
  };

  const actRole = async (p, role) => {
    try {
      await setUserRole(p.id, role);
      await logModAction(user?.uid, `role_${role || "player"}`, "user", p.id).catch(() => {});
      toast.success(t("role_saved"));
    } catch { toast.error(t("err_generic")); }
  };
  const actBan = async (p) => {
    const next = !p.banned;
    try {
      await banUser(p.id, next);
      await logModAction(user?.uid, next ? "user_banned" : "user_unbanned", "user", p.id).catch(() => {});
      toast.success(t(next ? "user_banned_msg" : "user_unbanned_msg"));
    } catch { toast.error(t("err_generic")); }
  };
  const actDeleteUser = async (p) => {
    if (!window.confirm(t("delete_user_confirm", { name: asString(p.pseudo) || p.id.slice(0, 8) }))) return;
    try {
      await deleteAccount(p.id);
      await logModAction(user?.uid, "user_deleted", "user", p.id).catch(() => {});
      toast.success(t("user_deleted"));
    } catch { toast.error(t("err_generic")); }
  };

  const permDenied = reports.error?.code === "permission-denied" || users.error?.code === "permission-denied";

  const roleLabel = (role) => {
    if (role === "admin") return t("role_admin");
    if (role === "moderator") return t("role_moderator");
    return t("role_player");
  };

  return (
    <div className="max-w-4xl space-y-8">
      <PageTitle eyebrow={<span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{t("official")}</span>} title={t("nav_admin")}>
        <p className="text-sm text-zinc-400 mt-2">{t("admin_desc")}</p>
      </PageTitle>

      {permDenied && (
        <div className="border border-yellow-500/40 bg-yellow-500/10 p-4 text-xs text-yellow-300 space-y-2" data-testid="admin-permission-help">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{t("admin_perm_title")}</div>
          <p>{t("admin_perm_desc")}</p>
          <p>{t("admin_perm_uid")} : <code className="text-[#D8CA82] select-all">{user?.uid}</code></p>
        </div>
      )}

      <div className="flex border-b border-white/10 overflow-x-auto" data-testid="admin-tabs">
        <button data-testid="admin-tab-games" onClick={() => setTab("games")} className={`tab-btn ${tab === "games" ? "tab-btn-active" : ""}`}>
          <Gamepad2 className="h-3.5 w-3.5 inline mr-1.5" />{t("admin_tab_games")} <span className="text-zinc-600 ml-1">{pending.length}</span>
        </button>
        <button data-testid="admin-tab-reports" onClick={() => setTab("reports")} className={`tab-btn ${tab === "reports" ? "tab-btn-active" : ""}`}>
          <Flag className="h-3.5 w-3.5 inline mr-1.5" />{t("admin_tab_reports")}
          {openReports.length > 0 && <span className="badge bg-red-500 text-white border-0 ml-2">{openReports.length}</span>}
        </button>
        <button data-testid="admin-tab-users" onClick={() => setTab("users")} className={`tab-btn ${tab === "users" ? "tab-btn-active" : ""}`}>
          <Users className="h-3.5 w-3.5 inline mr-1.5" />{t("admin_tab_users")}
          <span className="text-zinc-600 ml-1">{users.data.length}</span>
        </button>
      </div>

      {tab === "games" && (
        <>
          <section>
            <h2 className="section-title">{t("games_pending_validation")} ({pending.length})</h2>
            {games.loading ? <Skeletons n={2} className="h-16" /> : pending.length === 0 ? <EmptyState title={t("no_pending_games")} description={t("no_pending_games_desc")} testId="empty-pending-games" /> : (
              <div className="grid gap-2" data-testid="pending-games-list">
                {pending.map((g) => (
                  <div key={g.id} data-testid={`pending-game-${g.id}`} className="card-elysium p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1"><div className="font-display text-sm uppercase text-white">{g.name}</div><div className="text-xs text-zinc-500">{t("proposed_by")} {String(g.createdBy || "—").slice(0, 8)}… · {formatDate(g.createdAt, true)}</div></div>
                    <PendingBadge mine={g.createdBy === user?.uid} />
                    <button data-testid={`validate-game-${g.id}`} onClick={() => actGame(g.id, "validated")} className="btn-gold h-8 text-xs"><Check className="h-4 w-4" />{t("validate")}</button>
                    <button data-testid={`reject-game-${g.id}`} onClick={() => actGame(g.id, "rejected")} className="btn-danger h-8 text-xs"><X className="h-4 w-4" />{t("reject")}</button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="section-title">{t("custom_games")} ({others.length})</h2>
            <div className="grid sm:grid-cols-2 gap-2" data-testid="custom-games-list">
              {others.map((g) => (
                <div key={g.id} data-testid={`custom-game-${g.id}`} className="card-elysium p-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-white truncate">{g.name || "—"}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={g.status} />
                    {g.status === "rejected" && <button data-testid={`restore-game-${g.id}`} onClick={() => actGame(g.id, "validated")} className="btn-ghost h-7 text-xs">{t("validate")}</button>}
                    <button data-testid={`delete-game-${g.id}`} onClick={() => removeGame(g)} title={t("delete")} className="btn-ghost h-7 w-7 p-0 text-xs text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "reports" && (
        <section className="space-y-4">
          <div className="flex items-center gap-2" data-testid="reports-filters">
            {[["open", "admin_filter_open"], ["treated", "admin_filter_treated"], ["all", "admin_filter_all"]].map(([v, k]) => (
              <button key={v} data-testid={`reports-filter-${v}`} onClick={() => setReportFilter(v)} className={`badge px-3 py-1 text-xs cursor-pointer ${reportFilter === v ? "bg-[#D8CA82]/15 text-[#D8CA82] border-[#D8CA82]/50" : "text-zinc-400 border-white/10 hover:border-white/30"}`}>{t(k)}</button>
            ))}
            <span className="ml-auto text-xs text-zinc-500">{reportList.length} {t("reports").toLowerCase()}</span>
          </div>
          {reports.loading ? <Skeletons n={2} className="h-16" /> : reportList.length === 0 ? (
            <EmptyState icon={Flag} title={t("no_reports")} description={t("no_reports_desc")} testId="empty-reports" />
          ) : (
            <div className="grid gap-2" data-testid="reports-list">
              {reportList.map((r) => (
                <div key={r.id} data-testid={`report-row-${r.id}`} className={`card-elysium p-4 space-y-2 ${isOpen(r) ? "" : "opacity-70"}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="badge bg-[#D8CA82]/10 text-[#D8CA82] border-[#D8CA82]/30">{t(`rt_${r.targetType}`) !== `rt_${r.targetType}` ? t(`rt_${r.targetType}`) : r.targetType}</span>
                    <span className="text-white font-semibold truncate">{r.targetLabel || r.conversationId || r.targetId || "—"}</span>
                    <StatusBadge status={r.status || "open"} testId={`report-status-${r.id}`} />
                    <span className="ml-auto text-zinc-500">{formatDate(r.createdAt, true)}</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {t(`report_${r.reason}`) !== `report_${r.reason}` ? t(`report_${r.reason}`) : r.reason} · {t("reported_by")} {String(r.reportedBy || "—").slice(0, 8)}…
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isOpen(r) && (
                      <>
                        <button data-testid={`report-resolve-${r.id}`} onClick={() => actReport(r, "resolved")} className="btn-gold h-7 text-xs"><Check className="h-3.5 w-3.5" />{t("resolve_report")}</button>
                        <button data-testid={`report-dismiss-${r.id}`} onClick={() => actReport(r, "dismissed")} className="btn-outline h-7 text-xs">{t("dismiss_report")}</button>
                        {DELETABLE_TARGETS.includes(r.targetType) && r.targetId && (
                          <button data-testid={`report-delete-content-${r.id}`} onClick={() => removeReportedContent(r)} className="btn-danger h-7 text-xs"><Trash2 className="h-3.5 w-3.5" />{t("delete_reported_content")}</button>
                        )}
                      </>
                    )}
                    <button data-testid={`report-delete-${r.id}`} onClick={() => removeReport(r.id)} title={t("delete_report")} className="btn-ghost h-7 w-7 p-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "users" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2" data-testid="users-toolbar">
            <input
              data-testid="users-search-input"
              className="input-elysium h-9 text-xs w-full sm:w-64"
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              placeholder={t("users_search_placeholder")}
            />
            <span className="ml-auto text-xs text-zinc-500" data-testid="users-count">{t("user_count", { n: userList.length })}</span>
          </div>
          {users.error?.code === "permission-denied" ? (
            <EmptyState icon={AlertTriangle} title={t("users_perm_title")} description={t("users_perm_desc")} testId="users-permission-denied" />
          ) : users.loading ? <Skeletons n={3} className="h-16" /> : userList.length === 0 ? (
            <EmptyState icon={Users} title={t("no_users")} description={t("no_users_desc")} testId="empty-users" />
          ) : (
            <div className="grid gap-2" data-testid="users-list">
              {userList.map((p) => {
                const official = isOfficialUid(p.id, p.role);
                return (
                  <div key={p.id} data-testid={`user-row-${p.id}`} className={`card-elysium p-4 space-y-2 ${p.banned ? "border-red-500/40" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="badge bg-[#D8CA82]/10 text-[#D8CA82] border-[#D8CA82]/30">{roleLabel(p.role)}</span>
                      {official && <OfficialBadge className="!text-[10px]" />}
                      {p.banned && <span className="badge bg-red-500/15 text-red-400 border-red-500/30" data-testid={`user-banned-${p.id}`}>{t("banned")}</span>}
                      <span className="text-white font-semibold">{asString(p.pseudo) || "—"}</span>
                      <span className="text-zinc-500 truncate max-w-[220px]">{p.email}</span>
                      <span className="ml-auto text-zinc-500" title={p.id}>{t("joined")} {formatDate(p.createdAt)} · {p.id.slice(0, 8)}…</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        {t("user_role")}
                        <select
                          data-testid={`user-role-select-${p.id}`}
                          className="select-elysium h-7 text-xs"
                          value={p.role || ""}
                          disabled={official}
                          onChange={(e) => actRole(p, e.target.value)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      </label>
                      <button data-testid={`user-ban-${p.id}`} onClick={() => actBan(p)} disabled={official} className={`h-7 text-xs ${p.banned ? "btn-outline" : "btn-danger"}`}>
                        {p.banned ? <><UserCheck className="h-3.5 w-3.5 inline mr-1" />{t("unban")}</> : <><UserX className="h-3.5 w-3.5 inline mr-1" />{t("ban_user")}</>}
                      </button>
                      <button data-testid={`user-delete-${p.id}`} onClick={() => actDeleteUser(p)} disabled={official || p.id === user?.uid} title={t("delete")} className="btn-ghost h-7 w-7 p-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
