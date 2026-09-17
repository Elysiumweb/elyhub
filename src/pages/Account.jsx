import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reauthenticateWithCredential, EmailAuthProvider, updateEmail, updatePassword } from "firebase/auth";
import { KeyRound, Mail, Database, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { saveProfile, publishProfile, exportUserData, deleteAccount } from "@/lib/db";
import { isMinorProfile } from "@/lib/profile";
import { PageTitle, Field } from "@/components/common/States";
import { ProfileForm } from "./Onboarding";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const TABS = [
  { value: "profile", key: "acc_tab_profile", icon: Mail },
  { value: "security", key: "acc_tab_security", icon: KeyRound },
  { value: "privacy", key: "acc_tab_privacy", icon: ShieldQuestion },
  { value: "data", key: "acc_tab_data", icon: Database },
];

const authError = (e, t) => {
  const map = {
    "auth/wrong-password": "err_invalid_credentials",
    "auth/invalid-credential": "err_invalid_credentials",
    "auth/user-not-found": "err_invalid_credentials",
    "auth/email-already-in-use": "err_email_in_use",
    "auth/weak-password": "err_weak_password",
    "auth/invalid-email": "err_invalid_email",
    "auth/requires-recent-login": "err_recent_login",
    "auth/permission-denied": "err_recent_login",
  };
  return t(map[e?.code] || "err_generic");
};

// updateEmail/updatePassword exigent une authentification récente : si la
// session est jugée trop ancienne, on ré-authentifie avec le mot de passe
// saisi puis on retente l'opération.
const secureMutate = async (user, currentPassword, mutate) => {
  try {
    await mutate();
  } catch (e) {
    if (e?.code === "auth/requires-recent-login" || e?.code === "auth/permission-denied") {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await mutate();
    } else {
      throw e;
    }
  }
};

const SecurityTab = ({ user }) => {
  const { t } = useI18n();
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  const changeEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword) return toast.error(t("err_invalid_email"));
    setBusyEmail(true);
    try {
      await secureMutate(user, emailForm.currentPassword, () => updateEmail(user, emailForm.newEmail.trim()));
      await saveProfile(user.uid, { email: emailForm.newEmail.trim() });
      toast.success(t("email_updated"));
      setEmailForm({ newEmail: "", currentPassword: "" });
    } catch (err) { toast.error(authError(err, t)); } finally { setBusyEmail(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error(t("err_weak_password"));
    if (pwForm.newPassword !== pwForm.confirm) return toast.error(t("password_mismatch"));
    if (!pwForm.currentPassword) return toast.error(t("err_invalid_credentials"));
    setBusyPw(true);
    try {
      await secureMutate(user, pwForm.currentPassword, () => updatePassword(user, pwForm.newPassword));
      toast.success(t("password_updated"));
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) { toast.error(authError(err, t)); } finally { setBusyPw(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6" data-testid="account-security">
      <form onSubmit={changeEmail} className="card-elysium p-5 space-y-4">
        <h3 className="section-title"><Mail className="h-3.5 w-3.5" />{t("change_email")}</h3>
        <p className="text-xs text-zinc-500">{user.email}</p>
        <Field label={t("new_email")} required>
          <input data-testid="account-new-email-input" type="email" required className="input-elysium" value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} />
        </Field>
        <Field label={t("current_password")} required>
          <input data-testid="account-email-current-pw-input" type="password" required className="input-elysium" value={emailForm.currentPassword} onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })} />
        </Field>
        <button data-testid="account-email-submit" disabled={busyEmail} className="btn-gold text-xs w-full">{t("change_email")}</button>
      </form>
      <form onSubmit={changePassword} className="card-elysium p-5 space-y-4">
        <h3 className="section-title"><KeyRound className="h-3.5 w-3.5" />{t("change_password")}</h3>
        <Field label={t("current_password")} required>
          <input data-testid="account-pw-current-input" type="password" required className="input-elysium" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        </Field>
        <Field label={t("new_password")} required>
          <input data-testid="account-pw-new-input" type="password" required minLength={6} className="input-elysium" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        </Field>
        <Field label={t("confirm_password")} required>
          <input data-testid="account-pw-confirm-input" type="password" required className="input-elysium" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
        </Field>
        <button data-testid="account-pw-submit" disabled={busyPw} className="btn-gold text-xs w-full">{t("change_password")}</button>
      </form>
    </div>
  );
};

const PrivacyTab = ({ user, profile }) => {
  const { t } = useI18n();
  const vis = { public: true, hideDirectory: false, hideRank: false, ...(profile?.visibility || {}) };
  const minor = profile && isMinorProfile(profile);

  const setVis = (key, value) => {
    const visibility = { ...vis, [key]: value };
    saveProfile(user.uid, { visibility })
      .then(() => publishProfile(user.uid, { visibility }))
      .catch(() => toast.error(t("err_generic")));
  };

  const Row = ({ id, label, checked, hint }) => (
    <label data-testid={`privacy-${id}`} className="flex items-center justify-between gap-4 border-b border-white/5 py-3">
      <span className="text-sm text-zinc-200">{label}{hint && <span className="block text-xs text-zinc-500">{hint}</span>}</span>
      <Switch data-testid={`privacy-${id}-toggle`} checked={checked} onCheckedChange={(v) => setVis(id, v)} className="data-[state=checked]:bg-[#D8CA82]" />
    </label>
  );

  return (
    <div className="card-elysium p-5" data-testid="account-privacy">
      <p className="text-xs text-zinc-500 mb-2">{t("vis_hint")}</p>
      {minor && <div data-testid="account-minor-notice" className="mb-3 border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-300">{t("minor_notice")}</div>}
      <Row id="public" label={t("vis_public")} checked={vis.public !== false} />
      <Row id="hideDirectory" label={t("vis_hide_directory")} checked={Boolean(vis.hideDirectory)} />
      <Row id="hideRank" label={t("vis_hide_rank")} checked={Boolean(vis.hideRank)} />
    </div>
  );
};

const DataTab = ({ user }) => {
  const { t } = useI18n();
  const nav = useNavigate();
  const { logout } = useAuth();
  const [busyExport, setBusyExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const exportData = async () => {
    setBusyExport(true);
    try {
      const data = await exportUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `elyhub-export-${user.uid.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success(t("data_exported"));
    } catch { toast.error(t("err_generic")); } finally { setBusyExport(false); }
  };

  const doDelete = async () => {
    setBusyDelete(true);
    try {
      await deleteAccount(user.uid);
      toast.success(t("account_deleted"));
      await logout();
      nav("/login", { replace: true });
    } catch { toast.error(t("err_generic")); setBusyDelete(false); setConfirmDelete(false); }
  };

  return (
    <div className="space-y-4" data-testid="account-data">
      <div className="card-elysium p-5">
        <h3 className="section-title"><Database className="h-3.5 w-3.5" />{t("export_data")}</h3>
        <p className="text-xs text-zinc-500 mb-4">{t("export_data_desc")}</p>
        <button data-testid="account-export-button" onClick={exportData} disabled={busyExport} className="btn-outline text-xs">{t("export_data")}</button>
      </div>
      <div className="card-elysium p-5 border-red-500/40" data-testid="account-delete-zone">
        <h3 className="section-title text-red-400">{t("danger_zone")}</h3>
        <p className="text-xs text-zinc-400 mb-4">{t("delete_account_desc")}</p>
        <button data-testid="account-delete-button" onClick={() => setConfirmDelete(true)} className="btn-danger text-xs">{t("delete_account")}</button>
      </div>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[#181818] border-red-500/40">
          <DialogHeader><DialogTitle className="font-display uppercase text-white">{t("delete_account")}</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-300">{t("delete_account_confirm")}</p>
          <DialogFooter className="flex gap-2">
            <button type="button" data-testid="account-delete-cancel" onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs">{t("cancel")}</button>
            <button type="button" data-testid="account-delete-confirm" onClick={doDelete} disabled={busyDelete} className="btn-danger text-xs">{t("delete_account")}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function Account() {
  const { profile, user, logout } = useAuth();
  const { t } = useI18n();
  return (
    <div className="max-w-4xl">
      <PageTitle eyebrow={user?.email} title={t("nav_account")} right={<>
        <Link to={`/players/${user?.uid}`} data-testid="account-public-profile-link" className="btn-outline text-xs">{t("view_public_profile")}</Link>
        <button data-testid="account-logout-button" onClick={logout} className="btn-ghost text-xs">{t("logout")}</button>
      </>} />
      <Tabs defaultValue="profile" data-testid="account-tabs">
        <TabsList>
          {TABS.map(({ value, key, icon: Icon }) => (
            <TabsTrigger key={value} value={value} data-testid={`account-tab-${value}`} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />{t(key)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile" className="pt-6">
          <div className="card-elysium p-6"><ProfileForm initial={profile} /></div>
        </TabsContent>
        <TabsContent value="security" className="pt-6"><SecurityTab user={user} /></TabsContent>
        <TabsContent value="privacy" className="pt-6"><PrivacyTab user={user} profile={profile} /></TabsContent>
        <TabsContent value="data" className="pt-6"><DataTab user={user} /></TabsContent>
      </Tabs>
    </div>
  );
}
