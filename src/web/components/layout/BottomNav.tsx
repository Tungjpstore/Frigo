import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Refrigerator, Camera, CalendarDays, User } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Tủ lạnh', path: '/fridge', icon: Refrigerator },
    { label: 'Quét', path: '/scan', icon: Camera, isCenter: true },
    { label: 'Tuần', path: '/week', icon: CalendarDays },
    { label: 'Tôi', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 safe-bottom max-w-md sm:max-w-lg md:max-w-2xl mx-auto shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-stretch justify-around h-[68px] px-1.5">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath === item.path ||
                (item.path === '/fridge' && (currentPath.startsWith('/fridge') || currentPath.startsWith('/inventory'))) ||
                (item.path === '/week' && currentPath.startsWith('/week')) ||
                (item.path === '/profile' && (currentPath.startsWith('/profile') || currentPath.startsWith('/settings')));
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative -top-4 flex flex-col items-center group focus:outline-none tap-target"
                aria-label="Quét AI"
              >
                {/* Halo ring behind the scan button */}
                <div className="absolute -top-1 w-[68px] h-[68px] rounded-full bg-emerald-500/10 group-active:bg-emerald-500/20 transition-colors" />
                <div className="relative w-[58px] h-[58px] rounded-[20px] bg-gradient-to-tr from-[#0F3D2E] via-[#14532D] to-emerald-600 shadow-float flex items-center justify-center text-white transition-all duration-200 transform group-hover:scale-105 group-active:scale-95 border border-emerald-400/40 ring-2 ring-white">
                  <Icon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="relative text-[11px] font-heading font-bold text-slate-800 mt-1 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center h-full tap-target transition-all duration-150 relative py-1.5 rounded-2xl',
                isActive ? 'text-emerald-800' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div
                className={clsx(
                  'flex flex-col items-center gap-1 px-3.5 py-1 rounded-2xl transition-all duration-200',
                  isActive && 'bg-emerald-50'
                )}
              >
                <Icon
                  className={clsx(
                    'w-[22px] h-[22px] transition-all duration-200',
                    isActive ? 'scale-110 stroke-[2.4] text-emerald-700' : 'stroke-[2] text-slate-400'
                  )}
                />
                <span
                  className={clsx(
                    'text-[11px] tracking-tight leading-none',
                    isActive ? 'font-heading font-bold text-emerald-800' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </div>
              {isActive && (
                <span className="absolute top-0 w-8 h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
