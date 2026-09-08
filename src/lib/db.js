import {
  doc, getDoc, setDoc, addDoc, updateDoc, collection, query, where, getDocs,
  arrayUnion, arrayRemove, orderBy, limit, writeBatch, increment, deleteDoc,
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
export const sendMessage = async (convId, sender, text, participantIds = []) => {
  await addDoc(collection(db, "conversations", convId, "messages"), { senderId: sender.id, senderName: sender.pseudo, text, createdAt: now() });
  const unread = Object.fromEntries(participantIds.filter((p) => p !== sender.id).map((p) => [`unread.${p}`, increment(1)]));
  await updateDoc(doc(db, "conversations", convId), { lastMessage: text.slice(0, 120), lastAt: now(), lastSenderId: sender.id, ...unread });
};
export const markRead = (convId, uid) => updateDoc(doc(db, "conversations", convId), { [`unread.${uid}`]: 0 });
export const toggleBlock = (convId, uid, blocked) =>
  updateDoc(doc(db, "conversations", convId), { blockedBy: blocked ? arrayRemove(uid) : arrayUnion(uid) });
export const deleteDocById = (col, id) => deleteDoc(doc(db, col, id));
export const unregisterTeamFromTournament = (tid, teamEntry) =>
  updateDoc(doc(db, "tournaments", tid), { registeredTeamIds: arrayRemove(teamEntry.id), registeredTeams: arrayRemove(teamEntry) });
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
    isOfficial: isOfficialUid(uid), status: "registration", rounds: 0, registeredTeamIds: [], registeredTeams: [], createdAt: now(),
  });
export const registerTeamToTournament = (tid, team) =>
  updateDoc(doc(db, "tournaments", tid), {
    registeredTeamIds: arrayUnion(team.id),
    registeredTeams: arrayUnion({ id: team.id, name: team.name, logo: team.logo || null, region: team.region || null, ownerId: team.ownerId }),
  });

// Tournament matches (bracket)
export const startTournament = async (tournament, matches, rounds) => {
  const batch = writeBatch(db);
  matches.forEach((m) => batch.set(doc(db, "matches", m.id), { ...m, createdAt: now() }));
  batch.update(doc(db, "tournaments", tournament.id), { status: "ongoing", rounds, startedAt: now() });
  await batch.commit();
};
export const addMatches = async (tournament, matches, round) => {
  const batch = writeBatch(db);
  matches.forEach((m) => batch.set(doc(db, "matches", m.id), { ...m, createdAt: now() }));
  batch.update(doc(db, "tournaments", tournament.id), { rounds: round });
  await batch.commit();
};
export const updateMatch = (id, data) => updateDoc(doc(db, "matches", id), { ...data, updatedAt: now() });
export const finishTournament = (id, winner) => updateDoc(doc(db, "tournaments", id), { status: "finished", winner: winner || null, finishedAt: now() });

// Set a result and propagate the winner to the next match
export const resolveMatch = async (match, scoreA, scoreB, resolvedBy) => {
  const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;
  await updateMatch(match.id, { scoreA, scoreB, winnerId: winner?.id || null, status: "done", dispute: null, resolvedBy });
  if (match.nextMatchId && winner) {
    const nextRef = doc(db, "matches", match.nextMatchId);
    const next = (await getDoc(nextRef)).data();
    const other = match.nextSlot === "teamA" ? next.teamB : next.teamA;
    await updateDoc(nextRef, { [match.nextSlot]: { id: winner.id, name: winner.name, logo: winner.logo || null, ownerId: winner.ownerId || null }, status: other ? "ready" : "pending", updatedAt: now() });
  }
};
// Captain reports a score with proof; auto-resolve if both reports agree
export const reportMatch = async (match, teamId, scoreA, scoreB, proof, uid) => {
  const reports = { ...(match.reports || {}), [teamId]: { scoreA, scoreB, proof: proof || null, by: uid, at: now() } };
  const otherId = teamId === match.teamA.id ? match.teamB.id : match.teamA.id;
  const other = reports[otherId];
  if (other && other.scoreA === scoreA && other.scoreB === scoreB) { await updateMatch(match.id, { reports }); return resolveMatch({ ...match, reports }, scoreA, scoreB, "auto"); }
  await updateMatch(match.id, { reports, status: other ? "disputed" : "reported", dispute: other ? { reason: "score_mismatch", by: uid, at: now() } : match.dispute || null });
};
export const disputeMatch = (match, uid, reason) => updateMatch(match.id, { status: "disputed", dispute: { reason, by: uid, at: now() } });

export const createMatchConversation = async (match, tournament, me) => {
  const ids = [...new Set([match.teamA.ownerId, match.teamB.ownerId, tournament.organizerId].filter(Boolean))];
  const participants = {};
  [match.teamA, match.teamB].forEach((tm) => { if (tm.ownerId) participants[tm.ownerId] = { name: `${tm.name} (capt.)`, avatar: tm.logo || null }; });
  if (tournament.organizerId && !participants[tournament.organizerId]) participants[tournament.organizerId] = { name: `${tournament.organizerName || "Orga"} (orga)`, avatar: null };
  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: ids, participants, type: "match", matchId: match.id, tournamentId: tournament.id, scrimId: null, teamId: null, teamName: tournament.name,
    title: `${match.teamA.name} vs ${match.teamB.name}`, blockedBy: [], lastMessage: "", lastAt: now(), createdAt: now(),
  });
  await updateMatch(match.id, { conversationId: ref.id });
  return ref.id;
};

// LFT — players looking for a team
export const createLft = (data, profile) =>
  addDoc(collection(db, "lft"), {
    ...data, playerId: profile.id, playerPseudo: profile.pseudo, playerAvatar: profile.avatar || null, languages: profile.languages || [],
    status: "open", isOfficial: isOfficialUid(profile.id), createdAt: now(),
  });
export const updateLft = (id, data) => updateDoc(doc(db, "lft", id), data);

export const recentQuery = (col, n = 100) => query(collection(db, col), orderBy("createdAt", "desc"), limit(n));
export const updateTournamentStatus = (id, status) => updateDoc(doc(db, "tournaments", id), { status, updatedAt: now() });
export const updateTournament = (id, data) => updateDoc(doc(db, "tournaments", id), { ...data, updatedAt: now() });
