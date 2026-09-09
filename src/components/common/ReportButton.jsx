import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { reportContent } from "@/lib/db";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const REASONS = ["abuse", "spam", "fake", "cheating", "other"];

// Signalement de tout contenu (équipe, offre, scrim, tournoi, LFT, profil, commentaire).
export const ReportButton = ({ targetType, targetId, targetLabel, className = "", testId = "report-button" }) => {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const minor = profile?.ageRange && ["u16", "16-17"].includes(profile.ageRange);

  const submit = async () => {
    if (!reason) return toast.error(t("report_reason"));
    setBusy(true);
    try {
      await reportContent({ targetType, targetId, targetLabel, reason, byUid: user.uid, minor });
      toast.success(t("content_reported"));
      setOpen(false);
    } catch {
      toast.error(t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" data-testid={testId} onClick={() => setOpen(true)} className={`btn-ghost text-xs ${className}`} title={t("report_content")}>
        <Flag className="h-3.5 w-3.5" />
        {t("report_content")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="report-dialog">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-white">{t("report_content")}</DialogTitle>
            <p className="text-xs text-zinc-500">{targetLabel}</p>
          </DialogHeader>
          {minor && <div className="border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-300">{t("reported_minor")}</div>}
          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                data-testid={`report-reason-${r}`}
                onClick={() => setReason(r)}
                className={`w-full text-left border p-2.5 text-sm transition-colors ${reason === r ? "border-[#D8CA82] bg-[#D8CA82]/10 text-white" : "border-white/10 text-zinc-300 hover:border-white/30"}`}
              >
                {t(`report_${r}`)}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={() => setOpen(false)}>
              {t("cancel")}
            </button>
            <button type="button" data-testid="report-submit" className="btn-gold text-xs" disabled={busy || !reason} onClick={submit}>
              {t("report_content")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
