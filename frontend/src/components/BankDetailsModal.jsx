/**
 * BankDetailsModal.jsx
 *
 * Simple, Rural-Friendly Bank Account & Aadhaar Registration for Govt DBT Payments.
 *
 * Essential 3 Fields:
 * 1. 12-Digit Aadhaar Card Number
 * 2. Bank Account Number
 * 3. Bank IFSC Code (with auto-bank detection badge)
 */

import { useState } from 'react';
import {
  Building2,
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Landmark,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const POPULAR_BANKS = [
  { prefix: 'SBIN', name: 'State Bank of India (SBI)' },
  { prefix: 'MAHB', name: 'Bank of Maharashtra' },
  { prefix: 'HDFC', name: 'HDFC Bank' },
  { prefix: 'BARB', name: 'Bank of Baroda' },
  { prefix: 'PUNB', name: 'Punjab National Bank' },
  { prefix: 'CNRB', name: 'Canara Bank' },
];

function detectBank(ifsc = '') {
  const clean = ifsc.trim().toUpperCase().slice(0, 4);
  const found = POPULAR_BANKS.find((b) => b.prefix === clean);
  if (found) return found.name;
  if (clean.length === 4) return 'Nationalized Commercial Bank';
  return null;
}

export function BankDetailsModal({ farmer, onSaved, onClose }) {
  const { t } = useLanguage();
  const [aadhaar, setAadhaar] = useState(farmer?.aadhaar_no || '');
  const [account, setAccount] = useState(farmer?.bank_account || '');
  const [ifsc, setIfsc] = useState(farmer?.ifsc_code || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const detectedBank = detectBank(ifsc) || farmer?.bank_name || 'State Bank of India';

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    const cleanAccount = account.replace(/\s+/g, '');
    const cleanIfsc = ifsc.trim().toUpperCase();

    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits');
      return;
    }
    if (!cleanAccount || cleanAccount.length < 8) {
      setError('Please enter a valid Bank Account number (minimum 8 digits)');
      return;
    }
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      setError('IFSC code must be exactly 11 characters (e.g. SBIN0000324)');
      return;
    }

    setLoading(true);
    try {
      const res = await api('/auth/farmer/bank-details', {
        method: 'POST',
        body: {
          aadhaarNo: cleanAadhaar,
          bankAccount: cleanAccount,
          ifscCode: cleanIfsc,
          bankName: detectedBank,
          accountHolder: farmer?.name,
        },
      });

      setLoading(false);
      setSuccess(true);
      if (onSaved) onSaved(res.user);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to save bank details');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
              <Landmark className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">{t('bankModal.title')}</h3>
              <p className="text-[11px] text-emerald-200 font-medium">{t('bankModal.sub')}</p>
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

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">{t('bankModal.success')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('receipt.doneSub')}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bankModal.bankName')}:</span>
                  <span className="font-bold text-slate-900">{detectedBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bankModal.accountNo')}:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    ••••{account.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bankModal.ifsc')}:</span>
                  <span className="font-mono font-bold text-slate-800">{ifsc.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('farmer.aadhaar')}:</span>
                  <span className="font-bold text-emerald-800">✅ {t('common.verified')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. Aadhaar Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. {t('ekycModal.aadhaarNo')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaar}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = v.replace(/(\d{4})(?=\d)/g, '$1-');
                      setAadhaar(formatted);
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-mono tracking-wider font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* 2. Bank Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. {t('bankModal.accountNo')}
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={account}
                  onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 30829104821"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* 3. IFSC Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    3. {t('bankModal.ifsc')}
                  </label>
                  {detectedBank && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      🏛️ {detectedBank}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0000324"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-mono uppercase font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('bankModal.saving')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t('bankModal.saveBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
