// Helpers temps : fuseaux horaires explicites, affichages relatifs, conversions.
// Un scrim est stocké en "YYYY-MM-DDTHH:mm" (datetime-local) + champ `timezone` IANA.

export const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

// "YYYY-MM-DDTHH:mm" (local) + fuseau → Date UTC réelle
export const localToDate = (localStr, tz = "UTC") => {
  if (!localStr) return null;
  const m = String(localStr).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    const d = new Date(localStr);
    return isNaN(d) ? null : d;
  }
  const [, y, mo, d, h, mi] = m.map(Number);
  // Construit la date en UTC puis applique le décalage du fuseau
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const off = tzOffsetMs(tz, new Date(asUtc));
  return new Date(asUtc - off);
};

export const tzOffsetMs = (tz, date = new Date()) => {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
};

// "20:00" dans un fuseau donné
export const fmtTimeInTz = (date, tz) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date).replace(":", "h").replace(" ", "");
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
};

// Libellé de fuseau court : "CEST", "EDT", "UTC+2"…
export const tzAbbr = (tz, date = new Date()) => {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
};

// Date relative : "dans 2 h", "demain", "il y a 3 j"… (clés i18n)
export const relTime = (ts, t, nowTs = Date.now()) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return String(ts);
  const diff = d.getTime() - nowTs;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const past = diff < 0;

  if (min < 1) return past ? t("rel_just_now") : t("rel_now");
  if (min < 60) return past ? t("rel_min_ago", { n: min }) : t("rel_in_min", { n: min });
  if (h < 24) return past ? t("rel_h_ago", { n: h }) : t("rel_in_h", { n: h });
  if (days === 1) return past ? t("rel_yesterday") : t("rel_tomorrow");
  if (days < 30) return past ? t("rel_d_ago", { n: days }) : t("rel_in_d", { n: days });
  return past ? t("rel_long_ago") : t("rel_long");
};

// "20:00 CEST · 14:00 EDT" pour un scrim publié dans `tz`, vu depuis le navigateur
export const dualTzLabel = (localStr, tz) => {
  const date = localToDate(localStr, tz);
  if (!date) return localStr;
  const mine = browserTimezone();
  if (!tz || tz === mine) return `${fmtTimeInTz(date, tz)} ${tzAbbr(tz, date)}`;
  return `${fmtTimeInTz(date, tz)} ${tzAbbr(tz, date)} · ${fmtTimeInTz(date, mine)} ${tzAbbr(mine, date)}`;
};

export const fmtDateShort = (v, lang = "fr") => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
