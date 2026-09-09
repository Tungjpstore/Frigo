import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlanDto } from '../../../../packages/domain/src/meal-planning-api';
import { mealPlanningApi } from '../../services/meal-planning';
import { ApiError } from '../../services/http';
import { capturePrivateSession } from '../../lib/private-session';
import { queryKeys } from '../../lib/queryKeys';

export function usePlanner(planId?: string, enabled = true) {
  const client = useQueryClient();
  const queryKey = planId ? queryKeys.mealPlanningPlan(planId) : queryKeys.currentMealPlanningPlan();
  const query = useQuery({ queryKey, queryFn: async () => planId
    ? mealPlanningApi.get(planId) : (await mealPlanningApi.current()).plan,
  enabled, retry: false, staleTime: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshed, setRefreshed] = useState(false);
  const gate = useRef(false);
  const mounted = useRef(true);
  const keys = useRef(new Map<string, string>());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function requestKey(intent: unknown) {
    const fingerprint = JSON.stringify(intent);
    if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
    return keys.current.get(fingerprint)!;
  }

  function replacePlan(plan: MealPlanDto) {
    void client.cancelQueries({ queryKey: queryKeys.mealPlanningPlan(plan.id) });
    void client.cancelQueries({ queryKey: queryKeys.currentMealPlanningPlan() });
    client.setQueryData(queryKeys.mealPlanningPlan(plan.id), plan);
    client.setQueryData(queryKeys.currentMealPlanningPlan(), plan);
    client.removeQueries({ queryKey: queryKeys.mealPlanningShopping(plan.id) });
    client.removeQueries({ queryKey: queryKeys.mealPlanningAlternativesForPlan(plan.id) });
  }

  async function perform<T>(label: string, operation: () => Promise<T>, accept?: (data: T) => void): Promise<T | undefined> {
    if (gate.current) return;
    gate.current = true;
    const current = capturePrivateSession();
    setBusy(label); setError(null); setRefreshed(false);
    try {
      const result = await operation();
      if (!current() || !mounted.current) return;
      accept?.(result);
      return result;
    } catch (failure) {
      if (!current() || !mounted.current) return;
      setError(failure);
      if (failure instanceof ApiError && failure.status === 409 && planId) {
        client.removeQueries({ queryKey: queryKeys.mealPlanningShopping(planId) });
        const latest = await query.refetch();
        if (current() && mounted.current && latest.data) setRefreshed(true);
      }
    } finally {
      gate.current = false;
      if (current() && mounted.current) setBusy(null);
    }
  }

  return { query, plan: query.data, busy, error, refreshed, perform, replacePlan, requestKey };
}
