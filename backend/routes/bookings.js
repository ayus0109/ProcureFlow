const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { activeBooking, createBooking } = require('../services/bookingService');
const { farmerSummary, allFarmerBookings } = require('../services/trackerService');

const router = express.Router();

/** GET /api/bookings/mine — the farmer's current booking, or null. */
router.get('/mine', requireAuth('farmer'), (req, res) => {
  res.json(activeBooking(req.auth.id));
});

/** GET /api/bookings/summary — the farmer's own season record. */
router.get('/summary', requireAuth('farmer'), (req, res) => {
  res.json(farmerSummary(req.auth.id));
});

/** GET /api/bookings/history — the farmer's complete past bookings and receipts. */
router.get('/history', requireAuth('farmer'), (req, res) => {
  res.json(allFarmerBookings(req.auth.id));
});

/** POST /api/bookings  { centreId, crop, quantityQtl, slotDate, slotTime } */
router.post('/', requireAuth('farmer'), (req, res) => {
  const booking = createBooking({ farmerId: req.auth.id, ...(req.body || {}) });
  res.status(201).json(booking);
});

module.exports = router;
