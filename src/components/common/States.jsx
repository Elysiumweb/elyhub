import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { useI18n } from "@/i18n";

export const EmptyState = ({ title, description, action, to, icon: Icon = Inbox, testId = "empty-state" }) => (
  <div data-testid={testId} className="card-elysium flex flex-col items-start gap-3 p-8 border-dashed">
    <div className="h-10 w-10 grid place-items-center bg-[#D8CA82]/10 border border-[#D8CA82]/30"><Icon className="h-5 w-5 text-[#D8CA82]" /></div>
    <h3 className="font-display text-sm uppercase tracking-wider text-white">{title}</h3>
    {description && <p className="text-sm text-zinc-400 max-w-md">{description}</p>}
    {action && to && <Link to={to} data-testid={`${testId}-action`} className="btn-gold mt-2">{action}</Link>}
  </div>
);

export const Skeletons = ({ n = 3, className = "h-32" }) => (
  <div data-testid="loading-skeleton" className="grid gap-3">
    {Array.from({ length: n }).map((_, i) => <div key={i} className={`skeleton ${className}`} />)}
  </div>
);

export const PageTitle = ({ eyebrow, title, right, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
    <div>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-wide text-white flex items-center gap-3">
        <span className="text-[#D8CA82]">&lt;</span>{title}<span className="text-[#D8CA82]">&gt;</span>
      </h1>
      {children}
    </div>
    {right && <div className="flex items-center gap-2">{right}</div>}
  </div>
);

export const Field = ({ label, children, hint, required }) => (
  <label className="block">
    <span className="label">{label}{required && <span className="text-[#D8CA82] ml-1">*</span>}</span>
    {children}
    {hint && <span className="text-xs text-zinc-500 mt-1 block">{hint}</span>}
  </label>
);

export const AuthRequired = () => {
  const { t } = useI18n();
  return <EmptyState title={t("login_required")} description={t("login_required_desc")} action={t("login")} to="/login" testId="auth-required" />;
};
