const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { adminCentreId, listQueue, advanceBooking } = require('../services/queueService');
const { completeProcurement, rejectProcurement } = require('../services/procurementService');

const router = express.Router();

/** GET /api/queue?date=YYYY-MM-DD — the admin's own centre, figures + ordered queue. */
router.get('/', requireAuth('admin'), (req, res) => {
  res.json(listQueue(adminCentreId(req.auth.id), req.query.date));
});

/** POST /api/queue/:bookingId/advance — one forward step through the stages. */
router.post('/:bookingId/advance', requireAuth('admin'), (req, res) => {
  res.json(advanceBooking({ bookingId: req.params.bookingId, adminId: req.auth.id }));
});

/** POST /api/queue/:bookingId/complete — record quality and weight, close the sale. */
router.post('/:bookingId/complete', requireAuth('admin'), (req, res) => {
  res.json(
    completeProcurement({
      bookingId: req.params.bookingId,
      adminId: req.auth.id,
      ...(req.body || {}),
    })
  );
});

/** POST /api/queue/:bookingId/reject — close the lot without buying it. */
router.post('/:bookingId/reject', requireAuth('admin'), (req, res) => {
  res.json(
    rejectProcurement({
      bookingId: req.params.bookingId,
      adminId: req.auth.id,
      ...(req.body || {}),
    })
  );
});

module.exports = router;
