import { useParams } from "react-router-dom";
import { useI18n } from "@/i18n";
import { Seo } from "@/components/common/Seo";
import { PageTitle } from "@/components/common/States";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotFound from "./NotFound";

export const GLOSSARY = {
  fr: [
    ["Scrim", "Match d'entraînement amical entre deux équipes, hors compétition officielle."],
    ["LFT", "« Looking For Team » : un joueur cherche une équipe à rejoindre."],
    ["LFP", "« Looking For Players » : une équipe recrute."],
    ["BO1 / BO3 / BO5 / BO7", "« Best of N » : le vainqueur est la première équipe à gagner la majorité des manches (2 sur 3 pour un BO3)."],
    ["Bracket", "Tableau d'un tournoi qui indique qui affronte qui et la progression des équipes."],
    ["Élimination simple", "Une défaite et l'équipe est éliminée."],
    ["Round robin", "Chaque équipe affronte toutes les autres ; classement aux points."],
    ["Système suisse", "Plusieurs tours ; à chaque tour on affronte une équipe au bilan similaire, sans être éliminé."],
    ["Roster", "L'effectif d'une équipe : titulaires, remplaçants, staff."],
    ["IGL", "« In-Game Leader » : le joueur qui dirige la stratégie pendant la partie."],
    ["Rang", "Niveau atteint dans le mode classé d'un jeu (ex. Immortal sur Valorant)."],
    ["Seeding", "Ordre de placement des équipes dans le bracket selon leur niveau."],
    ["Bye", "Tour sauté : une équipe passe automatiquement au tour suivant faute d'adversaire."],
    ["No-show", "Absence d'une équipe à un match prévu."],
    ["Organisateur", "Personne ou structure qui crée un tournoi, gère le bracket et tranche les litiges."],
  ],
  en: [
    ["Scrim", "Friendly practice match between two teams, outside official competition."],
    ["LFT", "“Looking For Team”: a player is looking for a team to join."],
    ["LFP", "“Looking For Players”: a team is recruiting."],
    ["BO1 / BO3 / BO5 / BO7", "“Best of N”: the first team to win a majority of maps wins (2 of 3 in a BO3)."],
    ["Bracket", "Tournament tree showing who plays whom and how teams progress."],
    ["Single elimination", "One loss and the team is out."],
    ["Round robin", "Every team plays every other team; ranked by points."],
    ["Swiss system", "Several rounds; each round you face a team with a similar record, nobody is eliminated."],
    ["Roster", "A team's line-up: starters, substitutes, staff."],
    ["IGL", "“In-Game Leader”: the player calling the strategy during the game."],
    ["Rank", "Level reached in a game's ranked mode (e.g. Immortal in Valorant)."],
    ["Seeding", "How teams are placed in the bracket according to their level."],
    ["Bye", "Skipped round: a team advances automatically for lack of an opponent."],
    ["No-show", "A team failing to attend a scheduled match."],
    ["Organizer", "Person or organisation that creates a tournament, runs the bracket and settles disputes."],
  ],
};

// Inline term with a glossary tooltip
export const Term = ({ k, children }) => {
  const { lang } = useI18n();
  const entry = GLOSSARY[lang].find(([w]) => w.toLowerCase().startsWith(k.toLowerCase()));
  if (!entry) return children;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild><span tabIndex={0} data-testid={`term-${k}`} className="underline decoration-dotted decoration-[#D8CA82]/70 underline-offset-2 cursor-help">{children}</span></TooltipTrigger>
        <TooltipContent className="bg-[#1f1f1f] border-[#D8CA82]/30 text-zinc-100 max-w-xs rounded-none text-xs"><b className="text-[#D8CA82]">{entry[0]}</b> — {entry[1]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Glossary() {
  const { t, lang } = useI18n();
  return (
    <div className="max-w-3xl" data-testid="glossary-page">
      <Seo title={t("glossary")} description={t("glossary_desc")} />
      <PageTitle eyebrow={t("help")} title={t("glossary")}><p className="text-sm text-zinc-300 mt-2">{t("glossary_desc")}</p></PageTitle>
      <dl className="grid gap-2">{GLOSSARY[lang].map(([w, d]) => <div key={w} className="card-elysium p-4"><dt className="font-display text-sm uppercase text-[#D8CA82]">{w}</dt><dd className="text-sm text-zinc-200 mt-1">{d}</dd></div>)}</dl>
    </div>
  );
}

const PAGES = {
  about: { fr: ["À propos", "ElyHub est la plateforme d'Elysium dédiée aux structures esport : recrutement, scrims et tournois au même endroit, pour les joueurs, les équipes et les organisateurs.\n\n[Texte de présentation du projet Elysium à compléter.]"], en: ["About", "ElyHub is Elysium's platform for esports organisations: recruitment, scrims and tournaments in one place, for players, teams and organizers.\n\n[Elysium project presentation to be completed.]"] },
  contact: { fr: ["Contact", "Une question, un partenariat, un signalement ?\n\nE-mail : contact@elysium.gg [à compléter]\nDiscord : [lien à compléter]"], en: ["Contact", "A question, a partnership, a report?\n\nEmail: contact@elysium.gg [to complete]\nDiscord: [link to complete]"] },
  legal: { fr: ["Mentions légales", "Éditeur : Elysium [forme juridique, adresse, SIREN à compléter]\nDirecteur de la publication : [à compléter]\nHébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA — Données : Google Firebase (Google Ireland Ltd)."], en: ["Legal notice", "Publisher: Elysium [legal form, address, registration to complete]\nPublication director: [to complete]\nHosting: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA — Data: Google Firebase (Google Ireland Ltd)."] },
  terms: { fr: ["Conditions générales d'utilisation", "1. Objet — ElyHub met en relation joueurs, équipes et organisateurs esport.\n2. Compte — Un compte est personnel ; l'utilisateur est responsable de son contenu (pseudo, bio, images, messages).\n3. Comportement — Tout propos haineux, harcèlement, triche ou usurpation entraîne la suspension du compte.\n4. Contenus — Vous conservez vos droits sur vos contenus et accordez à ElyHub une licence d'affichage sur la plateforme.\n5. Litiges de tournoi — L'organisateur du tournoi est seul décisionnaire des résultats.\n6. Responsabilité — ElyHub n'est pas partie aux accords entre utilisateurs.\n\n[À faire relire par un conseil juridique.]"], en: ["Terms of use", "1. Purpose — ElyHub connects esports players, teams and organizers.\n2. Account — Accounts are personal; users are responsible for their content.\n3. Conduct — Hate speech, harassment, cheating or impersonation lead to suspension.\n4. Content — You keep your rights and grant ElyHub a display licence on the platform.\n5. Tournament disputes — The organizer has the final say on results.\n6. Liability — ElyHub is not a party to agreements between users.\n\n[To be reviewed by legal counsel.]"] },
  privacy: { fr: ["Politique de confidentialité", "Données collectées : e-mail, pseudo, avatar, jeux, rangs, région, langues, bio, messages, contenus publiés.\nFinalités : fonctionnement du service (mise en relation, messagerie, tournois).\nBase légale : exécution du contrat (CGU).\nHébergement : Google Firebase (UE/USA, clauses contractuelles types).\nDurée : tant que le compte existe ; suppression sur demande.\nVos droits : accès, rectification, suppression, portabilité — écrivez à privacy@elysium.gg [à compléter].\nCookies : uniquement techniques (session de connexion, préférences de langue et de filtres). Aucune mesure d'audience tierce."], en: ["Privacy policy", "Data collected: email, nickname, avatar, games, ranks, region, languages, bio, messages, published content.\nPurpose: operating the service (matchmaking, messaging, tournaments).\nLegal basis: contract performance (Terms).\nHosting: Google Firebase (EU/USA, standard contractual clauses).\nRetention: as long as the account exists; deletion on request.\nYour rights: access, rectification, erasure, portability — write to privacy@elysium.gg [to complete].\nCookies: technical only (login session, language and filter preferences). No third-party analytics."] },
};

export default function StaticPage() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const page = PAGES[slug];
  if (!page) return <NotFound />;
  const [title, body] = page[lang];
  return (
    <div className="max-w-3xl" data-testid={`static-page-${slug}`}>
      <Seo title={title} description={body.slice(0, 150)} />
      <PageTitle eyebrow="Elysium" title={title} />
      <div className="card-elysium p-6 text-sm text-zinc-200 whitespace-pre-line leading-relaxed">{body}</div>
      <p className="text-xs text-zinc-400 mt-4">{t("legal_placeholder_note")}</p>
    </div>
  );
}
