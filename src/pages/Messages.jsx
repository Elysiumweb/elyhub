import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { where, orderBy } from "firebase/firestore";
import { Send, Ban, Flag, MessageSquare, Swords } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useCollection } from "@/hooks/useFirestore";
import { sendMessage, toggleBlock, reportConversation } from "@/lib/db";
import { Avatar } from "@/components/common/Cards";
import { EmptyState, Skeletons } from "@/components/common/States";

const Thread = ({ conv, me }) => {
  const { t, formatDate } = useI18n();
  const [text, setText] = useState("");
  const endRef = useRef();
  const msgs = useCollection(`conversations/${conv.id}/messages`, [orderBy("createdAt", "asc")], [conv.id]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs.data.length]);
  const otherId = conv.participantIds.find((p) => p !== me.id);
  const other = conv.participants?.[otherId] || { name: "?" };
  const blockedByMe = conv.blockedBy?.includes(me.id);
  const blocked = (conv.blockedBy || []).length > 0;

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await sendMessage(conv.id, me, text.trim()); setText(""); } catch (err) { console.error(err); toast.error(t("err_generic")); }
  };
  const report = async () => { await reportConversation(conv.id, me.id, "abuse"); toast.success(t("reported")); };

  return (
    <div className="flex flex-col h-full" data-testid="message-thread">
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-[#161616]">
        <Avatar src={other.avatar} name={other.name} round size="h-9 w-9" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{conv.title || other.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{conv.type === "scrim" ? <Link to={`/scrims/${conv.scrimId}`} className="text-[#D8CA82] hover:underline inline-flex items-center gap-1"><Swords className="h-3 w-3" />{t("scrim_discussion")}</Link> : conv.teamName ? <Link to={`/teams/${conv.teamId}`} className="hover:text-[#D8CA82]">{conv.teamName}</Link> : t("direct_message")}</div>
        </div>
        <button data-testid="conversation-block-button" onClick={() => toggleBlock(conv.id, me.id, blockedByMe)} className={`btn-ghost h-8 text-xs ${blockedByMe ? "text-red-400" : ""}`}><Ban className="h-3.5 w-3.5" />{blockedByMe ? t("unblock") : t("block")}</button>
        <button data-testid="conversation-report-button" onClick={report} className="btn-ghost h-8 text-xs"><Flag className="h-3.5 w-3.5" />{t("report")}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
        {msgs.loading ? <Skeletons n={3} className="h-10" /> : msgs.data.length === 0 ? <p className="text-xs text-zinc-500 text-center py-10" data-testid="thread-empty">{t("no_messages_yet")}</p> : msgs.data.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} data-testid={`message-${m.id}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 text-sm ${mine ? "bg-[#D8CA82] text-[#111111]" : "bg-[#1f1f1f] text-white border border-white/10"}`}>
                {!mine && <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{m.senderName}</div>}
                <div className="whitespace-pre-line break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-black/50" : "text-zinc-500"}`}>{formatDate(m.createdAt, true)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {blocked ? <div data-testid="thread-blocked-banner" className="p-3 text-xs text-center text-red-400 border-t border-red-500/20 bg-red-500/5">{t("conversation_blocked")}</div> : (
        <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2 bg-[#161616]">
          <input data-testid="message-input" className="input-elysium" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("write_message")} maxLength={4000} />
          <button data-testid="message-send-button" className="btn-gold px-4"><Send className="h-4 w-4" /></button>
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
  const { data, loading } = useCollection("conversations", [where("participantIds", "array-contains", profile?.id || "-")], [profile?.id], !!profile);
  const convs = [...data].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
  const active = convs.find((c) => c.id === id);
  useEffect(() => { if (!id && convs[0] && window.innerWidth >= 768) nav(`/messages/${convs[0].id}`, { replace: true }); }, [id, convs, nav]);

  return (
    <div className="grid md:grid-cols-[320px_1fr] border border-white/10 bg-[#141414] h-[calc(100vh-14rem)] min-h-[520px]" data-testid="messages-page">
      <aside className={`border-r border-white/10 overflow-y-auto ${id ? "hidden md:block" : ""}`}>
        <div className="p-3 border-b border-white/10 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#D8CA82]" /><span className="font-display text-xs uppercase tracking-widest">{t("nav_messages")}</span><span className="ml-auto text-xs text-zinc-500">{convs.length}</span></div>
        {loading ? <div className="p-3"><Skeletons n={4} className="h-14" /></div> : convs.length === 0 ? <div className="p-3"><EmptyState title={t("no_conversations")} description={t("no_conversations_desc")} action={t("browse_teams")} to="/teams" testId="empty-conversations" /></div> : convs.map((c) => {
          const otherId = c.participantIds.find((p) => p !== profile.id);
          const other = c.participants?.[otherId] || { name: "?" };
          return (
            <Link key={c.id} to={`/messages/${c.id}`} data-testid={`conversation-item-${c.id}`} className={`flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${c.id === id ? "bg-[#D8CA82]/10 border-l-2 border-l-[#D8CA82]" : ""}`}>
              <Avatar src={other.avatar} name={other.name} round size="h-10 w-10" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-white truncate">{c.title || other.name}</span><span className="text-[10px] text-zinc-500 shrink-0">{formatDate(c.lastAt)}</span></div>
                <div className="text-xs text-zinc-400 truncate">{c.type === "scrim" && <Swords className="inline h-3 w-3 mr-1 text-[#D8CA82]" />}{c.lastMessage || t("no_messages_yet")}</div>
              </div>
            </Link>
          );
        })}
      </aside>
      <section className={`${!id ? "hidden md:flex" : "flex"} flex-col min-h-0`}>
        {active ? <Thread conv={active} me={profile} /> : <div className="m-auto text-center text-zinc-500 text-sm p-8" data-testid="no-conversation-selected"><MessageSquare className="h-8 w-8 mx-auto mb-3 text-[#D8CA82]/50" />{t("select_conversation")}</div>}
      </section>
    </div>
  );
}
