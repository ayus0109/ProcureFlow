/**
 * Demo-grade authentication.
 *
 * The token is base64("<userId>:<role>") — NOT signed, NOT encrypted, NOT
 * expiring. That is a deliberate hackathon-prototype choice: it is enough to
 * separate the farmer and admin views and to prove role-based access control,
 * and it keeps the demo free of OTP and network failures. A production build
 * would use hashed passwords and signed, expiring tokens. Say this plainly if
 * a judge asks; do not present it as real security.
 */

const db = require('../db');
const { httpError } = require('../utils/http');

function makeToken(id, role) {
  return Buffer.from(`${id}:${role}`).toString('base64');
}

/** Decodes a token back to { id, role }, or null if it is unusable. */
function readToken(token) {
  try {
    const [rawId, role] = Buffer.from(token, 'base64').toString('utf8').split(':');
    const id = Number(rawId);
    if (!id || (role !== 'farmer' && role !== 'admin')) return null;
    return { id, role };
  } catch {
    return null;
  }
}

const FARMER_COLUMNS = 'id, name, phone, village';

function farmerSession(id) {
  const farmer = db.prepare(`SELECT ${FARMER_COLUMNS} FROM farmers WHERE id = ?`).get(id);
  if (!farmer) return null;
  return { token: makeToken(id, 'farmer'), user: { ...farmer, role: 'farmer' } };
}

function adminSession(id) {
  const admin = db
    .prepare(
      `SELECT a.id, a.admin_code, a.name, a.centre_id, c.name AS centre_name
         FROM admins a
         JOIN centres c ON c.id = a.centre_id
        WHERE a.id = ?`
    )
    .get(id);
  if (!admin) return null;
  return { token: makeToken(id, 'admin'), user: { ...admin, role: 'admin' } };
}

function registerFarmer({ name, phone, password, village }) {
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanVillage = (village || '').trim();

  if (!cleanName) throw httpError(400, 'Please enter your name');
  if (!/^\d{10}$/.test(cleanPhone)) throw httpError(400, 'Phone number must be 10 digits');
  if (!password || password.length < 4) {
    throw httpError(400, 'Password must be at least 4 characters');
  }

  const taken = db.prepare('SELECT id FROM farmers WHERE phone = ?').get(cleanPhone);
  if (taken) throw httpError(409, 'This phone number is already registered. Please sign in.');

  const result = db
    .prepare('INSERT INTO farmers (name, phone, password, village) VALUES (?, ?, ?, ?)')
    .run(cleanName, cleanPhone, password, cleanVillage || null); // null, never undefined

  const id = Number(result.lastInsertRowid);
  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    id,
    'Welcome to ProcureFlow. Book a procurement slot to receive your token.',
    'INFO'
  );

  return farmerSession(id);
}

function loginFarmer({ phone, password }) {
  const cleanPhone = (phone || '').trim();
  if (!cleanPhone || !password) throw httpError(400, 'Please enter your phone number and password');

  const farmer = db.prepare('SELECT id, password FROM farmers WHERE phone = ?').get(cleanPhone);
  if (!farmer || farmer.password !== password) {
    throw httpError(401, 'Incorrect phone number or password');
  }
  return farmerSession(farmer.id);
}

function loginFarmerOtp({ phone }) {
  const cleanPhone = (phone || '').trim();
  if (!/^\d{10}$/.test(cleanPhone)) {
    throw httpError(400, 'Phone number must be exactly 10 digits');
  }

  let farmer = db.prepare('SELECT id FROM farmers WHERE phone = ?').get(cleanPhone);
  if (!farmer) {
    // Auto-create account for new mobile numbers logging in via OTP
    const defaultName = `Kisan (${cleanPhone.slice(-4)})`;
    const result = db
      .prepare('INSERT INTO farmers (name, phone, password, village) VALUES (?, ?, ?, ?)')
      .run(defaultName, cleanPhone, 'otp_verified', 'District');
    const newId = Number(result.lastInsertRowid);
    db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
      newId,
      'Welcome to ProcureFlow. Book a procurement slot to receive your token.',
      'INFO'
    );
    farmer = { id: newId };
  }
  return farmerSession(farmer.id);
}

function loginAdmin({ adminCode, password }) {
  const code = (adminCode || '').trim().toUpperCase();
  if (!code || !password) throw httpError(400, 'Please enter your admin code and password');

  const admin = db.prepare('SELECT id, password FROM admins WHERE admin_code = ?').get(code);
  if (!admin || admin.password !== password) {
    throw httpError(401, 'Incorrect admin code or password');
  }
  return adminSession(admin.id);
}

module.exports = {
  httpError,
  readToken,
  registerFarmer,
  loginFarmer,
  loginFarmerOtp,
  loginAdmin,
  farmerSession,
  adminSession,
};
