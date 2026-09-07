# Week KV recovery

Use this only when a `meal_plans` row exists but its relational projection and
`snapshot_json` are empty while the matching `plan_<planId>` KV snapshot still
exists. The command refuses missing, cross-household, or partially populated
plans.

Dry-run the exact plan ids first:

```bash
node scripts/week-repair-from-kv.mjs \
  --scope remote \
  --plan-id plan_example_one \
  --plan-id plan_example_two
```

Production apply requires an explicit confirmation flag. It exports D1 before
writing, restores both v1 and v2 projections from the canonical KV snapshot,
then runs strict reconciliation:

```bash
node scripts/week-repair-from-kv.mjs \
  --scope remote \
  --plan-id plan_example_one \
  --plan-id plan_example_two \
  --apply \
  --confirm-production-repair
```

If a run is interrupted, rerun the same command. Fully restored plans are
skipped; partially populated projections fail closed for manual inspection.
