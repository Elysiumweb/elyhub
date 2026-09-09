import Seo, { ldBreadcrumb } from "@/components/common/Seo";
import StaticPage, { Section } from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [1, 2, 3, 4, 5, 6].map((n) => ({ q: `faq_q${n}`, a: `faq_a${n}` }));

export default function Help() {
  const { t } = useI18n();
  return (
    <>
      <Seo
        title={t("help_title")}
        description={t("help_desc")}
        path="/aide"
        jsonLd={ldBreadcrumb([{ name: "Accueil", path: "/" }, { name: t("help_title"), path: "/aide" }])}
      />
      <StaticPage eyebrow={t("footer_help")} title={t("help_title")} description={t("help_desc")}>
        <Section testId="faq-list">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i + 1}`}>
                <AccordionTrigger data-testid={`faq-q${i + 1}`}>{t(f.q)}</AccordionTrigger>
                <AccordionContent data-testid={`faq-a${i + 1}`}>{t(f.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      </StaticPage>
    </>
  );
}
