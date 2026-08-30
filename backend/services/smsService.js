/**
 * backend/services/smsService.js
 *
 * Automated SMS & WhatsApp dispatch simulator and integration service.
 *
 * Sends official APMC notification dispatches to farmers when:
 * 1) Booking is confirmed (Token & Arrival window)
 * 2) Farmer is called to counter (Urgent queue movement alert)
 * 3) Procurement completed & Payment credited (Direct Benefit Transfer receipt)
 * 4) Aadhaar e-KYC verification OTP
 */

const db = require('../db');

/**
 * Dispatch an SMS / WhatsApp message and log it in the database.
 */
function sendSms({ farmerId, phone, message, type = 'INFO', channel = 'SMS' }) {
  const cleanPhone = (phone || '').trim();
  if (!cleanPhone || !message) return null;

  try {
    const stmt = db.prepare(`
      INSERT INTO sms_logs (farmer_id, phone, message, channel, type, status)
      VALUES (?, ?, ?, ?, ?, 'DELIVERED')
    `);
    const result = stmt.run(farmerId || null, cleanPhone, message, channel, type);
    return {
      id: Number(result.lastInsertRowid),
      phone: cleanPhone,
      message,
      channel,
      type,
      status: 'DELIVERED',
      sent_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[SMS Service Error]', err);
    return null;
  }
}

/**
 * Trigger booking confirmed dispatch.
 */
function dispatchBookingSms(farmer, booking) {
  if (!farmer || !booking) return;

  const msg =
    `[KisanSathi APMC] Dear ${farmer.name}, your procurement slot is BOOKED at ${booking.centre_name || 'APMC'}.\n` +
    `Token: ${booking.token}\n` +
    `Date: ${booking.slot_date} (${booking.slot_time})\n` +
    `Crop: ${booking.cropLabel || booking.crop} (${booking.quantity_qtl} qtl)\n` +
    `Please arrive by ${booking.arriveBy || booking.slot_time.split('-')[0]}. Track live: https://kisansathi.gov.in`;

  sendSms({
    farmerId: farmer.id,
    phone: farmer.phone,
    message: msg,
    channel: 'SMS',
    type: 'BOOKING_CONFIRMED',
  });

  // Also send a WhatsApp template dispatch
  sendSms({
    farmerId: farmer.id,
    phone: farmer.phone,
    message: `🌾 *KisanSathi Mandi Pass*\n` +
      `नमस्ते ${farmer.name} जी, आपका टोकन *${booking.token}* बुक हो चुका है।\n` +
      `📅 दिनांक: ${booking.slot_date} [${booking.slot_time}]\n` +
      `🏛️ केंद्र: ${booking.centre_name}\n` +
      `🌾 फसल: ${booking.cropLabel || booking.crop} (${booking.quantity_qtl} क्विंटल)`,
    channel: 'WHATSAPP',
    type: 'BOOKING_CONFIRMED',
  });
}

/**
 * Trigger counter called dispatch.
 */
function dispatchCalledSms(farmer, booking, counterNum = 1) {
  if (!farmer || !booking) return;

  const msg =
    `[KisanSathi URGENT] Token ${booking.token} is now CALLED at Counter #${counterNum} at ${booking.centre_name || 'APMC'}. ` +
    `Please proceed immediately with your lot for quality assaying.`;

  sendSms({
    farmerId: farmer.id,
    phone: farmer.phone,
    message: msg,
    channel: 'SMS',
    type: 'CALLED_ALERT',
  });
}

/**
 * Trigger payment credited dispatch.
 */
function dispatchPaymentSms(farmer, token, amount, txnRef) {
  if (!farmer) return;

  const formattedAmt = Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const msg =
    `[KisanSathi DBT] Payment of Rs. ${formattedAmt} for Token ${token} has been credited to your Aadhaar-linked bank account. Ref: ${txnRef}.`;

  sendSms({
    farmerId: farmer.id,
    phone: farmer.phone,
    message: msg,
    channel: 'SMS',
    type: 'PAYMENT_CREDITED',
  });
}

/**
 * Retrieve recent SMS logs for a farmer or globally for admin inspection.
 */
function getSmsLogs(farmerId = null, limit = 20) {
  try {
    if (farmerId) {
      return db
        .prepare(`SELECT * FROM sms_logs WHERE farmer_id = ? ORDER BY id DESC LIMIT ?`)
        .all(Number(farmerId), limit);
    }
    return db
      .prepare(`SELECT * FROM sms_logs ORDER BY id DESC LIMIT ?`)
      .all(limit);
  } catch {
    return [];
  }
}

module.exports = {
  sendSms,
  dispatchBookingSms,
  dispatchCalledSms,
  dispatchPaymentSms,
  getSmsLogs,
};
