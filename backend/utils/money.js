/**
 * Money as it appears in a notification the farmer reads.
 *
 * Matches the frontend's formatter exactly: rounded amounts print clean
 * (₹48,500), fractional ones print in full (₹49,906.50, never ₹49,906.5). Grade
 * adjustments make paise routine, and an alert that disagrees with the receipt
 * beside it costs trust on stage.
 */

function money(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

module.exports = { money };
