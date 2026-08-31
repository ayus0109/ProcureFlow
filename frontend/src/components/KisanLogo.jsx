import React from 'react';

/**
 * Handcrafted KisanSathi Brand Emblem & Typography Logo.
 * Features a golden harvest wheat sheaf, rising morning sun, and flourishing emerald leaves.
 * Fully responsive on all mobile and desktop viewports.
 */
export function KisanLogoMark({ className = 'h-8 w-8 sm:h-9 sm:w-9' }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xs"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D6A4F" />
            <stop offset="60%" stopColor="#1B4332" />
            <stop offset="100%" stopColor="#081C15" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#52B788" />
            <stop offset="100%" stopColor="#95D5B2" />
          </linearGradient>
          <linearGradient id="sunGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
          <linearGradient id="wheatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Outer Organic Shield / Rounded Squircle */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="14"
          fill="url(#logoBgGrad)"
          stroke="#40916C"
          strokeWidth="1.5"
        />

        {/* Rising Morning Sun Arc */}
        <circle cx="24" cy="22" r="9" fill="url(#sunGrad)" opacity="0.95" />

        {/* Horizon / Furrow Waves */}
        <path
          d="M6 34C12 30 18 36 24 33C30 30 36 36 42 33"
          stroke="#52B788"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Golden Wheat Spikes (Center) */}
        {/* Central Stem */}
        <path
          d="M24 38V14"
          stroke="url(#wheatGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Wheat Grains Left & Right */}
        <path
          d="M24 16C21 13 20 9 24 6C28 9 27 13 24 16Z"
          fill="url(#wheatGrad)"
        />
        <path
          d="M24 20C20 18 19 14 23 12"
          stroke="url(#wheatGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 20C28 18 29 14 25 12"
          stroke="url(#wheatGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 26C19 24 18 20 22 18"
          stroke="url(#wheatGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 26C29 24 30 20 26 18"
          stroke="url(#wheatGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Flourishing Green Sprout Leaf (Left) */}
        <path
          d="M23 35C15 35 11 27 13 22C18 22 23 27 23 35Z"
          fill="url(#leafGrad)"
          opacity="0.9"
        />

        {/* Flourishing Green Sprout Leaf (Right) */}
        <path
          d="M25 33C33 33 37 25 35 20C30 20 25 25 25 33Z"
          fill="url(#leafGrad)"
          opacity="0.9"
        />

        {/* Small Golden Seed Sparkle */}
        <circle cx="24" cy="6" r="1.5" fill="#FEF08A" />
      </svg>
    </div>
  );
}

export default function KisanLogo({
  size = 'md',
  showTagline = true,
  theme = 'light',
  subtitleText,
}) {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const markSize = isLg
    ? 'h-11 w-11 sm:h-13 sm:w-13'
    : isSm
    ? 'h-7 w-7 sm:h-8 sm:w-8'
    : 'h-8 w-8 sm:h-9 sm:w-9';

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <KisanLogoMark className={markSize} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight leading-none ${
              isLg
                ? 'text-2xl sm:text-3xl'
                : isSm
                ? 'text-sm sm:text-base'
                : 'text-base sm:text-lg'
            } ${theme === 'dark' ? 'text-white' : 'text-[#1b4332]'}`}
          >
            Kisan<span className="text-[#52b788]">Sathi</span>
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
              theme === 'dark'
                ? 'bg-[#1b4332] text-[#95d5b2] border border-[#2d6a4f]'
                : 'bg-[#e8f5e9] text-[#1b5e20] border border-[#c8e6c9]'
            }`}
          >
            Mandi Pass
          </span>
        </div>
        {showTagline && (
          <p
            className={`mt-0.5 text-[10px] sm:text-[11px] font-medium leading-tight truncate hidden sm:block ${
              theme === 'dark' ? 'text-[#95d5b2]' : 'text-slate-500'
            }`}
          >
            {subtitleText || 'Smart APMC Procurement & Queue System'}
          </p>
        )}
      </div>
    </div>
  );
}
