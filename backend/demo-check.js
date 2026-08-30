/**
 * Full demo rehearsal — walks the exact path you will show on stage, in order,
 * and prints what a judge would see on screen at each step.
 *
 * Run the backend first, then:  node demo-check.js
 */

const BASE = 'http://127.0.0.1:4000/api';
const { todayISO } = require('./utils/dates');
const TODAY = todayISO();
let pass = 0;
let fail = 0;

function check(label, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  ok    ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

const post = (path, body, token) => call(path, { method: 'POST', body, token });

async function main() {
  console.log(`\nKisanSathi demo rehearsal — ${TODAY}\n${'='.repeat(46)}`);

  // ---- 1. the farmer signs in -------------------------------------------
  console.log('\n1. Farmer signs in');
  const f = await post('/auth/farmer/login', { phone: '9999990001', password: 'farmer123' });
  check('demo farmer logs in', f.status === 200, JSON.stringify(f.data).slice(0, 120));
  if (f.status !== 200) return;
  const fTok = f.data.token;
  console.log(`   -> ${f.data.user.name}, ${f.data.user.village}`);

  const mine0 = await call('/bookings/mine', { token: fTok });
  check('starts with a clean slate (no booking)', mine0.data === null, JSON.stringify(mine0.data));

  // ---- 2. picking a centre ----------------------------------------------
  console.log('\n2. Farmer compares centres');
  const centres = await call('/centres', { token: fTok });
  check('centre list loads', centres.status === 200 && Array.isArray(centres.data), String(centres.status));
  for (const c of centres.data || []) {
    console.log(`   ${c.name.padEnd(12)} ${String(c.congestion).padEnd(9)} wait ${c.waitLabel}`);
  }
  const pune = (centres.data || []).find((c) => /Pune/i.test(c.name));
  check('Pune is the low-congestion pick', pune && pune.congestion === 'LOW', pune && pune.congestion);

  // ---- 3. booking a slot ------------------------------------------------
  console.log('\n3. Farmer books an afternoon slot');
  const slots = await call(`/centres/${pune.id}/slots?date=${TODAY}`, { token: fTok });
  check('slot windows load', slots.status === 200, String(slots.status));
  // The endpoint answers with a bare array of windows.
  const windows = Array.isArray(slots.data) ? slots.data : [];
  const open = windows.filter((s) => !s.full && s.slot >= '14:00');
  check('an afternoon window is open', open.length > 0, JSON.stringify(slots.data).slice(0, 140));

  const booked = await post(
    '/bookings',
    { centreId: pune.id, crop: 'WHEAT', quantityQtl: 20, slotDate: TODAY, slotTime: open[0].slot },
    fTok
  );
  check('booking is created', booked.status === 201, JSON.stringify(booked.data).slice(0, 140));
  const bookingId = booked.data.id;

  const mine1 = await call('/bookings/mine', { token: fTok });
  const b1 = mine1.data;
  console.log(`   -> token ${b1.token} · position ${b1.position} · wait ${b1.waitLabel} · reach by ${b1.arriveBy}`);
  check('a token is issued', /^PF-\d+$/.test(b1.token), b1.token);
  check('a queue position is shown', b1.position > 0, String(b1.position));
  check('an arrival time is shown for today', Boolean(b1.arriveBy), String(b1.arriveBy));
  // The arrival advice belongs to the window the farmer booked — never a clock
  // time from some other part of the day.
  const [winFrom, winTo] = open[0].slot.split('-');
  check(
    `reach by ${b1.arriveBy} sits inside the booked window ${open[0].slot}`,
    b1.arriveBy >= winFrom && b1.arriveBy <= winTo,
    `${b1.arriveBy} outside ${open[0].slot}`
  );

  // up to 3 active bookings per farmer
  const b2 = await post(
    '/bookings',
    { centreId: pune.id, crop: 'TUR', quantityQtl: 10, slotDate: TODAY, slotTime: open[1]?.slot || open[0].slot },
    fTok
  );
  check('a second booking is allowed (up to 3 slots)', b2.status === 201, String(b2.status));

  const b3 = await post(
    '/bookings',
    { centreId: pune.id, crop: 'SOYBEAN', quantityQtl: 15, slotDate: TODAY, slotTime: open[2]?.slot || open[0].slot },
    fTok
  );
  check('a third booking is allowed (up to 3 slots)', b3.status === 201, String(b3.status));

  const b4 = await post(
    '/bookings',
    { centreId: pune.id, crop: 'WHEAT', quantityQtl: 20, slotDate: TODAY, slotTime: open[0].slot },
    fTok
  );
  check('a 4th booking is refused (max 3 slots)', b4.status === 409, String(b4.status));

  // ---- 4. the admin takes over -----------------------------------------
  console.log('\n4. Centre admin signs in');
  const a = await post('/auth/admin/login', { adminCode: 'ADMIN001', password: 'admin123' });
  check('admin logs in', a.status === 200, JSON.stringify(a.data).slice(0, 120));
  const aTok = a.data.token;
  console.log(`   -> ${a.data.user.name} · ${a.data.user.centre_name}`);

  const q = await call('/queue', { token: aTok });
  check('queue loads for the admin', q.status === 200, String(q.status));
  console.log(
    `   -> booked today ${q.data.centre.booked_today} · in queue ${q.data.centre.in_queue} · ` +
      `wait ${q.data.centre.waitLabel} · ${q.data.centre.congestion}`
  );
  check('our farmer is in the admin queue', q.data.queue.some((r) => r.id === bookingId));

  // ---- 5. the live-ETA moment ------------------------------------------
  console.log('\n5. Admin serves the farmers ahead — the queue moves on its own');
  const ahead = q.data.queue.filter((r) => r.id !== bookingId && r.position < b1.position).slice(0, 3);
  for (const row of ahead) {
    for (let i = 0; i < 3; i += 1) await post(`/queue/${row.id}/advance`, undefined, aTok);
  }
  const mine2 = (await call('/bookings/mine', { token: fTok })).data;
  console.log(`   -> position ${b1.position} -> ${mine2.position} · wait ${b1.waitLabel} -> ${mine2.waitLabel}`);
  check('the farmer moved up without refreshing', mine2.position < b1.position, `${mine2.position}`);
  check('the estimated wait fell', mine2.waitMin < b1.waitMin, `${b1.waitMin} -> ${mine2.waitMin}`);

  // ---- 6. calling the farmer to the counter ---------------------------
  console.log('\n6. Admin calls our farmer forward');
  for (const expected of ['WAITING', 'CALLED', 'CHECKED_IN', 'ASSAYING', 'WEIGHMENT']) {
    const r = await post(`/queue/${bookingId}/advance`, undefined, aTok);
    const row = r.data.queue.find((x) => x.id === bookingId);
    check(`stage -> ${expected}`, row && row.status === expected, row && row.status);
    if (expected === 'CALLED') {
      const alerts = await call('/notifications', { token: fTok });
      check('farmer is alerted it is their turn', alerts.data.items.some((i) => i.type === 'ACTION'));
    }
  }
  const atCounter = (await call('/bookings/mine', { token: fTok })).data;
  check('a farmer at the counter has no queue number', atCounter.position === null, String(atCounter.position));

  // ---- 7. recording the sale ------------------------------------------
  console.log('\n7. Admin records quality, moisture and weight');
  const blank = await post(`/queue/${bookingId}/complete`, { qualityGrade: 'FAQ', moisturePct: '', netWeightQtl: '20' }, aTok);
  check('a blank moisture reading is refused', blank.status === 400, String(blank.status));

  const other = await post('/auth/admin/login', { adminCode: 'ADMIN002', password: 'admin123' });
  const cross = await post(
    `/queue/${bookingId}/complete`,
    { qualityGrade: 'FAQ', moisturePct: '11.5', netWeightQtl: '20' },
    other.data.token
  );
  check("another centre's admin cannot record it", cross.status === 403, String(cross.status));

  const done = await post(
    `/queue/${bookingId}/complete`,
    { qualityGrade: 'Grade A', moisturePct: '11.5', netWeightQtl: '19.6', remarks: 'Clean lot' },
    aTok
  );
  check('the sale is recorded', done.status === 200, JSON.stringify(done.data).slice(0, 140));
  const c = done.data.completed;
  console.log(
    `   -> ${c.netWeightQtl} qtl · ${c.qualityGrade} · base Rs ${c.baseRatePerQtl} x ${c.gradeFactor} ` +
      `= Rs ${c.ratePerQtl}/qtl · total Rs ${c.totalAmount} · ${c.txnRef}`
  );
  // Quality has to change the money, or the assay is theatre.
  check('a better grade lifts the rate above the base', c.ratePerQtl > c.baseRatePerQtl, `${c.ratePerQtl} vs ${c.baseRatePerQtl}`);
  check(
    'the amount is calculated on the server',
    c.totalAmount === Math.round(19.6 * Math.round(2425 * 1.05 * 100) / 100 * 100) / 100,
    String(c.totalAmount)
  );

  // ---- 8. the farmer's receipt ----------------------------------------
  console.log('\n8. Farmer sees the receipt');
  const receipt = (await call('/bookings/mine', { token: fTok })).data;
  const p = receipt.recentCompleted?.procurement || receipt.procurement || receipt.allBookings?.find((b) => b.id === bookingId)?.procurement;
  check('receipt reaches the farmer', Boolean(p), JSON.stringify(receipt).slice(0, 120));
  console.log(`   -> Rs ${p.total_amount} · ${p.quality_grade} · ${p.moisture_pct}% · ${p.payment_status} · ${p.txn_ref}`);
  check('payment starts as PROCESSING', p.payment_status === 'PROCESSING', p.payment_status);

  // ---- 9. releasing the payment ---------------------------------------
  console.log('\n9. Admin pays the farmer');
  const pay = await call('/payments', { token: aTok });
  check('payment list loads', pay.status === 200, String(pay.status));
  console.log(
    `   -> to be paid Rs ${pay.data.totals.pendingAmount} (${pay.data.totals.pendingCount}) · ` +
      `paid Rs ${pay.data.totals.paidAmount} (${pay.data.totals.paidCount})`
  );
  const row = pay.data.payments.find((x) => x.txn_ref === c.txnRef);
  const marked = await post(`/payments/${row.id}/paid`, undefined, aTok);
  check('payment is marked paid', marked.status === 200, String(marked.status));
  const again = await post(`/payments/${row.id}/paid`, undefined, aTok);
  check('paying twice is refused', again.status === 409, String(again.status));

  const finalReceipt = (await call('/bookings/mine', { token: fTok })).data;
  const finalP = finalReceipt.recentCompleted?.procurement || finalReceipt.procurement || finalReceipt.allBookings?.find((b) => b.id === bookingId)?.procurement;
  check('farmer receipt now reads PAID', finalP.payment_status === 'PAID', finalP.payment_status);
  const finalAlerts = await call('/notifications', { token: fTok });
  const paidAlert = finalAlerts.data.items.find((i) =>
    /has been paid|credited directly|Govt DBT/i.test(i.message)
  );
  check('farmer is told they were paid', Boolean(paidAlert), paidAlert ? paidAlert.message : '');
  if (paidAlert) console.log(`   -> "${paidAlert.message}"`);

  // ---- 9b. the farmer's own record ------------------------------------
  console.log("\n9b. Farmer's season tracker adds it up");
  const summary = await call('/bookings/summary', { token: fTok });
  check('the tracker loads', summary.status === 200, String(summary.status));
  const s = summary.data;
  console.log(
    `   -> ${s.sales} sale(s) · ${s.qtlSold} qtl · earned Rs ${s.earned} · ` +
      `paid Rs ${s.paid} · awaiting Rs ${s.awaiting}`
  );
  check('the sale is counted', s.sales >= 1, String(s.sales));
  check('what was paid shows as paid', s.paid >= c.totalAmount, `${s.paid} vs ${c.totalAmount}`);
  check('paid + awaiting equals earned', Math.round((s.paid + s.awaiting) * 100) / 100 === s.earned, `${s.paid} + ${s.awaiting} vs ${s.earned}`);
  check('the grade split names the grade', s.byGrade.some((g) => g.grade === c.qualityGrade), JSON.stringify(s.byGrade));

  // ---- 10. and round again --------------------------------------------
  console.log('\n10. Farmer can sell again the same day');
  const reBook = await post(
    '/bookings',
    { centreId: pune.id, crop: 'SOYBEAN', quantityQtl: 8, slotDate: TODAY, slotTime: open[0].slot },
    fTok
  );
  check('a new booking is allowed after a completed sale', reBook.status === 201, String(reBook.status));

  console.log(`\n${'='.repeat(46)}\n${pass} ok, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('\nABORTED:', e.message);
  process.exit(1);
});
