// api/ical/[teamId].ts — flux iCal des scrims d'une équipe ("tous mes matchs").
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REST = "https://firestore.googleapis.com/v1/projects";

const valueOf = (v) => {
  if (!v) return null;
  for (const k of ["stringValue", "integerValue", "doubleValue", "booleanValue", "timestampValue"]) {
    if (v[k] !== undefined) return v[k];
  }
  return null;
};

const iso = (s) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) ? s.replace("T", " ").replace(/:00$/, ":00") : s);
const stamp = (dt) => String(dt).replace(/[-:]/g, "").replace(" ", "T") + "00";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const teamId = String(req.query.teamId || "").slice(0, 120);
  const apiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY || "";
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || "";
  if (!apiKey || !projectId || !teamId) {
    res.status(404).send("not found");
    return;
  }

  const q = {
    structuredQuery: {
      from: [{ collectionId: "scrims" }],
      where: { fieldFilter: { field: { fieldPath: "teamId" }, op: "EQUAL", value: { stringValue: teamId } } },
      limit: 300,
    },
  };

  let docs = [];
  try {
    const r = await fetch(`${REST}/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(q),
    });
    const body = await r.json();
    docs = (body || []).filter((x) => x.document).map((x) => ({ ...x.document.fields, id: x.document.name.split("/").pop() }));
  } catch {
    res.status(502).send("firestore unavailable");
    return;
  }

  const events = docs
    .filter((d) => valueOf(d.date))
    .map((d) => {
      const dt = String(valueOf(d.date));
      const tz = valueOf(d.timezone) || "Europe/Paris";
      const tzid = String(tz).replace(/^UTC$/, "Etc/UTC");
      const opponent = valueOf(d.opponentTeamName) ? ` vs ${valueOf(d.opponentTeamName)}` : "";
      const summary = `${valueOf(d.teamName) || "Scrim"}${opponent}`;
      const desc = [valueOf(d.notes), valueOf(d.rank) && `Rang : ${valueOf(d.rank)}`, `Format : ${valueOf(d.format)}`].filter(Boolean).join("\\n");
      return [
        "BEGIN:VEVENT",
        `UID:${valueOf(d.id) || d.id}@elyhub`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART;TZID=${tzid}:${stamp(dt)}`,
        `SUMMARY:${summary.replace(/,/g, "\\,")}`,
        desc && `DESCRIPTION:${desc.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
        `LOCATION:https://elysium-esport.fr`,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elysium//ElyHub//FR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:ElyHub — Scrims",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("content-type", "text/calendar; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=300");
  res.status(200).send(ics);
}
