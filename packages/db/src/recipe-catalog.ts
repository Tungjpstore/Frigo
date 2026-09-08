import {
  CatalogTextSchema,
  LanguageTagSchema,
  normalizeIngredientAlias,
} from '../../domain/src/foundation';
import {
  createRecipeCatalog,
  sortCatalogDiagnostics,
  type CatalogDiagnostic,
  type RecipeCatalogSnapshot,
} from '../../recipes/src/catalog';
import type { D1DatabaseBinding, D1Result } from './index';

interface IngredientRow {
  id: unknown;
}

interface RecipeRow {
  id: unknown;
  slug: unknown;
  title: unknown;
  description: unknown;
  cuisine: unknown;
  servings: unknown;
  prep_time_minutes: unknown;
  cook_time_minutes: unknown;
  difficulty: unknown;
  family_id: unknown;
  source_type: unknown;
  source_reference: unknown;
  verification_state: unknown;
  version: unknown;
}

interface RecipeLineRow {
  id: unknown;
  recipe_id: unknown;
  ingredient_id: unknown;
  name: unknown;
  required_quantity: unknown;
  unit: unknown;
  is_optional: unknown;
}

interface FamilyRow {
  id: unknown;
  slug: unknown;
  name: unknown;
  base_servings: unknown;
  source_type: unknown;
  source_reference: unknown;
  verification_state: unknown;
  version: unknown;
}

interface FamilySlotRow {
  family_id: unknown;
  slot_key: unknown;
  min_selections: unknown;
  max_selections: unknown;
}

interface FamilyOptionRow {
  family_id: unknown;
  slot_key: unknown;
  ingredient_id: unknown;
  quantity: unknown;
  unit: unknown;
}

interface AliasRow {
  id: unknown;
  ingredient_id: unknown;
  alias: unknown;
  language: unknown;
  normalized_alias: unknown;
}

interface RecipeClassificationRow {
  recipe_id: unknown;
  kind: unknown;
  tag: unknown;
}

function rowsFromBatch(result: D1Result<unknown>, label: string): Record<string, unknown>[] {
  if (!result.success) throw new Error(`Recipe catalog ${label} read failed`);
  return result.results.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Recipe catalog ${label} row is invalid`);
    }
    return row as Record<string, unknown>;
  });
}

function textOrUndefined(value: unknown): unknown {
  return value === null ? undefined : value;
}

function d1Boolean(value: unknown): unknown {
  if (value === 0 || value === false) return false;
  if (value === 1 || value === true) return true;
  return value;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function invalidRow(diagnostics: CatalogDiagnostic[], message: string, id?: unknown): void {
  diagnostics.push({
    code: 'invalid_d1_row',
    entity: 'catalog',
    id: isString(id) ? id : undefined,
    message,
  });
}

function mapRecipe(row: RecipeRow, lines: readonly RecipeLineRow[]): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: textOrUndefined(row.description),
    cuisine: row.cuisine,
    servings: row.servings,
    prepTimeMinutes: textOrUndefined(row.prep_time_minutes),
    cookTimeMinutes: row.cook_time_minutes,
    difficulty: row.difficulty,
    familyId: textOrUndefined(row.family_id),
    provenance: {
      sourceType: row.source_type,
      sourceReference: textOrUndefined(row.source_reference),
      verificationState: row.verification_state,
      version: row.version,
    },
    ingredients: lines.map((line) => ({
      ingredientId: line.ingredient_id,
      name: line.name,
      requiredQuantity: line.required_quantity,
      unit: line.unit,
      isOptional: d1Boolean(line.is_optional),
    })),
  };
}

function mapFamily(
  row: FamilyRow,
  slots: readonly FamilySlotRow[],
  options: readonly FamilyOptionRow[],
): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    baseServings: row.base_servings,
    provenance: {
      sourceType: row.source_type,
      sourceReference: textOrUndefined(row.source_reference),
      verificationState: row.verification_state,
      version: row.version,
    },
    slots: slots.map((slot) => ({
      key: slot.slot_key,
      minSelections: slot.min_selections,
      maxSelections: slot.max_selections,
      options: options
        .filter((option) => option.slot_key === slot.slot_key)
        .map((option) => ({
          ingredientId: option.ingredient_id,
          quantity: option.quantity,
          unit: option.unit,
        })),
    })),
  };
}

function auditLegacyAliases(rows: readonly AliasRow[]): CatalogDiagnostic[] {
  const diagnostics: CatalogDiagnostic[] = [];
  const candidates: Array<{
    id: string;
    ingredientId: string;
    language: string;
    normalizedAlias: string;
  }> = [];

  for (const row of rows) {
    const alias = CatalogTextSchema.safeParse(row.alias);
    const language = LanguageTagSchema.safeParse(row.language);
    if (!alias.success || !language.success || !isString(row.ingredient_id)) {
      diagnostics.push({
        code: 'invalid_legacy_alias',
        entity: 'alias',
        id: isString(row.id) ? row.id : undefined,
        message: 'Legacy alias cannot be normalized for review',
      });
      continue;
    }
    const normalizedAlias = normalizeIngredientAlias(alias.data);
    const rawNormalized = row.normalized_alias;
    if (rawNormalized === null) {
      diagnostics.push({
        code: 'legacy_alias_promotion_proposed',
        entity: 'alias',
        id: isString(row.id) ? row.id : undefined,
        message: 'Legacy alias normalization is proposed for explicit review only',
        details: { ingredientId: row.ingredient_id, language: language.data, normalizedAlias },
      });
    } else if (rawNormalized !== normalizedAlias || row.language !== language.data) {
      diagnostics.push({
        code: 'legacy_alias_normalization_drift',
        entity: 'alias',
        id: isString(row.id) ? row.id : undefined,
        message: 'Stored alias key differs from the validated normalization contract',
        details: { ingredientId: row.ingredient_id, language: language.data, normalizedAlias },
      });
    }
    candidates.push({
      id: isString(row.id) ? row.id : '',
      ingredientId: row.ingredient_id,
      language: language.data,
      normalizedAlias,
    });
  }

  const byLocaleKey = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const key = JSON.stringify([candidate.language, candidate.normalizedAlias]);
    const group = byLocaleKey.get(key) ?? [];
    group.push(candidate);
    byLocaleKey.set(key, group);
  }
  for (const [key, group] of [...byLocaleKey.entries()].sort(([left], [right]) =>
    compareText(left, right),
  )) {
    const ingredientIds = [...new Set(group.map((item) => item.ingredientId))].sort(compareText);
    if (ingredientIds.length > 1) {
      const [language, normalizedAlias] = JSON.parse(key) as [string, string];
      diagnostics.push({
        code: 'legacy_alias_collision',
        entity: 'alias',
        message: 'Legacy aliases normalize to conflicting canonical ingredients in one locale',
        details: { ingredientIds, language, normalizedAlias },
      });
    }
  }

  const undByAlias = new Map<string, Set<string>>();
  for (const candidate of candidates.filter((item) => item.language === 'und')) {
    const ids = undByAlias.get(candidate.normalizedAlias) ?? new Set<string>();
    ids.add(candidate.ingredientId);
    undByAlias.set(candidate.normalizedAlias, ids);
  }
  for (const candidate of candidates.filter((item) => item.language !== 'und')) {
    const undIds = undByAlias.get(candidate.normalizedAlias);
    if (!undIds) continue;
    const ingredientIds = [...new Set([...undIds, candidate.ingredientId])].sort(compareText);
    if (ingredientIds.length > 1) {
      diagnostics.push({
        code: 'legacy_alias_locale_und_collision',
        entity: 'alias',
        message: 'Locale and und aliases would resolve ambiguously after normalization',
        details: {
          ingredientIds,
          language: candidate.language,
          normalizedAlias: candidate.normalizedAlias,
        },
      });
    }
  }
  return sortCatalogDiagnostics(diagnostics);
}

/**
 * Reads the persisted catalog into validated leaf contracts. It has no write
 * path and never promotes historical alias keys.
 */
export async function readRecipeCatalog(db: D1DatabaseBinding): Promise<RecipeCatalogSnapshot> {
  const results = await db.batch([
    db.prepare('SELECT id FROM ingredients ORDER BY id'),
    db.prepare(
      `SELECT id, slug, title, description, cuisine, servings, prep_time_minutes,
          cook_time_minutes, difficulty, family_id, source_type, source_reference,
          verification_state, version FROM recipes ORDER BY id`,
    ),
    db.prepare(
      `SELECT id, recipe_id, ingredient_id, name, required_quantity, unit, is_optional
          FROM recipe_ingredients ORDER BY recipe_id, id`,
    ),
    db.prepare(
      `SELECT id, slug, name, base_servings, source_type, source_reference,
          verification_state, version FROM recipe_families ORDER BY id`,
    ),
    db.prepare(
      `SELECT family_id, slot_key, min_selections, max_selections
          FROM recipe_family_slots ORDER BY family_id, slot_key`,
    ),
    db.prepare(
      `SELECT family_id, slot_key, ingredient_id, quantity, unit
          FROM recipe_family_options ORDER BY family_id, slot_key, ingredient_id`,
    ),
    db.prepare(
      `SELECT id, ingredient_id, alias, language, normalized_alias
          FROM ingredient_aliases ORDER BY id`,
    ),
    db.prepare(
      `SELECT recipe_id, kind, tag FROM recipe_classifications ORDER BY recipe_id, kind, tag`,
    ),
  ]);
  if (results.length !== 8) throw new Error('Recipe catalog batch returned an unexpected result count');
  const [
    ingredientRows,
    recipeRows,
    lineRows,
    familyRows,
    slotRows,
    optionRows,
    aliasRows,
    classificationRows,
  ] = results.map((result, index) => {
    const labels = [
      'ingredients',
      'recipes',
      'recipe ingredients',
      'families',
      'family slots',
      'family options',
      'aliases',
      'classifications',
    ];
    return rowsFromBatch(result, labels[index]);
  });
  const ingredientRecords: IngredientRow[] = ingredientRows.map((row) => ({ id: row.id }));
  const recipeRecords: RecipeRow[] = recipeRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cuisine: row.cuisine,
    servings: row.servings,
    prep_time_minutes: row.prep_time_minutes,
    cook_time_minutes: row.cook_time_minutes,
    difficulty: row.difficulty,
    family_id: row.family_id,
    source_type: row.source_type,
    source_reference: row.source_reference,
    verification_state: row.verification_state,
    version: row.version,
  }));
  const lineRecords: RecipeLineRow[] = lineRows.map((row) => ({
    id: row.id,
    recipe_id: row.recipe_id,
    ingredient_id: row.ingredient_id,
    name: row.name,
    required_quantity: row.required_quantity,
    unit: row.unit,
    is_optional: row.is_optional,
  }));
  const familyRecords: FamilyRow[] = familyRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    base_servings: row.base_servings,
    source_type: row.source_type,
    source_reference: row.source_reference,
    verification_state: row.verification_state,
    version: row.version,
  }));
  const slotRecords: FamilySlotRow[] = slotRows.map((row) => ({
    family_id: row.family_id,
    slot_key: row.slot_key,
    min_selections: row.min_selections,
    max_selections: row.max_selections,
  }));
  const optionRecords: FamilyOptionRow[] = optionRows.map((row) => ({
    family_id: row.family_id,
    slot_key: row.slot_key,
    ingredient_id: row.ingredient_id,
    quantity: row.quantity,
    unit: row.unit,
  }));
  const aliasRecords: AliasRow[] = aliasRows.map((row) => ({
    id: row.id,
    ingredient_id: row.ingredient_id,
    alias: row.alias,
    language: row.language,
    normalized_alias: row.normalized_alias,
  }));
  const classificationRecords: RecipeClassificationRow[] = classificationRows.map((row) => ({
    recipe_id: row.recipe_id,
    kind: row.kind,
    tag: row.tag,
  }));

  const mappingDiagnostics: CatalogDiagnostic[] = [];
  const linesByRecipe = new Map<string, RecipeLineRow[]>();
  for (const line of lineRecords) {
    if (!isString(line.recipe_id)) {
      invalidRow(mappingDiagnostics, 'Recipe line has an invalid recipe ID', line.id);
      continue;
    }
    const lines = linesByRecipe.get(line.recipe_id) ?? [];
    lines.push(line);
    linesByRecipe.set(line.recipe_id, lines);
  }
  const slotsByFamily = new Map<string, FamilySlotRow[]>();
  for (const slot of slotRecords) {
    if (!isString(slot.family_id)) {
      invalidRow(mappingDiagnostics, 'Family slot has an invalid family ID');
      continue;
    }
    const slots = slotsByFamily.get(slot.family_id) ?? [];
    slots.push(slot);
    slotsByFamily.set(slot.family_id, slots);
  }
  const optionsByFamily = new Map<string, FamilyOptionRow[]>();
  for (const option of optionRecords) {
    if (!isString(option.family_id)) {
      invalidRow(mappingDiagnostics, 'Family option has an invalid family ID');
      continue;
    }
    const options = optionsByFamily.get(option.family_id) ?? [];
    options.push(option);
    optionsByFamily.set(option.family_id, options);
  }

  const catalog = createRecipeCatalog({
    source: 'd1',
    ingredientIds: ingredientRecords.map((row) => row.id),
    recipes: recipeRecords.map((row) =>
      mapRecipe(row, isString(row.id) ? (linesByRecipe.get(row.id) ?? []) : []),
    ),
    families: familyRecords.map((row) =>
      mapFamily(
        row,
        isString(row.id) ? (slotsByFamily.get(row.id) ?? []) : [],
        isString(row.id) ? (optionsByFamily.get(row.id) ?? []) : [],
      ),
    ),
    classifications: classificationRecords.map((row) => ({
      recipeId: row.recipe_id,
      kind: row.kind,
      tag: row.tag,
    })),
    diagnostics: mappingDiagnostics,
  });
  return {
    ...catalog,
    diagnostics: sortCatalogDiagnostics([
      ...catalog.diagnostics,
      ...auditLegacyAliases(aliasRecords),
    ]),
  };
}
