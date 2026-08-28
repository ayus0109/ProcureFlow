/**
 * Recording the sale: quality, weight, amount — and the payment it raises.
 *
 * This is the only place money is calculated. The rate comes from the crop
 * table on the server, never from the browser, so the amount cannot be tampered
 * with by editing a form field.
 */

const db = require('../db');
const { CROPS, STATUS, QUALITY_GRADES, PAYMENT_STATUS, gradeFactor } = require('../config/constants');
const { httpError } = require('../utils/http');
const { money } = require('../utils/money');
const { adminCentreId, listQueue } = require('./queueService');

/** Stages at which a farmer is physically at the counter and can be closed out. */
const CLOSEABLE = [STATUS.CHECKED_IN, STATUS.ASSAYING, STATUS.WEIGHMENT];

const BOOKING_SQL = `
  SELECT b.id, b.farmer_id, b.centre_id, b.crop, b.quantity_qtl, b.slot_date,
         b.status, b.token, c.name AS centre_name
    FROM bookings b
    JOIN centres c ON c.id = b.centre_id
   WHERE b.id = ?`;

function loadForAdmin(bookingId, adminId) {
  const centreId = adminCentreId(adminId);
  const booking = db.prepare(BOOKING_SQL).get(Number(bookingId));

  if (!booking) throw httpError(404, 'Booking not found');
  if (booking.centre_id !== centreId) {
    throw httpError(403, 'This farmer is booked at another centre');
  }
  if (booking.status === STATUS.CONFIRMED || booking.status === STATUS.REJECTED) {
    throw httpError(409, `Token ${booking.token} is already closed.`);
  }
  return { booking, centreId };
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Shared checks for both outcomes — a rejection still records what was measured. */
function readAssay({ qualityGrade, moisturePct }) {
  if (!QUALITY_GRADES.includes(qualityGrade)) {
    throw httpError(400, 'Please choose a quality grade');
  }
  // A blank field must not slip through as a measurement: Number('') is 0, which
  // would be recorded as 0% moisture.
  const raw = typeof moisturePct === 'string' ? moisturePct.trim() : moisturePct;
  if (raw === '' || raw === null || raw === undefined) {
    throw httpError(400, 'Please enter the moisture percentage');
  }
  const moisture = Number(raw);
  if (!Number.isFinite(moisture) || moisture < 0 || moisture > 30) {
    throw httpError(400, 'Moisture must be between 0 and 30 percent');
  }
  return { qualityGrade, moisture };
}

/** Runs several writes as one unit, so a half-recorded sale cannot exist. */
function inTransaction(work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function notify(farmerId, message, type) {
  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    farmerId,
    message,
    type
  );
}

function completeProcurement({
  bookingId,
  adminId,
  qualityGrade,
  moisturePct,
  netWeightQtl,
  remarks,
}) {
  const { booking, centreId } = loadForAdmin(bookingId, adminId);

  if (!CLOSEABLE.includes(booking.status)) {
    throw httpError(400, 'Check the farmer in at the counter before recording procurement.');
  }

  const { moisture } = readAssay({ qualityGrade, moisturePct });

  const weight = Number(netWeightQtl);
  if (!weight || weight <= 0) {
    throw httpError(400, 'Please enter the weighed quantity in quintals');
  }
  // A little over the booked amount is normal; a lot means a typo.
  const ceiling = round2(booking.quantity_qtl * 1.1);
  if (weight > ceiling) {
    throw httpError(
      400,
      `Weighed quantity cannot be more than ${ceiling} quintals for a booking of ${booking.quantity_qtl}`
    );
  }

  const crop = CROPS.find((c) => c.key === booking.crop);
  const baseRate = crop ? crop.ratePerQtl : 0;
  const factor = gradeFactor(qualityGrade);
  // `rate_per_qtl` stores the rate the farmer was actually paid, so weight x rate
  // still equals the amount on the receipt. The benchmark rate and the factor are
  // derived for display instead of stored, so the two can never disagree.
  const rate = round2(baseRate * factor);
  const amount = round2(weight * rate);

  const receipt = inTransaction(() => {
    const procurement = db
      .prepare(
        `INSERT INTO procurements
           (booking_id, quality_grade, moisture_pct, accepted, final_weight_qtl,
            rate_per_qtl, total_amount, remarks, confirmed_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, datetime('now', 'localtime'))`
      )
      .run(booking.id, qualityGrade, moisture, weight, rate, amount, remarks || null);

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(STATUS.CONFIRMED, booking.id);

    const payment = db
      .prepare('INSERT INTO payments (procurement_id, amount, status) VALUES (?, ?, ?)')
      .run(Number(procurement.lastInsertRowid), amount, PAYMENT_STATUS.PROCESSING);

    const { txn_ref: txnRef } = db
      .prepare('SELECT txn_ref FROM payments WHERE id = ?')
      .get(Number(payment.lastInsertRowid));

    notify(
      booking.farmer_id,
      `Procurement complete for token ${booking.token}. ${weight} qtl of ` +
        `${crop ? crop.label : booking.crop} (${qualityGrade}) at ` +
        `${money(rate)}/qtl. Amount ${money(amount)}. ` +
        `Payment is being processed (${txnRef}).`,
      'SUCCESS'
    );

    return {
      token: booking.token,
      netWeightQtl: weight,
      qualityGrade,
      baseRatePerQtl: baseRate,
      gradeFactor: factor,
      ratePerQtl: rate,
      totalAmount: amount,
      txnRef,
    };
  });

  return { ...listQueue(centreId, booking.slot_date), completed: receipt };
}

function rejectProcurement({ bookingId, adminId, qualityGrade, moisturePct, remarks }) {
  const { booking, centreId } = loadForAdmin(bookingId, adminId);

  if (!CLOSEABLE.includes(booking.status)) {
    throw httpError(400, 'Check the farmer in at the counter before rejecting a lot.');
  }

  const { moisture } = readAssay({ qualityGrade, moisturePct });

  const reason = (remarks || '').trim();
  if (reason.length < 4) {
    throw httpError(400, 'Please write the reason, so the farmer knows why it was not accepted');
  }

  inTransaction(() => {
    db.prepare(
      `INSERT INTO procurements
         (booking_id, quality_grade, moisture_pct, accepted, final_weight_qtl,
          rate_per_qtl, total_amount, remarks, confirmed_at)
       VALUES (?, ?, ?, 0, NULL, NULL, 0, ?, datetime('now', 'localtime'))`
    ).run(booking.id, qualityGrade, moisture, reason);

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(STATUS.REJECTED, booking.id);

    notify(
      booking.farmer_id,
      `Token ${booking.token} was not accepted at ${booking.centre_name}. Reason: ${reason}`,
      'ALERT'
    );
  });

  return { ...listQueue(centreId, booking.slot_date), rejected: { token: booking.token, reason } };
}

module.exports = { completeProcurement, rejectProcurement };
