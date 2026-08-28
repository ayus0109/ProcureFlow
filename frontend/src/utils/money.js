/**
 * One money formatter for the whole app.
 *
 * Rounded amounts print clean (₹48,500) and fractional ones print in full
 * (₹49,906.50, never ₹49,906.5) — a receipt that drops a paise digit looks like
 * a mistake to the person reading it. Grade adjustments make paise routine, so
 * this lives in one place rather than being copied into each screen.
 */

export function money(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
