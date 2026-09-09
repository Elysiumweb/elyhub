import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";
import { findTerm } from "@/lib/glossary";

// Terme technique avec infobulle de glossaire. Utilisation :
//   <Term term="BO3" />  — badge cliquable/survolable avec la définition.
//   <Term term="BO3">{content}</Term> — habille un texte existant.
export const Term = ({ term, children, className = "" }) => {
  const { lang } = useI18n();
  const def = findTerm(term || String(children || ""));
  const inner = children ?? term;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex cursor-help items-center gap-1 border-b border-dotted border-zinc-500/70 hover:border-[#D8CA82] ${className}`}>
          {inner}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs border-[#D8CA82]/30 bg-[#181818] p-3">
        <p className="font-display text-[10px] uppercase tracking-widest text-[#D8CA82]">{def?.term || term}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">{def ? (lang === "fr" ? def.fr : def.en) : "—"}</p>
        <Link to="/glossaire" className="mt-2 inline-block text-[10px] uppercase tracking-wider text-[#D8CA82] hover:underline">
          {lang === "fr" ? "Glossaire complet →" : "Full glossary →"}
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
