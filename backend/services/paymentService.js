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
         y.pfms_utr, y.disbursed_at, y.disbursement_type, y.credited_bank, y.credited_account,
         b.token, b.crop, b.slot_date,
         p.final_weight_qtl, p.rate_per_qtl,
         f.name AS farmer_name, f.village, f.phone,
         f.bank_account, f.ifsc_code, f.bank_name, f.aadhaar_no, f.ekyc_verified
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
    const maskedAccount = row.bank_account ? `••••${row.bank_account.slice(-4)}` : '••••4821';
    const displayBank = row.bank_name || 'State Bank of India (Baramati)';
    return {
      ...row,
      cropLabel: crop ? crop.label : row.crop,
      maskedAccount,
      displayBank,
    };
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

const { addDaysISO } = require('../utils/dates');

function markPaid({ paymentId, adminId, disbursementType = 'INSTANT', scheduleDays = 0 }) {
  const centreId = adminCentreId(adminId);
  const payment = db.prepare(ONE_SQL).get(Number(paymentId));

  if (!payment) throw httpError(404, 'Payment not found');
  if (payment.centre_id !== centreId) {
    throw httpError(403, 'This payment belongs to another centre');
  }
  if (payment.status === PAYMENT_STATUS.PAID) {
    throw httpError(409, `${payment.txn_ref} is already marked paid.`);
  }

  const farmer = db
    .prepare('SELECT id, name, phone, bank_account, ifsc_code, bank_name, aadhaar_no FROM farmers WHERE id = ?')
    .get(payment.farmer_id);

  const targetBank = farmer?.bank_name || 'State Bank of India';
  const targetAcc = farmer?.bank_account ? `••••${farmer.bank_account.slice(-4)}` : '••••4821';
  const pfmsUtr = `PFMS-DBT-${todayISO().replace(/-/g, '')}-${String(10000 + Math.floor(Math.random() * 90000))}`;
  const days = Number(scheduleDays) || (disbursementType === 'SCHEDULED_15_DAYS' ? 15 : 0);
  const disbursedDate = days > 0 ? addDaysISO(days) : todayISO();

  db.prepare(`
    UPDATE payments
       SET status = ?,
           updated_at = datetime('now', 'localtime'),
           disbursed_at = ?,
           disbursement_type = ?,
           pfms_utr = ?,
           credited_bank = ?,
           credited_account = ?
     WHERE id = ?
  `).run(
    PAYMENT_STATUS.PAID,
    disbursedDate,
    disbursementType,
    pfmsUtr,
    targetBank,
    targetAcc,
    payment.id
  );

  const isScheduled = days > 0;
  const notifyMsg = isScheduled
    ? `Govt DBT Bank Transfer of ${money(payment.amount)} for token ${payment.token} scheduled to ${targetBank} (${targetAcc}). Expected credit on ${disbursedDate}. Ref: ${pfmsUtr}.`
    : `Govt DBT Bank Transfer of ${money(payment.amount)} for token ${payment.token} credited directly to ${targetBank} (${targetAcc}). PFMS UTR: ${pfmsUtr}.`;

  notify(payment.farmer_id, notifyMsg, 'SUCCESS');

  try {
    const smsService = require('./smsService');
    const eventsService = require('./eventsService');
    smsService.dispatchPaymentSms(farmer, payment.token, payment.amount, pfmsUtr);
    eventsService.broadcast('PAYMENT_UPDATED', { centreId, paymentId: payment.id, farmerId: payment.farmer_id });
  } catch (err) {
    console.error('[Payment Dispatch Warning]', err.message);
  }

  return {
    ...listPayments(centreId, payment.slot_date),
    paid: {
      txnRef: payment.txn_ref,
      pfmsUtr,
      amount: payment.amount,
      creditedBank: targetBank,
      creditedAccount: targetAcc,
      disbursedDate,
    },
  };
}

module.exports = { listPayments, markPaid };
