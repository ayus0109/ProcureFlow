/**
 * Payments raised by completed procurements.
 *
 * A payment appears as PROCESSING the moment a sale is confirmed (see
 * procurementService) and the centre admin marks it PAID once the money is
 * released. Nothing here creates payments — that would let a payment exist
 * without a sale behind it.
 */

const db = require('../db');
const { PAYMENT_STATUS, CROPS } = require('../config/constants');
const { todayISO } = require('../utils/dates');
const { httpError } = require('../utils/http');
const { money } = require('../utils/money');
const { adminCentreId } = require('./queueService');
const { notify } = require('./notificationService');

const LIST_SQL = `
  SELECT y.id, y.amount, y.status, y.updated_at, y.txn_ref,
         b.token, b.crop, b.slot_date,
         p.final_weight_qtl, p.rate_per_qtl,
         f.name AS farmer_name, f.village
    FROM payments y
    JOIN procurements p ON p.id = y.procurement_id
    JOIN bookings b ON b.id = p.booking_id
    JOIN farmers f ON f.id = b.farmer_id
   WHERE b.centre_id = ? AND b.slot_date = ?
   ORDER BY y.id DESC`;

const round2 = (n) => Math.round(n * 100) / 100;

/** Today's payments at one centre, with the figures the admin is asked for. */
function listPayments(centreId, date) {
  const day = date || todayISO();
  const rows = db.prepare(LIST_SQL).all(centreId, day);

  const payments = rows.map((row) => {
    const crop = CROPS.find((c) => c.key === row.crop);
    return { ...row, cropLabel: crop ? crop.label : row.crop };
  });

  const paid = payments.filter((p) => p.status === PAYMENT_STATUS.PAID);
  const pending = payments.filter((p) => p.status !== PAYMENT_STATUS.PAID);

  return {
    date: day,
    payments,
    totals: {
      count: payments.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      paidAmount: round2(paid.reduce((sum, p) => sum + p.amount, 0)),
      pendingAmount: round2(pending.reduce((sum, p) => sum + p.amount, 0)),
    },
  };
}

const ONE_SQL = `
  SELECT y.id, y.amount, y.status, y.txn_ref, b.centre_id, b.slot_date, b.token, b.farmer_id
    FROM payments y
    JOIN procurements p ON p.id = y.procurement_id
    JOIN bookings b ON b.id = p.booking_id
   WHERE y.id = ?`;

function markPaid({ paymentId, adminId }) {
  const centreId = adminCentreId(adminId);
  const payment = db.prepare(ONE_SQL).get(Number(paymentId));

  if (!payment) throw httpError(404, 'Payment not found');
  if (payment.centre_id !== centreId) {
    throw httpError(403, 'This payment belongs to another centre');
  }
  if (payment.status === PAYMENT_STATUS.PAID) {
    throw httpError(409, `${payment.txn_ref} is already marked paid.`);
  }

  db.prepare(
    "UPDATE payments SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(PAYMENT_STATUS.PAID, payment.id);

  notify(
    payment.farmer_id,
    // "Paid" is the word on the admin's button, the status pill and the receipt,
    // so it is the word the farmer reads here too.
    `Payment of ${money(payment.amount)} for token ${payment.token} ` +
      `has been paid. Reference ${payment.txn_ref}.`,
    'SUCCESS'
  );

  return { ...listPayments(centreId, payment.slot_date), paid: { txnRef: payment.txn_ref, amount: payment.amount } };
}

module.exports = { listPayments, markPaid };
