const express = require('express');
const { listCentres, getCentre } = require('../services/centreService');
const { slotAvailability } = require('../services/bookingService');

const router = express.Router();

/** GET /api/centres?date=YYYY-MM-DD — all centres with live load. */
router.get('/', (req, res) => {
  res.json(listCentres(req.query.date));
});

/** GET /api/centres/:id/slots?date=YYYY-MM-DD — room left in each window. */
router.get('/:id/slots', (req, res) => {
  res.json(slotAvailability(req.params.id, req.query.date));
});

/** GET /api/centres/:id?date=YYYY-MM-DD */
router.get('/:id', (req, res) => {
  const centre = getCentre(req.params.id, req.query.date);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json(centre);
});

module.exports = router;
