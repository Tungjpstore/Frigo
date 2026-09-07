import { FRIGO_ASSETS } from './frigo-assets';

export function getIngredientImage(ingredientId?: string, name?: string): string {
  const cleanId = (ingredientId || '').toUpperCase();
  const cleanName = (name || '').toLowerCase();

  // Mapping canonical IDs and names to production transparent PNGs
  if (cleanId === 'PORK_BELLY' || cleanName.includes('ba chỉ') || cleanName.includes('thịt heo') || cleanName.includes('thịt lợn') || cleanName.includes('ba rọi')) {
    return FRIGO_ASSETS.ingredients.pantry['pork-belly'];
  }
  if (cleanId === 'CHICKEN_EGG' || cleanName.includes('trứng')) {
    return FRIGO_ASSETS.ingredients.pantry.egg;
  }
  if (cleanId === 'TOMATO' || cleanName.includes('cà chua')) {
    return FRIGO_ASSETS.ingredients.vegetables.tomato;
  }
  if (cleanId === 'WATER_SPINACH' || cleanName.includes('rau muống')) {
    return FRIGO_ASSETS.ingredients.vegetables['water-spinach'];
  }
  if (cleanId === 'TOFU' || cleanName.includes('đậu phụ') || cleanName.includes('đậu hũ')) {
    return FRIGO_ASSETS.ingredients.pantry.tofu;
  }
  if (cleanId === 'GARLIC' || cleanName.includes('tỏi')) {
    return FRIGO_ASSETS.ingredients.vegetables.garlic;
  }
  if (cleanId === 'ONION' || cleanName.includes('hành tây')) {
    return FRIGO_ASSETS.ingredients.vegetables.onion;
  }
  if (cleanId === 'SCALLION' || cleanName.includes('hành lá')) {
    return FRIGO_ASSETS.ingredients.vegetables.scallion;
  }
  if (cleanId === 'CARROT' || cleanName.includes('cà rốt')) {
    return FRIGO_ASSETS.ingredients.vegetables.carrot;
  }
  if (cleanId === 'BROCCOLI' || cleanName.includes('bông cải') || cleanName.includes('súp lơ')) {
    return FRIGO_ASSETS.ingredients.vegetables.broccoli;
  }
  if (cleanId === 'BEEF_SIRLOIN' || cleanName.includes('bò')) {
    return FRIGO_ASSETS.ingredients.pantry.beef;
  }
  if (cleanId === 'CHICKEN_BREAST' || cleanId === 'CHICKEN_THIGH' || cleanName.includes('gà')) {
    return FRIGO_ASSETS.ingredients.pantry['chicken-breast'];
  }
  if (cleanId === 'SHRIMP' || cleanName.includes('tôm')) {
    return FRIGO_ASSETS.ingredients.pantry.shrimp;
  }
  if (cleanId === 'SALMON_FILLET' || cleanName.includes('cá hồi') || cleanName.includes('cá')) {
    return FRIGO_ASSETS.ingredients.pantry.salmon;
  }
  if (cleanId === 'FRESH_MILK' || cleanName.includes('sữa')) {
    return FRIGO_ASSETS.ingredients.pantry.milk;
  }
  if (cleanId === 'CHEDDAR_CHEESE' || cleanName.includes('phô mai')) {
    return FRIGO_ASSETS.ingredients.pantry.cheese;
  }
  if (cleanId === 'BUTTER' || cleanName.includes('bơ')) {
    return FRIGO_ASSETS.ingredients.pantry.butter;
  }
  if (cleanId === 'RICE' || cleanName.includes('cơm') || cleanName.includes('gạo')) {
    return FRIGO_ASSETS.ingredients.pantry['cooked-rice'];
  }
  if (cleanId === 'SPAGHETTI_PASTA' || cleanName.includes('mì ý') || cleanName.includes('pasta')) {
    return FRIGO_ASSETS.ingredients.pantry.pasta;
  }
  if (cleanId === 'NOODLE' || cleanName.includes('bún') || cleanName.includes('mì')) {
    return FRIGO_ASSETS.ingredients.pantry.noodles;
  }
  if (cleanId === 'KIMCHI' || cleanName.includes('kim chi') || cleanName.includes('kimchi')) {
    return FRIGO_ASSETS.ingredients.pantry.kimchi;
  }
  if (cleanId === 'GINGER' || cleanName.includes('gừng')) {
    return FRIGO_ASSETS.ingredients.vegetables.ginger;
  }
  if (cleanId === 'CHILI' || cleanName.includes('ớt')) {
    return FRIGO_ASSETS.ingredients.vegetables.chili;
  }
  if (cleanId === 'CUCUMBER' || cleanName.includes('dưa leo') || cleanName.includes('dưa chuột')) {
    return FRIGO_ASSETS.ingredients.vegetables.cucumber;
  }
  if (cleanId === 'CABBAGE' || cleanName.includes('bắp cải')) {
    return FRIGO_ASSETS.ingredients.vegetables.cabbage;
  }
  if (cleanId === 'SPINACH' || cleanName.includes('bina') || cleanName.includes('rau chân vịt')) {
    return FRIGO_ASSETS.ingredients.vegetables.spinach;
  }
  if (cleanId === 'MUSHROOM' || cleanName.includes('nấm')) {
    return FRIGO_ASSETS.ingredients.vegetables.mushroom;
  }
  if (cleanId === 'FISH_SAUCE' || cleanName.includes('nước mắm')) {
    return FRIGO_ASSETS.ingredients.pantry['fish-sauce'];
  }
  if (cleanId === 'SOY_SAUCE' || cleanName.includes('nước tương') || cleanName.includes('xì dầu')) {
    return FRIGO_ASSETS.ingredients.pantry['soy-sauce'];
  }
  if (cleanId === 'COOKING_OIL' || cleanName.includes('dầu')) {
    return FRIGO_ASSETS.ingredients.pantry['cooking-oil'];
  }

  // Fallback
  return FRIGO_ASSETS.ingredients.vegetables.tomato;
}
