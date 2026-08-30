/**
 * ProcureFlow schema — 9 tables.
 *
 * Deliberately absent:
 *   - a `slots` table: windows are a fixed list in config/constants.js and
 *     availability is a COUNT of bookings, so there are no rows to pre-generate.
 *   - a `queue` table: queue position is DERIVED at read time from bookings,
 *     so it can never drift out of sync with reality.
 *   - a `users` table: two small role tables beat a users table plus joins
 *     when there are exactly two roles.
 *
 * `token` and `txn_ref` are GENERATED columns — SQLite computes them, so the
 * application never invents an ID that could collide.
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS centres (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT    NOT NULL,
  district           TEXT    NOT NULL,
  daily_capacity     INTEGER NOT NULL,
  active_counters    INTEGER NOT NULL DEFAULT 2,
  total_counters     INTEGER NOT NULL DEFAULT 2,
  avg_processing_min INTEGER NOT NULL DEFAULT 4,
  delay_min          INTEGER NOT NULL DEFAULT 0,
  max_qty_per_farmer REAL    NOT NULL DEFAULT 50,
  daily_target_qtl   REAL    NOT NULL DEFAULT 500,
  slot_capacity      INTEGER NOT NULL DEFAULT 10,
  accepted_crops     TEXT    NOT NULL DEFAULT 'WHEAT,PADDY,COTTON,SOYBEAN,TUR',
  max_moisture_pct   REAL    NOT NULL DEFAULT 12.0,
  min_quality_grade  TEXT    NOT NULL DEFAULT 'FAQ'
);

CREATE TABLE IF NOT EXISTS farmers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL UNIQUE,
  password       TEXT NOT NULL,
  village        TEXT,
  aadhaar_no     TEXT,
  ekyc_verified  INTEGER NOT NULL DEFAULT 0,
  pmkisan_id     TEXT,
  land_acres     REAL DEFAULT 4.5,
  bank_account   TEXT,
  ifsc_code      TEXT,
  bank_name      TEXT,
  account_holder TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS admins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_code TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,
  centre_id  INTEGER NOT NULL REFERENCES centres(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id    INTEGER NOT NULL REFERENCES farmers(id),
  centre_id    INTEGER NOT NULL REFERENCES centres(id),
  crop         TEXT    NOT NULL,
  quantity_qtl REAL    NOT NULL,
  slot_date    TEXT    NOT NULL,
  slot_time    TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'BOOKED',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  token        TEXT GENERATED ALWAYS AS ('PF-' || (1023 + id)) VIRTUAL,
  priority_score  INTEGER NOT NULL DEFAULT 0,
  dispute_reason  TEXT,
  dispute_status  TEXT,
  dispute_resolution TEXT,
  helper_id       INTEGER
);

CREATE TABLE IF NOT EXISTS procurements (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id       INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  quality_grade    TEXT,
  moisture_pct     REAL,
  accepted         INTEGER NOT NULL DEFAULT 1,
  final_weight_qtl REAL,
  rate_per_qtl     REAL,
  total_amount     REAL,
  remarks          TEXT,
  confirmed_at     TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  procurement_id    INTEGER NOT NULL UNIQUE REFERENCES procurements(id),
  amount            REAL NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  disbursed_at      TEXT,
  disbursement_type TEXT DEFAULT 'INSTANT',
  pfms_utr          TEXT,
  credited_bank     TEXT,
  credited_account  TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  txn_ref           TEXT GENERATED ALWAYS AS ('PF-TXN-' || (1000 + id)) VIRTUAL
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id  INTEGER NOT NULL REFERENCES farmers(id),
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'INFO',
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id  INTEGER REFERENCES farmers(id),
  phone      TEXT NOT NULL,
  message    TEXT NOT NULL,
  channel    TEXT NOT NULL DEFAULT 'SMS',
  type       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'DELIVERED',
  sent_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS helpers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id    INTEGER NOT NULL REFERENCES farmers(id),
  helper_name  TEXT    NOT NULL,
  helper_phone TEXT    NOT NULL,
  relationship TEXT    NOT NULL DEFAULT 'Family',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(farmer_id, helper_phone)
);

CREATE INDEX IF NOT EXISTS idx_bookings_queue
  ON bookings (centre_id, slot_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer
  ON bookings (farmer_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_notifications_farmer
  ON notifications (farmer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sms_logs_farmer
  ON sms_logs (farmer_id);
CREATE INDEX IF NOT EXISTS idx_helpers_farmer ON helpers (farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dispute ON bookings (centre_id, dispute_status);
`;

module.exports = { SCHEMA_SQL };
