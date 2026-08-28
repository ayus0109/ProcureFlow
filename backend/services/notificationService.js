/**
 * In-app alerts for the farmer.
 *
 * Rows are written all through the journey (booking, each queue stage, the sale,
 * the payment). This service only reads them back and marks them read, so the
 * farmer has a record of what happened even if they missed it live.
 */

const db = require('../db');

const LIST_SQL = `
  SELECT id, message, type, is_read, created_at
    FROM notifications
   WHERE farmer_id = ?
   ORDER BY id DESC
   LIMIT 20`;

const UNREAD_SQL = `
  SELECT COUNT(*) AS unread FROM notifications WHERE farmer_id = ? AND is_read = 0`;

function listForFarmer(farmerId) {
  return {
    items: db.prepare(LIST_SQL).all(farmerId),
    unread: db.prepare(UNREAD_SQL).get(farmerId).unread,
  };
}

function markAllRead(farmerId) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE farmer_id = ? AND is_read = 0').run(
    farmerId
  );
  return listForFarmer(farmerId);
}

/** Raise an alert. Types: INFO, ACTION, SUCCESS, ALERT. */
function notify(farmerId, message, type = 'INFO') {
  db.prepare('INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)').run(
    farmerId,
    message,
    type
  );
}

module.exports = { listForFarmer, markAllRead, notify };
