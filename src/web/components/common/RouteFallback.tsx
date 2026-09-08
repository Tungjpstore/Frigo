import React from 'react';
import { FRIGO_ASSETS } from '../../lib/frigo-assets';

/** Branded Suspense fallback shown while a lazy route chunk loads. */
export const RouteFallback: React.FC = () => (
  <div
    className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center gap-4"
    role="status"
    aria-live="polite"
    aria-label="Đang tải trang"
  >
    <img src={FRIGO_ASSETS.brand.mark} alt="" width={56} height={56} className="w-14 h-14 rounded-2xl" />
    <div className="animate-spin w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full motion-reduce:animate-none" />
    <p className="text-xs text-slate-500 font-medium">Đang tải…</p>
  </div>
);
