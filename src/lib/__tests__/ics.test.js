import { buildIcs, buildIcsEvent } from "../ics";

describe("buildIcsEvent", () => {
  const evt = buildIcsEvent({
    uid: "scrim-1",
    start: new Date("2026-06-01T20:00:00Z"),
    durationMin: 90,
    summary: "Scrim; test, virgules",
    description: "ligne 1\nligne 2",
  });

  it("contient les lignes VEVEVENT et UID", () => {
    expect(evt).toContain("BEGIN:VEVENT");
    expect(evt).toContain("UID:scrim-1@elyhub");
    expect(evt).toContain("END:VEVENT");
  });

  it("calcule DTEND à partir de la durée", () => {
    expect(evt).toContain("DTSTART:20260601T200000Z");
    expect(evt).toContain("DTEND:20260601T213000Z");
  });

  it("échappe les caractères spéciaux et les retours à la ligne", () => {
    expect(evt).toContain("SUMMARY:Scrim\\; test\\, virgules");
    expect(evt).toContain("DESCRIPTION:ligne 1\\nligne 2");
  });
});

describe("buildIcs", () => {
  it("enveloppe les événements dans un VCALENDAR", () => {
    const ics = buildIcs(["EVENT"], "ElyHub");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("X-WR-CALNAME:ElyHub");
    expect(ics).toContain("EVENT");
    expect(ics).toContain("END:VCALENDAR");
  });
});
