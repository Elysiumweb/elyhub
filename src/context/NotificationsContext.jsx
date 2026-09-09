import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { markAllNotificationsRead, markNotificationRead, withId } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

const Ctx = createContext(null);

// Centre de notifications in-app : pastille navbar + liste.
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return undefined;
    }
    setLoading(true);
    const q = query(collection(db, "notifications"), where("recipientId", "==", user.uid), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(withId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const unread = items.filter((n) => !n.read).length;
  const markRead = (id) => markNotificationRead(id);
  const markAllRead = () => user && markAllNotificationsRead(user.uid);

  return <Ctx.Provider value={{ items, unread, loading, markRead, markAllRead }}>{children}</Ctx.Provider>;
}

export const useNotifications = () => useContext(Ctx);
