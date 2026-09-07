import React from 'react';
import { clsx } from 'clsx';
import { FreshnessStatus } from '@frigo/domain';

interface StatusChipProps {
  status: FreshnessStatus | 'low' | 'frozen';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const configs: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    fresh: { label: 'Tươi ngon', bg: 'bg-emerald-50 border border-emerald-200/80', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    use_soon: { label: 'Dùng sớm', bg: 'bg-amber-50 border border-amber-200/80', text: 'text-amber-900', dot: 'bg-amber-500' },
    expiring: { label: 'Sắp hết hạn', bg: 'bg-rose-50 border border-rose-200/80', text: 'text-rose-800', dot: 'bg-rose-500' },
    out_of_stock: { label: 'Đã hết', bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
    low: { label: 'Sắp hết', bg: 'bg-orange-50 border border-orange-200/80', text: 'text-orange-900', dot: 'bg-orange-500' },
    frozen: { label: 'Ngăn đông', bg: 'bg-sky-50 border border-sky-200/80', text: 'text-sky-900', dot: 'bg-sky-500' },
  };

  const config = configs[status] || configs.fresh;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      <span>{config.label}</span>
    </span>
  );
};
