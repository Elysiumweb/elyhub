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
  useEffect(() => {
    if (!enabled) { setData([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, ...path.split("/")), ...constraints);
    const unsub = onSnapshot(q, (snap) => { setData(snap.docs.map(withId)); setLoading(false); },
      (e) => { console.error(path, e); setError(e); setLoading(false); });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, ...deps]);
  return { data, loading, error };
}

export function useDocument(path, id, enabled = isFirebaseConfigured) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id || !enabled) { setLoading(false); return; }
    setLoading(true);
    const unsub = onSnapshot(doc(db, path, id), (snap) => { setData(snap.exists() ? withId(snap) : null); setLoading(false); },
      (e) => { console.error(path, e); setLoading(false); });
    return unsub;
  }, [path, id, enabled]);
  return { data, loading };
}
