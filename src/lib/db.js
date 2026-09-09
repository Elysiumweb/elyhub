import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs,
  arrayUnion, arrayRemove, orderBy, limit, writeBatch, runTransaction, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_UID } from "./constants";
import { applyMatchToElo, ELO_INITIAL } from "./elo";
import { localToDate } from "./time";

export const now = () => Date.now();
export const isOfficialUid = (uid) => Boolean(ADMIN_UID) && uid === ADMIN_UID;
export const withId = (snap) => ({ id: snap.id, ...snap.data() });

// Sort: official first, then newest
export const rankOfficial = (list) =>
  [...list].sort((a, b) => (b.isOfficial === true) - (a.isOfficial === true) || (b.createdAt || 0) - (a.createdAt || 0));

// ─────────────────────────── Users ───────────────────────────
export const getProfile = async (uid) => {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? withId(s) : null;
};
export const saveProfile = (uid, data) => setDoc(doc(db, "users", uid), { ...data, updatedAt: now() }, { merge: true });

// Projection publique légère (annuaire) — écrite à chaque sauvegarde de profil.
export const publishProfile = (uid, data) =>
  setDoc(doc(db, "profiles", uid), { ...data, updatedAt: now() }, { merge: true });

export const banUser = (uid, banned = true) => updateDoc(doc(db, "users", uid), { banned, bannedAt: now() });
export const setUserRole = (uid, role) => updateDoc(doc(db, "users", uid), { role });

// ─────────────────────────── Games ───────────────────────────
export const createGame = (name, uid) =>
  addDoc(collection(db, "games"), {
    name, status: isOfficialUid(uid) ? "validated" : "pending", createdBy: uid, createdAt: now(),
  });
export const setGameStatus = (id, status) => updateDoc(doc(db, "games", id), { status });

// ─────────────────────────── Teams ───────────────────────────
export const createTeam = (data, uid) =>
  addDoc(collection(db, "teams"), {
    ...data, ownerId: uid, memberIds: [uid], isOfficial: isOfficialUid(uid),
    acceptMessages: true, palmares: [], createdAt: now(), status: "active", elo: ELO_INITIAL, eloGames: 0, rosterLog: [],
  });
export const updateTeam = (id, data) => updateDoc(doc(db, "teams", id), { ...data, updatedAt: now() });
export const getTeam = async (id) => {
  const s = await getDoc(doc(db, "teams", id));
  return s.exists() ? withId(s) : null;
};
export const archiveTeam = (id, archived = true) => updateDoc(doc(db, "teams", id), { status: archived ? "archived" : "active" });
export const deleteTeam = (id) => deleteDoc(doc(db, "teams", id));

export const addTeamMember = async (teamId, member) => {
  await updateDoc(doc(db, "teams", teamId), {
    memberIds: arrayUnion(member.uid),
    members: arrayUnion(member),
    rosterLog: arrayUnion({ type: "join", uid: member.uid, pseudo: member.pseudo, at: now() }),
  });
};
export const removeTeamMember = async (teamId, member) => {
  await updateDoc(doc(db, "teams", teamId), {
    memberIds: arrayRemove(member.uid),
    members: arrayRemove(member),
    rosterLog: arrayUnion({ type: "leave", uid: member.uid, pseudo: member.pseudo, at: now() }),
  });
};
// Un joueur quitte de lui-même : idem, en gardant l'entrée d'historique.
export const leaveTeam = (teamId, member) => removeTeamMember(teamId, member);
export const updateMemberRole = async (teamId, uid, role) => {
  const ref = doc(db, "teams", teamId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) return;
    const team = s.data();
    const members = (team.members || []).map((m) => (m.uid === uid ? { ...m, role } : m));
    tx.update(ref, { members, updatedAt: now() });
  });
};

// Transfert de capitanat (transaction : le nouveau capitaine est promu, l'ancien devient titulaire).
export const transferCaptaincy = async (teamId, newOwnerUid) => {
  const ref = doc(db, "teams", teamId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error("team-not-found");
    const team = s.data();
    const members = (team.members || []).map((m) => ({
      ...m,
      role: m.uid === newOwnerUid ? "captain" : m.uid === team.ownerId && m.role === "captain" ? "starter" : m.role,
    }));
    tx.update(ref, {
      ownerId: newOwnerUid,
      members,
      rosterLog: arrayUnion({ type: "captain", uid: newOwnerUid, at: now() }),
      updatedAt: now(),
    });
  });
};

// ─────────────────────────── Offers ───────────────────────────
export const createOffer = (data, team, uid) =>
  addDoc(collection(db, "offers"), {
    ...data, teamId: team.id, teamName: team.name, teamLogo: team.logo || null, gameId: team.gameId,
    ownerId: team.ownerId, isOfficial: team.isOfficial === true, status: "open", createdBy: uid, createdAt: now(),
  });
export const updateOffer = (id, data) => updateDoc(doc(db, "offers", id), { ...data, updatedAt: now() });
export const deleteOffer = (id) => deleteDoc(doc(db, "offers", id));

// ─────────────────────────── Applications ───────────────────────────
export const applyToOffer = (offer, profile, message) =>
  addDoc(collection(db, "applications"), {
    offerId: offer.id, offerRole: offer.role, teamId: offer.teamId, teamName: offer.teamName, gameId: offer.gameId,
    ownerId: offer.ownerId, playerId: profile.id, playerPseudo: profile.pseudo, playerAvatar: profile.avatar || null,
    message, status: "sent", createdAt: now(),
  });
export const updateApplication = (id, data) => updateDoc(doc(db, "applications", id), { ...data, updatedAt: now() });

// ─────────────────────────── Invitations ───────────────────────────
export const invitePlayer = (team, invitee, by) =>
  addDoc(collection(db, "invites"), {
    teamId: team.id, teamName: team.name, teamLogo: team.logo || null, gameId: team.gameId,
    inviteeId: invitee.id, inviteePseudo: invitee.pseudo, byUid: by, status: "pending", createdAt: now(),
  });
export const updateInvite = (id, data) => updateDoc(doc(db, "invites", id), { ...data, updatedAt: now() });
export const acceptInvite = async (invite, profile) => {
  await updateInvite(invite.id, { status: "accepted" });
  await addTeamMember(invite.teamId, { uid: invite.inviteeId, pseudo: invite.inviteePseudo, avatar: profile?.avatar || null, role: "starter" });
  await getTeam(invite.teamId);
  await notify(invite.byUid, "team_invite_accepted", { name: invite.inviteePseudo, team: invite.teamName }, `/teams/${invite.teamId}`);
};

// ─────────────────────────── Conversations ───────────────────────────
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
    blockedBy: [], lastMessage: "", lastAt: now(), lastReadAt: { [me.id]: now() }, archivedBy: [], createdAt: now(),
  });
  return ref.id;
};
export const sendMessage = async (convId, sender, text) => {
  await addDoc(collection(db, "conversations", convId, "messages"), { senderId: sender.id, senderName: sender.pseudo, text, createdAt: now() });
  await updateDoc(doc(db, "conversations", convId), { lastMessage: text.slice(0, 120), lastAt: now(), lastSenderId: sender.id });
};
export const markConversationRead = (convId, uid) =>
  updateDoc(doc(db, "conversations", convId), { [`lastReadAt.${uid}`]: now() });
export const archiveConversation = (convId, uid, archived = true) =>
  updateDoc(doc(db, "conversations", convId), { archivedBy: archived ? arrayUnion(uid) : arrayRemove(uid) });
export const deleteConversation = (convId) => deleteDoc(doc(db, "conversations", convId));
export const setTyping = (convId, uid, typing) =>
  updateDoc(doc(db, "conversations", convId), { [`typing.${uid}`]: typing ? now() : null }).catch(() => {});
// Blocage unilatéral : seul le bloquant est affecté (l'autre partie continue de voir la conversation).
export const toggleBlock = (convId, uid, blocked) =>
  updateDoc(doc(db, "conversations", convId), { blockedBy: blocked ? arrayRemove(uid) : arrayUnion(uid) });
export const reportConversation = (convId, uid, reason) =>
  addDoc(collection(db, "reports"), { targetType: "conversation", targetId: convId, reportedBy: uid, reason, createdAt: now() });

// ─────────────────────────── Scrims ───────────────────────────
export const createScrim = (data, team, uid) =>
  addDoc(collection(db, "scrims"), {
    ...data, teamId: team.id, teamName: team.name, teamLogo: team.logo || null, gameId: team.gameId,
    ownerId: team.ownerId, ownerIds: [team.ownerId], isOfficial: team.isOfficial === true,
    status: "open", opponentTeamId: null, opponentTeamName: null, cancelledBy: null, relaunched: false,
    createdBy: uid, createdAt: now(),
  });
export const updateScrim = (id, data) => updateDoc(doc(db, "scrims", id), { ...data, updatedAt: now() });
export const deleteScrim = (id) => deleteDoc(doc(db, "scrims", id));
export const relaunchScrim = async (scrim) => {
  const { id, ...rest } = scrim;
  await addDoc(collection(db, "scrims"), {
    ...rest, status: "open", opponentTeamId: null, opponentTeamName: null, opponentOwnerId: null, ownerIds: [scrim.ownerId],
    cancelledBy: null, relaunched: false, relaunchedFrom: id, conversationId: null, createdAt: now(),
  });
  await updateScrim(id, { relaunched: true });
};

// Résultat de scrim : score + vainqueur, mise à jour ELO des deux équipes,
// et si le scrim est récurrent, republication pour la semaine suivante.
export const submitScrimResult = async (scrim, scoreA, scoreB, byUid) => {
  const teamA = await getTeam(scrim.teamId);
  const teamB = scrim.opponentTeamId ? await getTeam(scrim.opponentTeamId) : null;
  const winnerId = scoreA > scoreB ? scrim.teamId : scoreB > scoreA ? scrim.opponentTeamId : null;
  await updateScrim(scrim.id, { status: "played", scoreA, scoreB, winnerId, playedAt: now() });

  if (teamA) {
    const elo = teamB ? applyMatchToElo(teamA, teamB, scoreA, scoreB) : null;
    await updateTeam(scrim.teamId, {
      elo: elo ? elo.teamA.elo : teamA.elo, eloGames: elo ? elo.teamA.games : teamA.eloGames,
      scrimsPlayed: increment(1), wins: increment(scoreA > scoreB ? 1 : 0),
    });
    if (teamB && elo) {
      await updateTeam(scrim.opponentTeamId, {
        elo: elo.teamB.elo, eloGames: elo.teamB.games, scrimsPlayed: increment(1), wins: increment(scoreB > scoreA ? 1 : 0),
      });
    }
  }

  if (scrim.recurring && scrim.ownerIds?.[0] === byUid) {
    const next = localToDate(scrim.date, scrim.timezone || "UTC");
    if (next) {
      const shifted = new Date(next.getTime() + 7 * 86400000);
      const [d, t] = shifted.toISOString().split("T");
      await createScrim(
        { ...scrim, date: `${d}T${t.slice(0, 5)}`, status: "open", opponentTeamId: null, opponentTeamName: null, opponentOwnerId: null, conversationId: null, recurring: true, scoreA: null, scoreB: null, winnerId: null },
        { id: scrim.teamId, name: scrim.teamName, logo: scrim.teamLogo, gameId: scrim.gameId, ownerId: scrim.ownerId, isOfficial: scrim.isOfficial },
        byUid
      );
    }
  }
  return winnerId;
};

export const reportNoShow = async (scrim, byUid, targetTeamId) => {
  await updateScrim(scrim.id, { noShowReportedBy: arrayUnion(byUid) });
  const target = await getTeam(targetTeamId);
  if (target) await updateTeam(targetTeamId, { noShows: increment(1) });
};

// ─────────────────────────── Tournaments ───────────────────────────
export const createTournament = (data, uid, organizerTeam) =>
  addDoc(collection(db, "tournaments"), {
    ...data, organizerId: uid, organizerTeamId: organizerTeam?.id || null, organizerName: organizerTeam?.name || null,
    isOfficial: isOfficialUid(uid), status: "registration", rounds: 0, registeredTeamIds: [], registeredTeams: [], createdAt: now(),
  });
export const updateTournament = (id, data) => updateDoc(doc(db, "tournaments", id), { ...data, updatedAt: now() });
export const deleteTournament = (id) => deleteDoc(doc(db, "tournaments", id));

// Inscription : vérification côté serveur des places via une transaction
// (le surbooking par appel direct devient impossible, les règles Firestore doublent ce contrôle).
export const registerTeamToTournament = async (tid, team) => {
  const ref = doc(db, "tournaments", tid);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error("tournament-not-found");
    const tr = s.data();
    if ((tr.registeredTeamIds || []).includes(team.id)) return;
    if ((tr.registeredTeamIds || []).length >= tr.slots) throw new Error("tournament-full");
    tx.update(ref, {
      registeredTeamIds: arrayUnion(team.id),
      registeredTeams: arrayUnion({ id: team.id, name: team.name, logo: team.logo || null, region: team.region || null, ownerId: team.ownerId, elo: team.elo ?? null }),
    });
  });
};
export const unregisterTeamFromTournament = async (tid, teamId) => {
  const ref = doc(db, "tournaments", tid);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) return;
    const tr = s.data();
    tx.update(ref, {
      registeredTeamIds: (tr.registeredTeamIds || []).filter((x) => x !== teamId),
      registeredTeams: (tr.registeredTeams || []).filter((x) => x.id !== teamId),
    });
  });
};
export const checkInTeam = (tid, teamId) => updateDoc(doc(db, "tournaments", tid), { checkedInTeamIds: arrayUnion(teamId) });

// ─────────────────────────── Matches ───────────────────────────
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

// Résolution d'un match : propagation du vainqueur au match suivant, en transaction
// (la lecture-modification-écriture non atomique pouvait perdre une mise à jour).
export const resolveMatch = async (match, scoreA, scoreB, resolvedBy) => {
  const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;
  await updateMatch(match.id, { scoreA, scoreB, winnerId: winner?.id || null, status: "done", dispute: null, resolvedBy });

  // ELO des équipes impliquées
  if (match.teamA && match.teamB) {
    const [a, b] = await Promise.all([getTeam(match.teamA.id), getTeam(match.teamB.id)]);
    if (a && b) {
      const elo = applyMatchToElo(a, b, scoreA, scoreB);
      await updateTeam(a.id, { elo: elo.teamA.elo, eloGames: elo.teamA.games, matchesPlayed: increment(1), wins: increment(scoreA > scoreB ? 1 : 0) });
      await updateTeam(b.id, { elo: elo.teamB.elo, eloGames: elo.teamB.games, matchesPlayed: increment(1), wins: increment(scoreB > scoreA ? 1 : 0) });
    }
  }

  if (match.nextMatchId && winner) {
    const nextRef = doc(db, "matches", match.nextMatchId);
    await runTransaction(db, async (tx) => {
      const s = await tx.get(nextRef);
      if (!s.exists()) return;
      const next = s.data();
      const other = match.nextSlot === "teamA" ? next.teamB : next.teamA;
      tx.update(nextRef, {
        [match.nextSlot]: { id: winner.id, name: winner.name, logo: winner.logo || null, ownerId: winner.ownerId || null },
        status: other ? "ready" : "pending",
        updatedAt: now(),
      });
    });
    if (winner.ownerId) {
      await notify(winner.ownerId, "match_ready", { name: winner.name }, `/tournaments/${match.tournamentId}?tab=matches`);
    }
  }
};

// Déclaration de score par un capitaine (avec preuve) — transaction :
// deux déclarations simultanées ne peuvent plus s'écraser mutuellement.
export const reportMatch = async (match, teamId, scoreA, scoreB, proof, uid) => {
  const ref = doc(db, "matches", match.id);
  let agreed = false;
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error("match-not-found");
    const current = { id: ref.id, ...s.data() };
    const reports = { ...(current.reports || {}), [teamId]: { scoreA, scoreB, proof: proof || null, by: uid, at: now() } };
    const otherId = teamId === current.teamA?.id ? current.teamB?.id : current.teamA?.id;
    const other = reports[otherId];
    if (other && other.scoreA === scoreA && other.scoreB === scoreB) {
      agreed = true;
      tx.update(ref, { reports, status: "done", scoreA, scoreB, winnerId: scoreA > scoreB ? current.teamA?.id : scoreB > scoreA ? current.teamB?.id : null, updatedAt: now() });
      return;
    }
    tx.update(ref, {
      reports,
      status: other ? "disputed" : "reported",
      dispute: other ? { reason: "score_mismatch", by: uid, at: now() } : current.dispute || null,
      updatedAt: now(),
    });
  });
  // Propagation du vainqueur au match suivant (hors transaction : multi-documents).
  if (agreed) await resolveMatch({ ...match, reports: { ...(match.reports || {}), [teamId]: { scoreA, scoreB, proof, by: uid, at: now() } } }, scoreA, scoreB, "auto");
};
export const disputeMatch = (match, uid, reason) => updateMatch(match.id, { status: "disputed", dispute: { reason, by: uid, at: now() } });

export const createMatchConversation = async (match, tournament, _me) => {
  const ids = [...new Set([match.teamA?.ownerId, match.teamB?.ownerId, tournament.organizerId].filter(Boolean))];
  const participants = {};
  [match.teamA, match.teamB].forEach((tm) => { if (tm?.ownerId) participants[tm.ownerId] = { name: `${tm.name} (capt.)`, avatar: tm.logo || null }; });
  if (tournament.organizerId && !participants[tournament.organizerId]) participants[tournament.organizerId] = { name: `${tournament.organizerName || "Orga"} (orga)`, avatar: null };
  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: ids, participants, type: "match", matchId: match.id, tournamentId: tournament.id, scrimId: null, teamId: null, teamName: tournament.name,
    title: `${match.teamA?.name || "TBD"} vs ${match.teamB?.name || "TBD"}`, blockedBy: [], lastMessage: "", lastAt: now(), lastReadAt: {}, archivedBy: [], createdAt: now(),
  });
  await updateMatch(match.id, { conversationId: ref.id });
  return ref.id;
};

// ─────────────────────────── LFT ───────────────────────────
export const createLft = (data, profile) =>
  addDoc(collection(db, "lft"), {
    ...data, playerId: profile.id, playerPseudo: profile.pseudo, playerAvatar: profile.avatar || null, languages: profile.languages || [],
    status: "open", isOfficial: isOfficialUid(profile.id), createdAt: now(),
  });
export const updateLft = (id, data) => updateDoc(doc(db, "lft", id), data);
export const deleteLft = (id) => deleteDoc(doc(db, "lft", id));

// ─────────────────────────── Notifications ───────────────────────────
export const notify = (recipientId, type, params = {}, link = null) => {
  if (!recipientId) return Promise.resolve(null);
  return addDoc(collection(db, "notifications"), { recipientId, type, params, link, read: false, createdAt: now() });
};
export const markNotificationRead = (id) => updateDoc(doc(db, "notifications", id), { read: true });
export const markAllNotificationsRead = (uid) =>
  getDocs(query(collection(db, "notifications"), where("recipientId", "==", uid), where("read", "==", false))).then((s) =>
    Promise.all(s.docs.map((d) => updateDoc(d.ref, { read: true })))
  );
export const notifyCaptains = (match) => {
  const ids = [match.teamA?.ownerId, match.teamB?.ownerId].filter(Boolean);
  return Promise.all(ids.map((id) => notify(id, "match_ready", { name: match.teamA?.name || "" }, `/tournaments/${match.tournamentId}?tab=matches`)));
};

// ─────────────────────────── Alertes ───────────────────────────
export const createAlert = (userId, data) =>
  addDoc(collection(db, "alerts"), { userId, ...data, createdAt: now() });
export const deleteAlert = (id) => deleteDoc(doc(db, "alerts", id));

// ─────────────────────────── Favoris (stockés sur le profil) ───────────────────────────
export const toggleFavorite = async (profile, kind, id) => {
  if (!profile) return null;
  const key = `fav_${kind}`;
  const list = profile[key] || [];
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  await saveProfile(profile.id, { [key]: next });
  return next;
};
export const isFavorite = (profile, kind, id) => (profile?.[`fav_${kind}`] || []).includes(id);

// ─────────────────────────── Avis d'équipe ───────────────────────────
export const addReview = (data) => addDoc(collection(db, "reviews"), { ...data, createdAt: now() });

// ─────────────────────────── Commentaires ───────────────────────────
export const addComment = (data) => addDoc(collection(db, "comments"), { ...data, createdAt: now() });
export const deleteComment = (id) => deleteDoc(doc(db, "comments", id));

// ─────────────────────────── Signalements & modération ───────────────────────────
export const reportContent = ({ targetType, targetId, targetLabel, reason, byUid }) =>
  addDoc(collection(db, "reports"), {
    targetType, targetId, targetLabel: targetLabel || null, reportedBy: byUid, reason, status: "open", createdAt: now(),
  });
export const resolveReport = (id, resolution) =>
  updateDoc(doc(db, "reports", id), { status: resolution, resolvedAt: now() });
export const logModAction = (byUid, action, targetType, targetId) =>
  addDoc(collection(db, "modlog"), { by: byUid, action, targetType, targetId, at: now() });
export const deleteContentByRef = async (targetType, targetId) => {
  const col = { team: "teams", offer: "offers", scrim: "scrims", tournament: "tournaments", lft: "lft", comment: "comments", news: "news" }[targetType];
  if (!col) return null;
  return deleteDoc(doc(db, col, targetId));
};

// ─────────────────────────── Actualités / blog ───────────────────────────
export const createNews = (data, uid) =>
  addDoc(collection(db, "news"), { ...data, authorId: uid, status: "published", publishedAt: now(), createdAt: now() });
export const updateNews = (id, data) => updateDoc(doc(db, "news", id), { ...data, updatedAt: now() });
export const deleteNews = (id) => deleteDoc(doc(db, "news", id));

// ─────────────────────────── Activité (fil communautaire) ───────────────────────────
export const logActivity = (type, params = {}, link = null) =>
  addDoc(collection(db, "activity"), { type, params, link, createdAt: now() });

// ─────────────────────────── Événements locaux ───────────────────────────
export const createEvent = (data, uid) => addDoc(collection(db, "events"), { ...data, ownerId: uid, createdAt: now() });
export const deleteEvent = (id) => deleteDoc(doc(db, "events", id));

export const recentQuery = (col, n = 100) => query(collection(db, col), orderBy("createdAt", "desc"), limit(n));

// ─────────────────────────── Export RGPD ───────────────────────────
export const exportUserData = async (uid) => {
  const profile = await getProfile(uid);
  const out = { profile, uid, exportedAt: new Date().toISOString() };
  const queries = [
    ["applications", where("playerId", "==", uid)],
    ["conversations", where("participantIds", "array-contains", uid)],
    ["reviews", where("authorId", "==", uid)],
    ["comments", where("authorId", "==", uid)],
    ["alerts", where("userId", "==", uid)],
    ["invites", where("inviteeId", "==", uid)],
  ];
  for (const [col, w] of queries) {
    try {
      const s = await getDocs(query(collection(db, col), w));
      out[col] = s.docs.map(withId);
    } catch {
      out[col] = [];
    }
  }
  return out;
};
