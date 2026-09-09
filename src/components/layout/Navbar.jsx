import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { limit } from "firebase/firestore";
import { MessageSquare, LogOut, User, LayoutDashboard, ShieldCheck, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { Avatar } from "@/components/common/Cards";
import { NotificationBell } from "./NotificationBell";
import CommandPalette from "./CommandPalette";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", key: "nav_home", end: true },
  { to: "/teams", key: "nav_teams" },
  { to: "/scrims", key: "nav_scrims" },
  { to: "/tournaments", key: "nav_tournaments" },
  { to: "/players", key: "nav_players" },
  { to: "/glossaire", key: "nav_glossary" },
];

export const Navbar = () => {
  const { user, profile, isAdmin, isModerator, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  // Badge de messages non lus : compteur `unread` par participant (lastAt > lastReadAt[moi]).
  const convs = useCollection("conversations", [limit(100)], [], !!user);
  const unread = convs.data.filter((c) => (c.lastAt || 0) > (c.lastReadAt?.[user?.uid] || 0) && c.lastSenderId !== user?.uid).length;

  const NavItems = ({ onClick }) => (
    <>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={onClick}
          data-testid={`nav-${l.key.replace("nav_", "")}`}
          className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
        >
          {t(l.key)}
        </NavLink>
      ))}
      {isModerator && (
        <NavLink
          to="/admin"
          onClick={onClick}
          data-testid="nav-admin"
          className={({ isActive }) => `nav-link !text-[#D8CA82] inline-flex items-center gap-1 ${isActive ? "nav-link-active" : ""}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("nav_admin")}
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#D8CA82]/20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-16 flex items-center gap-6">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 shrink-0">
            <img src="/brand/logo-icon-gold.png" alt="Elysium" className="h-9 w-9" />
            <span className="font-display text-base tracking-[0.2em] text-white hidden sm:inline">
              ELY<span className="text-[#D8CA82]">HUB</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-1">
            <NavItems />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              data-testid="cmd-open"
              onClick={() => window.dispatchEvent(new Event("elyhub:open-cmd"))}
              className="btn-ghost h-9 hidden lg:flex items-center gap-2 px-3 text-xs text-zinc-500"
              title="⌘K"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{t("open_cmd")}</span>
              <kbd className="border border-white/15 px-1.5 text-[10px] text-zinc-600">⌘K</kbd>
            </button>
            <button
              data-testid="lang-toggle"
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="btn-ghost text-xs font-display tracking-widest px-2"
            >
              <span className={lang === "fr" ? "text-[#D8CA82]" : "text-zinc-500"}>FR</span>
              <span className="text-zinc-700 mx-1">/</span>
              <span className={lang === "en" ? "text-[#D8CA82]" : "text-zinc-500"}>EN</span>
            </button>
            {user && <NotificationBell />}
            {user && (
              <Link to="/messages" data-testid="nav-messages" className="btn-ghost h-9 w-9 p-0 relative grid place-items-center" aria-label={t("nav_messages")}>
                <MessageSquare className="h-4 w-4" />
                {unread > 0 && (
                  <span data-testid="messages-badge" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D8CA82] text-[#111111] text-[10px] font-bold grid place-items-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="nav-account-menu"
                    className="flex items-center gap-2 pl-1 pr-2 h-9 border border-white/10 hover:border-[#D8CA82]/50 transition-colors"
                  >
                    <Avatar src={profile?.avatar} name={profile?.pseudo || user.email} round size="h-7 w-7" />
                    <span className="text-xs hidden sm:inline max-w-[100px] truncate">{profile?.pseudo || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#181818] border-white/10 rounded-none w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/account" data-testid="menu-account">
                      <User className="h-4 w-4 mr-2" />
                      {t("nav_account")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" data-testid="menu-dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t("nav_dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" data-testid="menu-admin">
                        <ShieldCheck className="h-4 w-4 mr-2 text-[#D8CA82]" />
                        {t("nav_admin")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem data-testid="menu-logout" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" data-testid="nav-login" className="btn-gold text-xs">
                {t("login")}
              </Link>
            )}
            <button data-testid="nav-mobile-toggle" className="md:hidden btn-ghost h-9 w-9 p-0 grid place-items-center" onClick={() => setOpen(!open)}>
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden flex flex-col p-3 gap-1 border-t border-white/10 bg-[#111111]">
            <NavItems onClick={() => setOpen(false)} />
          </nav>
        )}
      </header>
      <CommandPalette />
    </>
  );
};
