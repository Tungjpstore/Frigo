// Recipes, recommendations and cooking-completion domain service.
// Online: the server is authoritative (it evaluates against real inventory).
// Offline: the bundled recipe bank provides an explicit local projection.
import { ALL_RECIPES, rankRecipes, evaluateRecipeMatch } from '@frigo/recipes';
import { tryConvertUnit } from '@frigo/domain';
import {
  fetchJson,
  isOffline,
  queueWrite,
  getHouseholdId,
  createClientItemId,
  writeCachedInventory,
} from './http';
import { inventoryApi } from './inventory';

export const recipesApi = {
  getRecommendations: async (params?: {
    noBuy?: boolean;
    cuisine?: string;
    category?: string;
    region?: string;
    maxTime?: number;
  }) => {
    try {
      const query = new URLSearchParams();
      if (params?.noBuy) query.set('noBuy', 'true');
      if (params?.cuisine) query.set('cuisine', params.cuisine);
      if (params?.category) query.set('category', params.category);
      if (params?.region) query.set('region', params.region);
      if (params?.maxTime) query.set('maxTime', String(params.maxTime));

      const res = await fetchJson<{ recommendations: any[] }>(`/recommendations?${query.toString()}`);
      return res.recommendations;
    } catch (err) {
      if (!isOffline(err)) throw err;
      // Offline projection: deterministic local ranking over the bundled bank.
      const inventory = await inventoryApi.getInventory();
      let target = ALL_RECIPES;
      if (params?.category) {
        target = target.filter((r) => r.category === params.category);
      }
      if (params?.region) {
        target = target.filter((r) => r.region === params.region || r.region === 'toan_quoc');
      }
      return rankRecipes(target, {
        inventory,
        onlyNoBuyNeeded: params?.noBuy,
        maxCookTimeMinutes: params?.maxTime,
        preferredCuisines: params?.cuisine ? (params.cuisine.split(',') as any) : undefined,
      });
    }
  },

  getRecipeById: async (id: string) => {
    try {
      // Server-first: match evaluation uses the authoritative inventory.
      return await fetchJson<{ recipe: any; match: any }>(`/recipes/${encodeURIComponent(id)}`);
    } catch (err) {
      if (!isOffline(err)) throw err;
      // Offline projection from the bundled bank + cached inventory.
      const recipe = ALL_RECIPES.find((r) => r.id === id || r.slug === id);
      if (!recipe) throw err; // offline AND unknown locally — surface the offline error
      const inventory = await inventoryApi.getInventory();
      const match = evaluateRecipeMatch(recipe, { inventory });
      return { recipe, match };
    }
  },

  completeCooking: async (
    recipeId: string,
    deductions: any[],
    commandId = createClientItemId('cook')
  ) => {
    const hhId = getHouseholdId();
    const path = `/recipes/${recipeId}/cook/complete`;
    const init = {
      method: 'POST',
      body: JSON.stringify({ deductions, commandId }),
      headers: { 'Idempotency-Key': commandId },
    };
    try {
      const res = await fetchJson<any>(path, init);
      if (res && res.inventory) {
        writeCachedInventory(res.inventory, hhId);
      }
      return res;
    } catch (err) {
      if (!isOffline(err)) throw err;
      queueWrite(
        path,
        'POST',
        init.body,
        'Hoàn tất bữa nấu',
        `cooking:${commandId}`,
        init.headers
      );
      const inventory = await inventoryApi.getInventory();
      const updated = inventory
        .map((item: any) => {
          const matches = deductions.filter((dec: any) => {
            const itemKey = String(item.ingredientId || item.name || '').toUpperCase();
            const deductionKey = String(dec.ingredientId || dec.name || '').toUpperCase();
            return deductionKey === itemKey;
          });
          const convertedDeductions = matches.map((dec: any) =>
            tryConvertUnit(Number(dec.quantityDeducted || 0), dec.unit, item.unit)
          );
          const deduction =
            convertedDeductions.length > 0 && convertedDeductions.every((value) => value !== null)
              ? convertedDeductions.reduce((sum, value) => sum + (value || 0), 0)
              : null;
          if (deduction !== null) {
            const remaining = Math.max(0, Number(item.quantity || 0) - deduction);
            return { ...item, quantity: remaining, pendingSync: true };
          }
          return item;
        })
        .filter((i: any) => i.quantity > 0);
      writeCachedInventory(updated, hhId);
      return { success: true, inventory: updated, pendingSync: true };
    }
  },
};
