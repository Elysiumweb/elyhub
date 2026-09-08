import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { where, orderBy } from "firebase/firestore";
import { Send, Ban, Flag, MessageSquare, Swords } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { sendMessage, toggleBlock, reportConversation, markRead } from "@/lib/db";
import { Avatar } from "@/components/common/Cards";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { EmptyState, Skeletons, ErrorState } from "@/components/common/States";
import { Seo } from "@/components/common/Seo";

const Thread = ({ conv, me }) => {
  const { t, formatDate } = useI18n();
  const [text, setText] = useState("");
  const endRef = useRef();
  const msgs = useCollection(`conversations/${conv.id}/messages`, [orderBy("createdAt", "asc")], [conv.id]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs.data.length]);
  const otherId = conv.participantIds.find((p) => p !== me.id);
  const other = conv.participants?.[otherId] || { name: "?" };
  const others = conv.participantIds.filter((p) => p !== me.id).map((p) => conv.participants?.[p]?.name).filter(Boolean);
  const blockedByMe = conv.blockedBy?.includes(me.id);
  const blockedMe = (conv.blockedBy || []).some((b) => b !== me.id);
  useEffect(() => { if (conv.unread?.[me.id]) markRead(conv.id, me.id); }, [conv.id, conv.unread, me.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await sendMessage(conv.id, me, text.trim(), conv.participantIds); setText(""); } catch (err) { console.error(err); toast.error(t("err_generic")); }
  };
  const report = async () => { await reportConversation(conv.id, me.id, "abuse"); toast.success(t("reported")); };

  return (
    <div className="flex flex-col h-full" data-testid="message-thread">
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-[#161616]">
        <Avatar src={other.avatar} name={other.name} round size="h-9 w-9" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{conv.title || other.name}{conv.type === "match" && <span className="text-zinc-400 font-normal text-xs ml-2">{others.join(" · ")}</span>}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">{conv.type === "scrim" ? <Link to={`/scrims/${conv.scrimId}`} className="text-[#D8CA82] hover:underline inline-flex items-center gap-1"><Swords className="h-3 w-3" />{t("scrim_discussion")}</Link> : conv.type === "match" ? <Link to={`/tournaments/${conv.tournamentId}?tab=matches`} className="text-[#D8CA82] hover:underline inline-flex items-center gap-1"><Swords className="h-3 w-3" />{t("match_discussion")} · {conv.teamName}</Link> : conv.teamName ? <Link to={`/teams/${conv.teamId}`} className="hover:text-[#D8CA82]">{conv.teamName}</Link> : t("direct_message")}</div>
        </div>
        <ConfirmButton testId="conversation-block-button" onConfirm={() => toggleBlock(conv.id, me.id, blockedByMe)} title={blockedByMe ? t("unblock") : t("block")} description={t("block_desc")} className={`btn-ghost h-8 text-xs ${blockedByMe ? "text-red-400" : ""}`}><Ban className="h-3.5 w-3.5" aria-hidden="true" />{blockedByMe ? t("unblock") : t("block")}</ConfirmButton>
        <ConfirmButton testId="conversation-report-button" onConfirm={report} title={t("report")} description={t("report_desc")} className="btn-ghost h-8 text-xs"><Flag className="h-3.5 w-3.5" aria-hidden="true" />{t("report")}</ConfirmButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
        {msgs.loading ? <Skeletons n={3} className="h-10" /> : msgs.data.length === 0 ? <p className="text-xs text-zinc-400 text-center py-10" data-testid="thread-empty">{t("no_messages_yet")}</p> : msgs.data.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} data-testid={`message-${m.id}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 text-sm ${mine ? "bg-[#D8CA82] text-[#111111]" : "bg-[#1f1f1f] text-white border border-white/10"}`}>
                {!mine && <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{m.senderName}</div>}
                <div className="whitespace-pre-line break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-black/50" : "text-zinc-400"}`}>{formatDate(m.createdAt, true)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {blockedMe ? <div data-testid="thread-blocked-banner" className="p-3 text-xs text-center text-red-400 border-t border-red-500/20 bg-red-500/5">{t("you_are_blocked")}</div> : (
        <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2 bg-[#161616]">
          {blockedByMe && <span className="text-[11px] text-red-400 self-center shrink-0">{t("you_blocked")}</span>}
          <input data-testid="message-input" aria-label={t("write_message")} className="input-elysium" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("write_message")} maxLength={4000} />
          <button data-testid="message-send-button" aria-label={t("send")} className="btn-gold px-4"><Send className="h-4 w-4" aria-hidden="true" /></button>
        </form>
      )}
    </div>
  );
};

export default function Messages() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { t, formatDate } = useI18n();
  const nav = useNavigate();
  const { data, loading, error } = useCollection("conversations", [where("participantIds", "array-contains", profile?.id || "-")], [profile?.id], !!profile);
  const convs = useMemo(() => [...data].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)), [data]);
  const active = convs.find((c) => c.id === id);
  const firstId = convs[0]?.id;
  useEffect(() => { if (!id && firstId && window.innerWidth >= 768) nav(`/messages/${firstId}`, { replace: true }); }, [id, firstId, nav]);

  return (
    <div className="grid md:grid-cols-[320px_1fr] border border-white/10 bg-[#141414] h-[calc(100vh-14rem)] min-h-[520px]" data-testid="messages-page">
      <Seo title={t("nav_messages")} noindex />
      <aside className={`border-r border-white/10 overflow-y-auto ${id ? "hidden md:block" : ""}`}>
        <div className="p-3 border-b border-white/10 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#D8CA82]" aria-hidden="true" /><span className="font-display text-xs uppercase tracking-widest">{t("nav_messages")}</span><span className="ml-auto text-xs text-zinc-400">{convs.length}</span></div>
        {error ? <div className="p-3"><ErrorState error={error} /></div> : loading ? <div className="p-3"><Skeletons n={4} className="h-14" /></div> : convs.length === 0 ? <div className="p-3"><EmptyState title={t("no_conversations")} description={t("no_conversations_desc")} action={t("browse_teams")} to="/teams" testId="empty-conversations" /></div> : convs.map((c) => {
          const otherId = c.participantIds.find((p) => p !== profile.id);
          const other = c.participants?.[otherId] || { name: "?" };
          const n = c.unread?.[profile.id] || 0;
          return (
            <Link key={c.id} to={`/messages/${c.id}`} data-testid={`conversation-item-${c.id}`} className={`flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${c.id === id ? "bg-[#D8CA82]/10 border-l-2 border-l-[#D8CA82]" : ""}`}>
              <Avatar src={other.avatar} name={other.name} round size="h-10 w-10" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2"><span className={`text-sm truncate ${n ? "font-bold text-white" : "font-semibold text-zinc-200"}`}>{c.title || other.name}</span><span className="text-[11px] text-zinc-400 shrink-0">{formatDate(c.lastAt)}</span></div>
                <div className="flex items-center gap-2"><div className="text-xs text-zinc-400 truncate flex-1">{c.type === "scrim" && <Swords className="inline h-3 w-3 mr-1 text-[#D8CA82]" aria-hidden="true" />}{c.lastMessage || t("no_messages_yet")}</div>{n > 0 && <span data-testid={`conversation-unread-${c.id}`} className="badge bg-[#D8CA82] text-[#111111] border-0">{n}</span>}</div>
              </div>
            </Link>
          );
        })}
      </aside>
      <section className={`${!id ? "hidden md:flex" : "flex"} flex-col min-h-0`}>
        {active ? <Thread conv={active} me={profile} /> : <div className="m-auto text-center text-zinc-400 text-sm p-8" data-testid="no-conversation-selected"><MessageSquare className="h-8 w-8 mx-auto mb-3 text-[#D8CA82]/50" />{t("select_conversation")}</div>}
      </section>
    </div>
  );
}
