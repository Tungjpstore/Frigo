-- Prevent a meal plan from moving between households. The Worker intentionally
-- includes household_id in its upsert so a conflicting concurrent claim aborts
-- the entire D1 batch, including any child cleanup performed earlier.
CREATE TRIGGER IF NOT EXISTS trg_meal_plans_household_immutable
BEFORE UPDATE OF household_id ON meal_plans
FOR EACH ROW
WHEN OLD.household_id <> NEW.household_id
BEGIN
  SELECT RAISE(ABORT, 'meal_plan_household_immutable');
END;
