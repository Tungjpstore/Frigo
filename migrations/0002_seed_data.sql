-- Migration 0002: Seed Data for Frigo

-- Cuisines
INSERT OR IGNORE INTO cuisines (id, name_vi, name_en, icon) VALUES
('vietnamese', 'Việt Nam', 'Vietnamese', '🇻🇳'),
('korean', 'Hàn Quốc', 'Korean', '🇰🇷'),
('japanese', 'Nhật Bản', 'Japanese', '🇯🇵'),
('chinese', 'Trung Hoa', 'Chinese', '🇨🇳'),
('thai', 'Thái Lan', 'Thai', '🇹🇭'),
('italian', 'Ý', 'Italian', '🇮🇹');

-- Canonical Ingredients
INSERT OR IGNORE INTO ingredients (id, name_vi, name_en, category, default_unit, default_shelf_life_days, icon) VALUES
('PORK_BELLY', 'Thịt ba chỉ', 'Pork belly', 'meat', 'g', 4, '🥓'),
('GROUND_PORK', 'Thịt heo xay', 'Ground pork', 'meat', 'g', 3, '🥩'),
('BEEF_SIRLOIN', 'Thịt bò', 'Beef sirloin', 'meat', 'g', 4, '🥩'),
('CHICKEN_BREAST', 'Ức gà', 'Chicken breast', 'meat', 'g', 3, '🍗'),
('CHICKEN_THIGH', 'Đùi gà', 'Chicken thigh', 'meat', 'g', 3, '🍗'),
('SHRIMP', 'Tôm tươi', 'Fresh shrimp', 'seafood', 'g', 2, '🦐'),
('SALMON_FILLET', 'Cá hồi', 'Salmon fillet', 'seafood', 'g', 2, '🐟'),
('CHICKEN_EGG', 'Trứng gà', 'Chicken egg', 'egg', 'piece', 14, '🥚'),
('FRESH_MILK', 'Sữa tươi', 'Fresh milk', 'dairy', 'ml', 7, '🥛'),
('CHEDDAR_CHEESE', 'Phô mai', 'Cheese', 'dairy', 'g', 21, '🧀'),
('BUTTER', 'Bơ', 'Butter', 'dairy', 'g', 30, '🧈'),
('TOMATO', 'Cà chua', 'Tomato', 'vegetable', 'piece', 7, '🍅'),
('WATER_SPINACH', 'Rau muống', 'Water spinach', 'vegetable', 'bunch', 4, '🥬'),
('SPINACH', 'Rau chân vịt', 'Spinach', 'vegetable', 'g', 4, '🥬'),
('TOFU', 'Đậu phụ', 'Tofu', 'vegetable', 'piece', 4, '🧊'),
('BROCCOLI', 'Bông cải xanh', 'Broccoli', 'vegetable', 'piece', 6, '🥦'),
('CARROT', 'Cà rốt', 'Carrot', 'vegetable', 'piece', 14, '🥕'),
('ONION', 'Hành tây', 'Onion', 'vegetable', 'piece', 20, '🧅'),
('GARLIC', 'Tỏi', 'Garlic', 'spice', 'piece', 30, '🧄'),
('GINGER', 'Gừng', 'Ginger', 'spice', 'g', 20, '🫚'),
('SCALLION', 'Hành lá', 'Green onion', 'vegetable', 'bunch', 5, '🌱'),
('CHILI', 'Ớt', 'Chili', 'spice', 'piece', 14, '🌶️'),
('CUCUMBER', 'Dưa leo', 'Cucumber', 'vegetable', 'piece', 7, '🥒'),
('CABBAGE', 'Bắp cải', 'Cabbage', 'vegetable', 'piece', 12, '🥬'),
('KIMCHI', 'Kim chi', 'Kimchi', 'vegetable', 'g', 45, '🥬'),
('RICE', 'Cơm / Gạo', 'Rice', 'grain', 'g', 90, '🍚'),
('SPAGHETTI_PASTA', 'Mì Ý / Pasta', 'Pasta', 'grain', 'g', 180, '🍝'),
('NOODLE', 'Bún / Mì sợi', 'Noodles', 'grain', 'g', 2, '🍜'),
('FISH_SAUCE', 'Nước mắm', 'Fish sauce', 'spice', 'ml', 365, '🥫'),
('SOY_SAUCE', 'Nước tương', 'Soy sauce', 'spice', 'ml', 365, '🍶'),
('COOKING_OIL', 'Dầu ăn', 'Cooking oil', 'spice', 'ml', 365, '🫗');

-- Demo User & Household
INSERT OR IGNORE INTO users (id, email, is_guest) VALUES
('demo_user_01', 'guest@frigo.local', 1);

INSERT OR IGNORE INTO profiles (id, user_id, display_name, avatar_url) VALUES
('demo_profile_01', 'demo_user_01', 'Bạn mới của Frigo', '/icons/favicon.svg');

INSERT OR IGNORE INTO households (id, name, created_by) VALUES
('demo_household_01', 'Tủ lạnh nhà tôi', 'demo_user_01');

INSERT OR IGNORE INTO household_members (id, household_id, user_id, role) VALUES
('demo_hm_01', 'demo_household_01', 'demo_user_01', 'owner');

INSERT OR IGNORE INTO user_preferences (id, user_id, household_size, spicy_level, favorite_cuisines, dietary_restrictions) VALUES
('demo_pref_01', 'demo_user_01', 2, 'medium', '["vietnamese", "korean", "japanese"]', '[]');

INSERT OR IGNORE INTO subscriptions (id, user_id, plan, scan_count_current_month, max_scans_per_month) VALUES
('demo_sub_01', 'demo_user_01', 'free', 1, 5);

INSERT OR IGNORE INTO shopping_lists (id, household_id, name) VALUES
('demo_shop_01', 'demo_household_01', 'Danh sách cần mua');

-- Demo Inventory Items (Matching the Demo requirements)
INSERT OR IGNORE INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit, category, storage, expiry_date, added_date, freshness, data_source) VALUES
('item_01', 'demo_household_01', 'CHICKEN_EGG', 'Trứng gà', 6, 'piece', 'egg', 'fridge', date('now', '+7 days'), datetime('now'), 'fresh', 'scan'),
('item_02', 'demo_household_01', 'PORK_BELLY', 'Thịt ba chỉ', 400, 'g', 'meat', 'fridge', date('now', '+1 days'), datetime('now'), 'use_soon', 'scan'),
('item_03', 'demo_household_01', 'TOMATO', 'Cà chua', 4, 'piece', 'vegetable', 'fridge', date('now', '+4 days'), datetime('now'), 'fresh', 'scan'),
('item_04', 'demo_household_01', 'WATER_SPINACH', 'Rau muống', 1, 'bunch', 'vegetable', 'fridge', date('now', '+2 days'), datetime('now'), 'use_soon', 'scan'),
('item_05', 'demo_household_01', 'TOFU', 'Đậu phụ', 2, 'piece', 'vegetable', 'fridge', date('now', '+3 days'), datetime('now'), 'use_soon', 'scan'),
('item_06', 'demo_household_01', 'GARLIC', 'Tỏi', 1, 'piece', 'spice', 'pantry', date('now', '+30 days'), datetime('now'), 'fresh', 'manual'),
('item_07', 'demo_household_01', 'FISH_SAUCE', 'Nước mắm', 200, 'ml', 'spice', 'pantry', date('now', '+180 days'), datetime('now'), 'fresh', 'manual'),
('item_08', 'demo_household_01', 'COOKING_OIL', 'Dầu ăn', 300, 'ml', 'spice', 'pantry', date('now', '+180 days'), datetime('now'), 'fresh', 'manual');

-- Demo Initial Inventory Events
INSERT OR IGNORE INTO inventory_events (id, household_id, inventory_item_id, event_type, quantity_delta, unit, reason) VALUES
('evt_01', 'demo_household_01', 'item_01', 'SCAN_CONFIRM', 6, 'piece', 'AI Fridge Scan Confirmation'),
('evt_02', 'demo_household_01', 'item_02', 'SCAN_CONFIRM', 400, 'g', 'AI Fridge Scan Confirmation'),
('evt_03', 'demo_household_01', 'item_03', 'SCAN_CONFIRM', 4, 'piece', 'AI Fridge Scan Confirmation'),
('evt_04', 'demo_household_01', 'item_04', 'SCAN_CONFIRM', 1, 'bunch', 'AI Fridge Scan Confirmation'),
('evt_05', 'demo_household_01', 'item_05', 'SCAN_CONFIRM', 2, 'piece', 'AI Fridge Scan Confirmation');

-- Demo Notifications
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read) VALUES
('notif_01', 'demo_user_01', 'Thịt ba chỉ nên dùng sớm!', 'Bạn có 400g thịt ba chỉ nên dùng trong 1-2 ngày tới để đảm bảo độ tươi ngon.', 'expiring_soon', 0),
('notif_02', 'demo_user_01', 'Gợi ý bữa tối hôm nay', 'Tủ lạnh của bạn đang có đủ nguyên liệu để nấu Thịt kho tàu hoặc Đậu sốt cà chua!', 'cook_ready', 0);
