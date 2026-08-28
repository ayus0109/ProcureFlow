/** Date helpers. Everything is local time — the demo is one centre, one timezone. */

/** 'YYYY-MM-DD' in local time. en-CA formats dates in exactly that shape. */
function todayISO(d = new Date()) {
  return d.toLocaleDateString('en-CA');
}

/** 'YYYY-MM-DD' offset from today, e.g. addDaysISO(1) is tomorrow. */
function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

/** 'YYYY-MM-DD HH:MM:SS' in local time, for stamping records. */
function nowStamp() {
  return new Date().toLocaleString('sv-SE');
}

module.exports = { todayISO, addDaysISO, nowStamp };
