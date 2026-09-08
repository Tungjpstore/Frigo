import { create } from 'zustand';
import { MealPlan, MealPlanSetupInput, MealSwapAlternative } from '@frigo/domain';
import { api } from '../services/api';
import { capturePrivateSession, onPrivateSessionReset } from '../lib/private-session';

interface WeekStoreState {
  currentPlan: MealPlan | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  setupDraft: Partial<MealPlanSetupInput>;
  swapSlotId: string | null;
  swapAlternatives: MealSwapAlternative[];
  isLoadingAlternatives: boolean;

  // Actions
  loadCurrentPlan: () => Promise<MealPlan | null>;
  loadPlanById: (id: string) => Promise<MealPlan | null>;
  updateSetupDraft: (updates: Partial<MealPlanSetupInput>) => void;
  resetSetupDraft: () => void;
  generatePlan: (input: MealPlanSetupInput) => Promise<MealPlan>;
  openSwap: (slotId: string) => Promise<void>;
  closeSwap: () => void;
  executeSwap: (recipeId: string) => Promise<void>;
  markMealCooked: (mealId: string) => Promise<void>;
  toggleShoppingItem: (itemId: string, checked: boolean) => Promise<void>;
  completeShopping: () => Promise<{ success: boolean; count: number }>;
}

export const useWeekStore = create<WeekStoreState>((set, get) => ({
  currentPlan: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  setupDraft: {
    householdSize: 3,
    mealSlotsPreset: 'dinner_only',
    budgetTargetVnd: 750000,
    priorities: ['use_fridge'],
    shoppingFrequency: 'once',
  },
  swapSlotId: null,
  swapAlternatives: [],
  isLoadingAlternatives: false,

  loadCurrentPlan: async () => {
    const isCurrent = capturePrivateSession();
    set({ isLoading: true, error: null });
    try {
      const plan = await api.getCurrentWeekPlan();
      if (!isCurrent()) return null;
      set({ currentPlan: plan, isLoading: false });
      return plan;
    } catch (err: any) {
      if (!isCurrent()) return null;
      set({ error: err?.message || 'Không thể tải thực đơn tuần', isLoading: false });
      return null;
    }
  },

  loadPlanById: async (id: string) => {
    const isCurrent = capturePrivateSession();
    set({ isLoading: true, error: null });
    try {
      const plan = await api.getWeekPlan(id);
      if (!isCurrent()) return null;
      set({ currentPlan: plan, isLoading: false });
      return plan;
    } catch (err: any) {
      if (!isCurrent()) return null;
      set({ error: err?.message || 'Không thể tìm thấy thực đơn', isLoading: false });
      return null;
    }
  },

  updateSetupDraft: (updates) => {
    set((state) => ({
      setupDraft: { ...state.setupDraft, ...updates },
    }));
  },

  resetSetupDraft: () => {
    set({
      setupDraft: {
        householdSize: 3,
        mealSlotsPreset: 'dinner_only',
        budgetTargetVnd: 750000,
        priorities: ['use_fridge'],
        shoppingFrequency: 'once',
      },
    });
  },

  generatePlan: async (input) => {
    const isCurrent = capturePrivateSession();
    set({ isGenerating: true, error: null });
    try {
      const plan = await api.createWeekPlan(input);
      if (!isCurrent()) throw new Error('Session changed');
      set({ currentPlan: plan, isGenerating: false });
      return plan;
    } catch (err: any) {
      if (isCurrent()) set({ error: err?.message || 'Không thể tạo thực đơn tuần', isGenerating: false });
      throw err;
    }
  },

  openSwap: async (slotId: string) => {
    const isCurrent = capturePrivateSession();
    const { currentPlan } = get();
    if (!currentPlan) return;

    set({ swapSlotId: slotId, isLoadingAlternatives: true, swapAlternatives: [] });
    try {
      const res = await api.swapMeal(currentPlan.id, slotId);
      if (!isCurrent()) return;
      set({
        swapAlternatives: res.alternatives || [],
        isLoadingAlternatives: false,
      });
    } catch (err) {
      if (!isCurrent()) return;
      console.error('Failed fetching alternatives:', err);
      set({ isLoadingAlternatives: false });
    }
  },

  closeSwap: () => {
    set({ swapSlotId: null, swapAlternatives: [], isLoadingAlternatives: false });
  },

  executeSwap: async (recipeId: string) => {
    const isCurrent = capturePrivateSession();
    const { currentPlan, swapSlotId } = get();
    if (!currentPlan || !swapSlotId) return;

    set({ isLoading: true });
    try {
      const res = await api.swapMeal(currentPlan.id, swapSlotId, recipeId);
      if (!isCurrent()) return;
      if (res.plan) {
        set({ currentPlan: res.plan, swapSlotId: null, swapAlternatives: [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      if (!isCurrent()) return;
      set({ error: err?.message || 'Không thể đổi món', isLoading: false });
    }
  },

  markMealCooked: async (mealId: string) => {
    const isCurrent = capturePrivateSession();
    const { currentPlan } = get();
    if (!currentPlan) return;

    try {
      const updated = await api.updateMealSlot(currentPlan.id, mealId, {
        status: 'COOKED',
      });
      if (isCurrent() && updated) {
        set({ currentPlan: updated });
      }
    } catch (err) {
      console.error('Failed marking meal as cooked:', err);
    }
  },

  toggleShoppingItem: async (itemId: string, checked: boolean) => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    // Optimistic UI update
    const updatedItems = currentPlan.shoppingItems.map((item) =>
      item.ingredientId === itemId ? { ...item, checked } : item
    );
    set({ currentPlan: { ...currentPlan, shoppingItems: updatedItems } });

    await api.toggleWeekShoppingItem(currentPlan.id, itemId, checked);
  },

  completeShopping: async () => {
    const { currentPlan } = get();
    if (!currentPlan) return { success: false, count: 0 };

    const checkedItems = currentPlan.shoppingItems.filter((i) => i.checked);
    const res = await api.completeWeekShopping(currentPlan.id, checkedItems);

    return {
      success: !!res.success,
      count: res.importedItemsCount || checkedItems.length,
    };
  },
}));

onPrivateSessionReset(() => useWeekStore.setState(useWeekStore.getInitialState()));
