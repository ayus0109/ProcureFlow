const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  registerFarmer,
  loginFarmer,
  loginFarmerOtp,
  loginAdmin,
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

module.exports = router;
