/**
 * Booking and queue logic — the core of the product.
 *
 * Queue position is never stored. It is derived with ROW_NUMBER at read time
 * from the bookings still active that day, so it cannot drift out of step with
 * reality no matter what the admin does.
 */

const db = require('../db');
const {
  CROPS,
  SLOT_WINDOWS,
  STATUS,
  ACTIVE_QUEUE_STATUSES,
  WAITING_QUEUE_STATUSES,
  gradeFactor,
} = require('../config/constants');
const { todayISO, addDaysISO } = require('../utils/dates');
const { estimateWaitMinutes, formatWait, recommendedArrival } = require('./etaService');
const { httpError } = require('../utils/http');

const ACTIVE_PLACEHOLDERS = ACTIVE_QUEUE_STATUSES.map(() => '?').join(',');
const WAITING_PLACEHOLDERS = WAITING_QUEUE_STATUSES.map(() => '?').join(',');

/** A farmer may book today or either of the next two days. */
function bookableDates() {
  return [todayISO(), addDaysISO(1), addDaysISO(2)];
}

function findCrop(key) {
  return CROPS.find((c) => c.key === key) || null;
}

/** The centre's day split evenly across the fixed windows. */
function windowCapacity(dailyCapacity) {
  return Math.max(1, Math.ceil(dailyCapacity / SLOT_WINDOWS.length));
}

/** Every window for a centre on a date, with how much room is left in each. */
function slotAvailability(centreId, date) {
  const centre = db
    .prepare('SELECT id, daily_capacity, slot_capacity FROM centres WHERE id = ?')
    .get(Number(centreId));
  if (!centre) throw httpError(404, 'Centre not found');

  const day = date || todayISO();
  const capacity = centre.slot_capacity || windowCapacity(centre.daily_capacity);

  const rows = db
    .prepare(
      `SELECT slot_time, COUNT(*) AS booked FROM bookings
        WHERE centre_id = ? AND slot_date = ?
        GROUP BY slot_time`
    )
    .all(centre.id, day);

  const booked = new Map(rows.map((r) => [r.slot_time, r.booked]));

  return SLOT_WINDOWS.map((slot) => {
    const used = booked.get(slot) || 0;
    return {
      slot,
      booked: used,
      capacity,
      left: Math.max(0, capacity - used),
      full: used >= capacity,
    };
  });
}

const BOOKING_SELECT = `
  SELECT b.id, b.farmer_id, b.centre_id, b.crop, b.quantity_qtl,
         b.slot_date, b.slot_time, b.status, b.token, b.created_at,
         c.name AS centre_name, c.district,
         c.avg_processing_min, c.active_counters, c.delay_min
    FROM bookings b
    JOIN centres c ON c.id = b.centre_id`;

const ACTIVE_BOOKING_SQL = `${BOOKING_SELECT}
   WHERE b.farmer_id = ? AND b.status IN (${ACTIVE_PLACEHOLDERS})
   ORDER BY b.slot_date, b.slot_time, b.id
   LIMIT 1`;

const ONE_BOOKING_SQL = `${BOOKING_SELECT} WHERE b.id = ?`;

/**
 * A booking closed earlier today. Shown once no active booking remains, so the
 * farmer sees how their sale ended instead of an empty screen.
 */
const CLOSED_TODAY_SQL = `${BOOKING_SELECT}
   WHERE b.farmer_id = ? AND b.slot_date = ? AND b.status IN (?, ?)
   ORDER BY b.id DESC
   LIMIT 1`;

/** Quality, weight and money, once the sale has been recorded. */
const RECEIPT_SQL = `
  SELECT p.quality_grade, p.moisture_pct, p.accepted, p.final_weight_qtl,
         p.rate_per_qtl, p.total_amount, p.remarks, p.confirmed_at,
         y.status AS payment_status, y.txn_ref
    FROM procurements p
    LEFT JOIN payments y ON y.procurement_id = p.id
   WHERE p.booking_id = ?`;

/**
 * Position in the waiting line for that centre and day, ordered by slot then
 * booking age. Null once the farmer reaches a counter — they have left the line.
 */
const POSITION_SQL = `
  WITH queue AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY slot_time, id) AS position
      FROM bookings
     WHERE centre_id = ? AND slot_date = ? AND status IN (${WAITING_PLACEHOLDERS})
  )
  SELECT position FROM queue WHERE id = ?`;

function decorateBooking(row) {
  const seat = db
    .prepare(POSITION_SQL)
    .get(row.centre_id, row.slot_date, ...WAITING_QUEUE_STATUSES, row.id);

  const position = seat ? seat.position : null;
  const farmersAhead = position ? position - 1 : 0;

  const waitMin = estimateWaitMinutes({
    farmersAhead,
    avgProcessingMin: row.avg_processing_min,
    activeCounters: row.active_counters,
    delayMin: row.delay_min,
  });

  const crop = findCrop(row.crop);
  const closed = row.status === STATUS.CONFIRMED || row.status === STATUS.REJECTED;

  return {
    ...row,
    cropLabel: crop ? crop.label : row.crop,
    ratePerQtl: crop ? crop.ratePerQtl : null,
    position,
    farmersAhead,
    waitMin,
    waitLabel: formatWait(waitMin),
    // Only meaningful for a slot today that is still coming up — a clock time on
    // a future date, or on a finished sale, misleads. The window goes in too, so
    // the answer can never fall outside the hour the farmer booked.
    arriveBy:
      !closed
        ? row.slot_date === todayISO()
          ? recommendedArrival(waitMin, row.slot_time)
          : row.slot_time
          ? row.slot_time.split('-')[0]
          : null
        : null,
    procurement: decorateReceipt(db.prepare(RECEIPT_SQL).get(row.id) || null, crop),
  };
}

/**
 * Adds the two figures the receipt needs but the table does not store: the
 * crop's benchmark rate and the factor the grade applied to it. Derived rather
 * than stored — `rate_per_qtl` already holds what the farmer was actually paid,
 * and duplicating the base rate in a column would let the two drift apart.
 */
function decorateReceipt(receipt, crop) {
  if (!receipt || !receipt.accepted) return receipt;
  return {
    ...receipt,
    baseRatePerQtl: crop ? crop.ratePerQtl : null,
    gradeFactor: gradeFactor(receipt.quality_grade),
  };
}

/** The farmer's current active bookings (up to 3) and today's closed sales, or null. */
function activeBooking(farmerId) {
  const activeRows = db
    .prepare(
      `${BOOKING_SELECT}
       WHERE b.farmer_id = ? AND b.status IN (${ACTIVE_PLACEHOLDERS})
       ORDER BY b.slot_date, b.slot_time, b.id
       LIMIT 3`
    )
    .all(farmerId, ...ACTIVE_QUEUE_STATUSES);

  const closedRows = db
    .prepare(
      `${BOOKING_SELECT}
       WHERE b.farmer_id = ? AND b.slot_date = ? AND b.status IN (?, ?)
       ORDER BY b.id DESC`
    )
    .all(farmerId, todayISO(), STATUS.CONFIRMED, STATUS.REJECTED);

  const activeDecorated = (activeRows || []).map(decorateBooking);
  const closedDecorated = (closedRows || []).map(decorateBooking);
  const allDecorated = [...activeDecorated, ...closedDecorated];

  if (allDecorated.length === 0) return null;

  const primary = activeDecorated[0] || closedDecorated[0];

  return {
    ...primary,
    activeCount: activeDecorated.length,
    closedCount: closedDecorated.length,
    allBookings: allDecorated,
    recentCompleted: closedDecorated[0] || null,
  };
}

function createBooking({ farmerId, centreId, crop, quantityQtl, slotDate, slotTime }) {
  // A farmer can hold up to 3 active bookings concurrently (e.g. different crops/dates/slots)
  const activeRows = db
    .prepare(`SELECT id, token FROM bookings WHERE farmer_id = ? AND status IN (${ACTIVE_PLACEHOLDERS})`)
    .all(farmerId, ...ACTIVE_QUEUE_STATUSES);

  if (activeRows.length >= 3) {
    throw httpError(409, `You already have ${activeRows.length} active bookings. Maximum 3 slots allowed per farmer.`);
  }

  const centre = db
    .prepare('SELECT id, name, daily_capacity, max_qty_per_farmer FROM centres WHERE id = ?')
    .get(Number(centreId));
  if (!centre) throw httpError(400, 'Please choose a procurement centre');

  if (!findCrop(crop)) throw httpError(400, 'Please choose a crop');

  const qty = Number(quantityQtl);
  if (!qty || qty <= 0) throw httpError(400, 'Please enter the quantity in quintals');

  const maxLimit = centre.max_qty_per_farmer || 200;
  if (qty > maxLimit) {
    throw httpError(400, `${centre.name} has a maximum quota limit of ${maxLimit} quintals per booking.`);
  }

  if (!SLOT_WINDOWS.includes(slotTime)) throw httpError(400, 'Please choose a time slot');
  if (!bookableDates().includes(slotDate)) {
    throw httpError(400, 'Please choose a date within the next three days');
  }

  const window = slotAvailability(centre.id, slotDate).find((s) => s.slot === slotTime);
  if (window.full) throw httpError(409, 'That time slot is full. Please pick another window.');

  const result = db
    .prepare(
      `INSERT INTO bookings (farmer_id, centre_id, crop, quantity_qtl, slot_date, slot_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(farmerId, centre.id, crop, qty, slotDate, slotTime, STATUS.BOOKED);

  const booking = decorateBooking(
    db.prepare(ONE_BOOKING_SQL).get(Number(result.lastInsertRowid))
  );

  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    farmerId,
    `Slot booked at ${centre.name} on ${booking.slot_date}, ${booking.slot_time}. ` +
      `Token ${booking.token}. You are number ${booking.position} in the queue.`,
    'SUCCESS'
  );

  return booking;
}

module.exports = { bookableDates, slotAvailability, activeBooking, createBooking };
