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

/** POST /api/queue/:bookingId/dispute — farmer raises a quality dispute. */
router.post('/:bookingId/dispute', requireAuth('farmer'), (req, res) => {
  const db = require('../db');
  const bookingId = Number(req.params.bookingId);
  const { reason } = req.body || {};
  
  if (!reason) throw require('../utils/http').httpError(400, 'Please provide a reason for the dispute');
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND farmer_id = ?').get(bookingId, req.auth.id);
  if (!booking) throw require('../utils/http').httpError(404, 'Booking not found');
  if (booking.status !== 'REJECTED' && booking.status !== 'CONFIRMED') {
    throw require('../utils/http').httpError(400, 'Disputes can only be raised on completed or rejected bookings');
  }
  
  db.prepare('UPDATE bookings SET dispute_status = ?, dispute_reason = ? WHERE id = ?')
    .run('PENDING', reason, bookingId);
  
  // Notify admin
  const { broadcast } = require('../services/eventsService');
  broadcast('DISPUTE_RAISED', { bookingId, centreId: booking.centre_id });
  
  res.json({ ok: true, message: 'Dispute submitted successfully. The centre will review your request.' });
});

/** GET /api/queue/disputes — admin gets disputes for their centre. */
router.get('/disputes', requireAuth('admin'), (req, res) => {
  const db = require('../db');
  const centreId = adminCentreId(req.auth.id);
  const rows = db.prepare(
    `SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone, f.village AS farmer_village,
            p.quality_grade, p.moisture_pct, p.final_weight_qtl, p.remarks AS proc_remarks
       FROM bookings b
       JOIN farmers f ON f.id = b.farmer_id
       LEFT JOIN procurements p ON p.booking_id = b.id
      WHERE b.centre_id = ? AND b.dispute_status IS NOT NULL
      ORDER BY b.id DESC`
  ).all(centreId);
  res.json(rows);
});

/** POST /api/queue/:bookingId/dispute/resolve — admin resolves a dispute. */
router.post('/:bookingId/dispute/resolve', requireAuth('admin'), (req, res) => {
  const db = require('../db');
  const bookingId = Number(req.params.bookingId);
  const centreId = adminCentreId(req.auth.id);
  const { resolution, newGrade } = req.body || {};
  
  if (!resolution) throw require('../utils/http').httpError(400, 'Please provide a resolution');
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND centre_id = ?').get(bookingId, centreId);
  if (!booking) throw require('../utils/http').httpError(404, 'Booking not found or belongs to another centre');
  if (booking.dispute_status !== 'PENDING') {
    throw require('../utils/http').httpError(400, 'This dispute has already been resolved');
  }
  
  db.prepare('UPDATE bookings SET dispute_status = ?, dispute_resolution = ? WHERE id = ?')
    .run('RESOLVED', resolution, bookingId);
  
  // Notify the farmer
  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)')
    .run(booking.farmer_id, `Your dispute for token PF-${1023 + booking.id} has been resolved: ${resolution}`, 'INFO');
  
  const { broadcast } = require('../services/eventsService');
  broadcast('DISPUTE_RESOLVED', { bookingId, centreId });
  
  res.json({ ok: true, message: 'Dispute resolved successfully.' });
});

module.exports = router;
