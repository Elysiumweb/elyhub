import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { PageTitle } from "@/components/common/States";
import { ProfileForm } from "./Onboarding";
import { Link } from "react-router-dom";

export default function Account() {
  const { profile, user, logout } = useAuth();
  const { t } = useI18n();
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow={user?.email} title={t("nav_account")} right={<>
        <Link to={`/players/${user?.uid}`} data-testid="account-public-profile-link" className="btn-outline text-xs">{t("view_public_profile")}</Link>
        <button data-testid="account-logout-button" onClick={logout} className="btn-ghost text-xs">{t("logout")}</button>
      </>} />
      <div className="card-elysium p-6"><ProfileForm initial={profile} /></div>
    </div>
  );
}
