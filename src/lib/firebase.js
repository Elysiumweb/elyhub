import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

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
export const isStorageConfigured = Boolean(firebaseConfig.storageBucket);

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
export const storage = getStorage(app);

// Fournisseurs d'authentification. Google est toujours proposé ; Discord, Steam et
// Twitch nécessitent une configuration côté Firebase Auth + les variables d'env dédiées.
export const googleProvider = new GoogleAuthProvider();

const discordClientId = process.env.DISCORD_CLIENT_ID || process.env.REACT_APP_DISCORD_CLIENT_ID || "";
const twitchClientId = process.env.TWITCH_CLIENT_ID || process.env.REACT_APP_TWITCH_CLIENT_ID || "";
const steamApiKey = process.env.STEAM_API_KEY || process.env.REACT_APP_STEAM_API_KEY || "";

export const discordProvider = discordClientId ? new OAuthProvider("oidc.discord") : null;
if (discordProvider) discordProvider.setCustomParameters({ client_id: discordClientId });

export const steamProvider = steamApiKey ? new OAuthProvider("oidc.steam") : null;
if (steamProvider) steamProvider.setCustomParameters({ api_key: steamApiKey });

export const twitchProvider = twitchClientId ? new OAuthProvider("twitch.com") : null;
if (twitchProvider) twitchProvider.setCustomParameters({ client_id: twitchClientId });

export const SOCIAL_PROVIDERS = [
  { id: "discord", label: "Discord", provider: discordProvider, enabled: Boolean(discordProvider) },
  { id: "steam", label: "Steam", provider: steamProvider, enabled: Boolean(steamProvider) },
  { id: "twitch", label: "Twitch", provider: twitchProvider, enabled: Boolean(twitchProvider) },
].filter((p) => p.enabled);

// ── Stockage des images : Firebase Storage en priorité (base64 en secours) ─────
// Les images ne doivent plus vivre en base64 dans Firestore (limite 1 Mo/document,
// chaque lecture de carte transporterait le logo).
export async function uploadImageDataUrl(dataUrl, path, { maxBytes = 4 * 1024 * 1024 } = {}) {
  if (!isStorageConfigured || !dataUrl) return null;
  try {
    // Vérif de taille avant upload
    const head = dataUrl.split(",")[1] || "";
    if (head.length * 0.75 > maxBytes) return null;
    const r = ref(storage, path);
    await uploadString(r, dataUrl, "data_url");
    return getDownloadURL(r);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[storage] upload failed, falling back to base64", e);
    return null;
  }
}

export const avatarPath = (uid) => `avatars/${uid}/avatar-${Date.now()}.jpg`;
export const teamLogoPath = (teamId) => `teams/${teamId}/logo-${Date.now()}.jpg`;
export const teamBannerPath = (teamId) => `teams/${teamId}/banner-${Date.now()}.jpg`;
export const proofPath = (matchId, uid) => `proofs/${matchId}/${uid}-${Date.now()}.jpg`;

export const SITE_URL = process.env.SITE_URL || process.env.REACT_APP_SITE_URL || "";

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    `[ElyHub] Configuration Firebase manquante : ${missingEnvVars.join(", ")}. ` +
      "Ajoutez ces variables sur Vercel (Project → Settings → Environment Variables, " +
      "Production + Preview) puis redéployez — elles sont injectées au build.",
  );
}
