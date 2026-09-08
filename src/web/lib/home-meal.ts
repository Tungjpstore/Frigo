import type { MealPlan, MealSlotItem } from '@frigo/domain';
import { todayLocalIso } from './format';

const MEAL_WINDOWS: { slotType: MealSlotItem['slotType']; endHour: number }[] = [
  { slotType: 'breakfast', endHour: 11 },
  { slotType: 'lunch', endHour: 16 },
  { slotType: 'dinner', endHour: 24 },
];

export function findTodayMeal(
  plan: MealPlan | null | undefined,
  now = new Date(),
): MealSlotItem | null {
  const day = plan?.days.find((entry) => entry.date === todayLocalIso(now));
  if (!day) return null;

  // Ignore elapsed windows and completed/skipped slots; prefer the current meal, then the next.
  for (const { slotType, endHour } of MEAL_WINDOWS) {
    if (now.getHours() >= endHour) continue;
    const meal = day.slots.find(
      (slot) =>
        slot.slotType === slotType &&
        slot.recipe &&
        (slot.status === 'PLANNED' || slot.status === 'LEFTOVER'),
    );
    if (meal) return meal;
  }
  return null;
}
