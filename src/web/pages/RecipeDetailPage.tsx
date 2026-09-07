import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/common/TopBar';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import { useCookingStore } from '../stores/useCookingStore';
import { getIngredientImage } from '../lib/ingredient-images';
import { Clock, Users, ChefHat, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export const RecipeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const startCooking = useCookingStore((s) => s.startCooking);

  const [recipe, setRecipe] = useState<any | null>(null);
  const [matchInfo, setMatchInfo] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToShop, setAddedToShop] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'steps' | 'ingredients' | 'nutrition'>('steps');

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const inv = await api.getInventory();
        setInventory(inv);

        const data = await api.getRecipeById(slug);
        setRecipe(data.recipe);
        setMatchInfo(data.match);
      } catch (err) {
        console.error('Failed to load recipe:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleStartCook = () => {
    if (!recipe) return;
    startCooking(recipe, inventory);
    navigate(`/cook/${recipe.slug}`);
  };

  const handleAddToShoppingList = async (ing: any) => {
    await api.addShoppingItem({
      name: ing.name,
      quantity: ing.requiredQuantity,
      unit: ing.unit,
      sourceRecipeTitle: recipe.title,
    });
    setAddedToShop([...addedToShop, ing.ingredientId]);
  };

  if (loading || !recipe) {
    return (
      <div className="min-h-screen bg-[#F8FAF9]">
        <TopBar showBack title="Chi tiết món ăn" />
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-32 select-none max-w-md mx-auto">
      <TopBar showBack title={recipe.title} />

      {/* Cover Image */}
      <div className="relative w-full h-56 overflow-hidden bg-slate-100">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
              {recipe.cuisine === 'vietnamese' ? 'Món Việt' : recipe.cuisine}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white">
              Khớp {matchInfo?.matchPercentage || 100}% tủ lạnh
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl leading-snug text-white drop-shadow-sm">
            {recipe.title}
          </h2>
          <div className="flex items-center gap-4 text-xs mt-1 text-slate-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{recipe.cookTimeMinutes} phút</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{recipe.servings} người</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 animate-fade-in">
        {/* 3 Tabs: Cách nấu | Nguyên liệu | Dinh dưỡng (Screen 8.2) */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          {[
            { id: 'steps' as const, label: 'Cách nấu' },
            { id: 'ingredients' as const, label: 'Nguyên liệu' },
            { id: 'nutrition' as const, label: 'Dinh dưỡng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 py-2 rounded-lg text-xs font-heading font-bold transition-all tap-target',
                activeTab === tab.id
                  ? 'bg-white text-[#0F3D2E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Cách nấu (Screen 8.2) */}
        {activeTab === 'steps' && (
          <div className="space-y-3 pt-1">
            {recipe.steps.map((s: any, idx: number) => (
              <div
                key={s.stepNumber || idx}
                className="bg-white rounded-2xl p-4 flex gap-3.5 border border-slate-200/80 shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white font-heading font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {s.stepNumber || idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-1">
                    {s.title || (idx === 0 ? 'Sơ chế nguyên liệu' : idx === 1 ? 'Ướp gia vị' : 'Chế biến')}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {s.instruction}
                  </p>
                  {s.timerMinutes && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mt-2 border border-emerald-200/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hẹn giờ: {s.timerMinutes} phút</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Nguyên liệu */}
        {activeTab === 'ingredients' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Nguyên liệu ({recipe.ingredients.length} món)
              </h3>
              <span className="text-xs font-bold text-emerald-700">
                Đã có {matchInfo?.availableIngredientCount || 0} món
              </span>
            </div>

            <div className="space-y-2">
              {recipe.ingredients.map((ing: any) => {
                const invItem = inventory.find((i: any) => i.ingredientId === ing.ingredientId);
                const hasIngredient = Boolean(invItem && invItem.quantity > 0);
                const isAdded = addedToShop.includes(ing.ingredientId);

                return (
                  <div
                    key={ing.ingredientId}
                    className={clsx(
                      'p-2.5 rounded-xl border flex items-center justify-between transition-all',
                      hasIngredient
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : 'bg-white border-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img
                          src={getIngredientImage(ing.ingredientId, ing.name)}
                          alt={ing.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-heading font-bold text-xs text-slate-900">
                            {ing.name}
                          </p>
                          {hasIngredient && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cần: {ing.requiredQuantity} {ing.unit}
                          {invItem && ` • Trong tủ: ${invItem.quantity} ${invItem.unit}`}
                        </p>
                      </div>
                    </div>

                    {!hasIngredient && (
                      <button
                        onClick={() => handleAddToShoppingList(ing)}
                        disabled={isAdded}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all tap-target',
                          isAdded
                            ? 'bg-slate-100 text-slate-400 border border-slate-200'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100 active:scale-95 shadow-xs'
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isAdded ? 'Đã thêm' : '+ Mua'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Dinh dưỡng */}
        {activeTab === 'nutrition' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Dinh dưỡng mỗi khẩu phần
            </h3>
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Calories</p>
                <p className="font-heading font-bold text-base text-slate-900 mt-1">
                  {recipe.nutrition?.calories || 324}
                </p>
                <p className="text-[10px] text-slate-400">kcal</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Đạm</p>
                <p className="font-heading font-bold text-base text-slate-900 mt-1">
                  {recipe.nutrition?.proteinG || 28}
                </p>
                <p className="text-[10px] text-slate-400">g</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Béo</p>
                <p className="font-heading font-bold text-base text-slate-900 mt-1">
                  {recipe.nutrition?.fatG || 14}
                </p>
                <p className="text-[10px] text-slate-400">g</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Carb</p>
                <p className="font-heading font-bold text-base text-slate-900 mt-1">
                  {recipe.nutrition?.carbG || 18}
                </p>
                <p className="text-[10px] text-slate-400">g</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Start Cooking Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] bg-white/95 backdrop-blur-md border-t border-slate-200/80 max-w-md mx-auto z-40 shadow-lg">
        <Button
          fullWidth
          size="lg"
          onClick={handleStartCook}
          className="bg-[#22C55E] hover:bg-[#1ea750] text-white font-heading font-bold text-base py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
        >
          <ChefHat className="w-5 h-5" />
          <span>Bắt đầu nấu ({recipe.cookTimeMinutes} phút)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
