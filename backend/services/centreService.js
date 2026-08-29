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

function updateCentre(id, updates = {}) {
  const current = db.prepare('SELECT * FROM centres WHERE id = ?').get(Number(id));
  if (!current) {
    const err = new Error('Centre not found');
    err.status = 404;
    throw err;
  }

  const daily_capacity = updates.daily_capacity !== undefined ? Math.max(10, Number(updates.daily_capacity)) : current.daily_capacity;
  const active_counters = updates.active_counters !== undefined ? Math.max(1, Number(updates.active_counters)) : current.active_counters;
  const total_counters = updates.total_counters !== undefined ? Math.max(active_counters, Number(updates.total_counters)) : current.total_counters;
  const avg_processing_min = updates.avg_processing_min !== undefined ? Math.max(1, Number(updates.avg_processing_min)) : current.avg_processing_min;
  const delay_min = updates.delay_min !== undefined ? Math.max(0, Number(updates.delay_min)) : current.delay_min;
  const max_qty_per_farmer = updates.max_qty_per_farmer !== undefined ? Math.max(1, Number(updates.max_qty_per_farmer)) : (current.max_qty_per_farmer || 50);
  const daily_target_qtl = updates.daily_target_qtl !== undefined ? Math.max(10, Number(updates.daily_target_qtl)) : (current.daily_target_qtl || 500);
  const slot_capacity = updates.slot_capacity !== undefined ? Math.max(1, Number(updates.slot_capacity)) : (current.slot_capacity || 6);

  db.prepare(`
    UPDATE centres
       SET daily_capacity = ?, active_counters = ?, total_counters = ?,
           avg_processing_min = ?, delay_min = ?, max_qty_per_farmer = ?,
           daily_target_qtl = ?, slot_capacity = ?
     WHERE id = ?
  `).run(
    daily_capacity,
    active_counters,
    total_counters,
    avg_processing_min,
    delay_min,
    max_qty_per_farmer,
    daily_target_qtl,
    slot_capacity,
    Number(id)
  );

  return getCentre(id);
}

module.exports = { listCentres, getCentre, updateCentre };
