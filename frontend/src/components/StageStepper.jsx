import React from 'react';
import {
  Calendar,
  Users,
  BellRing,
  ShieldCheck,
  FlaskConical,
  Scale,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const STAGES = [
  { key: 'BOOKED', icon: Calendar },
  { key: 'WAITING', icon: Users },
  { key: 'CALLED', icon: BellRing },
  { key: 'CHECKED_IN', icon: ShieldCheck },
  { key: 'ASSAYING', icon: FlaskConical },
  { key: 'WEIGHMENT', icon: Scale },
  { key: 'CONFIRMED', icon: CheckCircle2 },
];

export default function StageStepper({ currentStatus }) {
  const { t } = useLanguage();

  if (currentStatus === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
        <XCircle className="h-5 w-5 text-red-700" />
        <span className="text-sm font-semibold text-red-900">{t('status.REJECTED')}</span>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="w-full py-2">
      {/* Step Progress Line */}
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-slate-200" />
        {/* Active progress bar */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-emerald-600 transition-all duration-500 ease-out"
          style={{ width: `${(activeIdx / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Step Nodes */}
        {STAGES.map((s, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const Icon = s.icon;

          return (
            <div key={s.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                    : isDone
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-400 ring-2 ring-slate-200'
                }`}
                title={t(`stage.${s.key}`) || s.key}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Label for current stage */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-800">
          {t(`status.${currentStatus}`) || currentStatus}
        </span>
        <span className="text-slate-500">
          Step {activeIdx + 1} of {STAGES.length}
        </span>
      </div>
    </div>
  );
}
