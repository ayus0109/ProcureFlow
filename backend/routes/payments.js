const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { adminCentreId } = require('../services/queueService');
const { listPayments, markPaid } = require('../services/paymentService');

const router = express.Router();

/** GET /api/payments?date=YYYY-MM-DD — today's payments at the admin's own centre. */
router.get('/', requireAuth('admin'), (req, res) => {
  res.json(listPayments(adminCentreId(req.auth.id), req.query.date));
});

/** POST /api/payments/:paymentId/paid — release the money via Govt DBT. */
router.post('/:paymentId/paid', requireAuth('admin'), (req, res) => {
  res.json(
    markPaid({
      paymentId: req.params.paymentId,
      adminId: req.auth.id,
      ...(req.body || {}),
    })
  );
});

module.exports = router;
