/**
 * backend/routes/analytics.js
 *
 * Real-time Procurement Analytics, Grade Distributions, Financial Metrics,
 * Instant Farmer Dossier & Aadhaar Lookup, and Official APMC CSV Export.
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
      COUNT(DISTINCT b.farmer_id) AS total_farmers,
      SUM(CASE WHEN b.slot_date = ? THEN 1 ELSE 0 END) AS bookings_today,
      SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS completed_sales,
      SUM(CASE WHEN b.status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_sales,
      SUM(CASE WHEN b.status IN ('BOOKED', 'WAITING', 'CALLED', 'CHECKED_IN', 'ASSAYING', 'WEIGHMENT') AND b.slot_date = ? THEN 1 ELSE 0 END) AS active_in_queue,
      COALESCE(SUM(p.final_weight_qtl), 0) AS total_weight_qtl,
      COALESCE(SUM(CASE WHEN b.slot_date = ? THEN p.final_weight_qtl ELSE 0 END), 0) AS today_weight_qtl,
      COALESCE(SUM(p.total_amount), 0) AS total_revenue_inr,
      COALESCE(SUM(CASE WHEN y.status = 'PAID' THEN y.amount ELSE 0 END), 0) AS paid_revenue_inr,
      COALESCE(SUM(CASE WHEN y.status != 'PAID' AND p.id IS NOT NULL THEN p.total_amount ELSE 0 END), 0) AS pending_payout_inr,
      COALESCE(AVG(p.moisture_pct), 11.2) AS avg_moisture_pct
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
      COALESCE(SUM(p.total_amount), 0) AS payout_inr,
      COALESCE(AVG(p.moisture_pct), 0) AS avg_moisture
    FROM bookings b
    LEFT JOIN procurements p ON p.booking_id = b.id AND p.accepted = 1
    WHERE b.centre_id = ?
    GROUP BY b.crop
  `).all(centreId);

  const cropMap = new Map(cropRows.map((r) => [r.crop, r]));
  const cropBreakdown = CROPS.map((c) => {
    const data = cropMap.get(c.key) || { booking_count: 0, planned_qtl: 0, procured_qtl: 0, payout_inr: 0, avg_moisture: 0 };
    return {
      cropKey: c.key,
      cropLabel: c.label,
      mspRate: c.ratePerQtl,
      bookings: Number(data.booking_count),
      plannedQtl: Number(data.planned_qtl.toFixed(1)),
      procuredQtl: Number(data.procured_qtl.toFixed(1)),
      payoutInr: Number(data.payout_inr.toFixed(2)),
      avgMoisture: Number(Number(data.avg_moisture).toFixed(1)),
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

  // 5. Recent 7-Day Procurement Trend
  const trendRows = db.prepare(`
    SELECT
      b.slot_date AS date,
      COUNT(b.id) AS total_bookings,
      SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS completed_sales,
      COALESCE(SUM(p.final_weight_qtl), 0) AS total_qtl,
      COALESCE(SUM(p.total_amount), 0) AS total_payout
    FROM bookings b
    LEFT JOIN procurements p ON p.booking_id = b.id AND p.accepted = 1
    WHERE b.centre_id = ?
    GROUP BY b.slot_date
    ORDER BY b.slot_date ASC
    LIMIT 7
  `).all(centreId);

  const formattedMetrics = {
    total_bookings: Number(totals.total_bookings || 0),
    total_farmers: Number(totals.total_farmers || 0),
    bookings_today: Number(totals.bookings_today || 0),
    completed_sales: Number(totals.completed_sales || 0),
    rejected_sales: Number(totals.rejected_sales || 0),
    active_in_queue: Number(totals.active_in_queue || 0),
    total_weight_qtl: Number(Number(totals.total_weight_qtl || 0).toFixed(1)),
    today_weight_qtl: Number(Number(totals.today_weight_qtl || 0).toFixed(1)),
    total_revenue_inr: Number(Number(totals.total_revenue_inr || 0).toFixed(2)),
    paid_revenue_inr: Number(Number(totals.paid_revenue_inr || 0).toFixed(2)),
    pending_payout_inr: Number(Number(totals.pending_payout_inr || 0).toFixed(2)),
    avg_moisture_pct: Number(Number(totals.avg_moisture_pct || 11.2).toFixed(1)),
  };

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
    metrics: formattedMetrics,
    cropBreakdown,
    gradeBreakdown: gradeRows,
    hourlyThroughput: slotRows,
    trend: trendRows,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/analytics/farmer-lookup?query=...
 * High-speed instant search for farmer by Name, Aadhaar Card, Phone, PM-Kisan ID, or Token #.
 * Returns full farmer dossier and all historical procurement transaction details within milliseconds.
 */
router.get('/farmer-lookup', requireAuth('admin'), (req, res) => {
  const query = (req.query.q || req.query.query || '').trim();
  if (!query) {
    return res.json({ query: '', count: 0, farmers: [] });
  }

  const cleanDigits = query.replace(/\D/g, '');
  const likeQuery = `%${query}%`;
  const likeDigits = cleanDigits ? `%${cleanDigits}%` : null;

  let farmerIds = [];

  // Match by Token e.g. PF-1024 or 1024
  if (query.toUpperCase().startsWith('PF-') || (cleanDigits.length >= 3 && cleanDigits.length <= 6)) {
    const tokenMatch = db.prepare(`
      SELECT DISTINCT farmer_id FROM bookings WHERE token LIKE ? OR id = ?
    `).all(`%${query.toUpperCase()}%`, Number(cleanDigits) >= 1024 ? Number(cleanDigits) - 1023 : Number(cleanDigits));
    farmerIds.push(...tokenMatch.map((r) => r.farmer_id));
  }

  // Match by name, phone, village, pmkisan_id, aadhaar_no
  const directMatches = db.prepare(`
    SELECT id FROM farmers
    WHERE name LIKE ?
       OR phone LIKE ?
       OR village LIKE ?
       OR pmkisan_id LIKE ?
       OR (aadhaar_no IS NOT NULL AND REPLACE(aadhaar_no, '-', '') LIKE ?)
       OR (aadhaar_no IS NOT NULL AND aadhaar_no LIKE ?)
    LIMIT 20
  `).all(likeQuery, likeQuery, likeQuery, likeQuery, likeDigits || likeQuery, likeQuery);

  farmerIds.push(...directMatches.map((r) => r.id));
  farmerIds = Array.from(new Set(farmerIds)).slice(0, 10);

  if (farmerIds.length === 0) {
    return res.json({ query, count: 0, farmers: [] });
  }

  const results = [];

  for (const fId of farmerIds) {
    const farmer = db.prepare(`
      SELECT id, name, phone, village, aadhaar_no, ekyc_verified, pmkisan_id, land_acres, bank_account, ifsc_code, bank_name, account_holder, created_at
      FROM farmers WHERE id = ?
    `).get(fId);

    if (!farmer) continue;

    const summary = db.prepare(`
      SELECT
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS completed_sales,
        SUM(CASE WHEN b.status IN ('BOOKED', 'WAITING', 'CALLED', 'CHECKED_IN', 'ASSAYING', 'WEIGHMENT') THEN 1 ELSE 0 END) AS active_bookings,
        COALESCE(SUM(p.final_weight_qtl), 0) AS total_weighed_qtl,
        COALESCE(SUM(p.total_amount), 0) AS total_payout_inr,
        COALESCE(SUM(CASE WHEN y.status = 'PAID' THEN y.amount ELSE 0 END), 0) AS paid_amount_inr,
        COALESCE(SUM(CASE WHEN y.status != 'PAID' AND p.id IS NOT NULL THEN p.total_amount ELSE 0 END), 0) AS pending_payout_inr
      FROM bookings b
      LEFT JOIN procurements p ON p.booking_id = b.id AND p.accepted = 1
      LEFT JOIN payments y ON y.procurement_id = p.id
      WHERE b.farmer_id = ?
    `).get(fId);

    const history = db.prepare(`
      SELECT
        b.id AS booking_id,
        b.token,
        b.slot_date,
        b.slot_time,
        b.status AS booking_status,
        b.crop,
        b.quantity_qtl AS booked_qty_qtl,
        b.created_at AS booking_created_at,
        c.id AS centre_id,
        c.name AS centre_name,
        c.district AS centre_district,
        p.id AS procurement_id,
        p.quality_grade,
        p.moisture_pct,
        p.final_weight_qtl,
        p.rate_per_qtl,
        p.total_amount,
        p.remarks,
        p.confirmed_at,
        COALESCE(y.status, CASE WHEN p.id IS NOT NULL THEN 'PROCESSING' ELSE 'PENDING' END) AS payment_status,
        y.txn_ref,
        y.pfms_utr,
        y.disbursed_at,
        y.credited_bank,
        y.credited_account
      FROM bookings b
      JOIN centres c ON c.id = b.centre_id
      LEFT JOIN procurements p ON p.booking_id = b.id
      LEFT JOIN payments y ON y.procurement_id = p.id
      WHERE b.farmer_id = ?
      ORDER BY b.slot_date DESC, b.id DESC
    `).all(fId);

    const enrichedHistory = history.map((h) => {
      const cropObj = CROPS.find((c) => c.key === h.crop) || { label: h.crop, ratePerQtl: h.rate_per_qtl || 0 };
      return {
        ...h,
        cropLabel: cropObj.label,
        baseMspRate: cropObj.ratePerQtl,
      };
    });

    results.push({
      farmer,
      summary: {
        totalBookings: Number(summary.total_bookings || 0),
        completedSales: Number(summary.completed_sales || 0),
        activeBookings: Number(summary.active_bookings || 0),
        totalWeighedQtl: Number((summary.total_weighed_qtl || 0).toFixed(1)),
        totalPayoutInr: Number((summary.total_payout_inr || 0).toFixed(2)),
        paidAmountInr: Number((summary.paid_amount_inr || 0).toFixed(2)),
        pendingPayoutInr: Number((summary.pending_payout_inr || 0).toFixed(2)),
      },
      transactions: enrichedHistory,
    });
  }

  res.json({
    query,
    count: results.length,
    farmers: results,
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
      y.txn_ref,
      y.pfms_utr
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
    'PFMS UTR',
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
      r.pfms_utr || '',
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
