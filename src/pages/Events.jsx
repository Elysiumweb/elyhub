import { useState } from "react";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/components/common/Seo";
import StaticPage from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { createEvent, deleteEvent } from "@/lib/db";
import { EmptyState, Field } from "@/components/common/States";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { limit } from "firebase/firestore";

export default function Events() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const { data, loading } = useCollection("events", [limit(100)], []);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", location: "", date: "", url: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    setBusy(true);
    try {
      await createEvent({ ...f, name: f.name.trim() }, user.uid);
      toast.success(t("saved"));
      setOpen(false);
    } catch {
      toast.error(t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={t("events_title")} description={t("events_desc")} path="/evenements" />
      <StaticPage
        eyebrow={t("nav_events")}
        title={t("events_title")}
        description={t("events_desc")}
        right={
          user && (
            <button data-testid="event-create-button" onClick={() => setOpen(true)} className="btn-gold text-xs">
              <Plus className="h-4 w-4" />
              {t("add_event")}
            </button>
          )
        }
      >
        {loading ? null : data.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t("no_events")} description={t("events_desc")} testId="empty-events" />
        ) : (
          <div className="grid md:grid-cols-2 gap-3" data-testid="events-grid">
            {[...data].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((ev) => (
              <div key={ev.id} data-testid={`event-${ev.id}`} className="card-elysium p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#D8CA82]" />
                  <span className="font-display text-sm uppercase text-white">{ev.name}</span>
                  {ev.ownerId === user?.uid && (
                    <button data-testid={`event-delete-${ev.id}`} onClick={() => deleteEvent(ev.id)} className="ml-auto text-xs text-red-400 hover:underline">
                      {t("delete")}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {ev.date && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(ev.date)}
                    </span>
                  )}
                  {ev.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ev.location}
                    </span>
                  )}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noreferrer" className="text-[#D8CA82] hover:underline">
                      {t("see_all")} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </StaticPage>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="event-create-dialog">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-white">{t("add_event")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Field label={t("title")} required>
              <input data-testid="event-name-input" className="input-elysium" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("event_location")}>
                <input data-testid="event-location-input" className="input-elysium" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
              </Field>
              <Field label={t("event_date")}>
                <input data-testid="event-date-input" type="date" className="input-elysium" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
              </Field>
            </div>
            <Field label="URL">
              <input data-testid="event-url-input" className="input-elysium" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
            </Field>
            <button data-testid="event-submit-button" className="btn-gold" disabled={busy}>
              {t("publish")}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
