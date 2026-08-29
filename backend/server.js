/**
 * ProcureFlow API.
 * Start:   npm start
 * Reload:  npm run dev   (Node's built-in --watch, no nodemon needed)
 */

const express = require('express');
const cors = require('cors');

require('./db'); // opens the database and ensures every table exists
const { CROPS, SLOT_WINDOWS, QUALITY_GRADES, GRADE_FACTORS } = require('./config/constants');
const authRoutes = require('./routes/auth');
const centreRoutes = require('./routes/centres');
const bookingRoutes = require('./routes/bookings');
const queueRoutes = require('./routes/queue');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const ttsRoutes = require('./routes/tts');
const eventsRoutes = require('./routes/events');
const analyticsRoutes = require('./routes/analytics');
const { bookableDates } = require('./services/bookingService');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ProcureFlow API', time: new Date().toISOString() });
});

/** Reference lists the frontend needs for its dropdowns. */
app.get('/api/reference', (req, res) => {
  res.json({
    crops: CROPS,
    slotWindows: SLOT_WINDOWS,
    qualityGrades: QUALITY_GRADES,
    // Sent rather than mirrored in the frontend, so the counter form's preview
    // and the amount the server calculates can never fall out of step.
    gradeFactors: GRADE_FACTORS,
    dates: bookableDates(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/analytics', analyticsRoutes);

const path = require('path');
const fs = require('fs');

const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');

// If built frontend exists, serve it (production / deployed mode)
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    }
    next();
  });
} else {
  /** Friendly API index if frontend is not built yet */
  app.get('/', (req, res) => {
    res.json({
      service: 'ProcureFlow API',
      status: 'Active',
      endpoints: [
        '/api/health',
        '/api/reference',
        '/api/centres',
        '/api/bookings/mine',
        '/api/queue',
        '/api/payments',
        '/api/notifications',
      ],
    });
  });
}

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[ProcureFlow]', err);
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ProcureFlow server listening on port ${PORT}`);
});
