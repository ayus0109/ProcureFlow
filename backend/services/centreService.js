/**
 * Centre listing with live load figures, so a farmer can compare centres
 * before choosing one. All business logic lives here, never in React.
 */

const db = require('../db');
const { WAITING_QUEUE_STATUSES } = require('../config/constants');
const { todayISO } = require('../utils/dates');
const { estimateWaitMinutes, congestionLevel, formatWait } = require('./etaService');

const STATUS_PLACEHOLDERS = WAITING_QUEUE_STATUSES.map(() => '?').join(',');

const LIST_SQL = `
  SELECT c.*,
    (SELECT COUNT(*) FROM bookings b
       WHERE b.centre_id = c.id AND b.slot_date = ?) AS booked_today,
    (SELECT COUNT(*) FROM bookings b
       WHERE b.centre_id = c.id AND b.slot_date = ?
         AND b.status IN (${STATUS_PLACEHOLDERS})) AS in_queue
  FROM centres c
  ORDER BY c.name`;

function decorate(row) {
  const waitMin = estimateWaitMinutes({
    farmersAhead: row.in_queue,
    avgProcessingMin: row.avg_processing_min,
    activeCounters: row.active_counters,
    delayMin: row.delay_min,
  });

  return {
    ...row,
    utilisationPct: row.daily_capacity
      ? Math.round((row.booked_today / row.daily_capacity) * 100)
      : 0,
    congestion: congestionLevel(row.booked_today, row.daily_capacity),
    waitMin,
    waitLabel: formatWait(waitMin),
    slotsLeft: Math.max(0, row.daily_capacity - row.booked_today),
  };
}

function listCentres(date) {
  const day = date || todayISO();
  return db
    .prepare(LIST_SQL)
    .all(day, day, ...WAITING_QUEUE_STATUSES)
    .map(decorate);
}

function getCentre(id, date) {
  return listCentres(date).find((c) => c.id === Number(id)) || null;
}

module.exports = { listCentres, getCentre };
