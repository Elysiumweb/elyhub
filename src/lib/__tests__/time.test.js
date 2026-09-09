import { localToDate, relTime, fmtDateShort } from "../time";

const t = (k, p) => (p ? `${k}|${Object.values(p).join("")}` : k);

describe("localToDate", () => {
  it("convertit un datetime-local en Date", () => {
    const d = localToDate("2026-06-01T20:00", "UTC");
    expect(d.toISOString()).toBe("2026-06-01T20:00:00.000Z");
  });

  it("retourne null pour une entrée vide ou invalide", () => {
    expect(localToDate("")).toBeNull();
    expect(localToDate(null)).toBeNull();
  });
});

describe("relTime", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  it("dit « à l'instant » sous une minute", () => {
    expect(relTime(now - 20000, t, now)).toBe("rel_just_now");
  });

  it("dit « il y a N min »", () => {
    expect(relTime(now - 5 * 60000, t, now)).toBe("rel_min_ago|5");
  });

  it("dit « il y a N h »", () => {
    expect(relTime(now - 3 * 3600000, t, now)).toBe("rel_h_ago|3");
  });

  it("dit « hier »", () => {
    expect(relTime(now - 26 * 3600000, t, now)).toBe("rel_yesterday");
  });

  it("dit « dans N j » pour le futur", () => {
    expect(relTime(now + 7 * 86400000, t, now)).toBe("rel_in_d|7");
  });

  it("gère une entrée nulle", () => {
    expect(relTime(null, t, now)).toBe("—");
  });
});

describe("fmtDateShort", () => {
  it("formate une date française", () => {
    expect(fmtDateShort("2026-06-01T20:00:00.000Z", "fr")).toMatch(/2026/);
  });

  it("renvoie — pour une entrée vide", () => {
    expect(fmtDateShort(null)).toBe("—");
  });
});
