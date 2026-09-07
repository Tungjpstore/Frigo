import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/common/TopBar';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import { ALL_RECIPES } from '@frigo/recipes';
import { getIngredientImage } from '../lib/ingredient-images';
import { Clock, ChefHat, Calendar, Layers, ArrowRight } from 'lucide-react';

export const IngredientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any | null>(null);
  const [matchingRecipes, setMatchingRecipes] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const inv = await api.getInventory();
      const found = inv.find((i: any) => i.id === id);
      setItem(found || null);

      if (found) {
        const matching = ALL_RECIPES.filter((r) =>
          r.ingredients.some(
            (ing) =>
              ing.ingredientId === found.ingredientId ||
              ing.name.toLowerCase() === found.name.toLowerCase()
          )
        );
        setMatchingRecipes(matching);
      }
    }
    load();
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] max-w-md mx-auto">
        <TopBar showBack title="Chi tiết nguyên liệu" />
        <div className="p-6 text-center">
          <p className="text-xs text-slate-500">Không tìm thấy nguyên liệu này trong tủ.</p>
          <Button className="mt-4" onClick={() => navigate('/fridge')}>
            Về tủ lạnh
          </Button>
        </div>
      </div>
    );
  }

  const imgSrc = getIngredientImage(item.ingredientId, item.name);

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-12 max-w-md mx-auto">
      <TopBar showBack title={item.name} subtitle="Thông tin nguyên liệu" />

      <div className="px-4 pt-4 space-y-4">
        {/* Ingredient Header Card */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 overflow-hidden shrink-0">
            <img
              src={imgSrc}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-bold text-xl text-slate-900 leading-tight">
                {item.name}
              </h3>
              <StatusChip status={item.freshness} />
            </div>

            <p className="text-sm font-semibold text-emerald-700">
              {item.quantity} {item.unit}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-semibold">Vị trí</span>
            </div>
            <p className="font-heading font-semibold text-sm text-slate-900">
              {item.storage === 'freezer' ? 'Ngăn đông đá' : item.storage === 'pantry' ? 'Tủ đồ khô' : 'Ngăn mát tủ lạnh'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-semibold">Hạn sử dụng</span>
            </div>
            <p className="font-heading font-semibold text-sm text-slate-900">
              {item.expiryDate || 'Chưa đặt hạn'}
            </p>
          </div>
        </div>

        {/* Recipes using this ingredient */}
        <div className="pt-2">
          <h4 className="font-heading font-bold text-base text-slate-900 flex items-center gap-1.5 mb-3">
            <ChefHat className="w-4 h-4 text-emerald-600" />
            <span>Món ngon có thể nấu ({matchingRecipes.length})</span>
          </h4>

          <div className="space-y-2.5">
            {matchingRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipes/${recipe.slug}`)}
                className="bg-white rounded-xl p-3 flex items-center gap-3.5 border border-slate-200/80 shadow-xs cursor-pointer hover:border-emerald-500/40 active:scale-[0.99] transition-all"
              >
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 uppercase">
                    {recipe.cuisine}
                  </span>
                  <h5 className="font-heading font-semibold text-sm text-slate-900 truncate mt-1">
                    {recipe.title}
                  </h5>
                  <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{recipe.cookTimeMinutes} phút</span>
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
