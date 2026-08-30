const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  registerFarmer,
  loginFarmer,
  loginFarmerOtp,
  loginAdmin,
  verifyEkyc,
  updateBankDetails,
  farmerSession,
  adminSession,
} = require('../services/authService');

const router = express.Router();

/** POST /api/auth/farmer/register  { name, phone, password, village } */
router.post('/farmer/register', (req, res) => {
  res.status(201).json(registerFarmer(req.body || {}));
});

/** POST /api/auth/farmer/login  { phone, password } */
router.post('/farmer/login', (req, res) => {
  res.json(loginFarmer(req.body || {}));
});

/** POST /api/auth/farmer/otp-login  { phone } */
router.post('/farmer/otp-login', (req, res) => {
  res.json(loginFarmerOtp(req.body || {}));
});

/** POST /api/auth/farmer/ekyc  { aadhaarNo, otp } (Requires auth) */
router.post('/farmer/ekyc', requireAuth('farmer'), (req, res) => {
  res.json(verifyEkyc(req.auth.id, req.body || {}));
});

/** POST /api/auth/farmer/bank-details  { aadhaarNo, bankAccount, ifscCode, bankName, accountHolder } (Requires auth) */
router.post('/farmer/bank-details', requireAuth('farmer'), (req, res) => {
  res.json(updateBankDetails(req.auth.id, req.body || {}));
});

/** POST /api/auth/admin/login  { adminCode, password } */
router.post('/admin/login', (req, res) => {
  res.json(loginAdmin(req.body || {}));
});

/** GET /api/auth/me — lets the client confirm a stored token is still valid. */
router.get('/me', requireAuth(), (req, res) => {
  const session =
    req.auth.role === 'admin' ? adminSession(req.auth.id) : farmerSession(req.auth.id);
  if (!session) return res.status(401).json({ error: 'Please sign in again' });
  res.json(session);
});

/** POST /api/auth/farmer/add-helper — link a helper to the farmer's account. */
router.post('/farmer/add-helper', requireAuth('farmer'), (req, res) => {
  const db = require('../db');
  const { helperName, helperPhone, relationship } = req.body || {};
  
  if (!helperName || !helperPhone) {
    throw require('../utils/http').httpError(400, 'Helper name and phone number are required');
  }
  
  // Max 3 helpers per farmer
  const count = db.prepare('SELECT COUNT(*) as cnt FROM helpers WHERE farmer_id = ?').get(req.auth.id);
  if (count && count.cnt >= 3) {
    throw require('../utils/http').httpError(400, 'Maximum 3 helpers allowed per account');
  }
  
  try {
    db.prepare('INSERT INTO helpers (farmer_id, helper_name, helper_phone, relationship) VALUES (?, ?, ?, ?)')
      .run(req.auth.id, helperName, helperPhone, relationship || 'Family');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      throw require('../utils/http').httpError(409, 'This phone number is already linked as a helper');
    }
    throw err;
  }
  
  res.json({ ok: true, message: 'Helper added successfully' });
});

/** GET /api/auth/farmer/helpers — list linked helpers. */
router.get('/farmer/helpers', requireAuth('farmer'), (req, res) => {
  const db = require('../db');
  const helpers = db.prepare('SELECT id, helper_name, helper_phone, relationship, created_at FROM helpers WHERE farmer_id = ?')
    .all(req.auth.id);
  res.json(helpers || []);
});

/** DELETE /api/auth/farmer/helpers/:id — remove a helper. */
router.delete('/farmer/helpers/:id', requireAuth('farmer'), (req, res) => {
  const db = require('../db');
  const result = db.prepare('DELETE FROM helpers WHERE id = ? AND farmer_id = ?')
    .run(Number(req.params.id), req.auth.id);
  if (result.changes === 0) {
    throw require('../utils/http').httpError(404, 'Helper not found');
  }
  res.json({ ok: true, message: 'Helper removed' });
});

module.exports = router;
