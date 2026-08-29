/**
 * ProcureFlow — DEMO SEED DATA.
 *
 * Every row below is invented prototype data for a hackathon demonstration.
 * None of it comes from a government system.
 *
 * Run: npm run seed   (safe to run repeatedly — it wipes and rebuilds)
 *
 * Tuning that matters for the live demo:
 *   - Farmer 1 (9999990001) is left with NO bookings, so the demo starts clean.
 *   - Pune has exactly 17 farmers waiting in windows before 14:00. A booking
 *     made on stage in a 14:00+ window therefore lands at position 18 with
 *     17 ahead: 17 x 4 min / 2 counters = 34 min.
 *   - Pune stays under 40% of capacity so it displays as LOW / green.
 */

const db = require('./index');
const { CROPS, SLOT_WINDOWS, STATUS, PAYMENT_STATUS } = require('../config/constants');
const { todayISO, addDaysISO, nowStamp } = require('../utils/dates');

const TODAY = todayISO();
const TOMORROW = addDaysISO(1);
const DAY3 = addDaysISO(2);

// name, district, capacity, active counters, total counters, avg min, delay min, max_qty_per_farmer, daily_target_qtl, slot_capacity, accepted_crops, max_moisture_pct, min_quality_grade
const CENTRES = [
  ['Pune Procurement Center', 'Pune', 120, 2, 3, 4, 0, 50, 1500, 15, 'WHEAT,SOYBEAN,TUR', 12.0, 'FAQ'],
  ['Nashik Procurement Center', 'Nashik', 96, 3, 3, 5, 0, 40, 1200, 12, 'WHEAT,PADDY,SOYBEAN', 12.0, 'FAQ'],
  ['Nagpur Procurement Center', 'Nagpur', 80, 2, 3, 6, 10, 30, 900, 10, 'SOYBEAN,COTTON', 11.5, 'FAQ'],
  ['Aurangabad Procurement Center', 'Aurangabad', 112, 3, 3, 4, 0, 50, 1400, 14, 'COTTON,TUR,SOYBEAN', 12.0, 'FAQ'],
  ['Kolhapur Procurement Center', 'Kolhapur', 80, 2, 2, 5, 5, 25, 600, 10, 'PADDY,SOYBEAN', 13.0, 'FAQ'],
];

// Farmer 1 is the demo account and is intentionally left booking-free.
const FARMERS = [
  ['Ramesh Patil', 'Baramati'],
  ['Sunita Jadhav', 'Indapur'],
  ['Vitthal Shinde', 'Daund'],
  ['Kavita More', 'Shirur'],
  ['Ganesh Kulkarni', 'Junnar'],
  ['Anita Deshmukh', 'Khed'],
  ['Balu Pawar', 'Ambegaon'],
  ['Mangala Chavan', 'Purandar'],
  ['Nitin Bhosale', 'Velhe'],
  ['Shobha Gaikwad', 'Mulshi'],
  ['Dattatray Kadam', 'Haveli'],
  ['Rekha Salunkhe', 'Bhor'],
  ['Sanjay Thorat', 'Sinnar'],
  ['Ujwala Nikam', 'Niphad'],
  ['Prakash Waghmare', 'Dindori'],
  ['Sarita Bansode', 'Yeola'],
  ['Machhindra Sawant', 'Malegaon'],
  ['Vaishali Dhumal', 'Chandwad'],
  ['Ashok Randhive', 'Igatpuri'],
  ['Jyoti Khandagale', 'Nandgaon'],
];

function reset() {
  db.exec(`
    DELETE FROM sms_logs;
    DELETE FROM notifications;
    DELETE FROM payments;
    DELETE FROM procurements;
    DELETE FROM bookings;
    DELETE FROM admins;
    DELETE FROM farmers;
    DELETE FROM centres;
  `);
  // Restart every AUTOINCREMENT counter so tokens begin at PF-1024 each reseed.
  try {
    db.exec('DELETE FROM sqlite_sequence');
  } catch {
    /* absent on a brand-new database — nothing to reset */
  }
}

function seed() {
  const insCentre = db.prepare(`
    INSERT INTO centres
      (name, district, daily_capacity, active_counters, total_counters, avg_processing_min, delay_min, max_qty_per_farmer, daily_target_qtl, slot_capacity, accepted_crops, max_moisture_pct, min_quality_grade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  CENTRES.forEach((c) => insCentre.run(...c));

  const insFarmer = db.prepare(
    'INSERT INTO farmers (name, phone, password, village, aadhaar_no, ekyc_verified, pmkisan_id, land_acres, bank_account, ifsc_code, bank_name, account_holder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  FARMERS.forEach(([name, village], i) => {
    const phone = `99999900${String(i + 1).padStart(2, '0')}`;
    const aadhaar = `XXXX-XXXX-${String(7821 + i * 13).slice(0, 4)}`;
    const pmkId = `PMK-MH-${String(849200 + i * 7)}`;
    const land = 3.5 + (i % 5) * 1.5;
    const account = `3082910${String(4820 + i * 17)}`;
    const ifsc = 'SBIN0000324';
    const bank = 'State Bank of India (Baramati)';
    insFarmer.run(name, phone, 'farmer123', village, aadhaar, 1, pmkId, land, account, ifsc, bank, name);
  });

  const insAdmin = db.prepare(
    'INSERT INTO admins (admin_code, name, password, centre_id) VALUES (?, ?, ?, ?)'
  );
  insAdmin.run('ADMIN001', 'Suresh Kale', 'admin123', 1);
  // A second centre's admin, so the demo can show that an admin only ever sees
  // and controls their own centre's queue.
  insAdmin.run('ADMIN002', 'Vaishali Deshmukh', 'admin123', 2);

  const insBooking = db.prepare(`
    INSERT INTO bookings (farmer_id, centre_id, crop, quantity_qtl, slot_date, slot_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const cropKeyFor = (n) => CROPS[n % CROPS.length].key;

  // --- Pune: 17 waiting today, spread across the windows before 14:00 ---
  const perWindow = [4, 4, 3, 3, 3]; // SLOT_WINDOWS[0..4] => 17 farmers
  let farmerId = 2; // farmer 1 stays clean for the live demo
  perWindow.forEach((count, w) => {
    for (let k = 0; k < count; k += 1) {
      insBooking.run(
        farmerId,
        1,
        cropKeyFor(farmerId),
        10 + (farmerId % 15),
        TODAY,
        SLOT_WINDOWS[w],
        STATUS.WAITING
      );
      farmerId += 1;
    }
  });

  // --- Pune: two completed records so payment states are visible immediately ---
  const insProc = db.prepare(`
    INSERT INTO procurements
      (booking_id, quality_grade, moisture_pct, accepted, final_weight_qtl,
       rate_per_qtl, total_amount, remarks, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insPayment = db.prepare(
    'INSERT INTO payments (procurement_id, amount, status) VALUES (?, ?, ?)'
  );

  const history = [
    { farmerId: 19, crop: 'WHEAT', qty: 22, weight: 21.6, grade: 'FAQ', moisture: 10.4, pay: PAYMENT_STATUS.PAID },
    { farmerId: 20, crop: 'SOYBEAN', qty: 18, weight: 17.8, grade: 'Grade A', moisture: 12.1, pay: PAYMENT_STATUS.PROCESSING },
  ];

  history.forEach((h, i) => {
    const booking = insBooking.run(
      h.farmerId, 1, h.crop, h.qty, TODAY, SLOT_WINDOWS[i], STATUS.CONFIRMED
    );
    const rate = CROPS.find((c) => c.key === h.crop).ratePerQtl;
    const amount = Math.round(h.weight * rate);
    const proc = insProc.run(
      Number(booking.lastInsertRowid),
      h.grade,
      h.moisture,
      1, // accepted — integer, never a boolean: node:sqlite rejects booleans
      h.weight,
      rate,
      amount,
      'Demo history record',
      nowStamp()
    );
    insPayment.run(Number(proc.lastInsertRowid), amount, h.pay);
  });

  // --- Other centres: booking volume for TODAY ---
  const load = [
    { centreId: 2, total: 62 }, // Nashik  -> MODERATE
    { centreId: 3, total: 78 }, // Nagpur  -> HIGH (78 booked across 80 capacity -> 2 left)
    { centreId: 4, total: 28 }, // Aurangabad -> LOW
    { centreId: 5, total: 55 }, // Kolhapur -> MODERATE
  ];
  load.forEach(({ centreId, total }) => {
    for (let i = 0; i < total; i += 1) {
      insBooking.run(
        2 + (i % 19),
        centreId,
        cropKeyFor(i),
        8 + (i % 20),
        TODAY,
        SLOT_WINDOWS[i % SLOT_WINDOWS.length],
        i % 3 === 0 ? STATUS.BOOKED : STATUS.WAITING
      );
    }
  });

  // --- Advance bookings for TOMORROW and DAY 3 (Realistic slot availability) ---
  // Tomorrow: moderate advance bookings
  [
    { centreId: 1, count: 25 }, // Pune tomorrow: 25 booked, 95 left
    { centreId: 2, count: 32 }, // Nashik tomorrow: 32 booked, 64 left
    { centreId: 3, count: 48 }, // Nagpur tomorrow: 48 booked (approx 6 per slot, 4 left each), 32 left
    { centreId: 4, count: 18 }, // Aurangabad tomorrow: 18 booked, 94 left
    { centreId: 5, count: 22 }, // Kolhapur tomorrow: 22 booked, 58 left
  ].forEach(({ centreId, count }) => {
    for (let i = 0; i < count; i += 1) {
      insBooking.run(
        2 + (i % 19),
        centreId,
        cropKeyFor(i),
        10 + (i % 15),
        TOMORROW,
        SLOT_WINDOWS[i % SLOT_WINDOWS.length],
        STATUS.BOOKED
      );
    }
  });

  // Day 3: light advance bookings
  [
    { centreId: 1, count: 12 },
    { centreId: 2, count: 15 },
    { centreId: 3, count: 20 },
    { centreId: 4, count: 8 },
    { centreId: 5, count: 10 },
  ].forEach(({ centreId, count }) => {
    for (let i = 0; i < count; i += 1) {
      insBooking.run(
        2 + (i % 19),
        centreId,
        cropKeyFor(i),
        10 + (i % 15),
        DAY3,
        SLOT_WINDOWS[i % SLOT_WINDOWS.length],
        STATUS.BOOKED
      );
    }
  });

  db.prepare(
    'INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)'
  ).run(1, 'Welcome to ProcureFlow. Book a procurement slot to receive your token.', 'INFO');
}

function report() {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  const pune = db
    .prepare(
      `SELECT COUNT(*) AS waiting FROM bookings
        WHERE centre_id = 1 AND slot_date = ? AND status = ?`
    )
    .get(TODAY, STATUS.WAITING);
  const firstToken = db.prepare('SELECT token FROM bookings ORDER BY id LIMIT 1').get();

  console.log('\nProcureFlow demo data seeded (prototype data, not live records)');
  console.log(`  date            ${TODAY}`);
  console.log(`  centres         ${count('centres')}`);
  console.log(`  farmers         ${count('farmers')}`);
  console.log(`  bookings        ${count('bookings')}`);
  console.log(`  procurements    ${count('procurements')}`);
  console.log(`  payments        ${count('payments')}`);
  console.log(`  Pune waiting    ${pune.waiting}  (next booking lands at position ${pune.waiting + 1})`);
  console.log(`  first token     ${firstToken.token}`);
  console.log('\n  Farmer login    9999990001 / farmer123   (Ramesh Patil, no bookings yet)');
  console.log('  Admin login     ADMIN001 / admin123     (Pune Procurement Center)\n');
}

reset();
seed();
report();
