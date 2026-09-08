import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ADMIN_UID } from "@/lib/constants";
import { withId } from "@/lib/db";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u || null); if (!u) { setProfile(null); setProfileLoading(false); } }), []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    return onSnapshot(doc(db, "users", user.uid), (s) => { setProfile(s.exists() ? withId(s) : null); setProfileLoading(false); });
  }, [user]);

  const value = {
    user, profile, loading: user === undefined || (user && profileLoading),
    isAdmin: user?.uid === ADMIN_UID,
    logout: () => signOut(auth),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
