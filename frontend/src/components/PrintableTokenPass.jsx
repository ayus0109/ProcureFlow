/**
 * PrintableTokenPass.jsx
 *
 * Official Mandi Token Pass & Digital PDF Document.
 *
 * Features:
 * - Clean Govt of India / APMC header with emblem and watermark
 * - High-resolution printable styling with QR Code
 * - Direct Print / PDF Save (`window.print()`)
 * - 1-Click WhatsApp Share with pre-formatted pass details
 */

import { useRef } from 'react';
import {
  Printer,
  Share2,
  X,
  Building2,
  Calendar,
  Clock,
  Wheat,
  Scale,
  User,
  ShieldCheck,
  MapPin,
  QrCode,
  Download,
} from 'lucide-react';
import QRCode from './QRCode.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { formatWhatsAppPass } from '../utils/localizedMessages.js';

export function PrintableTokenPass({ booking, farmer, onClose }) {
  const printRef = useRef(null);
  const { t, lang } = useLanguage();

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = formatWhatsAppPass(booking, farmer, lang, t);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div
        ref={printRef}
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl print:shadow-none print:max-w-none print:w-full border border-[#d5ead8]"
      >
        {/* Action Header - Hidden on Print */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-[#d5ead8] bg-[#2d6a4f] px-4 py-3 text-white print:hidden">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm truncate">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#52b788] shrink-0" />
            <span className="truncate">{t('pass.title')}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 rounded-xl bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white hover:brightness-110 transition shadow-2xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-[#1b4332] hover:bg-[#eef7f0] transition shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#2d6a4f]" />
              <span>{t('common.print')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Pass Body */}
        <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Govt & APMC Header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white font-black text-xl shadow-md">
                🌾
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900">
                  {t('pass.govHeader')}
                </p>
                <h2 className="text-base font-black text-slate-900">{t('pass.title')}</h2>
                <p className="text-xs text-slate-500 font-medium">{t(`centre.${booking.centre_id}`) || booking.centre_name}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[10px] font-black text-emerald-900">
                <ShieldCheck className="h-3 w-3 text-emerald-700" />
                {t('common.verified')}
              </span>
              <p className="mt-1 text-[10px] font-mono text-slate-400">{t('book.date')}: {booking.slot_date}</p>
            </div>
          </div>

          {/* Token Hero Badge & QR Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-5 border border-emerald-200/90 shadow-xs">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {t('booking.token')}
              </p>
              <p className="mt-0.5 font-mono text-4xl sm:text-5xl font-black text-emerald-950 tracking-tight">
                {booking.token}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-700" />
                  {t('booking.when')}: <strong>{booking.slot_time}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-900">
                  {t('booking.arriveBy')}: <strong>{booking.arriveBy || booking.slot_time.split('-')[0]}</strong>
                </span>
              </div>
            </div>

            {/* QR Code graphic */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <QRCode
                  value={`PROCURFLOW:${booking.token}:${booking.farmer_id}:${booking.centre_id}:${booking.crop}`}
                  size={96}
                />
              </div>
              <span className="mt-1 text-[9px] font-mono text-slate-400">Scan at Gate</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 mb-1">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t('pass.farmerDetails')}</span>
              </div>
              <p className="font-extrabold text-slate-900 text-sm">{farmer?.name || 'Ramesh Patil'}</p>
              <p className="text-slate-600 font-mono text-[11px]">{farmer?.phone || '9999990001'}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{farmer?.village || 'Baramati'}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 mb-1">
                <Wheat className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t('book.crop')}</span>
              </div>
              <p className="font-extrabold text-slate-900 text-sm">{t(`crop.${booking.crop}`) || booking.crop}</p>
              <p className="text-emerald-900 font-black text-sm">{booking.quantity_qtl} {t('booking.qtl')}</p>
              {booking.ratePerQtl && (
                <p className="text-slate-500 text-[10px]">MSP: ₹{booking.ratePerQtl}/{t('booking.qtl')}</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 mb-1">
                <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t('book.centre')}</span>
              </div>
              <p className="font-bold text-slate-900">{t(`centre.${booking.centre_id}`) || booking.centre_name}</p>
              <p className="text-slate-500 text-[11px]">{booking.district || 'Maharashtra'}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t('farmer.bankDbt')}</span>
              </div>
              <p className="font-bold text-slate-900">
                {farmer?.bank_name || 'State Bank of India'}
              </p>
              <p className="text-emerald-900 font-mono font-bold text-[11px]">
                A/c: {farmer?.bank_account ? `••••${farmer.bank_account.slice(-4)}` : '••••4821'} • {farmer?.ifsc_code || 'SBIN0000324'}
              </p>
            </div>
          </div>

          {/* Farmer Gate Instructions */}
          <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200 text-[11px] text-amber-950 space-y-1">
            <p className="font-bold">⚠️ {t('pass.instructions')}:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
              <li>{t('pass.inst1')}</li>
              <li>{t('pass.inst2')}</li>
              <li>{t('pass.inst3')}</li>
            </ul>
          </div>

          {/* Footer Barcode line */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>PROCURFLOW-PASS-SECURE-V2</span>
            <span>TOKEN #{booking.token}</span>
            <span>ISSUED: {booking.slot_date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
