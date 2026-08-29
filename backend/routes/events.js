/**
 * backend/routes/events.js
 *
 * Real-time SSE endpoint for live queue and counter updates.
 */

const express = require('express');
const { addClient } = require('../services/eventsService');

const router = express.Router();

router.get('/', (req, res) => {
  addClient(req, res);
});

module.exports = router;
