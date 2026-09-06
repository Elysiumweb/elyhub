import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// CRA inline les variables REACT_APP_* au moment du build. Sur Vercel elles doivent
// donc être définies dans Settings → Environment Variables AVANT de (re)déployer.
export const FIREBASE_ENV = [
  { name: "REACT_APP_FIREBASE_API_KEY", required: true, present: Boolean(firebaseConfig.apiKey) },
  { name: "REACT_APP_FIREBASE_AUTH_DOMAIN", required: true, present: Boolean(firebaseConfig.authDomain) },
  { name: "REACT_APP_FIREBASE_PROJECT_ID", required: true, present: Boolean(firebaseConfig.projectId) },
  { name: "REACT_APP_FIREBASE_APP_ID", required: true, present: Boolean(firebaseConfig.appId) },
  { name: "REACT_APP_FIREBASE_STORAGE_BUCKET", required: false, present: Boolean(firebaseConfig.storageBucket) },
  { name: "REACT_APP_FIREBASE_MESSAGING_SENDER_ID", required: false, present: Boolean(firebaseConfig.messagingSenderId) },
  { name: "REACT_APP_FIREBASE_MEASUREMENT_ID", required: false, present: Boolean(firebaseConfig.measurementId) },
  { name: "REACT_APP_ADMIN_UID", required: false, present: Boolean(process.env.REACT_APP_ADMIN_UID) },
];

export const missingFirebaseEnv = FIREBASE_ENV.filter((v) => v.required && !v.present).map((v) => v.name);
export const firebaseReady = missingFirebaseEnv.length === 0;

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (firebaseReady) {
  app = getApps()[0] || initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  googleProvider = new GoogleAuthProvider();
} else {
  // Surtout ne rien lever ici : une exception pendant l'évaluation de ce module
  // empêche React de monter et laisse une page totalement vide (noire).
  console.error(
    `[ElyHub] Firebase n'est pas configuré — variables d'environnement manquantes : ${missingFirebaseEnv.join(", ")}`,
  );
}

export { app, auth, db, googleProvider };
