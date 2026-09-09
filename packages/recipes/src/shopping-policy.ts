import { z } from 'zod';

export const SHOPPING_LIMITS = Object.freeze({
  catalogOptions: 2000,
  requirements: 2000,
  optionsPerRequirement: 32,
  statesPerRequirement: 16384,
  totalStates: 65536,
  packagesPerRequirement: 1024,
});

export const ShoppingPolicySchema = z
  .object({
    objective: z.enum(['cost_first', 'bounded_surplus']).default('cost_first'),
    // A dimensionless per-ingredient premium over its best known price, never grams + money.
    surplusPremiumBps: z.number().int().min(0).max(2500).default(1000),
    maxOptionsPerRequirement: z
      .number()
      .int()
      .positive()
      .max(SHOPPING_LIMITS.optionsPerRequirement)
      .default(12),
    maxStatesPerRequirement: z
      .number()
      .int()
      .positive()
      .max(SHOPPING_LIMITS.statesPerRequirement)
      .default(2048),
    maxTotalStates: z.number().int().positive().max(SHOPPING_LIMITS.totalStates).default(16384),
    maxPackagesPerRequirement: z
      .number()
      .int()
      .positive()
      .max(SHOPPING_LIMITS.packagesPerRequirement)
      .default(128),
    maxPriceAgeDays: z.number().int().min(0).max(366).default(30),
  })
  .strict();

export type ShoppingPolicy = z.infer<typeof ShoppingPolicySchema>;
export const DEFAULT_SHOPPING_POLICY = Object.freeze(ShoppingPolicySchema.parse({}));
