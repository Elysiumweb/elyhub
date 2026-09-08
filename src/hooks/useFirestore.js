import { useEffect, useState } from "react";
import { onSnapshot, doc, collection, query } from "firebase/firestore";
import { db, isFirebaseReady } from "@/lib/firebase";
import { withId } from "@/lib/db";

// Live collection. `constraints` are firestore query constraints; deps triggers resubscription.
export function useCollection(path, constraints = [], deps = [], enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return undefined;
    }
    if (!isFirebaseReady || !db) {
      setData([]);
      setError(new Error("firebase_not_configured"));
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    let unsub = () => {};
    try {
      const q = query(collection(db, ...path.split("/")), ...constraints);
      unsub = onSnapshot(
        q,
        (snap) => {
          setData(snap.docs.map(withId));
          setLoading(false);
        },
        (e) => {
          console.error(path, e);
          setError(e);
          setLoading(false);
        },
      );
    } catch (e) {
      console.error(path, e);
      setError(e);
      setLoading(false);
    }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, ...deps]);
  return { data, loading, error };
}

export function useDocument(path, id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id || !isFirebaseReady || !db) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        doc(db, path, id),
        (snap) => {
          setData(snap.exists() ? withId(snap) : null);
          setLoading(false);
        },
        (e) => {
          console.error(path, e);
          setLoading(false);
        },
      );
    } catch (e) {
      console.error(path, e);
      setLoading(false);
    }
    return () => unsub();
  }, [path, id]);
  return { data, loading };
}
