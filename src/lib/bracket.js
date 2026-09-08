// Bracket generation helpers. Teams: [{id,name,logo,ownerId}]
const slot = (t) => (t ? { id: t.id, name: t.name, logo: t.logo || null, ownerId: t.ownerId || null } : null);
const matchId = (tid, r, i) => `${tid}_r${r}_m${i}`;
const base = (tid, r, i, extra = {}) => ({ id: matchId(tid, r, i), tournamentId: tid, round: r, index: i, teamA: null, teamB: null, scoreA: null, scoreB: null, winnerId: null, status: "pending", reports: {}, dispute: null, conversationId: null, nextMatchId: null, nextSlot: null, ...extra });

export const shuffle = (arr) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

export function generateSingleElim(tid, teams) {
  const size = Math.max(2, 2 ** Math.ceil(Math.log2(teams.length)));
  const rounds = Math.log2(size);
  const seeded = [...teams, ...Array(size - teams.length).fill(null)];
  const matches = {};
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    for (let i = 0; i < count; i++) {
      const m = base(tid, r, i, { format: "single_elim" });
      if (r < rounds) { m.nextMatchId = matchId(tid, r + 1, Math.floor(i / 2)); m.nextSlot = i % 2 === 0 ? "teamA" : "teamB"; }
      matches[m.id] = m;
    }
  }
  for (let i = 0; i < size / 2; i++) {
    const m = matches[matchId(tid, 1, i)];
    m.teamA = slot(seeded[i * 2]); m.teamB = slot(seeded[i * 2 + 1]);
    if (m.teamA && m.teamB) m.status = "ready";
    else if (m.teamA || m.teamB) { const w = m.teamA || m.teamB; m.status = "done"; m.winnerId = w.id; m.isBye = true; if (m.nextMatchId) matches[m.nextMatchId][m.nextSlot] = w; }
  }
  Object.values(matches).forEach((m) => { if (m.round > 1 && m.teamA && m.teamB && m.status === "pending") m.status = "ready"; });
  return { matches: Object.values(matches), rounds };
}

export function generateRoundRobin(tid, teams) {
  const list = [...teams]; if (list.length % 2) list.push(null);
  const n = list.length, rounds = n - 1, matches = [];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a && b) matches.push(base(tid, r + 1, i, { format: "round_robin", teamA: slot(a), teamB: slot(b), status: "ready" }));
    }
    list.splice(1, 0, list.pop());
  }
  return { matches, rounds };
}

// Swiss: pair teams by points, avoiding rematches. Returns next round matches.
export function generateSwissRound(tid, teams, existing) {
  const round = (existing.reduce((m, x) => Math.max(m, x.round), 0)) + 1;
  const { table } = standings(teams, existing);
  const played = new Set(existing.map((m) => [m.teamA?.id, m.teamB?.id].sort().join("|")));
  const pool = table.map((s) => teams.find((t) => t.id === s.id)).filter(Boolean);
  const matches = []; let idx = 0;
  while (pool.length > 1) {
    const a = pool.shift();
    let j = pool.findIndex((b) => !played.has([a.id, b.id].sort().join("|")));
    if (j < 0) j = 0;
    const b = pool.splice(j, 1)[0];
    matches.push(base(tid, round, idx++, { format: "swiss", teamA: slot(a), teamB: slot(b), status: "ready" }));
  }
  if (pool.length === 1) matches.push(base(tid, round, idx, { format: "swiss", teamA: slot(pool[0]), status: "done", winnerId: pool[0].id, isBye: true }));
  return { matches, round };
}

export function standings(teams, matches) {
  const rows = Object.fromEntries(teams.map((t) => [t.id, { id: t.id, name: t.name, logo: t.logo, played: 0, wins: 0, draws: 0, losses: 0, points: 0, diff: 0 }]));
  matches.filter((m) => m.status === "done" && m.teamA && m.teamB).forEach((m) => {
    const a = rows[m.teamA.id], b = rows[m.teamB.id]; if (!a || !b) return;
    a.played++; b.played++; a.diff += (m.scoreA || 0) - (m.scoreB || 0); b.diff += (m.scoreB || 0) - (m.scoreA || 0);
    if (m.winnerId === a.id) { a.wins++; a.points += 3; b.losses++; } else if (m.winnerId === b.id) { b.wins++; b.points += 3; a.losses++; } else { a.draws++; b.draws++; a.points++; b.points++; }
  });
  matches.filter((m) => m.isBye && m.winnerId && rows[m.winnerId]).forEach((m) => { rows[m.winnerId].points += 3; rows[m.winnerId].wins++; rows[m.winnerId].played++; });
  return { table: Object.values(rows).sort((x, y) => y.points - x.points || y.diff - x.diff || x.name.localeCompare(y.name)) };
}
