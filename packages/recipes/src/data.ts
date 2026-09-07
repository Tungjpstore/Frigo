import { Recipe } from './types';
import { VIETNAMESE_RECIPES } from './vietnamese-bank';

export * from './vietnamese-bank';

export const GLOBAL_RECIPES: Recipe[] = [
  // =================== GLOBAL (Korean, Japanese, Chinese, Thai, Italian) ===================
  {
    id: 'gl-01',
    slug: 'pasta-pomodoro',
    title: 'Mì Ý sốt cà chua Pomodoro',
    description: 'Món mì Ý kinh điển với sốt cà chua tươi, tỏi phi thơm và dầu olive tinh tế.',
    cuisine: 'italian',
    cookTimeMinutes: 18,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/pasta-pomodoro.webp',
    nutrition: { calories: 380, proteinG: 12, fatG: 8, carbG: 65 },
    tags: ['Ý', 'Pasta', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'SPAGHETTI_PASTA', name: 'Mì Ý', requiredQuantity: 180, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu olive / Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Luộc mì Ý trong nước sôi có chút muối trong 8 phút chín al dente.', timerMinutes: 8 },
      { stepNumber: 2, instruction: 'Phi thơm tỏi băm trong dầu olive trên lửa nhỏ.' },
      { stepNumber: 3, instruction: 'Thêm cà chua băm nhuyễn, đun nhỏ lửa 6 phút tạo sốt sánh mịn.' },
      { stepNumber: 4, instruction: 'Trộn mì vào sốt, rắc tiêu và phô mai lên trên.' }
    ]
  },
  {
    id: 'gl-02',
    slug: 'mapo-tofu',
    title: 'Đậu phụ sốt Mapo Tofu Tứ Xuyên',
    description: 'Đậu phụ mềm non ngập trong sốt cay nồng tê tê chuẩn vị Trung Hoa.',
    cuisine: 'chinese',
    cookTimeMinutes: 16,
    servings: 3,
    difficulty: 'medium',
    imageUrl: '/frigo/recipes/global/mapo-tofu.webp',
    nutrition: { calories: 320, proteinG: 22, fatG: 16, carbG: 14 },
    tags: ['Trung Hoa', 'Cay', 'Đậu phụ'],
    ingredients: [
      { ingredientId: 'TOFU', name: 'Đậu phụ', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo xay', requiredQuantity: 100, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GINGER', name: 'Gừng', requiredQuantity: 10, unit: 'g' },
      { ingredientId: 'CHILI', name: 'Ớt', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đậu phụ cắt hạt lựu, chần qua nước sôi 1 phút.' },
      { stepNumber: 2, instruction: 'Phi tỏi, gừng và ớt băm, xào chín thịt băm.' },
      { stepNumber: 3, instruction: 'Thêm gia vị cay và 1/2 chén nước đun sôi, thả đậu phụ vào rim 5 phút.' }
    ]
  },
  {
    id: 'gl-03',
    slug: 'tomato-egg-stir-fry',
    title: 'Cà chua xào trứng Trung Hoa',
    description: 'Món ăn gia đình kinh điển với trứng mềm xốp quyện sốt cà chua đỏ sánh mịn.',
    cuisine: 'chinese',
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/tomato-egg-stir-fry.webp',
    nutrition: { calories: 230, proteinG: 14, fatG: 16, carbG: 8 },
    tags: ['Trung Hoa', 'Dưới 20 phút', 'Nhanh gọn'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đánh tan trứng với chút muối. Cà chua cắt múi cau.' },
      { stepNumber: 2, instruction: 'Chiên trứng xốp mềm rồi gắp ra đĩa.' },
      { stepNumber: 3, instruction: 'Xào cà chua ra nước sốt đỏ sánh cùng chút muối.' },
      { stepNumber: 4, instruction: 'Trút trứng vào đảo nhanh tay 30 giây rồi tắt bếp.' }
    ]
  },
  {
    id: 'gl-04',
    slug: 'oyakodon',
    title: 'Cơm gà trứng Oyakodon Nhật Bản',
    description: 'Món cơm donburi Nhật Bản với thịt gà mềm ngọt và trứng nấu lướt mịn mượt trên bát cơm nóng.',
    cuisine: 'japanese',
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/oyakodon.webp',
    nutrition: { calories: 480, proteinG: 32, fatG: 14, carbG: 55 },
    tags: ['Nhật Bản', 'Dưới 20 phút', 'Cơm donburi'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Thịt đùi gà', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'ONION', name: 'Hành tây', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SOY_SAUCE', name: 'Nước tương', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'RICE', name: 'Cơm', requiredQuantity: 300, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gà cắt miếng vừa ăn, hành tây thái mỏng.' },
      { stepNumber: 2, instruction: 'Đun sôi nước tương, đường và chút nước, thả gà hành tây vào nấu 5 phút.' },
      { stepNumber: 3, instruction: 'Rưới trứng đánh nhẹ lên trên đậy vung 1 phút chín lòng đào rồi trút lên bát cơm.' }
    ]
  },
  {
    id: 'gl-05',
    slug: 'kimchi-fried-rice',
    title: 'Cơm chiên kim chi Hàn Quốc',
    description: 'Cơm chiên kim chi chua cay giòn sần sật phủ trứng ốp la lòng đào béo ngậy.',
    cuisine: 'korean',
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/kimchi-fried-rice.webp',
    nutrition: { calories: 420, proteinG: 16, fatG: 14, carbG: 58 },
    tags: ['Hàn Quốc', 'Dưới 20 phút', 'Cay'],
    ingredients: [
      { ingredientId: 'RICE', name: 'Cơm nguội', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'KIMCHI', name: 'Kim chi', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Kim chi vắt nhẹ bớt nước, băm nhỏ.' },
      { stepNumber: 2, instruction: 'Xào kim chi thơm với dầu ăn 2 phút.' },
      { stepNumber: 3, instruction: 'Cho cơm nguội vào đảo đều tay trên lửa lớn cho hạt săn tơi.' },
      { stepNumber: 4, instruction: 'Chiên 1 trứng ốp la lòng đào đặt lên bát cơm thưởng thức.' }
    ]
  },
  {
    id: 'gl-06',
    slug: 'pad-krapow',
    title: 'Thịt băm xào lá quế kiểu Thái (Pad Krapow)',
    description: 'Món thịt heo băm xào cay thơm lừng lá quế ăn kèm cơm trắng và trứng rán giòn viền.',
    cuisine: 'thai',
    cookTimeMinutes: 12,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/pad-krapow.webp',
    nutrition: { calories: 440, proteinG: 28, fatG: 22, carbG: 32 },
    tags: ['Thái Lan', 'Dưới 20 phút', 'Cay'],
    ingredients: [
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo xay', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'CHILI', name: 'Ớt', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Phi thơm tỏi ớt băm trên lửa lớn.' },
      { stepNumber: 2, instruction: 'Cho thịt băm vào xào săn tơi đều 3 phút.' },
      { stepNumber: 3, instruction: 'Nêm nước mắm hạt nêm, cho lá quế/húng quế vào đảo nhanh tắt bếp.' },
      { stepNumber: 4, instruction: 'Chiên ốp la 1 quả trứng lòng đào ăn kèm.' }
    ]
  },
  {
    id: 'gl-07',
    slug: 'kimbap-han-quoc',
    title: 'Cơm cuộn Kimbap Hàn Quốc',
    description: 'Cơm cuộn rong biển nhân trứng rán, xúc xích/thịt và dưa chuột giòn mát rượi.',
    cuisine: 'korean',
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/kimchi-fried-rice.webp',
    nutrition: { calories: 360, proteinG: 14, fatG: 10, carbG: 54 },
    tags: ['Hàn Quốc', 'Meal prep', 'Dã ngoại'],
    ingredients: [
      { ingredientId: 'RICE', name: 'Cơm trắng', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Cà rốt', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CUCUMBER', name: 'Dưa leo', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 10, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Trộn cơm với chút dầu mè và muối cho đậm đà.' },
      { stepNumber: 2, instruction: 'Tráng trứng mỏng rồi cắt sợi dài, cà rốt và dưa leo cắt sợi dài.' },
      { stepNumber: 3, instruction: 'Trải lá rong biển, dàn đều cơm rồi xếp nhân trứng, cà rốt, dưa leo.' },
      { stepNumber: 4, instruction: 'Cuộn chặt tay rồi cắt thành từng khoanh tròn 1.5cm.' }
    ]
  },
  {
    id: 'gl-08',
    slug: 'tokbokki-cay-ngot',
    title: 'Bánh gạo Tokbokki sốt cay ngọt',
    description: 'Bánh gạo dẻo mềm đượm sốt ớt Gochujang cay nồng cùng trứng luộc lòng đào.',
    cuisine: 'korean',
    cookTimeMinutes: 18,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/kimchi-fried-rice.webp',
    nutrition: { calories: 410, proteinG: 12, fatG: 8, carbG: 72 },
    tags: ['Hàn Quốc', 'Món ăn vặt', 'Cay'],
    ingredients: [
      { ingredientId: 'RICE', name: 'Bánh gạo / Bột gạo', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CABBAGE', name: 'Bắp cải', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'CHILI', name: 'Ớt bột / Tương ớt', requiredQuantity: 2, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Luộc 2 quả trứng gà bóc vỏ để sẵn.', timerMinutes: 7 },
      { stepNumber: 2, instruction: 'Đun sôi nước với tương ớt Hàn Quốc, đường và nước tương.' },
      { stepNumber: 3, instruction: 'Cho bánh gạo và bắp cải vào đảo đều đun nhỏ lửa 8 phút cho ngấm sốt.', timerMinutes: 8 },
      { stepNumber: 4, instruction: 'Thêm trứng luộc và hành lá, đun đến khi sốt sánh sệt đỏ au.' }
    ]
  },
  {
    id: 'gl-09',
    slug: 'chawanmushi',
    title: 'Trứng hấp Chawanmushi Nhật Bản',
    description: 'Trứng hấp mịn màng như thạch tan trong miệng cùng tôm ngọt và nấm.',
    cuisine: 'japanese',
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/oyakodon.webp',
    nutrition: { calories: 140, proteinG: 15, fatG: 7, carbG: 3 },
    tags: ['Nhật Bản', 'Thanh đạm', 'Bữa tối nhẹ'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SHRIMP', name: 'Tôm tươi', requiredQuantity: 100, unit: 'g' },
      { ingredientId: 'SOY_SAUCE', name: 'Nước tương Nhật', requiredQuantity: 10, unit: 'ml' },
      { ingredientId: 'SCALLION', name: 'Hành lá', requiredQuantity: 1, unit: 'bunch', isOptional: true }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đánh tan 2 quả trứng với 200ml nước dùng dashi/nước lọc và xì dầu.' },
      { stepNumber: 2, instruction: 'Lọc hỗn hợp qua rây mịn 2 lần để mặt trứng không bị rỗ bọt khí.' },
      { stepNumber: 3, instruction: 'Xếp tôm vào chén, rót hỗn hợp trứng vào đậy nắp chén lại.' },
      { stepNumber: 4, instruction: 'Hấp cách thủy trên lửa cực nhỏ trong 10 phút cho trứng đông mượt.', timerMinutes: 10 }
    ]
  },
  {
    id: 'gl-10',
    slug: 'thai-green-curry',
    title: 'Cà ri gà kiểu Thái (Green Curry)',
    description: 'Thịt gà mềm ngập trong nước sốt cà ri cốt dừa béo ngậy thơm nồng lá quế và ớt xanh.',
    cuisine: 'thai',
    cookTimeMinutes: 25,
    servings: 3,
    difficulty: 'medium',
    imageUrl: '/frigo/recipes/global/pad-krapow.webp',
    nutrition: { calories: 460, proteinG: 36, fatG: 28, carbG: 16 },
    tags: ['Thái Lan', 'Béo ngậy', 'Cay nồng'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Thịt đùi gà', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'FRESH_MILK', name: 'Sữa tươi/Cốt dừa', requiredQuantity: 200, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt xanh/đỏ', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt gà chặt miếng vừa ăn, phi thơm tỏi băm và bột cà ri.' },
      { stepNumber: 2, instruction: 'Cho thịt gà vào xào săn trên lửa vừa 4 phút.' },
      { stepNumber: 3, instruction: 'Đổ sữa tươi/cốt dừa và 100ml nước vào đun sôi nhỏ lửa 15 phút.', timerMinutes: 15 },
      { stepNumber: 4, instruction: 'Nêm nước mắm đường, cho ớt và lá húng quế vào rồi tắt bếp.' }
    ]
  },
  {
    id: 'gl-11',
    slug: 'spaghetti-bolognese',
    title: 'Mì Ý sốt bò băm Bolognese',
    description: 'Sợi mì Ý dai mềm đượm sốt cà chua thịt bò băm thơm lừng thảo mộc Ý.',
    cuisine: 'italian',
    cookTimeMinutes: 25,
    servings: 3,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/global/carbonara.webp',
    nutrition: { calories: 510, proteinG: 32, fatG: 14, carbG: 64 },
    tags: ['Món Ý', 'Được yêu thích', 'Trẻ em mê'],
    ingredients: [
      { ingredientId: 'SPAGHETTI_PASTA', name: 'Mì Ý Spaghetti', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt bò/heo băm', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'ONION', name: 'Hành tây', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ô liu', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Luộc mì Ý trong nước sôi có muối trong 9 phút đến khi chín tới (al dente).', timerMinutes: 9 },
      { stepNumber: 2, instruction: 'Phi thơm tỏi và hành tây băm nhỏ trên chảo dầu ô liu.' },
      { stepNumber: 3, instruction: 'Cho thịt băm vào xào tơi, tiếp tục cho cà chua băm nhuyễn vào đun liu riu 12 phút.', timerMinutes: 12 },
      { stepNumber: 4, instruction: 'Gắp mì ra đĩa, chan ngập sốt bò băm nóng hổi lên trên thưởng thức.' }
    ]
  },
  {
    id: 'gl-12',
    slug: 'chinese-tomato-egg',
    title: 'Trứng xào cà chua kiểu Trung Hoa',
    description: 'Món ăn gia đình kinh điển Trung Hoa với trứng mềm xốp ngập trong sốt cà chua đỏ sánh chua ngọt.',
    cuisine: 'chinese',
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'easy',
    imageUrl: '/frigo/recipes/vietnam/dau-phu-sot-ca-chua.webp',
    nutrition: { calories: 230, proteinG: 14, fatG: 16, carbG: 8 },
    tags: ['Trung Hoa', 'Dưới 15 phút', 'Siêu nhanh'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'SOY_SAUCE', name: 'Nước tương', requiredQuantity: 10, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đánh tan 3 quả trứng với xíu muối. Rán trứng trên chảo dầu nóng vừa chín tới thì dầm miếng to trút ra đĩa.' },
      { stepNumber: 2, instruction: 'Cà chua cắt múi cau, xào mềm tiết nước sốt đỏ sánh trong 3 phút.' },
      { stepNumber: 3, instruction: 'Đổ trứng rán vào chảo cà chua, nêm chút đường xì dầu đảo nhẹ tay 1 phút.' },
      { stepNumber: 4, instruction: 'Rắc hành hoa cắt nhỏ, tắt bếp múc ra đĩa ăn nóng với cơm.' }
    ]
  }
];

export const SEED_RECIPES: Recipe[] = [...VIETNAMESE_RECIPES, ...GLOBAL_RECIPES];

export const ALL_RECIPES: Recipe[] = SEED_RECIPES;
