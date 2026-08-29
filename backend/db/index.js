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
try { db.exec('ALTER TABLE centres ADD COLUMN slot_capacity INTEGER DEFAULT 6'); } catch {}

module.exports = db;
module.exports.DB_PATH = DB_PATH;
