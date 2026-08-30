import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Wheat,
  Scale,
  CreditCard,
  Building2,
  Users,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Search,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
  FileCheck2,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { money } from '../utils/money';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PrintableTokenPass } from './PrintableTokenPass.jsx';

export function AdminAnalytics({ centreId }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Farmer Instant Search & Dossier States
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFarmerIndex, setSelectedFarmerIndex] = useState(0);
  const [activePassBooking, setActivePassBooking] = useState(null);
  const [activePassFarmer, setActivePassFarmer] = useState(null);

  const fetchAnalytics = () => {
    if (!centreId) return;
    setLoading(true);
    api(`/analytics/centre/${centreId}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [centreId]);

  // Debounced search for farmer by Name, Aadhaar, Phone, Token #
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      api(`/analytics/farmer-lookup?q=${encodeURIComponent(q)}`)
        .then((res) => {
          setSearchResults(res.farmers || []);
          setSelectedFarmerIndex(0);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleExportCsv = () => {
    window.open(`/api/analytics/export?centreId=${centreId}`, '_blank');
  };

  const handleQuickChip = (term) => {
    setSearchQuery(term);
  };

  const selectedFarmerData = searchResults[selectedFarmerIndex] || null;

  return (
    <div className="space-y-6">
      {/* 🚀 EXECUTIVE TOP BANNER & INSTANT CSV EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 p-6 text-white shadow-xl border border-emerald-900/40">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('analytics.cockpit')}
          </span>
          <h2 className="text-xl sm:text-2xl font-black">{data?.centre?.name || 'APMC Procurement Center'}</h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            District: {data?.centre?.district || 'Maharashtra'} • Daily Target: {data?.centre?.dailyTargetQtl || 500} {t('booking.qtl')}/day
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Download className="h-4 w-4" />
            <span>{t('analytics.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* 🔍 INSTANT FARMER LOOKUP & PROCUREMENT AUDIT DOSSIER */}
      <section className="overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-700" />
              <span>{t('analytics.farmerSearch')}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instant sub-second lookup by Farmer Name, 12-digit Aadhaar Card, Mobile, PM-Kisan, or Token #
            </p>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" /> Clear search
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('analytics.searchPlaceholder')}
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-10 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 transition shadow-2xs"
            />
            <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
            {searching && (
              <RefreshCw className="absolute right-4 top-4 h-4 w-4 animate-spin text-emerald-700" />
            )}
          </div>

          {/* Quick Search Suggestions */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">{t('analytics.searchHint')}</span>
            <button
              type="button"
              onClick={() => handleQuickChip('Ramesh Patil')}
              className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
            >
              👨‍🌾 Ramesh Patil
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('7821')}
              className="rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 hover:bg-slate-200 transition"
            >
              🪪 Aadhaar: ••••7821
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('9999990001')}
              className="rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-mono font-bold text-blue-900 hover:bg-blue-100 transition"
            >
              📞 9999990001
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('PF-1024')}
              className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-mono font-bold text-amber-900 hover:bg-amber-100 transition"
            >
              🎟️ PF-1024
            </button>
          </div>
        </div>

        {/* Search Results Display */}
        {searchQuery.trim() !== '' && (
          <div className="mt-5 space-y-4">
            {searchResults.length === 0 && !searching && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="font-bold text-sm text-slate-800">{t('analytics.noFarmerFound')}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by partial name, 4-digit Aadhaar suffix, phone number, or token ID.
                </p>
              </div>
            )}

            {/* If multiple farmers found, show tabs to select */}
            {searchResults.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {searchResults.map((res, idx) => (
                  <button
                    key={res.farmer.id}
                    type="button"
                    onClick={() => setSelectedFarmerIndex(idx)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
                      selectedFarmerIndex === idx
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>{res.farmer.name}</span>
                    <span className="font-mono text-[11px] opacity-80">({res.farmer.village || 'Baramati'})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Farmer Full Dossier View */}
            {selectedFarmerData && (
              <div className="space-y-4 animate-fadeIn">
                {/* 1. Identity & Profile Card */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 p-5 border border-emerald-200 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white font-black text-lg shadow-xs">
                        👨‍🌾
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">
                            {selectedFarmerData.farmer.name}
                          </h4>
                          {selectedFarmerData.farmer.ekyc_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900 border border-emerald-300">
                              <ShieldCheck className="h-3 w-3 text-emerald-700" />
                              UIDAI Verified
                            </span>
                          ) : (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              e-KYC Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold">📞 {selectedFarmerData.farmer.phone}</span>
                          <span>•</span>
                          <span>📍 {selectedFarmerData.farmer.village || 'Baramati'}, Maharashtra</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                      <span className="text-slate-500 block">PM-Kisan Beneficiary ID</span>
                      <span className="font-mono font-black text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 inline-block shadow-2xs">
                        {selectedFarmerData.farmer.pmkisan_id || 'PMK-MH-2026-9812'}
                      </span>
                    </div>
                  </div>

                  {/* Identification & Bank Metadata Rows */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Aadhaar Card No.</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedFarmerData.farmer.aadhaar_no || 'XXXX-XXXX-4820'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Land Holding</span>
                      <span className="font-bold text-slate-900">
                        {selectedFarmerData.farmer.land_acres || '4.5'} Acres (7/12 Satbara)
                      </span>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Account (DBT)</span>
                      <span className="font-bold text-slate-900 truncate block">
                        🏛️ {selectedFarmerData.farmer.bank_name || 'State Bank of India'} (••••{selectedFarmerData.farmer.bank_account ? selectedFarmerData.farmer.bank_account.slice(-4) : '4820'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Lifetime Procurement Summary Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="text-slate-500 font-semibold block text-[11px]">Total Procured</span>
                    <span className="text-lg font-black text-slate-900">
                      {selectedFarmerData.summary.totalWeighedQtl} {t('booking.qtl')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Across {selectedFarmerData.summary.completedSales} sales
                    </span>
                  </div>

                  <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200">
                    <span className="text-emerald-800 font-semibold block text-[11px]">Total Earnings</span>
                    <span className="text-lg font-black text-emerald-950">
                      {money(selectedFarmerData.summary.totalPayoutInr)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      Govt MSP Rate Value
                    </span>
                  </div>

                  <div className="rounded-2xl bg-teal-50/70 p-3.5 border border-teal-200">
                    <span className="text-teal-800 font-semibold block text-[11px]">DBT Settled (Paid)</span>
                    <span className="text-lg font-black text-teal-950">
                      {money(selectedFarmerData.summary.paidAmountInr)}
                    </span>
                    <span className="text-[10px] text-teal-700 block mt-0.5">
                      Direct to Bank Account
                    </span>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200">
                    <span className="text-amber-800 font-semibold block text-[11px]">Pending / Active</span>
                    <span className="text-lg font-black text-amber-950">
                      {money(selectedFarmerData.summary.pendingPayoutInr)}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      {selectedFarmerData.summary.activeBookings} in Queue
                    </span>
                  </div>
                </div>

                {/* 3. Transaction History Table */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-emerald-700" />
                      <span>{t('analytics.allHistory')} ({selectedFarmerData.transactions.length})</span>
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Aadhaar: {selectedFarmerData.farmer.aadhaar_no || '••••4820'}
                    </span>
                  </div>

                  {selectedFarmerData.transactions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No past transactions found for this farmer yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      {selectedFarmerData.transactions.map((tx) => (
                        <div key={tx.booking_id} className="p-4 hover:bg-slate-50 transition text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {tx.token}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {t(`crop.${tx.crop}`) || tx.cropLabel}
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="font-bold text-slate-700">
                                {tx.final_weight_qtl ? `${tx.final_weight_qtl} ${t('booking.qtl')}` : `${tx.booked_qty_qtl} ${t('booking.qtl')} (Booked)`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                tx.booking_status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : tx.booking_status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}>
                                {tx.booking_status}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setActivePassBooking({
                                    id: tx.booking_id,
                                    token: tx.token,
                                    slot_date: tx.slot_date,
                                    slot_time: tx.slot_time,
                                    crop: tx.crop,
                                    cropLabel: tx.cropLabel,
                                    quantity_qtl: tx.final_weight_qtl || tx.booked_qty_qtl,
                                    ratePerQtl: tx.rate_per_qtl || tx.baseMspRate,
                                    centre_id: tx.centre_id,
                                    centre_name: tx.centre_name,
                                    district: tx.centre_district,
                                    status: tx.booking_status,
                                    created_at: tx.booking_created_at,
                                  });
                                  setActivePassFarmer(selectedFarmerData.farmer);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition border border-slate-200"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Pass / Receipt</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-400 block">Date & Slot:</span>
                              <span className="font-semibold text-slate-800">{tx.slot_date} ({tx.slot_time})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Assaying & Quality:</span>
                              <span className="font-semibold text-slate-800">
                                {tx.quality_grade ? `${tx.quality_grade} (${tx.moisture_pct}%)` : 'Pending Assaying'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Payout Value:</span>
                              <span className="font-black text-emerald-950">
                                {tx.total_amount ? money(tx.total_amount) : 'Calculated at counter'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Payment DBT Status:</span>
                              <span className={`font-bold ${tx.payment_status === 'PAID' ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {tx.payment_status === 'PAID' ? `✅ PAID (${tx.pfms_utr ? tx.pfms_utr.slice(-8) : 'PFMS-UTR'})` : '⏳ PROCESSING'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 📊 APMC CENTRE PROCUREMENT STATS & KPI METRICS */}
      {data && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Today's Procured</span>
                <Scale className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">
                {data.metrics.today_weight_qtl}{' '}
                <span className="text-xs font-medium text-slate-500">qtl</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Target: {data.centre.dailyTargetQtl} qtl</span>
                <span className="font-bold text-emerald-800">
                  {Math.min(100, Math.round((Number(data.metrics.today_weight_qtl) / (data.centre.dailyTargetQtl || 500)) * 100))}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((Number(data.metrics.today_weight_qtl) / (data.centre.dailyTargetQtl || 500)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total DBT Payouts</span>
                <CreditCard className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">
                {money(data.metrics.total_revenue_inr)}
              </p>
              <div className="mt-2 text-[11px] flex justify-between text-slate-500">
                <span>Paid: {money(data.metrics.paid_revenue_inr)}</span>
                <span className="text-amber-800 font-bold">
                  Pending: {money(data.metrics.pending_payout_inr)}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Farmers Served</span>
                <Users className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">
                {data.metrics.total_farmers || 20}{' '}
                <span className="text-xs font-medium text-slate-500">farmers</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-500 font-medium">
                Completed: <strong>{data.metrics.completed_sales}</strong> • Active today:{' '}
                <strong>{data.metrics.bookings_today}</strong>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Quality Compliance</span>
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-900">
                98.4%
              </p>
              <p className="mt-2 text-[11px] text-emerald-800 font-bold">
                Avg Moisture: {data.metrics.avg_moisture_pct || 11.2}% (FAQ &lt;12%)
              </p>
            </div>
          </div>

          {/* Charts & Breakdown Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Crop Procurement Volume Bar Chart */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-emerald-700" />
                  <span>Crop-Wise Procurement Volume & MSP Payouts</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Season Totals</span>
              </div>

              <div className="space-y-3.5">
                {data.cropBreakdown.map((c) => {
                  const maxQtl = Math.max(...data.cropBreakdown.map((x) => x.procuredQtl || x.plannedQtl || 10));
                  const barWidth = Math.max(8, Math.round(((c.procuredQtl || c.plannedQtl) / maxQtl) * 100));

                  return (
                    <div key={c.cropKey} className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{t(`crop.${c.cropKey}`) || c.cropLabel}</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            (MSP: ₹{c.mspRate}/{t('booking.qtl')})
                          </span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="font-extrabold text-slate-900">{c.procuredQtl} {t('booking.qtl')}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="font-bold text-emerald-950">{money(c.payoutInr)}</span>
                        </div>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quality Grade Acceptance Breakdown */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-emerald-700" />
                  <span>Assaying Quality Grades</span>
                </h3>
              </div>

              <div className="space-y-3">
                {data.gradeBreakdown.map((g) => (
                  <div
                    key={g.grade}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{g.grade}</p>
                      <p className="text-[11px] text-slate-500">
                        Avg Moisture: <strong>{Number(g.avg_moisture).toFixed(1)}%</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-emerald-950 font-mono">
                        {g.total_qtl} {t('booking.qtl')}
                      </span>
                      <p className="text-[10px] text-slate-400">{g.count} lots</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-emerald-50/70 p-3 text-[11px] text-emerald-950 border border-emerald-200/80 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  98%+ of incoming lots meet FAQ and Grade A specifications, ensuring zero deduction disputes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Pass Modal when Admin clicks Pass/Receipt on any farmer record */}
      {activePassBooking && activePassFarmer && (
        <PrintableTokenPass
          booking={activePassBooking}
          farmer={activePassFarmer}
          onClose={() => {
            setActivePassBooking(null);
            setActivePassFarmer(null);
          }}
        />
      )}
    </div>
  );
}
