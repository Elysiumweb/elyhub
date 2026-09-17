// Firestore in-memory factice pour les tests « connectés » : mêmes formes
// d'objets que firebase/firestore (query snapshots, doc snapshots, refs).
const STORE = {};

export const __seed = (docs) => {
  for (const [k, v] of Object.entries(docs)) STORE[k] = v;
};
export const __store = STORE;

const colDocs = (colPath) =>
  Object.entries(STORE)
    .filter(([p]) => p.startsWith(`${colPath}/`) && p.slice(colPath.length + 1).split("/").length === 1)
    .map(([p, data]) => ({ id: p.slice(colPath.length + 1), data: () => ({ ...data }), ref: { id: p.slice(colPath.length + 1) } }));

const matchConstraint = (data, c) => {
  if (c.kind === "where") {
    const v = data[c.field];
    switch (c.op) {
      case "==": return v === c.value;
      case "!=": return v !== c.value;
      case "array-contains": return Array.isArray(v) && v.includes(c.value);
      case "in": return Array.isArray(c.value) && c.value.includes(v);
      case ">=": return (v ?? -Infinity) >= c.value;
      case "<=": return (v ?? Infinity) <= c.value;
      default: return true;
    }
  }
  return true;
};

const applyConstraints = (docs, constraints = []) => {
  let out = docs.filter((d) => constraints.every((c) => matchConstraint(d.data(), c)));
  const ord = constraints.find((c) => c.kind === "orderBy");
  if (ord) {
    out = [...out].sort((a, b) => {
      const va = a.data()[ord.field]; const vb = b.data()[ord.field];
      const cmp = va === vb ? 0 : (va ?? 0) > (vb ?? 0) ? 1 : -1;
      return ord.dir === "desc" ? -cmp : cmp;
    });
  }
  const lim = constraints.find((c) => c.kind === "limit");
  if (lim) out = out.slice(0, lim.n);
  return out;
};

export const collection = (_db, ...segs) => ({ type: "collection", path: segs.join("/") });
export const doc = (_db, ...segs) => ({ type: "doc", path: segs.join("/") });
export const query = (ref, ...constraints) => ({ ...ref, constraints });
export const where = (field, op, value) => ({ kind: "where", field, op, value });
export const orderBy = (field, dir = "asc") => ({ kind: "orderBy", field, dir });
export const limit = (n) => ({ kind: "limit", n });
export const arrayUnion = (...vals) => ({ __op: "arrayUnion", vals });
export const arrayRemove = (...vals) => ({ __op: "arrayRemove", vals });
export const increment = (n) => ({ __op: "increment", n });
export const initializeFirestore = () => ({ fake: true });

const snapFor = (target) => {
  if (target.type === "doc") {
    const data = STORE[target.path];
    return { id: target.path.split("/").pop(), exists: () => Boolean(data), data: () => ({ ...data }), ref: target };
  }
  const docs = applyConstraints(colDocs(target.path), target.constraints);
  return { docs, size: docs.length, empty: docs.length === 0 };
};

export const onSnapshot = (target, next, onError) => {
  try {
    next(snapFor(target));
  } catch (e) {
    if (onError) onError(e);
  }
  return () => {};
};

export const getDocs = async (target) => snapFor(target);
export const getDoc = async (target) => snapFor(target);

const applyPlain = (data, patch) => {
  const out = { ...data };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && v.__op === "increment") out[k] = (out[k] || 0) + v.n;
    else if (v && typeof v === "object" && v.__op === "arrayUnion") out[k] = [...new Set([...(out[k] || []), ...v.vals])];
    else if (v && typeof v === "object" && v.__op === "arrayRemove") out[k] = (out[k] || []).filter((x) => JSON.stringify(x) !== JSON.stringify(v.vals[0]));
    else out[k] = v;
  }
  return out;
};

let autoId = 0;
export const addDoc = async (col, data) => {
  const id = `auto${(autoId += 1)}`;
  STORE[`${col.path}/${id}`] = { ...data };
  return { id };
};
export const setDoc = async (ref, data, opts = {}) => {
  STORE[ref.path] = opts.merge ? applyPlain(STORE[ref.path] || {}, data) : { ...data };
};
export const updateDoc = async (ref, patch) => {
  STORE[ref.path] = applyPlain(STORE[ref.path] || {}, patch);
};
export const deleteDoc = async (ref) => {
  delete STORE[ref.path];
};
export const writeBatch = () => {
  const ops = [];
  return {
    set: (ref, data) => ops.push(() => setDoc(ref, data)),
    update: (ref, patch) => ops.push(() => updateDoc(ref, patch)),
    delete: (ref) => ops.push(() => deleteDoc(ref)),
    commit: async () => { await Promise.all(ops.map((op) => op())); },
  };
};
export const runTransaction = async (_db, fn) => {
  const tx = {
    get: async (ref) => snapFor(ref),
    set: (ref, data) => setDoc(ref, data),
    update: (ref, patch) => updateDoc(ref, patch),
  };
  return fn(tx);
};
