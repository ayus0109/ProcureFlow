/**
 * The farmer's own record — how much they have sold, earned, and been paid.
 *
 * Read-only aggregation over what already exists. No new table and no stored
 * totals: every figure is summed at read time from the procurements and payments
 * rows, so a total can never disagree with the receipts it came from.
 */

const db = require('../db');
const { CROPS, PAYMENT_STATUS, gradeFactor } = require('../config/constants');

/** Accepted lots only — a rejected lot earned nothing and is counted separately. */
const TOTALS_SQL = `
  SELECT COUNT(*) AS sales,
         COALESCE(SUM(pr.final_weight_qtl), 0) AS qtlSold,
         COALESCE(SUM(pr.total_amount), 0) AS earned,
         COALESCE(SUM(CASE WHEN pay.status = ? THEN pr.total_amount ELSE 0 END), 0) AS paid
    FROM procurements pr
    JOIN bookings b ON b.id = pr.booking_id
    LEFT JOIN payments pay ON pay.procurement_id = pr.id
   WHERE b.farmer_id = ? AND pr.accepted = 1`;

const REJECTED_SQL = `
  SELECT COUNT(*) AS rejected
    FROM procurements pr
    JOIN bookings b ON b.id = pr.booking_id
   WHERE b.farmer_id = ? AND pr.accepted = 0`;

/** Grade-wise split — this is what makes the grade factor visible over a season. */
const BY_GRADE_SQL = `
  SELECT pr.quality_grade AS grade,
         COUNT(*) AS sales,
         COALESCE(SUM(pr.final_weight_qtl), 0) AS qtlSold,
         COALESCE(SUM(pr.total_amount), 0) AS earned
    FROM procurements pr
    JOIN bookings b ON b.id = pr.booking_id
   WHERE b.farmer_id = ? AND pr.accepted = 1
   GROUP BY pr.quality_grade
   ORDER BY earned DESC`;

const HISTORY_SQL = `
  SELECT b.token, b.crop, b.slot_date, c.name AS centre_name,
         pr.quality_grade, pr.accepted, pr.final_weight_qtl,
         pr.rate_per_qtl, pr.total_amount,
         pay.status AS payment_status, pay.txn_ref
    FROM procurements pr
    JOIN bookings b ON b.id = pr.booking_id
    JOIN centres c ON c.id = b.centre_id
    LEFT JOIN payments pay ON pay.procurement_id = pr.id
   WHERE b.farmer_id = ?
   ORDER BY pr.id DESC
   LIMIT 5`;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

function cropLabel(key) {
  const crop = CROPS.find((c) => c.key === key);
  return crop ? crop.label : key;
}

/** Everything the farmer's tracker panel shows, in one read. */
function farmerSummary(farmerId) {
  const id = Number(farmerId);
  const totals = db.prepare(TOTALS_SQL).get(PAYMENT_STATUS.PAID, id);
  const { rejected } = db.prepare(REJECTED_SQL).get(id);

  const earned = round2(totals.earned);
  const paid = round2(totals.paid);

  return {
    sales: totals.sales,
    rejected,
    qtlSold: round2(totals.qtlSold),
    earned,
    paid,
    // Derived rather than summed a second time, so the two halves always add up
    // to the total the farmer is reading directly above them.
    awaiting: round2(earned - paid),
    byGrade: db
      .prepare(BY_GRADE_SQL)
      .all(id)
      .map((row) => ({
        grade: row.grade,
        factor: gradeFactor(row.grade),
        sales: row.sales,
        qtlSold: round2(row.qtlSold),
        earned: round2(row.earned),
      })),
    history: db
      .prepare(HISTORY_SQL)
      .all(id)
      .map((row) => ({ ...row, cropLabel: cropLabel(row.crop) })),
  };
}

const ALL_BOOKINGS_SQL = `
  SELECT b.id, b.token, b.crop, b.quantity_qtl, b.slot_date, b.slot_time, b.status, b.created_at,
         c.name AS centre_name, c.district,
         pr.quality_grade, pr.moisture_pct, pr.accepted, pr.final_weight_qtl,
         pr.rate_per_qtl, pr.total_amount, pr.confirmed_at, pr.remarks,
         pay.status AS payment_status, pay.txn_ref, pay.updated_at AS payment_date
    FROM bookings b
    JOIN centres c ON c.id = b.centre_id
    LEFT JOIN procurements pr ON pr.booking_id = b.id
    LEFT JOIN payments pay ON pay.procurement_id = pr.id
   WHERE b.farmer_id = ?
   ORDER BY b.slot_date DESC, b.id DESC`;

function allFarmerBookings(farmerId) {
  const id = Number(farmerId);
  const rows = db.prepare(ALL_BOOKINGS_SQL).all(id);
  return rows.map((r) => {
    const crop = CROPS.find((c) => c.key === r.crop);
    return {
      ...r,
      cropLabel: crop ? crop.label : r.crop,
      mspRate: crop ? crop.ratePerQtl : null,
      gradeFactor: r.quality_grade ? gradeFactor(r.quality_grade) : 1,
    };
  });
}

module.exports = { farmerSummary, allFarmerBookings };
