import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Newspaper, Plus } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/components/common/Seo";
import StaticPage from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { useCollection, useDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { createNews, updateNews, deleteNews, rankOfficial } from "@/lib/db";
import { EmptyState, PageTitle, Skeletons, Field } from "@/components/common/States";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { limit } from "firebase/firestore";
import NotFound from "./NotFound";

const NewsCard = ({ n }) => {
  const { t, formatDate } = useI18n();
  return (
    <Link to={`/actu/${n.id}`} data-testid={`news-card-${n.id}`} className="card-elysium hoverable p-5 block">
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-[#D8CA82]" />
        <span className="eyebrow">{t("news_title")}</span>
        <span className="ml-auto text-[10px] text-zinc-500">{formatDate(n.publishedAt || n.createdAt)}</span>
      </div>
      <h3 className="font-display text-base uppercase text-white mt-2">{n.title}</h3>
      <p className="text-xs text-zinc-400 mt-2 line-clamp-3">{n.excerpt || n.body?.slice(0, 180)}</p>
    </Link>
  );
};

export default function News() {
  const { t } = useI18n();
  const { isModerator, user } = useAuth();
  const { data, loading } = useCollection("news", [limit(50)], []);
  const list = rankOfficial(data).filter((n) => n.status !== "draft");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", excerpt: "", body: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    setBusy(true);
    try {
      await createNews({ title: f.title.trim(), excerpt: f.excerpt.trim(), body: f.body.trim() }, user.uid);
      toast.success(t("saved"));
      setOpen(false);
      setF({ title: "", excerpt: "", body: "" });
    } catch {
      toast.error(t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={t("news_title")} description={t("news_desc")} path="/actu" type="article" />
      <StaticPage
        eyebrow={t("nav_blog")}
        title={t("news_title")}
        description={t("news_desc")}
        right={isModerator && (
          <button data-testid="news-create-button" onClick={() => setOpen(true)} className="btn-gold text-xs">
            <Plus className="h-4 w-4" />
            {t("publish")}
          </button>
        )}
      >
        {loading ? (
          <Skeletons n={3} className="h-32" />
        ) : list.length === 0 ? (
          <EmptyState title={t("no_news")} description={t("news_desc")} testId="empty-news" />
        ) : (
          <div className="grid md:grid-cols-2 gap-3" data-testid="news-grid">
            {list.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
        )}
      </StaticPage>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="news-create-dialog">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-white">{t("publish")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Field label={t("title")} required>
              <input data-testid="news-title-input" className="input-elysium" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} required />
            </Field>
            <Field label={t("description")}>
              <input data-testid="news-excerpt-input" className="input-elysium" value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} maxLength={280} />
            </Field>
            <Field label={t("notes")}>
              <textarea data-testid="news-body-input" className="input-elysium min-h-[160px]" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            </Field>
            <button data-testid="news-submit-button" className="btn-gold" disabled={busy}>
              {t("publish")}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NewsDetail() {
  const { id } = useParams();
  const { t, formatDate } = useI18n();
  const { isModerator } = useAuth();
  const { data: n, loading } = useDocument("news", id);

  if (loading) return <Skeletons n={2} />;
  if (!n) return <NotFound />;

  const remove = async () => {
    if (!window.confirm(t("delete"))) return;
    await deleteNews(n.id);
    window.location.href = "/actu";
  };
  const toggleDraft = () => updateNews(n.id, { status: n.status === "draft" ? "published" : "draft" });

  return (
    <>
      <Seo title={n.title} description={n.excerpt || n.body?.slice(0, 160)} path={`/actu/${n.id}`} type="article" />
      <div className="max-w-3xl space-y-6">
        <PageTitle eyebrow={t("news_title")} title={n.title}>
          <p className="text-xs text-zinc-500 mt-2">
            {t("published_at")} {formatDate(n.publishedAt || n.createdAt, true)}
          </p>
        </PageTitle>
        {n.excerpt && <p className="text-sm text-zinc-400 italic" data-testid="news-excerpt">{n.excerpt}</p>}
        <div className="card-elysium p-6 text-sm text-zinc-300 whitespace-pre-line leading-relaxed" data-testid="news-body">
          {n.body || n.excerpt}
        </div>
        {isModerator && (
          <div className="flex gap-2">
            <button data-testid="news-toggle-draft" onClick={toggleDraft} className="btn-ghost text-xs">
              {n.status === "draft" ? t("publish") : "Draft"}
            </button>
            <button data-testid="news-delete" onClick={remove} className="btn-danger text-xs">
              {t("delete")}
            </button>
          </div>
        )}
        <Link to="/actu" className="text-xs text-[#D8CA82] hover:underline">
          ← {t("back")}
        </Link>
      </div>
    </>
  );
}
