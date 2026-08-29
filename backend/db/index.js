/**
 * Single shared database handle.
 *
 * Uses `node:sqlite`, which ships inside Node 22+ — no npm package and no
 * native compiler needed. Requiring this file also guarantees the tables
 * exist, so the server can never start against an empty database.
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { SCHEMA_SQL } = require('./schema');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'procureflow.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
db.exec(SCHEMA_SQL);

// Safe column migrations for existing databases
try { db.exec('ALTER TABLE centres ADD COLUMN max_qty_per_farmer REAL DEFAULT 50'); } catch {}
try { db.exec('ALTER TABLE centres ADD COLUMN daily_target_qtl REAL DEFAULT 500'); } catch {}
try { db.exec('ALTER TABLE centres ADD COLUMN slot_capacity INTEGER DEFAULT 10'); } catch {}
try { db.exec("ALTER TABLE centres ADD COLUMN accepted_crops TEXT DEFAULT 'WHEAT,PADDY,COTTON,SOYBEAN,TUR'"); } catch {}
try { db.exec('ALTER TABLE centres ADD COLUMN max_moisture_pct REAL DEFAULT 12.0'); } catch {}
try { db.exec("ALTER TABLE centres ADD COLUMN min_quality_grade TEXT DEFAULT 'FAQ'"); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN aadhaar_no TEXT'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN ekyc_verified INTEGER DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN pmkisan_id TEXT'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN land_acres REAL DEFAULT 4.5'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN bank_account TEXT'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN ifsc_code TEXT'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN bank_name TEXT'); } catch {}
try { db.exec('ALTER TABLE farmers ADD COLUMN account_holder TEXT'); } catch {}
try { db.exec('ALTER TABLE payments ADD COLUMN disbursed_at TEXT'); } catch {}
try { db.exec("ALTER TABLE payments ADD COLUMN disbursement_type TEXT DEFAULT 'INSTANT'"); } catch {}
try { db.exec('ALTER TABLE payments ADD COLUMN pfms_utr TEXT'); } catch {}
try { db.exec('ALTER TABLE payments ADD COLUMN credited_bank TEXT'); } catch {}
try { db.exec('ALTER TABLE payments ADD COLUMN credited_account TEXT'); } catch {}

module.exports = db;
module.exports.DB_PATH = DB_PATH;
