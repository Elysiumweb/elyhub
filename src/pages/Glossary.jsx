import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import Seo, { ldBreadcrumb } from "@/components/common/Seo";
import StaticPage from "@/components/common/StaticPage";
import { useI18n } from "@/i18n";
import { GLOSSARY } from "@/lib/glossary";
import { localSearch } from "@/lib/search";

export default function Glossary() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const list = q ? localSearch(GLOSSARY, q, ["term", "aliases", "fr", "en"]) : GLOSSARY;

  return (
    <>
      <Seo
        title={t("glossary_title")}
        description={t("glossary_desc")}
        path="/glossaire"
        jsonLd={ldBreadcrumb([{ name: "Accueil", path: "/" }, { name: t("glossary_title"), path: "/glossaire" }])}
      />
      <StaticPage eyebrow={t("nav_help")} title={t("glossary_title")} description={t("glossary_desc")}>
        <div className="flex items-center gap-2 border border-white/10 bg-[#141414] px-3 w-full sm:w-80">
          <Search className="h-4 w-4 text-zinc-500" />
          <input data-testid="glossary-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("glossary_search")} className="bg-transparent h-10 flex-1 text-sm outline-none placeholder:text-zinc-600" />
        </div>
        <div className="grid md:grid-cols-2 gap-3" data-testid="glossary-list">
          {list.map((g) => (
            <div key={g.id} className="card-elysium p-4" data-testid={`glossary-term-${g.id}`}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#D8CA82]" />
                <h3 className="font-display text-sm uppercase tracking-wide text-white">{g.term}</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{lang === "fr" ? g.fr : g.en}</p>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="text-sm text-zinc-500" data-testid="glossary-empty">{t("no_results")}</p>}
      </StaticPage>
    </>
  );
}
