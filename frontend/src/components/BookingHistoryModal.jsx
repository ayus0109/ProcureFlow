import { useState, useEffect } from 'react';
import {
  History,
  X,
  Search,
  Filter,
  Wheat,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { money } from '../utils/money';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export function BookingHistoryModal({ onClose, onSelectPass }) {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api('/bookings/history')
      .then((data) => setBookings(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    if (selectedCrop !== 'ALL' && b.crop !== selectedCrop) return false;
    if (selectedStatus === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
    if (selectedStatus === 'ACTIVE' && (b.status === 'CONFIRMED' || b.status === 'REJECTED')) return false;
    if (selectedStatus === 'REJECTED' && b.status !== 'REJECTED') return false;
    return true;
  });

  const crops = Array.from(new Set(bookings.map((b) => b.crop))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">{t('historyModal.title')}</h3>
              <p className="text-[11px] text-emerald-200 font-medium">{t('historyModal.sub')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">{t('historyModal.allCrops')}</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {t(`crop.${c}`) || c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">{t('historyModal.allStatuses')}</option>
              <option value="ACTIVE">{t('status.ACTIVE') || 'Active'}</option>
              <option value="CONFIRMED">{t('status.CONFIRMED') || 'Completed'}</option>
              <option value="REJECTED">{t('status.REJECTED') || 'Rejected'}</option>
            </select>
          </div>

          <span className="text-xs font-mono font-bold text-slate-500">
            {filtered.length} Record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Bookings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-slate-50/50">
          {loading && (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              {t('common.loading')}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <History className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">{t('historyModal.empty')}</p>
              <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters above.</p>
            </div>
          )}

          {filtered.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const isRejected = b.status === 'REJECTED';
            const isExpanded = expandedId === b.id;

            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:border-slate-300"
              >
                {/* Booking Summary Card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  className="flex cursor-pointer items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl font-mono text-sm font-black ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300'
                          : isRejected
                          ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-300'
                          : 'bg-blue-100 text-blue-900 ring-1 ring-blue-300'
                      }`}
                    >
                      {b.token.slice(3)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {t(`crop.${b.crop}`) || b.cropLabel || b.crop}
                        </h4>
                        <span className="font-bold text-slate-700 text-xs">
                          • {b.final_weight_qtl ? `${b.final_weight_qtl} ${t('booking.qtl')}` : `${b.quantity_qtl} ${t('booking.qtl')}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>🏛️ {t(`centre.${b.centre_id}`) || b.centre_name}</span>
                        <span>•</span>
                        <span>📅 {b.slot_date}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {isConfirmed && b.total_amount && (
                        <p className="font-extrabold text-emerald-950 text-sm">
                          {money(b.total_amount)}
                        </p>
                      )}
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-900'
                            : isRejected
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {t(`status.${b.status}`) || b.status}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Digital Receipt */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          {t('booking.token')}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {b.token}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          {t('booking.when')}
                        </span>
                        <span className="font-bold text-slate-900">{b.slot_time}</span>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          Grade
                        </span>
                        <span className="font-bold text-slate-900">
                          {b.quality_grade || 'Pending'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          {t('farmer.bankDbt')}
                        </span>
                        <span
                          className={`font-bold ${
                            b.payment_status === 'PAID' ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {t(`payment.${b.payment_status}`) || b.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Full Financial Breakdown if Confirmed */}
                    {isConfirmed && (
                      <div className="rounded-2xl bg-white p-3.5 border border-emerald-200 shadow-2xs space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>{t('receipt.weight')}:</span>
                          <span className="font-bold text-slate-900">{b.final_weight_qtl} {t('booking.qtl')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{t('receipt.rate')}:</span>
                          <span className="font-bold text-slate-900">{money(b.rate_per_qtl)}/{t('booking.qtl')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{t('receipt.moisture')}:</span>
                          <span className="font-bold text-slate-900">{b.moisture_pct}%</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{t('receipt.utr')}:</span>
                          <span className="font-mono font-bold text-slate-900">{b.txn_ref || 'PF-TXN-1002'}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex justify-between font-extrabold text-sm text-emerald-950">
                          <span>{t('receipt.totalAmount')}:</span>
                          <span>{money(b.total_amount)}</span>
                        </div>
                      </div>
                    )}

                    {b.remarks && (
                      <p className="text-[11px] text-slate-500 italic">Remarks: {b.remarks}</p>
                    )}

                    {onSelectPass && (
                      <button
                        type="button"
                        onClick={() => onSelectPass(b)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>{t('common.print')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
