import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeekStore } from '../stores/useWeekStore';
import { FRIGO_ASSETS } from '../lib/frigo-assets';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

const GENERATION_STEPS = [
  'Kiểm tra đồ trong tủ lạnh',
  'Tìm thực phẩm nên dùng sớm',
  'Cân đối khẩu phần cho gia đình',
  'Chọn món ăn phù hợp khẩu vị',
  'Kiểm tra và tối ưu ngân sách',
  'Tính nguyên liệu cần mua thêm',
  'Tối ưu chuyến đi chợ',
];

export const WeekGeneratingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setupDraft, generatePlan } = useWeekStore();
  const [completedStepIndex, setCompletedStepIndex] = useState(0);

  useEffect(() => {
    let timer: any;
    let isCancelled = false;

    async function run() {
      const currentHouseholdId = localStorage.getItem('frigo_household_id') || 'household_user';
      const planPromise = generatePlan({
        householdId: currentHouseholdId,
        startDate: new Date().toISOString().split('T')[0],
        householdSize: setupDraft.householdSize || 3,
        mealSlotsPreset: setupDraft.mealSlotsPreset as any || 'dinner_only',
        budgetTargetVnd: setupDraft.budgetTargetVnd !== undefined ? setupDraft.budgetTargetVnd : 750000,
        priorities: setupDraft.priorities || ['use_fridge'],
        shoppingFrequency: setupDraft.shoppingFrequency || 'once',
      });

      // Quick progression animation through the 7 real steps
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        if (isCancelled) return;
        setCompletedStepIndex(i);
        await new Promise((resolve) => {
          timer = setTimeout(resolve, 350);
        });
      }

      const plan = await planPromise;
      if (!isCancelled) {
        navigate(`/week/${plan.id}`);
      }
    }

    run();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF6] text-slate-900 flex flex-col justify-between p-6 max-w-md mx-auto animate-fade-in">
      {/* Top Brand Mark */}
      <div className="pt-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 overflow-hidden flex items-center justify-center">
          <img
            src={FRIGO_ASSETS.brand.mark}
            alt="Frigo Planner"
            className="w-16 h-16 object-contain animate-bounce-slow"
          />
        </div>

        <h2 className="font-heading font-bold text-2xl text-slate-900">
          Frigo đang lên thực đơn tuần...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Ăn đủ • Mua đủ • Dùng hết
        </p>
      </div>

      {/* Real Progression Steps List */}
      <div className="bg-white rounded-2xl p-6 space-y-3.5 border border-slate-200/80 shadow-card">
        {GENERATION_STEPS.map((stepText, idx) => {
          const isDone = idx < completedStepIndex;
          const isCurrent = idx === completedStepIndex;

          return (
            <div
              key={stepText}
              className={clsx(
                'flex items-center gap-3 text-xs transition-all duration-200',
                isDone
                  ? 'text-slate-900 font-semibold'
                  : isCurrent
                  ? 'text-emerald-700 font-bold scale-[1.01]'
                  : 'text-slate-400'
              )}
            >
              <div
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border transition-colors',
                  isDone
                    ? 'bg-[#22C55E] border-[#22C55E] text-white'
                    : isCurrent
                    ? 'border-emerald-600 text-emerald-600 animate-spin'
                    : 'border-slate-200 text-transparent'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isCurrent ? '•' : ''}
              </div>

              <span className="font-heading">{stepText}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="text-center pb-6 text-xs text-slate-500">
        Quá trình này có thể mất 1-2 phút
      </div>
    </div>
  );
};
