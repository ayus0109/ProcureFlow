/**
 * Queue control for the centre admin.
 *
 * Advancing a farmer is a single forward step through STAGE_ORDER, and every
 * step writes a notification the farmer can see. An admin can only touch
 * bookings at their OWN centre — enforced here, not in the UI.
 */

const db = require('../db');
const {
  STAGE_ORDER,
  STATUS,
  ACTIVE_QUEUE_STATUSES,
  WAITING_QUEUE_STATUSES,
  CROPS,
} = require('../config/constants');
const { todayISO } = require('../utils/dates');
const { estimateWaitMinutes, formatWait } = require('./etaService');
const { getCentre } = require('./centreService');
const { httpError } = require('../utils/http');

const ACTIVE_PLACEHOLDERS = ACTIVE_QUEUE_STATUSES.map(() => '?').join(',');

function adminCentreId(adminId) {
  const row = db.prepare('SELECT centre_id FROM admins WHERE id = ?').get(adminId);
  if (!row) throw httpError(401, 'Please sign in again');
  return row.centre_id;
}

/**
 * The next status an admin may move a booking to, or null when the move needs
 * the procurement form (quality grade and weight) instead of a plain step.
 */
function nextStage(status) {
  const i = STAGE_ORDER.indexOf(status);
  if (i === -1 || i === STAGE_ORDER.length - 1) return null;
  const next = STAGE_ORDER[i + 1];
  return next === STATUS.CONFIRMED ? null : next;
}

const QUEUE_SQL = `
  SELECT b.id, b.token, b.crop, b.quantity_qtl, b.slot_time, b.status,
         f.name AS farmer_name, f.village, f.phone
    FROM bookings b
    JOIN farmers f ON f.id = b.farmer_id
   WHERE b.centre_id = ? AND b.slot_date = ? AND b.status IN (${ACTIVE_PLACEHOLDERS})
   ORDER BY b.slot_time, b.id`;

/** Centre figures and today's queue together, so the two can never disagree. */
function listQueue(centreId, date) {
  const day = date || todayISO();
  const centre = getCentre(centreId, day);
  if (!centre) throw httpError(404, 'Centre not found');

  const rows = db.prepare(QUEUE_SQL).all(centreId, day, ...ACTIVE_QUEUE_STATUSES);

  // Farmers already at a counter come first and carry no queue number — they
  // have left the waiting line, which is exactly why checking someone in
  // shortens the wait for everyone behind them.
  const isWaiting = (row) => WAITING_QUEUE_STATUSES.includes(row.status);

  const decorate = (row, position) => {
    const waitMin = estimateWaitMinutes({
      farmersAhead: position ? position - 1 : 0,
      avgProcessingMin: centre.avg_processing_min,
      activeCounters: centre.active_counters,
      delayMin: centre.delay_min,
    });
    const crop = CROPS.find((c) => c.key === row.crop);
    return {
      ...row,
      cropLabel: crop ? crop.label : row.crop,
      ratePerQtl: crop ? crop.ratePerQtl : null,
      position,
      atCounter: position === null,
      waitMin,
      waitLabel: formatWait(waitMin),
      nextStatus: nextStage(row.status),
    };
  };

  const atCounter = rows.filter((r) => !isWaiting(r)).map((r) => decorate(r, null));
  const waiting = rows.filter(isWaiting).map((r, i) => decorate(r, i + 1));

  return { centre, queue: [...atCounter, ...waiting], date: day, waitingCount: waiting.length };
}

function advanceMessage(status, booking) {
  switch (status) {
    case STATUS.WAITING:
      return `You are in the queue at ${booking.centre_name}. Token ${booking.token}.`;
    case STATUS.CALLED:
      return `It is your turn. Please go to the counter at ${booking.centre_name}. Token ${booking.token}.`;
    case STATUS.CHECKED_IN:
      return `Checked in at ${booking.centre_name}. Token ${booking.token}.`;
    case STATUS.ASSAYING:
      return `Quality check has started for token ${booking.token}.`;
    case STATUS.WEIGHMENT:
      return `Weighment has started for token ${booking.token}.`;
    default:
      return `Token ${booking.token} updated to ${status}.`;
  }
}

const BOOKING_SQL = `
  SELECT b.id, b.farmer_id, b.centre_id, b.status, b.token, b.slot_date,
         c.name AS centre_name
    FROM bookings b
    JOIN centres c ON c.id = b.centre_id
   WHERE b.id = ?`;

function advanceBooking({ bookingId, adminId }) {
  const centreId = adminCentreId(adminId);
  const booking = db.prepare(BOOKING_SQL).get(Number(bookingId));

  if (!booking) throw httpError(404, 'Booking not found');
  if (booking.centre_id !== centreId) {
    throw httpError(403, 'This farmer is booked at another centre');
  }

  const next = nextStage(booking.status);
  if (!next) {
    throw httpError(400, 'Completing procurement needs the quality and weight details.');
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(next, booking.id);

  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    booking.farmer_id,
    advanceMessage(next, booking),
    next === STATUS.CALLED ? 'ACTION' : 'INFO'
  );

  // Dispatch Urgent SMS & Broadcast real-time SSE update
  try {
    const eventsService = require('./eventsService');
    eventsService.broadcast('QUEUE_UPDATED', { centreId, bookingId: booking.id, stage: next });

    if (next === STATUS.CALLED) {
      const farmer = db.prepare('SELECT id, name, phone FROM farmers WHERE id = ?').get(booking.farmer_id);
      const smsService = require('./smsService');
      smsService.dispatchCalledSms(farmer, booking, 1);
    }
  } catch (err) {
    console.error('[Queue Event Warning]', err.message);
  }

  // Hand back the whole queue so the admin screen updates at once, without
  // waiting for the next poll.
  return listQueue(centreId, booking.slot_date);
}

module.exports = { adminCentreId, listQueue, advanceBooking, nextStage };
