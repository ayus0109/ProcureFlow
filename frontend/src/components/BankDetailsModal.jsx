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
              <h3 className="text-sm font-extrabold">Bank Account for Govt DBT</h3>
              <p className="text-[11px] text-emerald-200 font-medium">Direct Bank-to-Bank Transfer Setup</p>
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
                <h4 className="text-base font-black text-slate-900">Bank Account Linked!</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Govt procurement payments will be directly transferred to your bank account.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-900">{detectedBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    ••••{account.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800">{ifsc.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aadhaar Linked:</span>
                  <span className="font-bold text-emerald-800">✅ Active DBT Status</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Friendly Guide Box */}
              <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <FileText className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Enter your <strong>Aadhaar</strong>, <strong>Bank Account</strong>, and <strong>IFSC code</strong> as written on your bank passbook. The government will transfer money directly to this account.
                </p>
              </div>

              {/* 1. Aadhaar Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Aadhaar Number (12 Digits)
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
                <p className="mt-0.5 text-[10px] text-slate-500">Linked with UIDAI NPCI Aadhaar payment bridge</p>
              </div>

              {/* 2. Bank Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Bank Account Number
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
                <p className="mt-0.5 text-[10px] text-slate-500">As shown on your bank passbook</p>
              </div>

              {/* 3. IFSC Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Bank IFSC Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0000324"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <Building2 className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
                {detectedBank && ifsc.length >= 4 && (
                  <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Detected: {detectedBank}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 hover:brightness-110 transition disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Save & Enable Govt DBT Transfers</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
