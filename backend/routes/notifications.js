const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listForFarmer, markAllRead } = require('../services/notificationService');
const { getSmsLogs } = require('../services/smsService');

const router = express.Router();

/** GET /api/notifications — the farmer's own alerts, newest first. */
router.get('/', requireAuth('farmer'), (req, res) => {
  res.json(listForFarmer(req.auth.id));
});

/** GET /api/notifications/sms-logs — outgoing SMS and WhatsApp dispatches */
router.get('/sms-logs', requireAuth(), (req, res) => {
  const farmerId = req.auth.role === 'farmer' ? req.auth.id : null;
  res.json(getSmsLogs(farmerId));
});

/** POST /api/notifications/read — mark every unread alert as read. */
router.post('/read', requireAuth('farmer'), (req, res) => {
  res.json(markAllRead(req.auth.id));
});

module.exports = router;
