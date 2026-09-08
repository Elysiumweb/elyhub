import { useState } from "react";
import { useI18n } from "@/i18n";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Button that asks for confirmation before running onConfirm (destructive actions)
export const ConfirmButton = ({ onConfirm, title, description, children, className = "btn-danger text-xs", testId, disabled, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <button type="button" data-testid={testId} aria-label={ariaLabel} disabled={disabled} onClick={() => setOpen(true)} className={className}>{children}</button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-[#181818] border-white/10 rounded-none" data-testid="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase text-white text-base">{title || t("confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">{description || t("confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="confirm-cancel" className="btn-ghost rounded-none border-white/10">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-accept" onClick={onConfirm} className="btn-gold rounded-none">{t("confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
