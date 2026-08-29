/**
 * backend/routes/analytics.js
 *
 * Real-time Procurement Analytics, Grade Distributions, Financial Metrics,
 * and Official APMC CSV Export for District Administration.
 */

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { CROPS } = require('../config/constants');
const { todayISO } = require('../utils/dates');

const router = express.Router();

/**
 * GET /api/analytics/centre/:id
 * Rich analytical metrics for a procurement centre.
 */
router.get('/centre/:id', requireAuth('admin'), (req, res) => {
  const centreId = Number(req.params.id);
  const centre = db.prepare('SELECT * FROM centres WHERE id = ?').get(centreId);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  const today = todayISO();

  // 1. Daily & Total Summary
  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT b.id) AS total_bookings,
      SUM(CASE WHEN b.slot_date = ? THEN 1 ELSE 0 END) AS bookings_today,
      SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS completed_sales,
      SUM(CASE WHEN b.status IN ('BOOKED', 'WAITING', 'CALLED', 'CHECKED_IN', 'ASSAYING', 'WEIGHMENT') AND b.slot_date = ? THEN 1 ELSE 0 END) AS active_in_queue,
      COALESCE(SUM(p.final_weight_qtl), 0) AS total_weight_qtl,
      COALESCE(SUM(CASE WHEN b.slot_date = ? THEN p.final_weight_qtl ELSE 0 END), 0) AS today_weight_qtl,
      COALESCE(SUM(p.total_amount), 0) AS total_revenue_inr,
      COALESCE(SUM(CASE WHEN y.status = 'PAID' THEN y.amount ELSE 0 END), 0) AS paid_revenue_inr,
      COALESCE(SUM(CASE WHEN y.status != 'PAID' AND p.id IS NOT NULL THEN p.total_amount ELSE 0 END), 0) AS pending_payout_inr
    FROM bookings b
    LEFT JOIN procurements p ON p.booking_id = b.id AND p.accepted = 1
    LEFT JOIN payments y ON y.procurement_id = p.id
    WHERE b.centre_id = ?
  `).get(today, today, today, centreId);

  // 2. Crop-wise Breakdown
  const cropRows = db.prepare(`
    SELECT
      b.crop,
      COUNT(b.id) AS booking_count,
      COALESCE(SUM(b.quantity_qtl), 0) AS planned_qtl,
      COALESCE(SUM(p.final_weight_qtl), 0) AS procured_qtl,
      COALESCE(SUM(p.total_amount), 0) AS payout_inr
    FROM bookings b
    LEFT JOIN procurements p ON p.booking_id = b.id AND p.accepted = 1
    WHERE b.centre_id = ?
    GROUP BY b.crop
  `).all(centreId);

  const cropMap = new Map(cropRows.map((r) => [r.crop, r]));
  const cropBreakdown = CROPS.map((c) => {
    const data = cropMap.get(c.key) || { booking_count: 0, planned_qtl: 0, procured_qtl: 0, payout_inr: 0 };
    return {
      cropKey: c.key,
      cropLabel: c.label,
      mspRate: c.ratePerQtl,
      bookings: Number(data.booking_count),
      plannedQtl: Number(data.planned_qtl.toFixed(1)),
      procuredQtl: Number(data.procured_qtl.toFixed(1)),
      payoutInr: Number(data.payout_inr.toFixed(2)),
    };
  });

  // 3. Quality Grade Breakdown
  const gradeRows = db.prepare(`
    SELECT
      COALESCE(p.quality_grade, 'Uninspected') AS grade,
      COUNT(p.id) AS count,
      COALESCE(SUM(p.final_weight_qtl), 0) AS total_qtl,
      COALESCE(AVG(p.moisture_pct), 0) AS avg_moisture
    FROM bookings b
    JOIN procurements p ON p.booking_id = b.id
    WHERE b.centre_id = ?
    GROUP BY p.quality_grade
  `).all(centreId);

  // 4. Hourly Slot Throughput
  const slotRows = db.prepare(`
    SELECT
      b.slot_time,
      COUNT(b.id) AS booked_count,
      SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
      SUM(CASE WHEN b.status IN ('WAITING', 'CALLED', 'CHECKED_IN', 'ASSAYING', 'WEIGHMENT') THEN 1 ELSE 0 END) AS waiting_count
    FROM bookings b
    WHERE b.centre_id = ? AND b.slot_date = ?
    GROUP BY b.slot_time
    ORDER BY b.slot_time
  `).all(centreId, today);

  res.json({
    centre: {
      id: centre.id,
      name: centre.name,
      district: centre.district,
      dailyTargetQtl: centre.daily_target_qtl || 500,
      dailyCapacity: centre.daily_capacity,
      maxQtyPerFarmer: centre.max_qty_per_farmer,
      activeCounters: centre.active_counters,
      totalCounters: centre.total_counters,
    },
    metrics: totals,
    cropBreakdown,
    gradeBreakdown: gradeRows,
    hourlyThroughput: slotRows,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/analytics/export?centreId=...
 * Exports complete APMC procurement report as a downloadable CSV.
 */
router.get('/export', requireAuth('admin'), (req, res) => {
  const centreId = Number(req.query.centreId || req.auth.centre_id);
  const centre = db.prepare('SELECT name, district FROM centres WHERE id = ?').get(centreId);
  if (!centre) return res.status(404).send('Centre not found');

  const rows = db.prepare(`
    SELECT
      b.token,
      b.slot_date,
      b.slot_time,
      b.status AS booking_status,
      f.name AS farmer_name,
      f.phone AS farmer_phone,
      f.village AS farmer_village,
      f.aadhaar_no,
      f.pmkisan_id,
      b.crop,
      b.quantity_qtl AS booked_qty_qtl,
      p.quality_grade,
      p.moisture_pct,
      p.final_weight_qtl,
      p.rate_per_qtl,
      p.total_amount,
      p.confirmed_at,
      COALESCE(y.status, 'UNPAID') AS payment_status,
      y.txn_ref
    FROM bookings b
    JOIN farmers f ON f.id = b.farmer_id
    LEFT JOIN procurements p ON p.booking_id = b.id
    LEFT JOIN payments y ON y.procurement_id = p.id
    WHERE b.centre_id = ?
    ORDER BY b.slot_date DESC, b.slot_time, b.id
  `).all(centreId);

  const headers = [
    'Token',
    'Date',
    'Slot Time',
    'Status',
    'Farmer Name',
    'Phone',
    'Village',
    'Aadhaar Masked',
    'PM-Kisan ID',
    'Crop',
    'Booked Qtl',
    'Grade',
    'Moisture %',
    'Final Qtl',
    'Rate/Qtl (INR)',
    'Total Amount (INR)',
    'Confirmed At',
    'Payment Status',
    'Txn Ref',
  ];

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    const values = [
      r.token || '',
      r.slot_date || '',
      r.slot_time || '',
      r.booking_status || '',
      `"${(r.farmer_name || '').replace(/"/g, '""')}"`,
      r.farmer_phone || '',
      `"${(r.farmer_village || '').replace(/"/g, '""')}"`,
      r.aadhaar_no || '',
      r.pmkisan_id || '',
      r.crop || '',
      r.booked_qty_qtl || '',
      r.quality_grade || '',
      r.moisture_pct || '',
      r.final_weight_qtl || '',
      r.rate_per_qtl || '',
      r.total_amount || '',
      r.confirmed_at || '',
      r.payment_status || '',
      r.txn_ref || '',
    ];
    csvRows.push(values.join(','));
  }

  const csvData = csvRows.join('\n');
  const filename = `ProcureFlow_${centre.name.replace(/\s+/g, '_')}_Report_${todayISO()}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvData);
});

module.exports = router;
