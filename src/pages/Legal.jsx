import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";
import StaticPage, { Section, P } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { setConsent, getConsent } from "@/components/common/CookieBanner";

const CONFIG = {
  legal: { title: "legal_title", desc: null },
  cgu: { title: "legal_cgu_title", desc: null },
  privacy: { title: "legal_privacy_title", desc: null },
  cookies: { title: "legal_cookies_title", desc: null },
};

export default function Legal({ kind = "legal" }) {
  const { t } = useI18n();
  const cfg = CONFIG[kind] || CONFIG.legal;
  const consent = getConsent();

  return (
    <>
      <Seo title={t(cfg.title)} path={`/${kind === "legal" ? "mentions-legales" : kind}`} noindex={kind === "legal"} />
      <StaticPage eyebrow={t("footer_legal")} title={t(cfg.title)}>
        {kind === "legal" && (
          <>
            <Section title={t("legal_editor")} testId="legal-editor">
              <P>{t("legal_editor_text")}</P>
            </Section>
            <Section title={t("legal_hosting")} testId="legal-hosting">
              <P>{t("legal_hosting_text")}</P>
            </Section>
            <Section title={t("contact_title")} testId="legal-contact">
              <P>
                <Link to="/contact" className="text-[#D8CA82] hover:underline">
                  {t("contact_title")} →
                </Link>
              </P>
            </Section>
          </>
        )}

        {kind === "cgu" && (
          <Section testId="legal-cgu">
            <P>{t("privacy_intro")}</P>
            <P>
              <strong className="text-zinc-200">{t("report_content")} :</strong> tout contenu peut être signalé ; la modération peut supprimer des contenus et
              suspendre des comptes en cas de manquement (insultes, harcèlement, triche, usurpation).
            </P>
            <P>
              <strong className="text-zinc-200">{t("minor_account")} :</strong> la messagerie directe des comptes mineurs est restreinte et leurs signalements sont
              prioritaires.
            </P>
            <P>{t("privacy_retention")}</P>
          </Section>
        )}

        {kind === "privacy" && (
          <Section testId="legal-privacy">
            <P>{t("privacy_intro")}</P>
            <P>{t("privacy_retention")}</P>
            <P>
              {t("export_data")} : {t("export_data_desc")} · {t("delete_account")} : {t("delete_account_desc")}
            </P>
            <P>
              <Link to="/account" className="text-[#D8CA82] hover:underline">
                {t("nav_account")} →
              </Link>
            </P>
          </Section>
        )}

        {kind === "cookies" && (
          <Section testId="legal-cookies">
            <P>{t("cookies_text")}</P>
            <div className="mt-4 flex gap-2" data-testid="cookie-prefs-current">
              <button type="button" data-testid="cookie-accept" onClick={() => setConsent("accepted")} className={`btn-gold text-xs ${consent === "accepted" ? "opacity-60" : ""}`}>
                {t("cookie_accept")}
              </button>
              <button type="button" data-testid="cookie-refuse" onClick={() => setConsent("refused")} className={`btn-outline text-xs ${consent === "refused" ? "opacity-60" : ""}`}>
                {t("cookie_refuse")}
              </button>
            </div>
          </Section>
        )}
      </StaticPage>
    </>
  );
}
