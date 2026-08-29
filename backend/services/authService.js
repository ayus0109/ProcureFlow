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

const FARMER_COLUMNS = 'id, name, phone, village, aadhaar_no, ekyc_verified, pmkisan_id, land_acres, bank_account, ifsc_code, bank_name, account_holder';

function detectBankFromIfsc(code = '') {
  const prefix = code.trim().toUpperCase().slice(0, 4);
  const BANKS = {
    SBIN: 'State Bank of India',
    MAHB: 'Bank of Maharashtra',
    HDFC: 'HDFC Bank',
    ICIC: 'ICICI Bank',
    PUNB: 'Punjab National Bank',
    BARB: 'Bank of Baroda',
    CNRB: 'Canara Bank',
    CBIN: 'Central Bank of India',
    UBIN: 'Union Bank of India',
    IDIB: 'Indian Bank',
    IOBA: 'Indian Overseas Bank',
    UCBA: 'UCO Bank',
    BKID: 'Bank of India',
    KKBK: 'Kotak Mahindra Bank',
    UTIB: 'Axis Bank',
  };
  return BANKS[prefix] || 'Nationalized Bank';
}

function farmerSession(id) {
  const farmer = db.prepare(`SELECT ${FARMER_COLUMNS} FROM farmers WHERE id = ?`).get(id);
  if (!farmer) return null;
  return { token: makeToken(id, 'farmer'), user: { ...farmer, role: 'farmer' } };
}

function updateBankDetails(farmerId, { aadhaarNo, bankAccount, ifscCode, bankName, accountHolder }) {
  const cleanAadhaar = (aadhaarNo || '').replace(/\D/g, '');
  const cleanAccount = (bankAccount || '').replace(/\s+/g, '');
  const cleanIfsc = (ifscCode || '').trim().toUpperCase();

  if (cleanAadhaar && cleanAadhaar.length !== 12) {
    throw httpError(400, 'Aadhaar number must be 12 digits');
  }
  if (!cleanAccount || cleanAccount.length < 8 || cleanAccount.length > 20) {
    throw httpError(400, 'Please enter a valid bank account number (8-20 digits)');
  }
  if (!cleanIfsc || cleanIfsc.length !== 11) {
    throw httpError(400, 'IFSC code must be exactly 11 characters (e.g. SBIN0000324)');
  }

  const detectedBank = bankName || detectBankFromIfsc(cleanIfsc);
  const maskedAadhaar = cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : null;

  const current = db.prepare('SELECT name, aadhaar_no, ekyc_verified FROM farmers WHERE id = ?').get(farmerId);
  const holder = (accountHolder || current?.name || 'Farmer').trim();
  const finalAadhaar = maskedAadhaar || current?.aadhaar_no;
  const isEkyc = finalAadhaar ? 1 : (current?.ekyc_verified || 0);

  db.prepare(`
    UPDATE farmers
       SET bank_account = ?,
           ifsc_code = ?,
           bank_name = ?,
           account_holder = ?,
           aadhaar_no = COALESCE(?, aadhaar_no),
           ekyc_verified = ?
     WHERE id = ?
  `).run(cleanAccount, cleanIfsc, detectedBank, holder, finalAadhaar, isEkyc, Number(farmerId));

  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    farmerId,
    `Bank Account registered successfully: ${detectedBank} (A/c ••••${cleanAccount.slice(-4)}). Direct Benefit Transfer (DBT) enabled.`,
    'SUCCESS'
  );

  return farmerSession(farmerId);
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

function verifyEkyc(farmerId, { aadhaarNo, otp }) {
  const cleanAadhaar = (aadhaarNo || '').replace(/\D/g, '');
  if (cleanAadhaar.length !== 12) {
    throw httpError(400, 'Aadhaar number must be exactly 12 digits');
  }

  // Verify OTP simulation (accept standard '123456' or any 6-digit OTP for demo)
  if (!otp || String(otp).length !== 6) {
    throw httpError(400, 'Please enter the 6-digit OTP sent to your Aadhaar-linked mobile');
  }

  const maskedAadhaar = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
  const pmkId = `PMK-MH-${Math.floor(100000 + Math.random() * 900000)}`;
  const land = 4.2;

  db.prepare(`
    UPDATE farmers
       SET aadhaar_no = ?,
           ekyc_verified = 1,
           pmkisan_id = ?,
           land_acres = ?
     WHERE id = ?
  `).run(maskedAadhaar, pmkId, land, Number(farmerId));

  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    farmerId,
    `Govt e-KYC Verification Successful! Aadhaar linked (${maskedAadhaar}), PM-Kisan ID: ${pmkId}.`,
    'SUCCESS'
  );

  return farmerSession(farmerId);
}

function registerFarmer({ name, phone, password, village, aadhaarNo }) {
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanVillage = (village || '').trim();
  const cleanAadhaar = (aadhaarNo || '').replace(/\D/g, '');

  if (!cleanName) throw httpError(400, 'Please enter your name');
  if (!/^\d{10}$/.test(cleanPhone)) throw httpError(400, 'Phone number must be 10 digits');
  if (!password || password.length < 4) {
    throw httpError(400, 'Password must be at least 4 characters');
  }

  const taken = db.prepare('SELECT id FROM farmers WHERE phone = ?').get(cleanPhone);
  if (taken) throw httpError(409, 'This phone number is already registered. Please sign in.');

  const maskedAadhaar = cleanAadhaar.length === 12 ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : null;
  const isEkyc = cleanAadhaar.length === 12 ? 1 : 0;
  const pmkId = isEkyc ? `PMK-MH-${Math.floor(100000 + Math.random() * 900000)}` : null;

  const result = db
    .prepare(
      'INSERT INTO farmers (name, phone, password, village, aadhaar_no, ekyc_verified, pmkisan_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(cleanName, cleanPhone, password, cleanVillage || null, maskedAadhaar, isEkyc, pmkId);

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
  verifyEkyc,
  updateBankDetails,
  farmerSession,
  adminSession,
};
