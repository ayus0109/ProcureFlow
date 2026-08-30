const db = require('../backend/db');
const { todayISO } = require('../backend/utils/dates');
const { WAITING_QUEUE_STATUSES } = require('../backend/config/constants');
const WAITING_PLACEHOLDERS = WAITING_QUEUE_STATUSES.map(() => '?').join(', ');

const POS_SQL = `
  WITH queue AS (
    SELECT id, farmer_id, slot_time, status, ROW_NUMBER() OVER (ORDER BY slot_time, id) AS position
      FROM bookings
     WHERE centre_id = ? AND slot_date = ? AND status IN (${WAITING_PLACEHOLDERS})
  )
  SELECT id, farmer_id, slot_time, status, position FROM queue`;

const queue = db.prepare(POS_SQL).all(1, todayISO(), ...WAITING_QUEUE_STATUSES);
console.log('Today ISO:', todayISO());
console.log('Queue count:', queue.length);
console.log('Sample queue:', queue.slice(0, 10));
console.log('Farmer 1 in queue:', queue.find(q => q.farmer_id === 1));
