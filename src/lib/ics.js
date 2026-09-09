// Génération .ics côté client ("Ajouter au calendrier") + lien de flux iCal d'équipe.
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const toIcalDate = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
};

// buildIcsEvent({ uid, start (Date), durationMin, summary, description, location, url })
export const buildIcsEvent = ({ uid, start, durationMin = 90, summary, description = "", location = "", url = "" }) => {
  const end = new Date(new Date(start).getTime() + durationMin * 60000);
  return [
    "BEGIN:VEVENT",
    `UID:${esc(uid)}@elyhub`,
    `DTSTAMP:${toIcalDate(new Date())}`,
    `DTSTART:${toIcalDate(start)}`,
    `DTEND:${toIcalDate(end)}`,
    `SUMMARY:${esc(summary)}`,
    description && `DESCRIPTION:${esc(description)}`,
    location && `LOCATION:${esc(location)}`,
    url && `URL:${esc(url)}`,
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\r\n");
};

export const buildIcs = (events, calendarName = "ElyHub") =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Elysium//ElyHub//FR", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(calendarName)}`, ...events, "END:VCALENDAR"].join("\r\n");

export const downloadIcs = (filename, ics) => {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
};

// URL du flux iCal d'une équipe (fonction Vercel api/ical/[teamId])
export const teamIcalUrl = (teamId) => `/api/ical/${encodeURIComponent(teamId)}`;
