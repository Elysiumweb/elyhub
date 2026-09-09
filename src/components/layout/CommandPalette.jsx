import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { limit } from "firebase/firestore";
import { Swords, Trophy, Users, Briefcase, UserSearch, Home, BookOpen, HelpCircle, Search } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { useGames } from "@/hooks/useGames";
import { localSearch } from "@/lib/search";

// Recherche globale ⌘K / Ctrl+K : équipes + joueurs + tournois + scrims + offres + LFT + pages.
export default function CommandPalette() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { getGame } = useGames();

  const teams = useCollection("teams", [limit(100)], []);
  const players = useCollection("users", [limit(100)], []);
  const tournaments = useCollection("tournaments", [limit(100)], []);
  const scrims = useCollection("scrims", [limit(100)], []);
  const offers = useCollection("offers", [limit(100)], []);
  const lft = useCollection("lft", [limit(100)], []);

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const custom = () => setOpen((o) => !o);
    window.addEventListener("keydown", down);
    window.addEventListener("elyhub:open-cmd", custom);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("elyhub:open-cmd", custom);
    };
  }, []);

  const pages = [
    { to: "/", label: t("nav_home"), icon: Home },
    { to: "/teams", label: t("nav_teams"), icon: Users },
    { to: "/scrims", label: t("nav_scrims"), icon: Swords },
    { to: "/tournaments", label: t("nav_tournaments"), icon: Trophy },
    { to: "/players", label: t("nav_players"), icon: Users },
    { to: "/glossaire", label: t("nav_glossary"), icon: BookOpen },
    { to: "/aide", label: t("nav_help"), icon: HelpCircle },
  ];

  const s = q.trim().toLowerCase();
  const qq = q.trim();
  const found = useMemo(() => {
    if (!qq) return null;
    return {
      teams: localSearch(teams.data, qq, ["name"]).slice(0, 5),
      players: localSearch(players.data.filter((p) => p.onboarded), qq, ["pseudo"]).slice(0, 5),
      tournaments: localSearch(tournaments.data, qq, ["name", "organizerName"]).slice(0, 5),
      scrims: localSearch(scrims.data, qq, ["teamName", "opponentTeamName"]).slice(0, 5),
      offers: localSearch(offers.data, qq, ["role", "teamName"]).slice(0, 5),
      lft: localSearch(lft.data, qq, ["playerPseudo", "rank"]).slice(0, 5),
      pages: pages.filter((p) => p.label.toLowerCase().includes(s)).slice(0, 5),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qq, teams.data, players.data, tournaments.data, scrims.data, offers.data, lft.data]);

  const go = (to) => {
    setOpen(false);
    setQ("");
    nav(to);
  };

  const Item = ({ to, label, sub, Icon }) => (
    <CommandItem key={to} value={`${label} ${sub || ""}`} onSelect={() => go(to)}>
      <Icon className="h-4 w-4 text-[#D8CA82]" />
      <span className="flex-1 truncate">{label}</span>
      {sub && <span className="text-[10px] uppercase tracking-wider text-zinc-500 truncate max-w-[40%]">{sub}</span>}
    </CommandItem>
  );

  const ItemList = ({ title, rows, map }) => rows.length > 0 && (
    <CommandGroup heading={title}>
      {rows.map(map)}
    </CommandGroup>
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput data-testid="cmd-input" placeholder={t("cmd_placeholder")} value={q} onValueChange={setQ} />
      <CommandList data-testid="cmd-list">
        <CommandEmpty>{t("cmd_empty")}</CommandEmpty>
        {!qq && (
          <CommandGroup heading={t("cmd_pages")}>
            {pages.map((p) => (
              <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
                <p.icon className="h-4 w-4 text-[#D8CA82]" />
                <span>{p.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {found && (
          <>
            <ItemList title={t("cmd_teams")} rows={found.teams} map={(x) => <Item key={x.id} to={`/teams/${x.id}`} label={x.name} sub={getGame(x.gameId)?.name} Icon={Users} />} />
            <ItemList title={t("cmd_players")} rows={found.players} map={(x) => <Item key={x.id} to={`/players/${x.id}`} label={x.pseudo} sub={t("cmd_players")} Icon={UserSearch} />} />
            <ItemList title={t("cmd_tournaments")} rows={found.tournaments} map={(x) => <Item key={x.id} to={`/tournaments/${x.id}`} label={x.name} sub={getGame(x.gameId)?.name} Icon={Trophy} />} />
            <ItemList title={t("cmd_scrims")} rows={found.scrims} map={(x) => <Item key={x.id} to={`/scrims/${x.id}`} label={x.teamName} sub={getGame(x.gameId)?.name} Icon={Swords} />} />
            <ItemList title={t("cmd_offers")} rows={found.offers} map={(x) => <Item key={x.id} to={`/offers/${x.id}`} label={x.role} sub={x.teamName} Icon={Briefcase} />} />
            <ItemList title={t("cmd_lft")} rows={found.lft} map={(x) => <Item key={x.id} to={`/players/${x.playerId}`} label={x.playerPseudo} sub={x.rank} Icon={UserSearch} />} />
            <ItemList title={t("cmd_pages")} rows={found.pages} map={(x) => <Item key={x.to} to={x.to} label={x.label} Icon={Search} />} />
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
