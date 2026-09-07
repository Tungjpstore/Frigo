import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { RecipeCard } from '../components/common/RecipeCard';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import { FRIGO_ASSETS } from '../lib/frigo-assets';
import { RecipeMatchResult } from '@frigo/recipes';
import { MealPlan } from '@frigo/domain';
import {
  Bell,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Flame,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { displayName, avatarUrl } = useAuthStore();

  const [inventory, setInventory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeMatchResult[]>([]);
  const [weekPlan, setWeekPlan] = useState<MealPlan | null>(null);
  const [noBuyOnly, setNoBuyOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const inv = await api.getInventory();
        setInventory(inv);

        const recs = await api.getRecommendations({
          noBuy: noBuyOnly,
          cuisine: selectedCuisine || undefined,
        });
        setRecommendations(recs);

        const plan = await api.getCurrentWeekPlan();
        setWeekPlan(plan);
      } catch (err) {
        console.error('Failed loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [noBuyOnly, selectedCuisine]);

  const cuisinesList = [
    { id: null, label: 'Tất cả' },
    { id: 'vietnamese', label: '🇻🇳 Món Việt' },
    { id: 'korean', label: '🇰🇷 Món Hàn' },
    { id: 'japanese', label: '🇯🇵 Món Nhật' },
    { id: 'chinese', label: '🇨🇳 Trung Hoa' },
    { id: 'thai', label: '🇹🇭 Món Thái' },
    { id: 'italian', label: '🇮🇹 Món Ý' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-28 max-w-md sm:max-w-lg md:max-w-2xl mx-auto select-none">
      {/* 2.1 HEADER: Avatar + Xin chào + Notification Bell */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/profile')}
            className="w-11 h-11 rounded-full border-2 border-[#22C55E] ring-2 ring-emerald-100 overflow-hidden cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img
                src={FRIGO_ASSETS.brand.mark}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-slate-900 leading-tight">
              Xin chào, {displayName ? displayName.split(' ').pop() : 'Minh'}! 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium">Hôm nay ăn gì đây?</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 active:scale-95 flex items-center justify-center relative text-slate-700 transition-all tap-target"
          aria-label="Thông báo"
        >
          <Bell className="w-5.5 h-5.5 stroke-[2]" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-5 animate-fade-in">
        {/* HERO: HÔM NAY — gradient card, điểm nhấn chính của màn hình */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F3D2E] via-[#14532D] to-emerald-700 shadow-elevated">
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="absolute -bottom-14 -left-8 w-36 h-36 rounded-full bg-lime-300/10 blur-2xl" />

          <div className="relative p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase tracking-widest text-emerald-200/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <Flame className="w-3 h-3 text-amber-300" />
                Bữa tối hôm nay
              </span>
              <h3 className="font-heading font-extrabold text-xl text-white leading-snug">
                Thịt kho trứng
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-medium text-emerald-100/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 45 phút
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> 3 người
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-amber-300">20:00</span>
                </span>
              </div>
              <button
                onClick={() => navigate('/cook/thit-kho-trung')}
                className="mt-1 px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#1ea750] text-white font-heading font-bold text-sm shadow-float active:scale-95 transition-all flex items-center gap-2 tap-target"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu nấu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-[#22C55E]/40 blur-xl scale-110" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-[3px] border-white/30 ring-4 ring-white/10 shadow-lg">
                <img
                  src="/frigo/recipes/vietnam/thit-kho-trung.webp"
                  alt="Thịt kho trứng"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: TUẦN NÀY — progress bar trực quan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 block">
              TUẦN NÀY
            </span>
            <h3 className="font-heading font-bold text-base text-slate-900">
              5/7 bữa đã lên thực đơn
            </h3>
            {/* Progress bar */}
            <div className="w-full max-w-[180px] h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-emerald-500 to-[#22C55E]" />
            </div>
            <p className="text-xs text-slate-500 font-medium">560k / 800k ngân sách</p>
          </div>

          <button
            onClick={() => navigate(weekPlan ? `/week/${weekPlan.id}` : '/week/setup')}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-50 text-[#0F3D2E] border border-emerald-200/80 hover:bg-emerald-100 text-xs font-heading font-bold active:scale-95 transition-all flex items-center gap-1.5 tap-target"
          >
            <span>Xem thực đơn</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* SECTION 3: NÊN DÙNG SỚM (Screen 2.1) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-slate-800 uppercase tracking-wider">
              NÊN DÙNG SỚM
            </h4>
            <button
              onClick={() => navigate('/fridge')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
            >
              Xem tất cả ({inventory.length}) <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              {
                id: 'tomato',
                name: 'Cà chua',
                days: '2 ngày',
                img: '/frigo/ingredients/vegetables/tomato.png',
              },
              {
                id: 'chicken',
                name: 'Thịt gà',
                days: '3 ngày',
                img: '/frigo/ingredients/pantry/chicken-breast.png',
              },
              {
                id: 'lettuce',
                name: 'Rau xà lách',
                days: '3 ngày',
                img: '/frigo/ingredients/vegetables/lettuce.png',
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/fridge')}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-card flex flex-col items-center justify-center min-w-[104px] shrink-0 cursor-pointer active:scale-95 transition-transform hover:border-amber-300 hover:shadow-elevated"
              >
                <div className="w-14 h-14 overflow-hidden flex items-center justify-center mb-1.5">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="font-heading font-bold text-xs text-slate-900 leading-tight">
                  {item.name}
                </p>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mt-1.5">
                  ⏳ {item.days}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: GỢI Ý MÓN NGON */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-sm text-slate-900">
              Gợi ý cho bạn
            </h4>

            {/* Core toggle: Không muốn mua thêm gì */}
            <button
              onClick={() => setNoBuyOnly(!noBuyOnly)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer',
                noBuyOnly
                  ? 'bg-[#0F3D2E] text-white border border-[#0F3D2E]'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
              )}
            >
              <CheckCircle className={clsx('w-3.5 h-3.5', noBuyOnly ? 'text-emerald-400' : 'text-emerald-600')} />
              <span>Không mua thêm gì</span>
            </button>
          </div>

          {/* Cuisine Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {cuisinesList.map((c) => {
              const active = selectedCuisine === c.id;
              return (
                <button
                  key={c.label}
                  onClick={() => setSelectedCuisine(c.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-all tap-target cursor-pointer',
                    active
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Recipe List */}
          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Đang tìm món tối ưu...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                type="no-recipes"
                title="Chưa tìm thấy món phù hợp"
                description="Hãy thử tắt bộ lọc 'Không mua thêm gì' hoặc quét thêm nguyên liệu vào tủ lạnh nhé."
                actionText="Xem tất cả công thức"
                onAction={() => {
                  setNoBuyOnly(false);
                  setSelectedCuisine(null);
                }}
              />
            ) : (
              recommendations.slice(0, 5).map((match) => (
                <RecipeCard
                  key={match.recipe.id}
                  matchResult={match}
                  onClick={() => navigate(`/recipes/${match.recipe.slug}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
