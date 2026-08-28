/**
 * ProcureFlow — shared constants.
 *
 * DEMO DATA NOTICE: the rates below are indicative prototype figures for a
 * hackathon demonstration. They are NOT live government MSP values and must
 * not be presented as official data.
 */

const CROPS = [
  { key: 'WHEAT', label: 'Wheat', ratePerQtl: 2425 },
  { key: 'PADDY', label: 'Paddy', ratePerQtl: 2300 },
  { key: 'COTTON', label: 'Cotton', ratePerQtl: 7521 },
  { key: 'SOYBEAN', label: 'Soybean', ratePerQtl: 4892 },
  { key: 'TUR', label: 'Tur (Arhar)', ratePerQtl: 7550 },
];

/** Fixed one-hour windows. Zero-padded so plain string sorting is chronological. */
const SLOT_WINDOWS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
];

/** bookings.status — the single source of truth for where a farmer is. */
const STATUS = {
  BOOKED: 'BOOKED',
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  CHECKED_IN: 'CHECKED_IN',
  ASSAYING: 'ASSAYING',
  WEIGHMENT: 'WEIGHMENT',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
};

/** Forward-only order the admin advances a farmer through. */
const STAGE_ORDER = [
  STATUS.BOOKED,
  STATUS.WAITING,
  STATUS.CALLED,
  STATUS.CHECKED_IN,
  STATUS.ASSAYING,
  STATUS.WEIGHMENT,
  STATUS.CONFIRMED,
];

/** Statuses that still occupy a place in the queue. */
const ACTIVE_QUEUE_STATUSES = [
  STATUS.BOOKED,
  STATUS.WAITING,
  STATUS.CALLED,
  STATUS.CHECKED_IN,
  STATUS.ASSAYING,
  STATUS.WEIGHMENT,
];

/**
 * The waiting line: farmers who have not reached a counter yet. Queue position
 * and estimated wait are counted over these only — so checking a farmer in at
 * the counter immediately shortens the line for everyone behind them.
 */
const WAITING_QUEUE_STATUSES = [STATUS.BOOKED, STATUS.WAITING, STATUS.CALLED];

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
};

/** Share of daily capacity already booked. */
const CONGESTION_THRESHOLDS = { LOW: 0.4, MODERATE: 0.75 };

const QUALITY_GRADES = ['FAQ', 'Grade A', 'Grade B', 'Below FAQ'];

/**
 * What each grade does to the rate.
 *
 * FAQ — Fair Average Quality — is the benchmark the support price is quoted
 * against, so it pays the full rate. A superior lot earns a small premium; a lot
 * outside specification takes a value cut, which is how deductions already work
 * at a procurement centre. Every figure is applied on the server, so the counter
 * form cannot change what a farmer is paid.
 *
 * DEMO DATA NOTICE: indicative prototype percentages for the demonstration, not
 * official grade slabs.
 */
const GRADE_FACTORS = {
  'Grade A': 1.05,
  FAQ: 1,
  'Grade B': 0.95,
  'Below FAQ': 0.9,
};

/** Unknown grade never silently discounts a farmer — it pays the full rate. */
function gradeFactor(grade) {
  const factor = GRADE_FACTORS[grade];
  return typeof factor === 'number' ? factor : 1;
}

module.exports = {
  CROPS,
  SLOT_WINDOWS,
  STATUS,
  STAGE_ORDER,
  ACTIVE_QUEUE_STATUSES,
  WAITING_QUEUE_STATUSES,
  PAYMENT_STATUS,
  CONGESTION_THRESHOLDS,
  QUALITY_GRADES,
  GRADE_FACTORS,
  gradeFactor,
};
