import {
  CatalogIdSchema,
  CatalogTextSchema,
  IngredientAliasSchema,
  IngredientDefinitionSchema,
  LanguageTagSchema,
  normalizeIngredientAlias,
  type IngredientDefinition,
} from '../../domain/src/foundation';
import type { D1DatabaseBinding } from './index';

export type IngredientResolution =
  | { status: 'matched'; ingredientId: string }
  | { status: 'unmapped' }
  | { status: 'ambiguous'; ingredientIds: string[] };

// Catalog-authoring primitive, not a user-facing endpoint. Callers must own catalog-write authority.
export async function createIngredientDefinition(
  db: D1DatabaseBinding,
  input: unknown,
): Promise<IngredientDefinition> {
  const ingredient = IngredientDefinitionSchema.parse(input);
  const names = new Map(ingredient.names.map((name) => [name.language, name.name]));
  const aliases = new Map<string, { language: string; alias: string; normalizedAlias: string }>();
  for (const entry of [
    ...ingredient.aliases,
    ...ingredient.names.map((name) => ({ language: name.language, alias: name.name })),
    { language: 'und', alias: ingredient.defaultName },
  ]) {
    const normalizedAlias = normalizeIngredientAlias(entry.alias);
    aliases.set(JSON.stringify([entry.language, normalizedAlias]), { ...entry, normalizedAlias });
  }
  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO ingredients
      (id, name_vi, name_en, default_name, category, subcategory, default_unit, default_shelf_life_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        ingredient.id,
        names.get('vi') ?? ingredient.defaultName,
        names.get('en') ?? ingredient.defaultName,
        ingredient.defaultName,
        ingredient.category,
        ingredient.subcategory ?? null,
        ingredient.defaultUnit,
        ingredient.defaultShelfLifeDays,
      ),
    ...ingredient.names.map((name) =>
      db
        .prepare(
          `INSERT INTO ingredient_translations
      (id, ingredient_id, language, name) VALUES (?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), ingredient.id, name.language, name.name),
    ),
    ...[...aliases.values()].map((entry) =>
      db
        .prepare(
          `INSERT INTO ingredient_aliases
      (id, ingredient_id, alias, language, normalized_alias) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          ingredient.id,
          entry.alias,
          entry.language,
          entry.normalizedAlias,
        ),
    ),
  ]);
  if (results.some((result) => !result.success)) throw new Error('Catalog batch failed');
  return ingredient;
}

export async function addIngredientAlias(
  db: D1DatabaseBinding,
  ingredientId: string,
  input: unknown,
): Promise<void> {
  const id = CatalogIdSchema.parse(ingredientId);
  const alias = IngredientAliasSchema.parse(input);
  const result = await db
    .prepare(
      `INSERT INTO ingredient_aliases
    (id, ingredient_id, alias, language, normalized_alias) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      id,
      alias.alias,
      alias.language,
      normalizeIngredientAlias(alias.alias),
    )
    .run();
  if (!result.success) throw new Error('Catalog alias write failed');
}

export async function resolveIngredientAlias(
  db: D1DatabaseBinding,
  rawName: string,
  language = 'und',
): Promise<IngredientResolution> {
  const normalized = normalizeIngredientAlias(CatalogTextSchema.parse(rawName));
  const locale = LanguageTagSchema.parse(language);
  const rows = await db
    .prepare(
      `SELECT DISTINCT ingredient_id FROM ingredient_aliases
    WHERE normalized_alias = ? AND language IN (?, 'und') ORDER BY ingredient_id`,
    )
    .bind(normalized, locale)
    .all<{ ingredient_id: string }>();
  if (!rows.success) throw new Error('Catalog alias lookup failed');
  const ids = rows.results.map((row) => row.ingredient_id);
  if (ids.length === 0) return { status: 'unmapped' };
  if (ids.length > 1) return { status: 'ambiguous', ingredientIds: ids };
  return { status: 'matched', ingredientId: ids[0] };
}
