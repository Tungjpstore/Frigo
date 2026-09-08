// Query-key factory. Every server-state key embeds the owning user+household
// so cached data can never leak across account or household switches.
import { getCurrentScope } from '../services/http';

function scope(): [string, string] {
  const { userId, householdId } = getCurrentScope();
  return [userId, householdId];
}

export const queryKeys = {
  me: () => ['me', ...scope()] as const,
  inventory: () => ['inventory', ...scope()] as const,
  recommendationLists: () => ['recommendations', ...scope()] as const,
  recommendations: (params: {
    noBuy: boolean;
    cuisine: string | null;
    category?: string | null;
    region?: string | null;
    maxTime?: number;
  }) => ['recommendations', ...scope(), params] as const,
  recipes: () => ['recipe', ...scope()] as const,
  recipe: (idOrSlug: string) => ['recipe', ...scope(), idOrSlug] as const,
  weekPlans: () => ['weekPlan', ...scope()] as const,
  currentWeekPlan: () => ['weekPlan', ...scope(), 'current'] as const,
  weekPlan: (planId: string) => ['weekPlan', ...scope(), planId] as const,
  notifications: () => ['notifications', ...scope()] as const,
  shoppingList: () => ['shoppingList', ...scope()] as const,
};
