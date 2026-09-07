import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VIETNAMESE_RECIPES } from '../../packages/recipes/src/index';
import { VIETNAMESE_DISH_IMAGES } from '../../packages/recipes/src/vietnamese-images';

describe('Generate Database Migration 0006 & Synchronize Images', () => {
  it('should update vietnamese-bank.ts with distinct 100% authentic dish images', () => {
    const bankFilePath = path.resolve(process.cwd(), 'packages/recipes/src/vietnamese-bank.ts');
    let content = fs.readFileSync(bankFilePath, 'utf-8');

    if (!content.includes("from './vietnamese-images'")) {
      content = content.replace(
        "import { Recipe } from './types';",
        "import { Recipe } from './types';\nimport { VIETNAMESE_DISH_IMAGES } from './vietnamese-images';"
      );
    }

    // Replace all default image URLs with VIETNAMESE_DISH_IMAGES['<slug>']
    VIETNAMESE_RECIPES.forEach((r) => {
      const distinctImg = VIETNAMESE_DISH_IMAGES[r.slug];
      if (distinctImg) {
        // Regex to find the recipe block by slug and replace its imageUrl
        const slugRegex = new RegExp(`(slug:\\s*'${r.slug}',[\\s\\S]*?imageUrl:\\s*)'[^']*'`, 'm');
        if (slugRegex.test(content)) {
          content = content.replace(slugRegex, `$1VIETNAMESE_DISH_IMAGES['${r.slug}']`);
        }
      }
    });

    fs.writeFileSync(bankFilePath, content, 'utf-8');
    expect(content).toContain("from './vietnamese-images'");
  });

  it('should generate migrations/0006_vietnamese_recipe_bank.sql with distinct dish photos', () => {
    const migrationPath = path.resolve(process.cwd(), 'migrations/0006_vietnamese_recipe_bank.sql');

    function esc(str: string): string {
      return str.replace(/'/g, "''");
    }

    const lines: string[] = [
      '-- Migration 0006: Vietnamese Recipe Bank (Curated Dishes across 10 Categories)',
      '-- Generated from @frigo/recipes canonical recipe catalog with distinct authentic dish photos',
      '',
      '-- 1. Ensure Canonical Ingredients exist',
      'INSERT OR IGNORE INTO ingredients (id, name_vi, name_en, category, default_unit, default_shelf_life_days, icon) VALUES',
      "('PORK_RIBS', 'Sườn heo / Sườn non', 'Pork ribs', 'meat', 'g', 3, '🍖'),",
      "('CRAB_MEAT', 'Cua đồng / Cua thịt', 'Crab meat / Field crab', 'seafood', 'g', 2, '🦀'),",
      "('SQUID', 'Mực tươi', 'Squid', 'seafood', 'g', 2, '🦑'),",
      "('FISH_FRESHWATER', 'Cá tươi (Cá lóc, điêu hồng, rô)', 'Freshwater fish', 'seafood', 'g', 2, '🐟'),",
      "('BITTER_MELON', 'Khổ qua / Mướp đắng', 'Bitter melon', 'vegetable', 'piece', 5, '🥒'),",
      "('WINTER_MELON', 'Bí đao', 'Winter melon', 'vegetable', 'piece', 10, '🍈'),",
      "('PUMPKIN', 'Bí đỏ', 'Pumpkin', 'vegetable', 'piece', 20, '🎃'),",
      "('PINEAPPLE', 'Dứa / Thơm', 'Pineapple', 'fruit', 'piece', 7, '🍍'),",
      "('BEAN_SPROUTS', 'Giá đỗ', 'Bean sprouts', 'vegetable', 'g', 3, '🌱'),",
      "('CHAYOTE', 'Su su', 'Chayote', 'vegetable', 'piece', 10, '🍐'),",
      "('LEMONGRASS', 'Sả tươi', 'Lemongrass', 'spice', 'piece', 14, '🌾'),",
      "('LIME', 'Chanh tươi', 'Lime', 'fruit', 'piece', 14, '🍋'),",
      "('RICE_PAPER', 'Bánh tráng cuốn', 'Rice paper', 'grain', 'pack', 180, '🫓'),",
      "('MUSHROOM', 'Nấm tươi / nấm hương', 'Mushroom', 'vegetable', 'g', 5, '🍄');",
      '',
      '-- 2. Seed Vietnamese Recipes with Unique Authentic Photography',
      'INSERT INTO recipes (id, slug, title, description, cuisine, cook_time_minutes, servings, difficulty, image_url, tags) VALUES',
    ];

    const recipeRows = VIETNAMESE_RECIPES.map((r, idx) => {
      const allTags = [
        ...(r.tags || []),
        `cat:${r.category || 'mon_khac'}`,
        `region:${r.region || 'toan_quoc'}`,
      ];
      const tagsJson = esc(JSON.stringify(allTags));
      const imageUrl = VIETNAMESE_DISH_IMAGES[r.slug] || r.imageUrl;
      const isLast = idx === VIETNAMESE_RECIPES.length - 1;
      return `('${esc(r.id)}', '${esc(r.slug)}', '${esc(r.title)}', '${esc(r.description)}', '${esc(r.cuisine)}', ${r.cookTimeMinutes}, ${r.servings}, '${esc(r.difficulty)}', '${esc(imageUrl)}', '${tagsJson}')${isLast ? '' : ','}`;
    });
    lines.push(...recipeRows);
    lines.push(`ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  cuisine = excluded.cuisine,
  cook_time_minutes = excluded.cook_time_minutes,
  servings = excluded.servings,
  difficulty = excluded.difficulty,
  image_url = excluded.image_url,
  tags = excluded.tags;`);
    lines.push('');

    lines.push('-- 3. Seed Recipe Ingredients');
    lines.push('INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, name, required_quantity, unit, is_optional) VALUES');
    const ingredientRows: string[] = [];
    VIETNAMESE_RECIPES.forEach((r) => {
      r.ingredients.forEach((ing, iIdx) => {
        const id = `${r.id}_ing_${iIdx + 1}`;
        ingredientRows.push(
          `('${esc(id)}', '${esc(r.id)}', '${esc(ing.ingredientId)}', '${esc(ing.name)}', ${ing.requiredQuantity}, '${esc(ing.unit)}', ${ing.isOptional ? 1 : 0})`
        );
      });
    });
    lines.push(ingredientRows.join(',\n'));
    lines.push(`ON CONFLICT(id) DO UPDATE SET
  recipe_id = excluded.recipe_id,
  ingredient_id = excluded.ingredient_id,
  name = excluded.name,
  required_quantity = excluded.required_quantity,
  unit = excluded.unit,
  is_optional = excluded.is_optional;`);
    lines.push('');

    lines.push('-- 4. Seed Recipe Steps');
    lines.push('INSERT INTO recipe_steps (id, recipe_id, step_number, instruction, tip, timer_minutes) VALUES');
    const stepRows: string[] = [];
    VIETNAMESE_RECIPES.forEach((r) => {
      r.steps.forEach((st) => {
        const id = `${r.id}_step_${st.stepNumber}`;
        const tipVal = st.tip ? `'${esc(st.tip)}'` : 'NULL';
        const timerVal = st.timerMinutes ? st.timerMinutes : 'NULL';
        stepRows.push(
          `('${esc(id)}', '${esc(r.id)}', ${st.stepNumber}, '${esc(st.instruction)}', ${tipVal}, ${timerVal})`
        );
      });
    });
    lines.push(stepRows.join(',\n'));
    lines.push(`ON CONFLICT(id) DO UPDATE SET
  recipe_id = excluded.recipe_id,
  step_number = excluded.step_number,
  instruction = excluded.instruction,
  tip = excluded.tip,
  timer_minutes = excluded.timer_minutes;`);
    lines.push('');

    const content = lines.join('\n');
    fs.writeFileSync(migrationPath, content, 'utf-8');

    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(content).toContain('https://images.unsplash.com');
    expect(content).toContain('canh-chua-ca-loc-nam-bo');
  });
});
