import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { SQL } from '@frigo/db';

export const preferencesRoutes = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

const DEFAULT_PREFERENCES = {
  householdSize: 2,
  spicyLevel: 'medium',
  favoriteCuisines: ['vietnamese'],
  dietaryRestrictions: [],
  language: 'vi',
};

// GET /api/v1/preferences
preferencesRoutes.get('/preferences', async (c) => {
  const auth = c.get('auth');
  const db = c.env.DB;

  if (db) {
    try {
      const pref = await db.prepare(SQL.GET_USER_PREFERENCES).bind(auth.userId).first<any>();
      if (pref) {
        return c.json({
          preferences: {
            householdSize: pref.household_size,
            spicyLevel: pref.spicy_level,
            favoriteCuisines:
              typeof pref.favorite_cuisines === 'string'
                ? JSON.parse(pref.favorite_cuisines)
                : pref.favorite_cuisines,
            dietaryRestrictions:
              typeof pref.dietary_restrictions === 'string'
                ? JSON.parse(pref.dietary_restrictions)
                : pref.dietary_restrictions,
            language: pref.language,
          },
        });
      }
    } catch (err) {
      console.error('Failed querying user_preferences from D1:', err);
    }
  }

  return c.json({ preferences: DEFAULT_PREFERENCES });
});

// PATCH /api/v1/preferences
preferencesRoutes.patch('/preferences', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json().catch(() => ({}));
  const db = c.env.DB;

  if (!db) {
    return c.json({ error: 'Database service unavailable' }, 503);
  }

  try {
    const existing = await db.prepare(SQL.GET_USER_PREFERENCES).bind(auth.userId).first<any>();

    const householdSize = body.householdSize !== undefined ? Number(body.householdSize) : (existing?.household_size || 2);
    const spicyLevel = body.spicyLevel || existing?.spicy_level || 'medium';
    const favoriteCuisines = body.favoriteCuisines || (existing?.favorite_cuisines ? JSON.parse(existing.favorite_cuisines) : ['vietnamese']);
    const dietaryRestrictions = body.dietaryRestrictions || (existing?.dietary_restrictions ? JSON.parse(existing.dietary_restrictions) : []);
    const language = body.language || existing?.language || 'vi';

    await db
      .prepare(
        `INSERT OR REPLACE INTO user_preferences (id, user_id, household_size, spicy_level, favorite_cuisines, dietary_restrictions, language, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        `pref_${auth.userId}`,
        auth.userId,
        householdSize,
        spicyLevel,
        JSON.stringify(favoriteCuisines),
        JSON.stringify(dietaryRestrictions),
        language
      )
      .run();

    const updated = {
      householdSize,
      spicyLevel,
      favoriteCuisines,
      dietaryRestrictions,
      language,
    };

    return c.json({ success: true, preferences: updated });
  } catch (err) {
    console.error('Failed saving user_preferences to D1:', err);
    return c.json({ error: 'Lỗi cập nhật tùy chọn người dùng', code: 'DATABASE_ERROR' }, 500);
  }
});
