import { useState } from "react";
import { toast } from "sonner";
import Seo from "@/components/common/Seo";
import StaticPage from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { Field } from "@/components/common/States";

const CONTACT_EMAIL = "contact@elysium.gg";

export default function Contact() {
  const { t } = useI18n();
  const [f, setF] = useState({ email: "", subject: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    const body = encodeURIComponent(`${f.message}\n\n— ${f.email}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(f.subject || t("contact_title"))}&body=${body}`;
    toast.success(t("contact_sent"));
  };

  return (
    <>
      <Seo title={t("contact_title")} description={t("contact_desc")} path="/contact" />
      <StaticPage eyebrow="Elysium" title={t("contact_title")} description={t("contact_desc")}>
        <form onSubmit={submit} className="card-elysium p-6 space-y-4 max-w-xl" data-testid="contact-form">
          <Field label={t("contact_email_label")} required>
            <input data-testid="contact-email" type="email" required className="input-elysium" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label={t("contact_subject")}>
            <input data-testid="contact-subject" className="input-elysium" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
          </Field>
          <Field label={t("contact_message")} required>
            <textarea data-testid="contact-message" required className="input-elysium min-h-[140px]" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          </Field>
          <button data-testid="contact-submit" className="btn-gold">
            {t("publish")}
          </button>
          <p className="text-xs text-zinc-600">Direct : {CONTACT_EMAIL}</p>
        </form>
      </StaticPage>
    </>
  );
}
