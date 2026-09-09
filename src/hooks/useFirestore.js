import { useEffect, useState } from "react";
import { onSnapshot, doc, collection, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { withId } from "@/lib/db";

// Live collection. `constraints` are firestore query constraints; deps triggers resubscription.
// Sans configuration Firebase on ne lance aucun abonnement (données vides plutôt qu'erreurs réseau).
export function useCollection(path, constraints = [], deps = [], enabled = isFirebaseConfigured) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!enabled) { setData([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const q = query(collection(db, ...path.split("/")), ...constraints);
    const unsub = onSnapshot(q, (snap) => { setData(snap.docs.map(withId)); setLoading(false); },
      // eslint-disable-next-line no-console
      (e) => { console.error(path, e); setError(e); setLoading(false); });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, nonce, ...deps]);
  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}

export function useDocument(path, id, enabled = isFirebaseConfigured) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!id || !enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const unsub = onSnapshot(doc(db, path, id), (snap) => { setData(snap.exists() ? withId(snap) : null); setLoading(false); },
      // eslint-disable-next-line no-console
      (e) => { console.error(path, e); setError(e); setLoading(false); });
    return unsub;
  }, [path, id, enabled, nonce]);
  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
