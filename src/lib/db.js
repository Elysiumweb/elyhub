import {
  doc, getDoc, setDoc, addDoc, updateDoc, collection, query, where, getDocs,
  arrayUnion, arrayRemove, orderBy, limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_UID } from "./constants";

export const now = () => Date.now();
export const isOfficialUid = (uid) => uid === ADMIN_UID;
export const withId = (snap) => ({ id: snap.id, ...snap.data() });

// Sort: official first, then newest
export const rankOfficial = (list) =>
  [...list].sort((a, b) => (b.isOfficial === true) - (a.isOfficial === true) || (b.createdAt || 0) - (a.createdAt || 0));

// Users
export const getProfile = async (uid) => {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? withId(s) : null;
};
export const saveProfile = (uid, data) => setDoc(doc(db, "users", uid), { ...data, updatedAt: now() }, { merge: true });

// Games
export const createGame = (name, uid) =>
  addDoc(collection(db, "games"), {
    name, status: isOfficialUid(uid) ? "validated" : "pending", createdBy: uid, createdAt: now(),
  });
export const setGameStatus = (id, status) => updateDoc(doc(db, "games", id), { status });

// Teams
export const createTeam = (data, uid) =>
  addDoc(collection(db, "teams"), {
    ...data, ownerId: uid, memberIds: [uid], isOfficial: isOfficialUid(uid),
    acceptMessages: true, palmares: [], createdAt: now(),
  });
export const updateTeam = (id, data) => updateDoc(doc(db, "teams", id), data);
export const getTeam = async (id) => {
  const s = await getDoc(doc(db, "teams", id));
  return s.exists() ? withId(s) : null;
};
export const addTeamMember = (teamId, member) =>
  updateDoc(doc(db, "teams", teamId), { memberIds: arrayUnion(member.uid), members: arrayUnion(member) });
export const removeTeamMember = (teamId, member) =>
  updateDoc(doc(db, "teams", teamId), { memberIds: arrayRemove(member.uid), members: arrayRemove(member) });

// Offers
export const createOffer = (data, team, uid) =>
  addDoc(collection(db, "offers"), {
    ...data, teamId: team.id, teamName: team.name, teamLogo: team.logo || null, gameId: team.gameId,
    ownerId: team.ownerId, isOfficial: team.isOfficial === true, status: "open", createdBy: uid, createdAt: now(),
  });
export const updateOffer = (id, data) => updateDoc(doc(db, "offers", id), data);

// Applications
export const applyToOffer = (offer, profile, message) =>
  addDoc(collection(db, "applications"), {
    offerId: offer.id, offerRole: offer.role, teamId: offer.teamId, teamName: offer.teamName, gameId: offer.gameId,
    ownerId: offer.ownerId, playerId: profile.id, playerPseudo: profile.pseudo, playerAvatar: profile.avatar || null,
    message, status: "sent", createdAt: now(),
  });
export const updateApplication = (id, data) => updateDoc(doc(db, "applications", id), { ...data, updatedAt: now() });

// Conversations
export const findOrCreateConversation = async ({ me, other, teamId, teamName, title, type = "player_team", scrimId = null }) => {
  const q = query(collection(db, "conversations"), where("participantIds", "array-contains", me.id));
  const snaps = await getDocs(q);
  const existing = snaps.docs.map(withId).find((c) =>
    c.participantIds.includes(other.id) && (c.teamId || null) === (teamId || null) && (c.scrimId || null) === scrimId
  );
  if (existing) return existing.id;
  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: [me.id, other.id],
    participants: { [me.id]: { name: me.pseudo, avatar: me.avatar || null }, [other.id]: { name: other.pseudo, avatar: other.avatar || null } },
    teamId: teamId || null, teamName: teamName || null, title: title || null, type, scrimId,
    blockedBy: [], lastMessage: "", lastAt: now(), createdAt: now(),
  });
  return ref.id;
};
export const sendMessage = async (convId, sender, text) => {
  await addDoc(collection(db, "conversations", convId, "messages"), { senderId: sender.id, senderName: sender.pseudo, text, createdAt: now() });
  await updateDoc(doc(db, "conversations", convId), { lastMessage: text.slice(0, 120), lastAt: now(), lastSenderId: sender.id });
};
export const toggleBlock = (convId, uid, blocked) =>
  updateDoc(doc(db, "conversations", convId), { blockedBy: blocked ? arrayRemove(uid) : arrayUnion(uid) });
export const reportConversation = (convId, uid, reason) =>
  addDoc(collection(db, "reports"), { conversationId: convId, reportedBy: uid, reason, createdAt: now() });

// Scrims
export const createScrim = (data, team, uid) =>
  addDoc(collection(db, "scrims"), {
    ...data, teamId: team.id, teamName: team.name, teamLogo: team.logo || null, gameId: team.gameId,
    ownerId: team.ownerId, ownerIds: [team.ownerId], isOfficial: team.isOfficial === true,
    status: "open", opponentTeamId: null, opponentTeamName: null, cancelledBy: null, relaunched: false,
    createdBy: uid, createdAt: now(),
  });
export const updateScrim = (id, data) => updateDoc(doc(db, "scrims", id), { ...data, updatedAt: now() });
export const relaunchScrim = async (scrim) => {
  const { id, ...rest } = scrim;
  await addDoc(collection(db, "scrims"), {
    ...rest, status: "open", opponentTeamId: null, opponentTeamName: null, opponentOwnerId: null, ownerIds: [scrim.ownerId],
    cancelledBy: null, relaunched: false, relaunchedFrom: id, conversationId: null, createdAt: now(),
  });
  await updateScrim(id, { relaunched: true });
};

// Tournaments
export const createTournament = (data, uid, organizerTeam) =>
  addDoc(collection(db, "tournaments"), {
    ...data, organizerId: uid, organizerTeamId: organizerTeam?.id || null, organizerName: organizerTeam?.name || null,
    isOfficial: isOfficialUid(uid), registeredTeamIds: [], registeredTeams: [], createdAt: now(),
  });
export const registerTeamToTournament = (tid, team) =>
  updateDoc(doc(db, "tournaments", tid), {
    registeredTeamIds: arrayUnion(team.id),
    registeredTeams: arrayUnion({ id: team.id, name: team.name, logo: team.logo || null, region: team.region || null }),
  });

export const recentQuery = (col, n = 100) => query(collection(db, col), orderBy("createdAt", "desc"), limit(n));
