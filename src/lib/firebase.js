import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";

// Chaque variable existe sous deux noms : la version standard CRA
// (REACT_APP_FIREBASE_*, injectée automatiquement) et la version courte
// (FIREBASE_*, injectée par CLIENT_ENV_VARS dans craco.config.js).
// Les deux fonctionnent sur Vercel ; la version préfixée est prioritaire.
//
// ⚠️ Accès statiques obligatoires : webpack DefinePlugin ne remplace que les
// expressions `process.env.X` écrites en toutes lettres (pas process.env[name]).
const env = {
  FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
  FIREBASE_AUTH_DOMAIN:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
  FIREBASE_PROJECT_ID:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_STORAGE_BUCKET:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    "",
  FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
  FIREBASE_MEASUREMENT_ID:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || "",
};

// Bilan utilisé par l'écran <SetupRequired /> (variables présentes / manquantes).
export const FIREBASE_ENV = [
  { name: "FIREBASE_API_KEY", required: true, present: Boolean(env.FIREBASE_API_KEY) },
  { name: "FIREBASE_AUTH_DOMAIN", required: true, present: Boolean(env.FIREBASE_AUTH_DOMAIN) },
  { name: "FIREBASE_PROJECT_ID", required: true, present: Boolean(env.FIREBASE_PROJECT_ID) },
  { name: "FIREBASE_APP_ID", required: true, present: Boolean(env.FIREBASE_APP_ID) },
  {
    name: "FIREBASE_STORAGE_BUCKET",
    required: false,
    present: Boolean(env.FIREBASE_STORAGE_BUCKET),
  },
  {
    name: "FIREBASE_MESSAGING_SENDER_ID",
    required: false,
    present: Boolean(env.FIREBASE_MESSAGING_SENDER_ID),
  },
  {
    name: "FIREBASE_MEASUREMENT_ID",
    required: false,
    present: Boolean(env.FIREBASE_MEASUREMENT_ID),
  },
];

export const missingFirebaseEnv = FIREBASE_ENV.filter((v) => v.required && !v.present).map(
  (v) => v.name,
);
export const isFirebaseConfigured = missingFirebaseEnv.length === 0;

// L'initialisation ne doit JAMAIS lever : sans cela, le moindre problème de
// config démonte tout l'arbre React et laisse une page noire sans explication.
let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let firebaseInitError = null;

if (!isFirebaseConfigured) {
  console.error(
    `[ElyHub] Firebase non configuré — variable(s) manquante(s) au build : ${missingFirebaseEnv.join(
      ", ",
    )}. Ajoutez-les dans Vercel → Settings → Environment Variables puis redéployez.`,
  );
} else {
  try {
    const firebaseConfig = {
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || undefined,
      appId: env.FIREBASE_APP_ID,
      measurementId: env.FIREBASE_MEASUREMENT_ID || undefined,
    };
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    } catch {
      // Instance déjà créée (ex. rechargement à chaud) : la réutiliser.
      db = getFirestore(app);
    }
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("[ElyHub] Échec d'initialisation Firebase :", e);
    firebaseInitError = e;
    app = null;
    auth = null;
    db = null;
    googleProvider = null;
  }
}

export { app, auth, db, googleProvider, firebaseInitError };
export const isFirebaseReady = Boolean(
  isFirebaseConfigured && !firebaseInitError && app && auth && db,
);
