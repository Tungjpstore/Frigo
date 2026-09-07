import { create } from 'zustand';
import { Recipe } from '@frigo/recipes';
import { areUnitsCompatible, convertUnit, StandardUnit } from '@frigo/domain';

export interface DeductionDraft {
  ingredientId: string;
  name: string;
  currentQuantity: number;
  quantityDeducted: number;
  remainingQuantity: number;
  unit: string;
}

interface CookingState {
  activeRecipe: Recipe | null;
  currentStepIndex: number;
  timerSecondsRemaining: number | null;
  isTimerRunning: boolean;
  deductions: DeductionDraft[];
  startCooking: (recipe: Recipe, currentInventory: any[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTimer: (seconds: number) => void;
  tickTimer: () => void;
  toggleTimer: () => void;
  updateDeduction: (ingredientId: string, quantityDeducted: number) => void;
  resetCooking: () => void;
}

export const useCookingStore = create<CookingState>((set, get) => ({
  activeRecipe: null,
  currentStepIndex: 0,
  timerSecondsRemaining: null,
  isTimerRunning: false,
  deductions: [],

  startCooking: (recipe, currentInventory) => {
    // Generate draft deductions
    const deductions: DeductionDraft[] = recipe.ingredients.map(ing => {
      const invItem = currentInventory.find(i => i.ingredientId === ing.ingredientId);
      const inventoryUnit = invItem?.unit as StandardUnit | undefined;
      const recipeUnit = ing.unit as StandardUnit;
      const currentQty =
        invItem && inventoryUnit && areUnitsCompatible(inventoryUnit, recipeUnit)
          ? convertUnit(Number(invItem.quantity) || 0, inventoryUnit, recipeUnit)
          : 0;
      const deductQty = Math.min(currentQty, ing.requiredQuantity);
      return {
        ingredientId: ing.ingredientId,
        name: ing.name,
        currentQuantity: currentQty,
        quantityDeducted: deductQty,
        remainingQuantity: Math.max(0, currentQty - deductQty),
        unit: ing.unit,
      };
    });

    set({
      activeRecipe: recipe,
      currentStepIndex: 0,
      timerSecondsRemaining: null,
      isTimerRunning: false,
      deductions,
    });
  },

  nextStep: () => {
    const { activeRecipe, currentStepIndex } = get();
    if (activeRecipe && currentStepIndex < activeRecipe.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1, timerSecondsRemaining: null, isTimerRunning: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1, timerSecondsRemaining: null, isTimerRunning: false });
    }
  },

  setTimer: (seconds) => set({ timerSecondsRemaining: seconds, isTimerRunning: true }),
  
  tickTimer: () => {
    const { timerSecondsRemaining } = get();
    if (timerSecondsRemaining && timerSecondsRemaining > 0) {
      set({ timerSecondsRemaining: timerSecondsRemaining - 1 });
    } else if (timerSecondsRemaining === 0) {
      set({ isTimerRunning: false });
    }
  },

  toggleTimer: () => set(state => ({ isTimerRunning: !state.isTimerRunning })),

  updateDeduction: (ingredientId, quantityDeducted) => {
    set(state => ({
      deductions: state.deductions.map(d => {
        if (d.ingredientId === ingredientId) {
          const remaining = Math.max(0, d.currentQuantity - quantityDeducted);
          return { ...d, quantityDeducted, remainingQuantity: remaining };
        }
        return d;
      })
    }));
  },

  resetCooking: () => set({
    activeRecipe: null,
    currentStepIndex: 0,
    timerSecondsRemaining: null,
    isTimerRunning: false,
    deductions: [],
  })
}));
