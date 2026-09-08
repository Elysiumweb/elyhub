import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Les variables peuvent être déclarées avec le préfixe CRA (`REACT_APP_FIREBASE_API_KEY`)
// ou sans préfixe (`FIREBASE_API_KEY`, noms documentés dans .env.example et exposés au
// client par la liste CLIENT_ENV_VARS de craco.config.js). Les deux formes sont acceptées.
// ⚠️ Les accès doivent rester littéraux (`process.env.X`) : webpack remplace ces
// expressions au moment du build, une clé calculée ne serait jamais injectée.
const pick = (prefixed, plain) => prefixed || plain || "";

const firebaseConfig = {
  apiKey: pick(process.env.REACT_APP_FIREBASE_API_KEY, process.env.FIREBASE_API_KEY),
  authDomain: pick(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, process.env.FIREBASE_AUTH_DOMAIN),
  projectId: pick(process.env.REACT_APP_FIREBASE_PROJECT_ID, process.env.FIREBASE_PROJECT_ID),
  storageBucket: pick(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, process.env.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: pick(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID, process.env.FIREBASE_MESSAGING_SENDER_ID),
  appId: pick(process.env.REACT_APP_FIREBASE_APP_ID, process.env.FIREBASE_APP_ID),
  measurementId: pick(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, process.env.FIREBASE_MEASUREMENT_ID),
};

const REQUIRED = [["FIREBASE_API_KEY", firebaseConfig.apiKey], ["FIREBASE_PROJECT_ID", firebaseConfig.projectId]];
const OPTIONAL = [
  ["FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  ["FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
  ["FIREBASE_APP_ID", firebaseConfig.appId],
  ["FIREBASE_MEASUREMENT_ID", firebaseConfig.measurementId],
];

// Variables absentes du build : affichées par le bandeau d'avertissement et les logs.
export const missingEnvVars = [...REQUIRED, ...OPTIONAL].filter(([, value]) => !value).map(([name]) => name);
export const isFirebaseConfigured = REQUIRED.every(([, value]) => Boolean(value));

// Sans apiKey, getAuth() lève `auth/invalid-api-key` pendant l'évaluation du module :
// React ne monterait jamais et le site resterait désespérément noir. On initialise donc
// toujours Firebase (clé de substitution le cas échéant) et on signale l'état à l'écran.
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey || "firebase-not-configured",
      projectId: firebaseConfig.projectId || "firebase-not-configured",
    };

export const app = getApps()[0] || initializeApp(safeConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
export const googleProvider = new GoogleAuthProvider();

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    `[ElyHub] Configuration Firebase manquante : ${missingEnvVars.join(", ")}. ` +
      "Ajoutez ces variables sur Vercel (Project → Settings → Environment Variables, " +
      "Production + Preview) puis redéployez — elles sont injectées au build.",
  );
}
