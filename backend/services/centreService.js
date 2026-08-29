/**
 * Centre listing with live load figures, so a farmer can compare centres
 * before choosing one. All business logic lives here, never in React.
 */

const db = require('../db');
const { WAITING_QUEUE_STATUSES, SLOT_WINDOWS } = require('../config/constants');
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

function decorate(row, day) {
  const slotCap = row.slot_capacity || 10;
  const totalSlotsCapacity = slotCap * SLOT_WINDOWS.length;

  // Exact per-slot booking count for this centre on this specific date
  const slotCounts = db
    .prepare(
      'SELECT slot_time, COUNT(*) AS booked FROM bookings WHERE centre_id = ? AND slot_date = ? GROUP BY slot_time'
    )
    .all(row.id, day);

  const countMap = new Map(slotCounts.map((s) => [s.slot_time, s.booked]));

  let sumLeft = 0;
  for (const s of SLOT_WINDOWS) {
    const used = countMap.get(s) || 0;
    sumLeft += Math.max(0, slotCap - used);
  }

  const waitMin = estimateWaitMinutes({
    farmersAhead: row.in_queue,
    avgProcessingMin: row.avg_processing_min,
    activeCounters: row.active_counters,
    delayMin: row.delay_min,
  });

  const parsedCrops = row.accepted_crops
    ? row.accepted_crops.split(',').map((k) => k.trim()).filter(Boolean)
    : ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];

  return {
    ...row,
    accepted_crops_list: parsedCrops,
    daily_capacity: totalSlotsCapacity,
    slotsLeft: sumLeft,
    utilisationPct: Math.round(((totalSlotsCapacity - sumLeft) / totalSlotsCapacity) * 100),
    congestion: congestionLevel(totalSlotsCapacity - sumLeft, totalSlotsCapacity),
    waitMin,
    waitLabel: formatWait(waitMin),
  };
}

function listCentres(date) {
  const day = date || todayISO();
  return db
    .prepare(LIST_SQL)
    .all(day, day, ...WAITING_QUEUE_STATUSES)
    .map((row) => decorate(row, day));
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

  const slot_capacity = updates.slot_capacity !== undefined ? Math.max(1, Number(updates.slot_capacity)) : (current.slot_capacity || 10);
  const daily_capacity = updates.daily_capacity !== undefined ? Math.max(10, Number(updates.daily_capacity)) : (slot_capacity * SLOT_WINDOWS.length);
  const active_counters = updates.active_counters !== undefined ? Math.max(1, Number(updates.active_counters)) : current.active_counters;
  const total_counters = updates.total_counters !== undefined ? Math.max(active_counters, Number(updates.total_counters)) : current.total_counters;
  const avg_processing_min = updates.avg_processing_min !== undefined ? Math.max(1, Number(updates.avg_processing_min)) : current.avg_processing_min;
  const delay_min = updates.delay_min !== undefined ? Math.max(0, Number(updates.delay_min)) : current.delay_min;
  const max_qty_per_farmer = updates.max_qty_per_farmer !== undefined ? Math.max(1, Number(updates.max_qty_per_farmer)) : (current.max_qty_per_farmer || 50);
  const daily_target_qtl = updates.daily_target_qtl !== undefined ? Math.max(10, Number(updates.daily_target_qtl)) : (current.daily_target_qtl || 500);

  const accepted_crops = Array.isArray(updates.accepted_crops)
    ? updates.accepted_crops.join(',')
    : (updates.accepted_crops !== undefined ? updates.accepted_crops : (current.accepted_crops || 'WHEAT,PADDY,COTTON,SOYBEAN,TUR'));

  const max_moisture_pct = updates.max_moisture_pct !== undefined ? Number(updates.max_moisture_pct) : (current.max_moisture_pct || 12.0);
  const min_quality_grade = updates.min_quality_grade || current.min_quality_grade || 'FAQ';

  db.prepare(`
    UPDATE centres
       SET daily_capacity = ?, active_counters = ?, total_counters = ?,
           avg_processing_min = ?, delay_min = ?, max_qty_per_farmer = ?,
           daily_target_qtl = ?, slot_capacity = ?, accepted_crops = ?,
           max_moisture_pct = ?, min_quality_grade = ?
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
    accepted_crops,
    max_moisture_pct,
    min_quality_grade,
    Number(id)
  );

  return getCentre(id);
}

module.exports = { listCentres, getCentre, updateCentre };
