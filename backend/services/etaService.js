/**
 * Wait-time and congestion maths. Kept in one small file because this is the
 * part you will be asked to justify out loud — it must stay explainable.
 */

const { CONGESTION_THRESHOLDS } = require('../config/constants');

/**
 * The formula the whole product rests on:
 *
 *   wait = (farmers ahead x avg processing time) / active counters + current delay
 *
 * Recomputed on every read, so it responds automatically when the queue moves,
 * a counter goes down, or a delay is recorded.
 */
function estimateWaitMinutes({ farmersAhead, avgProcessingMin, activeCounters, delayMin = 0 }) {
  const counters = Math.max(1, Number(activeCounters) || 1);
  const ahead = Math.max(0, Number(farmersAhead) || 0);
  const perFarmer = Math.max(1, Number(avgProcessingMin) || 1);
  return Math.round((ahead * perFarmer) / counters) + (Number(delayMin) || 0);
}

/** How busy a centre is, as a share of its daily capacity. */
function congestionLevel(bookedToday, dailyCapacity) {
  if (!dailyCapacity) return 'LOW';
  const used = bookedToday / dailyCapacity;
  if (used < CONGESTION_THRESHOLDS.LOW) return 'LOW';
  if (used < CONGESTION_THRESHOLDS.MODERATE) return 'MODERATE';
  return 'HIGH';
}

/** '34 min' / '1 hr 5 min' — never a bare number on a farmer's screen. */
function formatWait(minutes) {
  const min = Math.max(0, Math.round(Number(minutes) || 0));
  if (min === 0) return 'No wait';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const pad = (n) => String(n).padStart(2, '0');

/** 'HH:MM' -> minutes since midnight. */
function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** Minutes since midnight -> 'HH:MM', kept inside a single day. */
function toClock(minutes) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/**
 * When the farmer should reach the centre.
 *
 * Arrive 10 minutes before your turn, so the counter never sits idle — but the
 * answer must always fall **inside the window the farmer booked**. This used to
 * be a bare `now + wait`, which ignored the window: at 17:20 a farmer holding a
 * 09:00-10:00 slot was told to reach by 17:25. Now the window start is the floor
 * and the window end is the ceiling.
 *
 * Returned as 24-hour 'HH:MM' so it reads consistently beside the slot label
 * ('09:00-10:00') sitting next to it on screen.
 */
function recommendedArrival(waitMinutes, slotWindow) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const lead = Math.max(0, (Number(waitMinutes) || 0) - 10);
  const target = nowMin + lead;

  const [from, to] = String(slotWindow || '').split('-');
  const start = toMinutes(from);
  const end = toMinutes(to);
  // No usable window (shouldn't happen — slot_time is validated on booking):
  // fall back to the plain estimate rather than inventing a time.
  if (start === null || end === null) return toClock(target);

  return toClock(Math.min(Math.max(target, start), end));
}

module.exports = { estimateWaitMinutes, congestionLevel, formatWait, recommendedArrival };
