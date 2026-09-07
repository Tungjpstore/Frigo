import { Recipe } from './types';
import { VIETNAMESE_DISH_IMAGES } from './vietnamese-images';

export const VIETNAMESE_RECIPES: Recipe[] = [
  // =========================================================================
  // 1. MÓN CANH / SÚP (mon_canh)
  // =========================================================================
  {
    id: 'vn-canh-01',
    slug: 'canh-chua-ca-loc-nam-bo',
    title: 'Canh chua cá lóc Nam Bộ',
    description: 'Bát canh chua cá lóc đậm đà vị chua thanh của me, ngọt mát từ dứa, cà chua, đậu bắp và giá đỗ chuẩn vị miền Tây.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'nam',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-chua-ca-loc-nam-bo'],
    nutrition: { calories: 285, proteinG: 26, fatG: 7, carbG: 28 },
    tags: ['Món canh', 'Nam Bộ', 'Thanh nhiệt', 'Cá tươi'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Cá lóc tươi (cắt khúc)', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'PINEAPPLE', name: 'Dứa / Thơm (thái lát)', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'BEAN_SPROUTS', name: 'Giá đỗ sống', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Ngò gai & ngò ôm', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'CHILI', name: 'Ớt sừng cay', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Tỏi phi & dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cá lóc làm sạch, xát muối và rượu trắng để khử nhớt và mùi tanh, ướp với chút nước mắm, tiêu trong 10 phút.', tip: 'Khử tanh cá bằng muối hột và nước cốt chanh giúp cá thơm và thịt săn.' },
      { stepNumber: 2, instruction: 'Phi thơm tỏi băm với chút dầu ăn, cho cà chua và dứa vào xào sơ để lên màu đẹp và tạo vị chua ngọt tự nhiên.' },
      { stepNumber: 3, instruction: 'Đổ 1 lít nước vào nồi đun sôi, chắt nước cốt me chua vào, thả cá khúc vào nấu sôi 8 phút với lửa vừa.', timerMinutes: 8 },
      { stepNumber: 4, instruction: 'Vớt bọt thường xuyên để nước canh trong. Cho giá đỗ vào đun sôi thêm 2 phút rồi tắt bếp.', timerMinutes: 2 },
      { stepNumber: 5, instruction: 'Múc canh ra bát lớn, rắc ngò gai, ngò ôm cắt nhỏ, vài lát ớt và tỏi phi vàng thơm lừng lên trên.' }
    ]
  },
  {
    id: 'vn-canh-02',
    slug: 'canh-cua-dong-rau-day-mong-toi',
    title: 'Canh cua đồng mồng tơi mướp hương',
    description: 'Món canh giải nhiệt trứ danh mùa hè miền Bắc với tảng riêu cua đồng béo ngậy nấu cùng mồng tơi và mướp hương thanh mát.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'bac',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-cua-dong-rau-day-mong-toi'],
    nutrition: { calories: 195, proteinG: 22, fatG: 5, carbG: 14 },
    tags: ['Món canh', 'Miền Bắc', 'Mùa hè', 'Cua đồng'],
    ingredients: [
      { ingredientId: 'CRAB_MEAT', name: 'Cua đồng giã nhuyễn lọc lấy nước', requiredQuantity: 350, unit: 'g' },
      { ingredientId: 'SPINACH', name: 'Rau đay & mồng tơi', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'WINTER_MELON', name: 'Mướp hương thái vát', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm truyền thống', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'GARLIC', name: 'Hành tím khô băm nhỏ', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Nước lọc cua đồng khuấy đều cùng 1 thìa cà phê muối, bắc lên bếp đun với lửa vừa và khuấy nhẹ tay theo một chiều.' },
      { stepNumber: 2, instruction: 'Khi nước canh bắt đầu nóng lăn tăn, hạ lửa thật nhỏ để thịt cua kết lại thành mảng riêu nổi lên mặt.', tip: 'Không khuấy mạnh khi nước gần sôi kẻo làm vỡ mảng gạch cua.' },
      { stepNumber: 3, instruction: 'Gạt nhẹ mảng thịt cua sang một bên, thả mướp hương và rau đay, mồng tơi đã rửa sạch cắt khúc vào nồi.', timerMinutes: 3 },
      { stepNumber: 4, instruction: 'Nêm nước mắm vừa ăn, đun sôi bùng lại 2 phút là rau chín mềm giữ màu xanh mướt.', timerMinutes: 2 },
      { stepNumber: 5, instruction: 'Múc canh ra bát, khéo léo để tảng riêu cua lên trên, ăn kèm cà pháo muối giòn.' }
    ]
  },
  {
    id: 'vn-canh-03',
    slug: 'canh-kho-qua-nhoi-thit',
    title: 'Canh khổ qua nhồi thịt thanh mát',
    description: 'Trái khổ qua dồn thịt heo xay ngọt đậm vị, nước dùng ngọt thanh giúp thanh nhiệt giải độc cơ thể.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'nam',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-kho-qua-nhoi-thit'],
    nutrition: { calories: 230, proteinG: 21, fatG: 9, carbG: 15 },
    tags: ['Món canh', 'Thanh nhiệt', 'Truyền thống', 'Dễ ăn'],
    ingredients: [
      { ingredientId: 'BITTER_MELON', name: 'Mướp đắng / Khổ qua xanh', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo nạc xay', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Nấm mèo / Mộc nhĩ ngâm nở', requiredQuantity: 50, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành lá & ngò rí', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Khổ qua rửa sạch, rạch một đường dọc thân móc bỏ ruột, chần sơ qua nước sôi 1 phút rồi ngâm nước đá để giảm đắng.' },
      { stepNumber: 2, instruction: 'Trộn thịt xay, mộc nhĩ băm nhỏ, hành tím, nước mắm, tiêu xay thật đều, để 10 phút cho ngấm gia vị.' },
      { stepNumber: 3, instruction: 'Nhồi nhân thịt vào từng trái khổ qua, dùng cọng hành lá trần buộc nhẹ quanh quả để giữ nhân.' },
      { stepNumber: 4, instruction: 'Đun sôi 1 lít nước dùng, thả khổ qua nhồi thịt vào hầm nhỏ lửa trong 20 phút đến khi khổ qua mềm.', timerMinutes: 20 },
      { stepNumber: 5, instruction: 'Nêm nếm lại vừa miệng, rắc hành ngò thái nhỏ và tiêu hạt đập dập lên trên.' }
    ]
  },
  {
    id: 'vn-canh-04',
    slug: 'canh-suon-bi-dao',
    title: 'Canh sườn hầm bí đao ngọt thanh',
    description: 'Sườn heo ninh mềm róc xương kết hợp vị ngọt thanh của bí đao xanh tạo nên món canh dễ ăn cho cả gia đình.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'toan_quoc',
    cookTimeMinutes: 35,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-suon-bi-dao'],
    nutrition: { calories: 310, proteinG: 25, fatG: 16, carbG: 12 },
    tags: ['Món canh', 'Bổ dưỡng', 'Cơm nhà', 'Trẻ em thích'],
    ingredients: [
      { ingredientId: 'PORK_RIBS', name: 'Sườn non heo chặt miếng vừa', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'WINTER_MELON', name: 'Bí đao gọt vỏ cắt miếng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá & mùi tàu', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'GARLIC', name: 'Hành khô băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm nguyên chất', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Sườn non chặt khúc 3cm, chần qua nước sôi cùng chút muối để loại bỏ bọt bẩn, rửa sạch lại.' },
      { stepNumber: 2, instruction: 'Phi thơm hành củ băm, cho sườn vào xào săn với 1 thìa nước mắm.' },
      { stepNumber: 3, instruction: 'Thêm 1.2 lít nước vào nồi, hầm lửa nhỏ liu riu trong 20 phút cho sườn mềm nhừ.', timerMinutes: 20 },
      { stepNumber: 4, instruction: 'Cho bí đao vào nấu thêm 5 phút đến khi bí trong là chín tới, giữ được độ giòn ngọt.', timerMinutes: 5 },
      { stepNumber: 5, instruction: 'Tắt bếp, thêm hành hoa mùi tàu thái nhỏ và rắc chút tiêu cay nồng.' }
    ]
  },
  {
    id: 'vn-canh-05',
    slug: 'canh-bi-do-thit-bam',
    title: 'Canh bí đỏ thịt bằm hạt sen',
    description: 'Bí đỏ bùi bùi sánh mịn cùng thịt băm ngọt đậm đà, bổ sung nhiều vitamin A và dưỡng chất quý giá.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'toan_quoc',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-bi-do-thit-bam'],
    nutrition: { calories: 215, proteinG: 18, fatG: 7, carbG: 22 },
    tags: ['Món canh', 'Bổ não', 'Nhanh gọn', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'PUMPKIN', name: 'Bí đỏ gọt vỏ cắt quân cờ', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo xay nạc', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & ngò gai', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'GARLIC', name: 'Hành tím băm nhuyễn', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn thực vật', requiredQuantity: 10, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt bằm ướp 1 thìa cà phê nước mắm, hành tím băm và chút tiêu bột trong 5 phút.' },
      { stepNumber: 2, instruction: 'Đặt nồi lên bếp, phi thơm hành tím với chút dầu ăn rồi trút thịt vào xào tơi săn lại.' },
      { stepNumber: 3, instruction: 'Đổ 800ml nước vào đun sôi, thả bí đỏ vào nấu sôi vừa trong 10 phút cho bí chín mềm bùi.', timerMinutes: 10 },
      { stepNumber: 4, instruction: 'Nêm lại gia vị cho vừa miệng, dùng muôi dầm nhẹ vài miếng bí để nước canh có độ sánh vàng đẹp mắt.' },
      { stepNumber: 5, instruction: 'Múc canh ra tô, rắc ngò gai thái sợi lên trên và thưởng thức nóng.' }
    ]
  },
  {
    id: 'vn-canh-06',
    slug: 'canh-ngao-nau-chua-thi-la',
    title: 'Canh ngao nấu chua thì là',
    description: 'Vị ngọt thanh khiết của ngao hòa cùng vị chua dịu của dứa, cà chua và hương thơm đặc trưng của rau thì là.',
    cuisine: 'vietnamese',
    category: 'mon_canh',
    region: 'bac',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-ngao-nau-chua-thi-la'],
    nutrition: { calories: 160, proteinG: 19, fatG: 4, carbG: 13 },
    tags: ['Món canh', 'Hải sản', 'Thanh mát', 'Hà Nội'],
    ingredients: [
      { ingredientId: 'CRAB_MEAT', name: 'Ngao tươi sống / Thịt ngao', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua đỏ chín', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'PINEAPPLE', name: 'Dứa thơm thái mỏng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & thì là tươi', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'CHILI', name: 'Ớt tươi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm cốt', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Ngao ngâm nước vo gạo và ớt cắt lát 30 phút cho nhả sạch cát, rửa sạch vỏ.' },
      { stepNumber: 2, instruction: 'Luộc ngao với 800ml nước đến khi ngao vừa há miệng thì vớt ra, gỡ lấy thịt, gạn lấy nước luộc trong.', timerMinutes: 5 },
      { stepNumber: 3, instruction: 'Phi thơm hành củ, xào cà chua cho nhuyễn rồi trút thịt ngao vào đảo nhanh tay cùng 1 thìa nước mắm.' },
      { stepNumber: 4, instruction: 'Đổ nước luộc ngao và dứa vào nồi đun sôi bùng, nêm nếm lại vừa vị chua thanh ngọt.', timerMinutes: 4 },
      { stepNumber: 5, instruction: 'Cho hành hoa, thì là cắt khúc vào nồi rồi tắt bếp ngay để giữ màu xanh và hương thơm thì là.' }
    ]
  },

  // =========================================================================
  // 2. MÓN KHO / RIM (mon_kho)
  // =========================================================================
  {
    id: 'vn-kho-01',
    slug: 'thit-kho-trung',
    title: 'Thịt kho tàu nước dừa trứng béo ngậy',
    description: 'Thịt ba chỉ vuông vức óng ả màu cánh gián, ninh nhừ mềm tan trong nước dừa xiêm cùng trứng gà bùi bùi chuẩn Tết miền Nam.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'nam',
    cookTimeMinutes: 45,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['thit-kho-trung'],
    nutrition: { calories: 480, proteinG: 32, fatG: 34, carbG: 10 },
    tags: ['Món kho', 'Món mặn', 'Nam Bộ', 'Ăn cơm nhiều'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà ta', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi & hành tím giã nhuyễn', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm Phú Quốc hảo hạng', requiredQuantity: 40, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt sừng nguyên trái', requiredQuantity: 2, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt ba chỉ cạo sạch bì, cắt miếng vuông lớn 4x4cm, chần sơ nước sôi rồi để ráo.' },
      { stepNumber: 2, instruction: 'Ướp thịt với nước mắm ngon, hành tỏi băm, tiêu và 1 thìa đường trong 30 phút cho ngấm sâu.', tip: 'Ướp thịt với chút nước cốt chanh giúp phần mỡ khi kho trong veo và giòn.' },
      { stepNumber: 3, instruction: 'Luộc trứng gà chín tới, ngâm nước lạnh bóc sạch vỏ.', timerMinutes: 8 },
      { stepNumber: 4, instruction: 'Đảo săn thịt rồi đổ nước dừa xiêm ngập mặt thịt, đun sôi rồi hạ lửa nhỏ liu riu không đậy nắp trong 30 phút.', timerMinutes: 30 },
      { stepNumber: 5, instruction: 'Thả trứng luộc vào kho cùng thêm 15 phút đến khi nước thịt sánh kẹo, màu vàng ươm cánh gián đẹp mắt.', timerMinutes: 15 }
    ]
  },
  {
    id: 'vn-kho-02',
    slug: 'ca-loc-kho-to-tieu-den',
    title: 'Cá lóc kho tộ tiêu đen cay nồng',
    description: 'Thịt cá lóc đồng săn chắc ngấm đậm vị mắm đường, thơm nức tiêu đen xay và tóp mỡ giòn rụm trong niêu đất.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'nam',
    cookTimeMinutes: 30,
    servings: 3,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['ca-loc-kho-to-tieu-den'],
    nutrition: { calories: 340, proteinG: 35, fatG: 14, carbG: 16 },
    tags: ['Món kho', 'Đặc sản', 'Đậm đà', 'Niêu đất'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Cá lóc cắt khứa dày', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ thái mỏng (lấy tóp mỡ)', requiredQuantity: 100, unit: 'g', isOptional: true },
      { ingredientId: 'GARLIC', name: 'Hành tím & tỏi khô', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm cá cơm ngon', requiredQuantity: 40, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt hiểm cay', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá đầu hành', requiredQuantity: 1, unit: 'bunch' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cá lóc làm sạch ruột, xát muối khử tanh rồi ướp nước mắm, nước màu dừa, tiêu đen đập dập 20 phút.' },
      { stepNumber: 2, instruction: 'Cho thịt ba chỉ vào nồi đất đảo lấy mỡ giòn, phi thơm hành tím và đầu hành lá.' },
      { stepNumber: 3, instruction: 'Xếp từng khứa cá vào tộ đất, đun lửa lớn 3 phút cho miếng cá săn chắc hai mặt.' },
      { stepNumber: 4, instruction: 'Thêm nửa chén nước sôi ấm và vài trái ớt hiểm, đậy nắp kho liu riu nhỏ lửa 20 phút.', timerMinutes: 20 },
      { stepNumber: 5, instruction: 'Mở nắp, rưới nước sốt lên mặt cá đến khi cạn sánh sệt, rắc nhiều tiêu đen xay và hành lá ăn kèm cơm cháy.' }
    ]
  },
  {
    id: 'vn-kho-03',
    slug: 'ga-ta-kho-gung-sa',
    title: 'Gà ta kho gừng sả đậm đà',
    description: 'Thịt gà ta da giòn thịt dai ngọt quyện trong lớp sốt kho vàng óng, thơm ấm nồng gừng tươi thái sợi và sả giã dập.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'toan_quoc',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['ga-ta-kho-gung-sa'],
    nutrition: { calories: 370, proteinG: 34, fatG: 20, carbG: 8 },
    tags: ['Món kho', 'Món mặn', 'Ấm bụng', 'Mùa đông'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Thịt đùi gà ta chặt miếng', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng già cạo vỏ thái sợi', requiredQuantity: 40, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Sả tươi băm nhuyễn', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt tươi cắt lát', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gà chặt miếng vừa ăn, chần qua nước sôi gừng để sạch mùi hôi lông, để ráo.' },
      { stepNumber: 2, instruction: 'Ướp thịt gà cùng nước mắm, nửa lượng gừng sợi, chút tiêu và đường trong 15 phút.' },
      { stepNumber: 3, instruction: 'Đun nóng dầu ăn, phi vàng thơm sả băm và phần gừng sợi còn lại.' },
      { stepNumber: 4, instruction: 'Cho thịt gà vào đảo đều tay trên lửa lớn cho miếng gà săn chắc và ngấm vị vàng thơm.', timerMinutes: 5 },
      { stepNumber: 5, instruction: 'Châm thêm 50ml nước sôi, hạ nhỏ lửa đậy vung kho 15 phút đến khi nước kho sền sệt bám đều thịt gà.', timerMinutes: 15 }
    ]
  },
  {
    id: 'vn-kho-04',
    slug: 'suon-heo-xao-chua-ngot',
    title: 'Sườn heo xào chua ngọt chuẩn vị',
    description: 'Từng dẻ sườn non áo lớp sốt đỏ au chua thanh ngọt dịu từ giấm táo và cà chua, thịt mềm róc xương đậm vị cơm nhà.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'bac',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['suon-heo-xao-chua-ngot'],
    nutrition: { calories: 420, proteinG: 28, fatG: 25, carbG: 22 },
    tags: ['Món mặn', 'Trẻ em thích', 'Chua ngọt', 'Đậm đà'],
    ingredients: [
      { ingredientId: 'PORK_RIBS', name: 'Sườn non heo chặt dẻ nhỏ', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua chín băm nhỏ', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'ONION', name: 'Hành tây thái múi cau', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm nhuyễn', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 25, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn để rán sườn', requiredQuantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Sườn non chặt miếng 3-4cm, luộc sơ qua nước sôi rồi ướp chút hạt nêm và nước mắm 10 phút.' },
      { stepNumber: 2, instruction: 'Cho dầu vào chảo rán sườn lửa vừa đến khi bề mặt xém vàng giòn hai mặt rồi vớt ra ráo dầu.', timerMinutes: 8 },
      { stepNumber: 3, instruction: 'Pha nước sốt: 2 thìa nước mắm, 2 thìa giấm gạo, 2 thìa đường, 1 thìa tương cà khuấy tan.' },
      { stepNumber: 4, instruction: 'Phi thơm tỏi băm, xào nhuyễn cà chua và hành tây rồi đổ nước sốt pha sẵn vào đun sôi.' },
      { stepNumber: 5, instruction: 'Trút sườn đã rán vào đảo đều cho sốt quánh lại, ngấm đều phủ bóng khắp các miếng sườn.', timerMinutes: 5 }
    ]
  },
  {
    id: 'vn-kho-05',
    slug: 'tom-rim-man-ngot',
    title: 'Tôm rim mặn ngọt mắm đường tỏi ớt',
    description: 'Tôm đồng hoặc tôm thẻ tươi vỏ giòn giòn, thịt dai ngọt rim kẹo mặn mặn ngọt ngọt, ăn với cơm nóng cực kỳ đưa miệng.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['tom-rim-man-ngot'],
    nutrition: { calories: 240, proteinG: 29, fatG: 8, carbG: 14 },
    tags: ['Món rim', 'Hải sản', 'Dưới 20 phút', 'Đưa cơm'],
    ingredients: [
      { ingredientId: 'SHRIMP', name: 'Tôm tươi cắt bớt râu chân', requiredQuantity: 350, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi & hành khô băm nhỏ', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm truyền thống', requiredQuantity: 25, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Tôm rửa sạch, cắt bỏ râu và đuôi nhọn, để ráo nước hoàn toàn.' },
      { stepNumber: 2, instruction: 'Đặt chảo lên bếp, cho 1 thìa đường vào thắng nước màu cánh gián, phi thơm tỏi băm.' },
      { stepNumber: 3, instruction: 'Bật lửa lớn, trút tôm vào đảo nhanh tay đến khi tôm cong lại và chuyển màu đỏ cam tươi rói.', timerMinutes: 3 },
      { stepNumber: 4, instruction: 'Nêm nước mắm và chút đường, rim nhỏ lửa đến khi nước sốt keo lại bám đều quanh vỏ tôm.', timerMinutes: 5 },
      { stepNumber: 5, instruction: 'Rắc hành lá thái nhỏ và tiêu hạt giã dập, tắt bếp trút ra đĩa.' }
    ]
  },
  {
    id: 'vn-kho-06',
    slug: 'thit-ba-chi-kho-cu-cai',
    title: 'Thịt ba chỉ kho củ cải trắng',
    description: 'Thịt ba chỉ ngậy béo kho cùng từng khúc củ cải trắng hút trọn vị ngọt mặn tinh túy, mềm tan trong miệng.',
    cuisine: 'vietnamese',
    category: 'mon_kho',
    region: 'bac',
    cookTimeMinutes: 35,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['thit-ba-chi-kho-cu-cai'],
    nutrition: { calories: 390, proteinG: 24, fatG: 28, carbG: 12 },
    tags: ['Món kho', 'Món mặn', 'Cơm nhà', 'Mùa đông'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ heo', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'CARROT', name: 'Củ cải trắng (cắt khúc vuông)', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Hành tím băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt tươi', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt ba chỉ thái miếng con chì vừa ăn, ướp với nước mắm, hành tím băm, tiêu xay 15 phút.' },
      { stepNumber: 2, instruction: 'Củ cải trắng gọt vỏ, cắt khúc dày 2cm, xóc chút muối hột 5 phút rồi rửa sạch để giảm vị hăng.' },
      { stepNumber: 3, instruction: 'Xào săn thịt ba chỉ cho ra bớt mỡ và thịt hơi xém cạnh vàng ươm.' },
      { stepNumber: 4, instruction: 'Cho củ cải vào đảo cùng 2 phút, thêm nước sôi xâm xấp mặt thịt, kho lửa nhỏ trong 20 phút.', timerMinutes: 20 },
      { stepNumber: 5, instruction: 'Khi củ cải trong mềm và nước kho sánh sệt thì tắt bếp, rắc hành lá cắt khúc lên mặt.' }
    ]
  },

  // =========================================================================
  // 3. MÓN XÀO (mon_xao)
  // =========================================================================
  {
    id: 'vn-xao-01',
    slug: 'rau-muong-xao-toi',
    title: 'Rau muống xào tỏi xanh giòn',
    description: 'Rau muống ngọn non xanh mướt giòn sần sật dậy mùi thơm lừng của tỏi ta phi vàng xém cạnh, linh hồn bữa cơm gia đình.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'toan_quoc',
    cookTimeMinutes: 10,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['rau-muong-xao-toi'],
    nutrition: { calories: 120, proteinG: 4, fatG: 7, carbG: 9 },
    tags: ['Món xào', 'Rau củ', 'Dưới 20 phút', 'Nhanh gọn'],
    ingredients: [
      { ingredientId: 'WATER_SPINACH', name: 'Rau muống ngọn non nhặt sạch', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'GARLIC', name: 'Tỏi ta đập dập nguyên tép', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Rau muống nhặt bỏ lá già và gốc cứng, ngâm nước muối loãng rồi rửa sạch vớt ra rổ thưa.' },
      { stepNumber: 2, instruction: 'Đun một nồi nước thật sôi với chút muối, chần nhanh rau trong 30 giây rồi vớt thả ngay vào âu nước đá lạnh.', tip: 'Sốc nhiệt nước đá giúp rau giữ màu xanh lục bảo và độ giòn sần sật.' },
      { stepNumber: 3, instruction: 'Đặt chảo sâu lòng lên bếp lửa lớn, cho dầu ăn vào phi thơm 2/3 lượng tỏi đập dập đến khi vàng ruộm.' },
      { stepNumber: 4, instruction: 'Thả rau muống vào xào đảo nhanh tay trên lửa cực lớn trong 1.5 phút cùng nước mắm.', timerMinutes: 2 },
      { stepNumber: 5, instruction: 'Cho nốt phần tỏi tươi còn lại vào đảo đều thêm 10 giây rồi trút ngay ra đĩa.' }
    ]
  },
  {
    id: 'vn-xao-02',
    slug: 'bo-xao-can-toi-hanh-tay',
    title: 'Bò xào cần tỏi hành tây mềm ngọt',
    description: 'Thịt bò thăn thái mỏng xào lửa lớn giữ trọn độ mềm mọng nước, kết hợp mùi thơm nồng đặc trưng của cần tây và tỏi tây.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'bac',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['bo-xao-can-toi-hanh-tay'],
    nutrition: { calories: 290, proteinG: 28, fatG: 12, carbG: 14 },
    tags: ['Món xào', 'Thịt bò', 'Dưới 20 phút', 'Bổ dưỡng'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò thăn thái lát mỏng ngang thớ', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'ONION', name: 'Hành tây thái múi cau', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua thái múi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi khô băm nhỏ', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'SOY_SAUCE', name: 'Xì dầu / Nước tương', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt bò thái mỏng ngang thớ, ướp với tỏi băm, xì dầu, tiêu và 1 thìa dầu ăn để thịt không bị khô dai.' },
      { stepNumber: 2, instruction: 'Làm nóng chảo với lửa lớn, phi thơm tỏi rồi cho thịt bò vào đảo nhanh tay 1 phút đến khi tái thì trút ra đĩa riêng.', timerMinutes: 1 },
      { stepNumber: 3, instruction: 'Vẫn chiếc chảo đó, thêm chút dầu xào hành tây và cà chua trong 2 phút cho vừa chín tới.' },
      { stepNumber: 4, instruction: 'Trút đĩa thịt bò trở lại chảo, đảo đều tay cùng rau củ trên lửa lớn trong 30 giây.' },
      { stepNumber: 5, instruction: 'Rắc hạt tiêu cay nồng, bày ra đĩa ăn nóng với cơm.' }
    ]
  },
  {
    id: 'vn-xao-03',
    slug: 'muc-xao-can-toi-dua',
    title: 'Mực ống xào cần tỏi dứa chua ngọt',
    description: 'Mực ống tươi dày mình giòn sần sật xào cùng dứa thơm chua dịu, cần tây và ớt chuông đậm đà thanh vị biển.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['muc-xao-can-toi-dua'],
    nutrition: { calories: 220, proteinG: 27, fatG: 6, carbG: 15 },
    tags: ['Món xào', 'Hải sản', 'Dưới 20 phút', 'Đãi khách'],
    ingredients: [
      { ingredientId: 'SQUID', name: 'Mực ống tươi khứa vảy rồng', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'PINEAPPLE', name: 'Dứa thái lát mỏng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua chín', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'ONION', name: 'Hành tây', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi & gừng băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Mực làm sạch nang mực, khứa vảy rồng trên thân rồi cắt miếng vuông, chần nhanh qua nước sôi có rượu gừng khử tanh.' },
      { stepNumber: 2, instruction: 'Phi thơm tỏi gừng băm, cho mực vào xào lửa lớn trong 1.5 phút cho mực săn giòn nở hoa rồi múc ra đĩa.', timerMinutes: 2 },
      { stepNumber: 3, instruction: 'Xào dứa, cà chua và hành tây với lửa vừa cho tiết nước chua ngọt tự nhiên.' },
      { stepNumber: 4, instruction: 'Trút mực vào đảo đều cùng rau củ, nêm nước mắm và tiêu xay vừa khẩu vị.' },
      { stepNumber: 5, instruction: 'Rắc cần tây cắt khúc đảo nhanh 15 giây rồi tắt bếp.' }
    ]
  },
  {
    id: 'vn-xao-04',
    slug: 'thit-bo-xao-bong-cai',
    title: 'Thịt bò xào bông cải xanh cà rốt',
    description: 'Súp lơ xanh giòn mát xào cùng thịt bò mềm và cà rốt tỉa hoa, món xào đầy đặn sắc màu và giàu chất xơ.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['thit-bo-xao-bong-cai'],
    nutrition: { calories: 260, proteinG: 26, fatG: 11, carbG: 16 },
    tags: ['Món xào', 'Bổ dưỡng', 'Healthy', 'Cơm nhà'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò mềm thái lát', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'BROCCOLI', name: 'Bông cải xanh cắt miếng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Cà rốt tỉa hoa thái mỏng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SOY_SAUCE', name: 'Dầu hào & xì dầu', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt bò ướp với tỏi băm, 1 thìa dầu hào, tiêu và chút dầu ăn trong 10 phút.' },
      { stepNumber: 2, instruction: 'Bông cải và cà rốt chần sơ qua nước sôi 1 phút để giữ màu tươi và độ giòn ngọt.' },
      { stepNumber: 3, instruction: 'Phi tỏi thơm trên chảo nóng, cho thịt bò vào xào chín tái trong 1 phút rồi gắp riêng ra.' },
      { stepNumber: 4, instruction: 'Cho bông cải xanh và cà rốt vào xào nhanh với 1 thìa dầu hào và 2 thìa nước lọc trong 2 phút.' },
      { stepNumber: 5, instruction: 'Đổ thịt bò vào đảo chung 30 giây cho hòa quyện hương vị, rắc tiêu và múc ra đĩa.' }
    ]
  },
  {
    id: 'vn-xao-05',
    slug: 'su-su-xao-trung-ga',
    title: 'Su su xào trứng gà thanh ngọt',
    description: 'Su su bào sợi giòn ngọt tự nhiên ôm lấy từng mảng trứng gà vàng ươm béo ngậy, món ăn thanh đạm dễ làm.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'bac',
    cookTimeMinutes: 12,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['su-su-xao-trung-ga'],
    nutrition: { calories: 180, proteinG: 11, fatG: 10, carbG: 12 },
    tags: ['Món xào', 'Tiết kiệm', 'Dưới 20 phút', 'Thanh đạm'],
    ingredients: [
      { ingredientId: 'CHAYOTE', name: 'Quả su su non bào sợi', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'GARLIC', name: 'Hành tím băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Su su gọt vỏ rửa sạch mủ, bào thành sợi dài.' },
      { stepNumber: 2, instruction: 'Đánh tan 2 quả trứng gà cùng 1 thìa cà phê nước mắm và chút tiêu.' },
      { stepNumber: 3, instruction: 'Phi thơm hành tím với dầu ăn, cho su su vào xào lửa lớn trong 3 phút cho chín tới.' },
      { stepNumber: 4, instruction: 'Rưới trứng gà đánh tan đều khắp chảo su su, để 15 giây cho trứng se lại rồi dùng đũa đảo nhẹ tay.' },
      { stepNumber: 5, instruction: 'Rắc hành hoa và tiêu xay, tắt bếp thưởng thức nóng.' }
    ]
  },
  {
    id: 'vn-xao-06',
    slug: 'dau-cove-xao-thit-bo',
    title: 'Đậu cô ve xào thịt bò giòn ngọt',
    description: 'Đậu cô ve tước xơ bẻ khúc xào vừa chín tới giữ trọn màu xanh non mướt, kết hợp thịt bò mềm thơm ngất ngây.',
    cuisine: 'vietnamese',
    category: 'mon_xao',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['dau-cove-xao-thit-bo'],
    nutrition: { calories: 250, proteinG: 25, fatG: 10, carbG: 14 },
    tags: ['Món xào', 'Bò xào', 'Dưới 20 phút', 'Cơm nhà'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò thăn', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'WATER_SPINACH', name: 'Đậu cô ve non tước xơ', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm thơm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm & dầu hào', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đậu cô ve tước xơ 2 bên sườn, cắt vát chéo, rửa sạch.' },
      { stepNumber: 2, instruction: 'Thịt bò thái mỏng ướp tỏi băm, hạt tiêu và dầu ăn.' },
      { stepNumber: 3, instruction: 'Xào nhanh thịt bò trên lửa lớn trong 1 phút rồi múc ra đĩa.' },
      { stepNumber: 4, instruction: 'Phi thêm tỏi, cho đậu cô ve vào xào với lửa lớn, thêm chút xíu nước để đậu chín giòn đều trong 3 phút.' },
      { stepNumber: 5, instruction: 'Đổ thịt bò vào đảo lại 30 giây, nêm nếm gia vị và rắc tiêu thơm.' }
    ]
  },

  // =========================================================================
  // 4. MÓN CHIÊN / RÁN (mon_chien)
  // =========================================================================
  {
    id: 'vn-chien-01',
    slug: 'dau-phu-sot-ca-chua',
    title: 'Đậu phụ lướt ván sốt cà chua',
    description: 'Miếng đậu phụ vàng mềm núng nính phủ lớp sốt cà chua đỏ au sánh mịn quyện cùng hành hoa thơm nức mũi.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['dau-phu-sot-ca-chua'],
    nutrition: { calories: 230, proteinG: 17, fatG: 13, carbG: 12 },
    tags: ['Món chiên', 'Tiết kiệm', 'Dưới 20 phút', 'Quốc dân'],
    ingredients: [
      { ingredientId: 'TOFU', name: 'Đậu phụ trắng Mơ', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua chín mọng', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá tươi', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn chiên đậu', requiredQuantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đậu phụ cắt miếng vuông vừa ăn, thấm khô nước bằng khăn giấy sạch.' },
      { stepNumber: 2, instruction: 'Đun nóng chảo dầu, chiên lướt ván đậu phụ đến khi vỏ ngoài vàng giòn rụm nhưng bên trong vẫn mềm béo.', timerMinutes: 6 },
      { stepNumber: 3, instruction: 'Phi thơm đầu hành trắng, cho cà chua thái hạt lựu vào xào nhuyễn cùng nước mắm và chút nước.' },
      { stepNumber: 4, instruction: 'Thả đậu phụ vào đảo nhẹ tay cho lớp sốt cà chua ngấm đều quanh từng miếng đậu trong 3 phút.' },
      { stepNumber: 5, instruction: 'Rắc hành lá thái nhỏ và tiêu thơm, múc ra đĩa ăn kèm cơm nóng hổi.' }
    ]
  },
  {
    id: 'vn-chien-02',
    slug: 'trung-chien-thit-bam-nam-rom',
    title: 'Trứng chiên thịt bằm nấm rơm',
    description: 'Món trứng chiên phồng xốp vàng rực, bên trong đầy đặn thịt heo băm đậm đà và nấm ngọt giòn sần sật.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'toan_quoc',
    cookTimeMinutes: 12,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['trung-chien-thit-bam-nam-rom'],
    nutrition: { calories: 270, proteinG: 22, fatG: 19, carbG: 5 },
    tags: ['Món chiên', 'Nhanh gọn', 'Dưới 20 phút', 'Được yêu thích'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà tươi', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo xay nạc', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Nấm rơm hoặc nấm hương băm nhỏ', requiredQuantity: 50, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & hành khô', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Xào sơ thịt bằm và nấm băm cùng hành khô cho chín tới và ráo bớt nước.' },
      { stepNumber: 2, instruction: 'Đập 4 quả trứng gà vào tô, nêm nước mắm, tiêu và hành hoa rồi đánh bông nhẹ.' },
      { stepNumber: 3, instruction: 'Trộn đều phần thịt bằm nấm đã xào vào âu trứng.' },
      { stepNumber: 4, instruction: 'Đun nóng dầu trong chảo, đổ trứng vào dàn đều, đậy vung chiên lửa nhỏ 4 phút cho chín phồng đáy.', timerMinutes: 4 },
      { stepNumber: 5, instruction: 'Khéo léo lật mặt trứng chiên thêm 2 phút cho vàng đều hai mặt rồi cắt miếng tam giác.' }
    ]
  },
  {
    id: 'vn-chien-03',
    slug: 'canh-ga-chien-nuoc-mam',
    title: 'Cánh gà chiên nước mắm tỏi ớt',
    description: 'Cánh gà chiên vàng giòn rụm bên ngoài mọng nước bên trong, lắc đều cùng sốt mắm tỏi ớt ngọt mặn dính tay hấp dẫn.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'toan_quoc',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-ga-chien-nuoc-mam'],
    nutrition: { calories: 430, proteinG: 31, fatG: 28, carbG: 14 },
    tags: ['Món chiên', 'Ăn vặt', 'Món nhậu', 'Trẻ em mê'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Cánh gà khúc giữa tươi', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi ta băm nhuyễn', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt sừng băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm truyền thống', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn chiên gà', requiredQuantity: 100, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cánh gà rửa sạch với nước muối gừng, khía nhẹ 2 đường ở mặt trong để nhanh chín và ngấm vị.' },
      { stepNumber: 2, instruction: 'Chiên cánh gà ngập dầu với lửa vừa đến khi da gà giòn rụm và ngả màu vàng cánh gián thì vớt ra thấm dầu.', timerMinutes: 12 },
      { stepNumber: 3, instruction: 'Pha sốt nước mắm: 2 thìa mắm, 2 thìa đường, 1 thìa nước lọc, chút tiêu khuấy tan.' },
      { stepNumber: 4, instruction: 'Phi thơm tỏi và ớt băm trên chảo với 1 thìa dầu, đổ sốt nước mắm vào đun sôi sủi bọt keo lại.' },
      { stepNumber: 5, instruction: 'Trút cánh gà chiên vào đảo nhanh tay 1 phút để sốt mắm óng ánh phủ đều quanh cánh gà.' }
    ]
  },
  {
    id: 'vn-chien-04',
    slug: 'cha-ca-hai-phong',
    title: 'Chả cá chiên thì là hạt tiêu',
    description: 'Chả cá thác lác hoặc cá điêu hồng quết dẻo quánh, trộn nhiều thì là và hạt tiêu đập dập rán vàng phồng thơm phức.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'bac',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['cha-ca-hai-phong'],
    nutrition: { calories: 310, proteinG: 32, fatG: 16, carbG: 8 },
    tags: ['Món chiên', 'Hải sản', 'Đặc sản', 'Bắc Bộ'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Phi lê cá tươi quết dẻo', requiredQuantity: 450, unit: 'g' },
      { ingredientId: 'PORK_BELLY', name: 'Mỡ heo hạt lựu (tạo độ mọng)', requiredQuantity: 80, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Thì là tươi cắt nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'GARLIC', name: 'Hành khô băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn chiên', requiredQuantity: 60, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt cá thấm khô, xay nhuyễn rồi dùng thìa quết mạnh tay liên tục 10 phút để chả đạt độ dai giòn tự nhiên.' },
      { stepNumber: 2, instruction: 'Trộn mỡ heo hạt lựu, thì là thái nhỏ, hành tím, nước mắm, tiêu sọ đập dập vào khối chả cá.' },
      { stepNumber: 3, instruction: 'Thoa chút dầu ăn lên lòng bàn tay, nặn chả cá thành từng miếng tròn dẹt vừa ăn.' },
      { stepNumber: 4, instruction: 'Đun nóng dầu, thả từng miếng chả cá vào chiên lửa vừa cho phồng xốp vàng ruộm hai mặt.', timerMinutes: 8 },
      { stepNumber: 5, instruction: 'Gắp chả cá ra đĩa lót giấy thấm dầu, ăn nóng chấm tương ớt hoặc nước mắm gừng thì là.' }
    ]
  },
  {
    id: 'vn-chien-05',
    slug: 'nem-ran-truyen-thong-ha-noi',
    title: 'Nem rán truyền thống Hà Nội giòn rụm',
    description: 'Vỏ nem vàng rộm giòn tan rụm, nhân thịt băm mộc nhĩ nấm hương miến dong và trứng gà thơm phức chấm mắm chua ngọt.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'bac',
    cookTimeMinutes: 35,
    servings: 4,
    difficulty: 'hard',
    imageUrl: VIETNAMESE_DISH_IMAGES['nem-ran-truyen-thong-ha-noi'],
    nutrition: { calories: 380, proteinG: 22, fatG: 22, carbG: 26 },
    tags: ['Món chiên', 'Nem rán', 'Tiệc tùng', 'Truyền thống'],
    ingredients: [
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo vai xay', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'SHRIMP', name: 'Tôm tươi băm nhỏ', requiredQuantity: 100, unit: 'g', isOptional: true },
      { ingredientId: 'CHICKEN_EGG', name: 'Lòng đỏ trứng gà', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Cà rốt & củ đậu thái chỉ', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'MUSHROOM', name: 'Mộc nhĩ & nấm hương băm', requiredQuantity: 40, unit: 'g' },
      { ingredientId: 'RICE_PAPER', name: 'Bánh đa nem / Bánh tráng giòn', requiredQuantity: 1, unit: 'pack' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu rán nem', requiredQuantity: 100, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Trộn đều thịt xay, tôm, mộc nhĩ, nấm hương, cà rốt, miến dong cắt khúc, hành hoa và lòng đỏ trứng gà.' },
      { stepNumber: 2, instruction: 'Trải bánh đa nem ra đĩa phẳng, cho lượng nhân vừa phải vào cuốn tròn vừa tay không quá chặt kẻo bục nem.' },
      { stepNumber: 3, instruction: 'Chiên nem 2 lần lửa: Lần 1 chiên chín tới ở lửa nhỏ vừa rồi vớt ra để nguội.', timerMinutes: 10 },
      { stepNumber: 4, instruction: 'Lần 2: Trước khi ăn chiên lại trên lửa lớn 2 phút để vỏ nem giòn rụm lâu và không bị ngậm dầu.', timerMinutes: 3 },
      { stepNumber: 5, instruction: 'Bày ra đĩa cùng rau sống kinh giới tía tô, chấm nước mắm pha chua ngọt tỏi ớt cà rốt đu đủ muối.' }
    ]
  },
  {
    id: 'vn-chien-06',
    slug: 'ca-ro-phi-chien-gion-mam-gung',
    title: 'Cá rô phi chiên giòn chấm mắm gừng',
    description: 'Cá rô phi làm sạch khía vảy chiên giòn tan từ vây đến da, thịt cá trắng ngọt chấm nước mắm gừng ớt ấm nồng.',
    cuisine: 'vietnamese',
    category: 'mon_chien',
    region: 'toan_quoc',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['ca-ro-phi-chien-gion-mam-gung'],
    nutrition: { calories: 330, proteinG: 34, fatG: 18, carbG: 4 },
    tags: ['Món chiên', 'Cá tươi', 'Cơm nhà', 'Dễ làm'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Cá rô phi tươi nguyên con khía sâu', requiredQuantity: 700, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng tươi giã nhuyễn', requiredQuantity: 30, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi & ớt băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'LIME', name: 'Chanh vắt lấy nước cốt', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm nguyên chất', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn chiên cá', requiredQuantity: 80, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cá rô phi làm sạch màng đen trong bụng, khía vát sâu lên thân, lau thật khô ráo cả trong lẫn ngoài.' },
      { stepNumber: 2, instruction: 'Đun dầu ăn sôi già, thả cá vào chiên vàng giòn một mặt rồi mới nhẹ nhàng lật sang mặt còn lại.', timerMinutes: 15 },
      { stepNumber: 3, instruction: 'Pha nước mắm chấm: 2 thìa nước mắm, 1 thìa đường, gừng giã nhuyễn, tỏi ớt băm và nước cốt chanh khuấy đều.' },
      { stepNumber: 4, instruction: 'Cá chín vàng giòn rụm cả 2 mặt thì vớt ra gác lên rây cho ráo dầu.' },
      { stepNumber: 5, instruction: 'Thưởng thức khi cá còn nóng hổi giòn rụm cùng cơm và rau luộc.' }
    ]
  },

  // =========================================================================
  // 5. MÓN HẤP / LUỘC (mon_hap_luoc)
  // =========================================================================
  {
    id: 'vn-hap-01',
    slug: 'ga-ta-hap-la-chanh',
    title: 'Gà ta hấp lá chanh da giòn thịt ngọt',
    description: 'Gà thả vườn hấp cách thủy giữ nguyên 100% vị ngọt thanh tinh khiết, da gà vàng óng giòn sần sật thơm nức lá chanh thái chỉ.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'bac',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['ga-ta-hap-la-chanh'],
    nutrition: { calories: 340, proteinG: 38, fatG: 18, carbG: 2 },
    tags: ['Món hấp', 'Gà ta', 'Thanh đạm', 'Đãi tiệc'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Gà ta nửa con hoặc đùi gà tươi', requiredQuantity: 600, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng đập dập & hành củ', requiredQuantity: 30, unit: 'g' },
      { ingredientId: 'LIME', name: 'Lá chanh tươi bánh tẻ thái chỉ', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt tươi cắt lát', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gà làm sạch xát muối và gừng đập dập quanh da để khử sạch mùi hôi, rửa lại để ráo.' },
      { stepNumber: 2, instruction: 'Xếp một lớp sả đập dập và gừng thái lát dưới đáy xửng hấp, đặt gà lên trên.' },
      { stepNumber: 3, instruction: 'Đậy kín nắp xửng hấp cách thủy trên lửa vừa trong 25 phút đến khi dùng tăm chọc không còn ứa nước hồng.', timerMinutes: 25 },
      { stepNumber: 4, instruction: 'Gà chín vớt ra ngâm ngay vào âu nước đá lạnh 3 phút rồi vớt ra để da gà se giòn căng mọng.' },
      { stepNumber: 5, instruction: 'Chặt gà thành từng miếng vuông đẹp mắt, rắc nhiều lá chanh thái chỉ lên trên, chấm muối tiêu chanh ớt.' }
    ]
  },
  {
    id: 'vn-hap-02',
    slug: 'thit-ba-chi-luoc-mam-tom',
    title: 'Thịt ba chỉ luộc chấm mắm tôm cà pháo',
    description: 'Thịt ba chỉ luộc trắng ngần, nạc mỡ đan xen đều tăm tắp thái mỏng tang, chấm mắm tôm đánh sủi bọt bông và cà pháo muối giòn.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'bac',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['thit-ba-chi-luoc-mam-tom'],
    nutrition: { calories: 360, proteinG: 25, fatG: 28, carbG: 2 },
    tags: ['Món luộc', 'Món thanh', 'Dưới 20 phút', 'Kinh điển'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ rút sườn liền khổ', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Hành khô đập dập', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GINGER', name: 'Gừng đập dập', requiredQuantity: 20, unit: 'g' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm chấm hoặc mắm tôm', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'LIME', name: 'Chanh tươi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt cay băm nhỏ', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt ba chỉ rửa sạch, dùng dây dù buộc nhẹ cuộn tròn để miếng thịt luộc thái ra tròn đẹp.' },
      { stepNumber: 2, instruction: 'Đun nồi nước sôi lăn tăn cùng củ hành tím và gừng đập dập, thả miếng thịt vào luộc lửa vừa.', timerMinutes: 15 },
      { stepNumber: 3, instruction: 'Vớt thịt ngâm ngay vào thau nước đá lạnh có vắt chút nước cốt chanh để thịt trắng phau và bì giòn.', tip: 'Ngâm nước đá sau luộc giúp giữ độ mọng nước và không bị thâm bì.' },
      { stepNumber: 4, instruction: 'Thịt nguội hẳn dùng dao thật sắc thái lát mỏng tang xếp đều ra đĩa.' },
      { stepNumber: 5, instruction: 'Pha mắm chấm chanh tỏi ớt đánh bông bọt trắng, ăn kèm rau húng quế và dưa chuột.' }
    ]
  },
  {
    id: 'vn-hap-03',
    slug: 'ca-dieu-hong-hap-hanh-gung',
    title: 'Cá điêu hồng hấp hành gừng xì dầu',
    description: 'Cá điêu hồng tươi hấp nguyên con giữ trọn vị ngọt tự nhiên, quyện trong sốt xì dầu thơm nồng gừng sợi và hành hoa chần dầu sôi.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'toan_quoc',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['ca-dieu-hong-hap-hanh-gung'],
    nutrition: { calories: 290, proteinG: 36, fatG: 10, carbG: 8 },
    tags: ['Món hấp', 'Cá tươi', 'Tươi ngọt', 'Đãi khách'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Cá điêu hồng tươi nguyên con', requiredQuantity: 800, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng non cạo vỏ thái sợi dài', requiredQuantity: 50, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa chẻ sợi mảnh', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'SOY_SAUCE', name: 'Xì dầu hảo hạng & dầu hào', requiredQuantity: 40, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn đun sôi', requiredQuantity: 25, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cá mổ sạch vẩy và mang, khía 3 đường chéo trên thân, ướp chút hạt nêm và gừng sợi trong bụng cá.' },
      { stepNumber: 2, instruction: 'Đặt cá vào đĩa sâu lòng, rải một nửa gừng sợi lên trên rồi cho vào xửng hấp chín tới trong 18 phút.', timerMinutes: 18 },
      { stepNumber: 3, instruction: 'Pha sốt xì dầu: 3 thìa xì dầu, 1 thìa dầu hào, 1 thìa đường và 2 thìa nước lọc đun sôi lăn tăn.' },
      { stepNumber: 4, instruction: 'Rải hành hoa chẻ sợi và gừng tươi còn lại lên khắp mình cá, đun dầu ăn thật sôi rồi xối trực tiếp lên hành gừng để dậy mùi thơm nức.' },
      { stepNumber: 5, instruction: 'Rưới nước sốt xì dầu quanh thân cá, dọn lên bàn ăn nóng kèm bánh tráng cuốn rau sống.' }
    ]
  },
  {
    id: 'vn-hap-04',
    slug: 'rau-cu-luoc-kho-quet',
    title: 'Rau củ luộc thập cẩm kho quẹt tóp mỡ',
    description: 'Mẹt rau củ vườn nhà tươi non giòn ngọt chấm ngập trong niêu kho quẹt tóp mỡ tôm khô thơm nức mũi chuẩn vị Nam Bộ.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'nam',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['rau-cu-luoc-kho-quet'],
    nutrition: { calories: 250, proteinG: 14, fatG: 15, carbG: 18 },
    tags: ['Món luộc', 'Rau củ', 'Kho quẹt', 'Món Nam'],
    ingredients: [
      { ingredientId: 'BROCCOLI', name: 'Súp lơ xanh cắt miếng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Cà rốt cắt khúc', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CHAYOTE', name: 'Quả su su cắt con chì', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ thái hạt lựu (làm tóp mỡ)', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'SHRIMP', name: 'Tôm khô ngâm mềm', requiredQuantity: 50, unit: 'g' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 40, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt hiểm & tiêu xanh', requiredQuantity: 2, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt ba chỉ thái hạt lựu đảo trên chảo nhỏ lấy tóp mỡ vàng giòn, vớt tóp ra riêng.' },
      { stepNumber: 2, instruction: 'Dùng mỡ đó phi thơm hành tỏi băm, cho tôm khô vào xào thơm.' },
      { stepNumber: 3, instruction: 'Pha 3 thìa nước mắm ngon và 2 thìa đường vào chảo, đun nhỏ lửa đến khi mắm keo sền sệt thì thả tóp mỡ, ớt hiểm và tiêu sọ vào.', timerMinutes: 8 },
      { stepNumber: 4, instruction: 'Đun sôi nồi nước với chút muối, lần lượt luộc chín tới cà rốt, su su và bông cải xanh rồi vớt ra đĩa.' },
      { stepNumber: 5, instruction: 'Bày mẹt rau củ xanh mướt quanh niêu kho quẹt bốc khói nghi ngút.' }
    ]
  },
  {
    id: 'vn-hap-05',
    slug: 'muc-hap-gung-sa',
    title: 'Mực ống hấp gừng sả giòn ngọt',
    description: 'Mực ống tươi dày mình hấp cùng sả cây đập dập và gừng non, từng miếng mực giòn ngọt sần sật mọng nước.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'trung',
    cookTimeMinutes: 12,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['muc-hap-gung-sa'],
    nutrition: { calories: 175, proteinG: 31, fatG: 3, carbG: 4 },
    tags: ['Món hấp', 'Hải sản', 'Dưới 20 phút', 'Tươi ngọt'],
    ingredients: [
      { ingredientId: 'SQUID', name: 'Mực ống tươi nguyên con', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng non thái chỉ', requiredQuantity: 30, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Sả tươi đập dập cắt khúc', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt sừng thái vát', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'LIME', name: 'Chanh chấm muối tiêu', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Mực rút túi mực và xương sống mềm, rửa sạch để ráo.' },
      { stepNumber: 2, instruction: 'Lót sả cây đập dập dưới đáy đĩa hấp, xếp mực lên trên, rải gừng non và ớt sừng khắp thân mực.' },
      { stepNumber: 3, instruction: 'Đặt vào xửng nước sôi hấp cách thủy với lửa lớn trong đúng 8 phút để mực chín giòn ngọt không bị dai.', timerMinutes: 8 },
      { stepNumber: 4, instruction: 'Cắt mực thành từng khoanh tròn vừa ăn xếp lại ngay ngắn trên đĩa.' },
      { stepNumber: 5, instruction: 'Chấm cùng muối ớt tiêu chanh hoặc mù tạt xì dầu đậm vị.' }
    ]
  },
  {
    id: 'vn-hap-06',
    slug: 'tom-hap-nuoc-dua-tuoi',
    title: 'Tôm hấp nước dừa tươi ngọt lịm',
    description: 'Tôm sú tươi roi rói hấp cùng nước dừa xiêm ngọt lịm, vỏ tôm đỏ au thịt tôm săn chắc ngọt ngào hương dừa thanh tao.',
    cuisine: 'vietnamese',
    category: 'mon_hap_luoc',
    region: 'nam',
    cookTimeMinutes: 12,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['tom-hap-nuoc-dua-tuoi'],
    nutrition: { calories: 190, proteinG: 30, fatG: 3, carbG: 8 },
    tags: ['Món hấp', 'Hải sản', 'Dưới 20 phút', 'Đặc sản Nam Bộ'],
    ingredients: [
      { ingredientId: 'SHRIMP', name: 'Tôm sú hoặc tôm càng tươi sống', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Sả cây đập dập', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'LIME', name: 'Chanh & muối tiêu hạt', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Tôm cắt bớt râu và chân bơi, rửa sạch để ráo.' },
      { stepNumber: 2, instruction: 'Đổ 1 bát nước dừa tươi vào nồi cùng sả đập dập, đun sôi bùng lên.' },
      { stepNumber: 3, instruction: 'Thả tôm vào đảo đều và đậy nắp hấp trong 6 phút đến khi tôm cong đều chuyển màu đỏ rực.', timerMinutes: 6 },
      { stepNumber: 4, instruction: 'Gắp tôm ra đĩa sâu lòng, xếp quanh quả dừa tươi hoặc trang trí cùng hành hoa.' },
      { stepNumber: 5, instruction: 'Thưởng thức nóng chấm muối tiêu chanh ớt ngọt lịm từng thớ thịt.' }
    ]
  },

  // =========================================================================
  // 6. MÓN CUỐN / NỘM / GỎI (mon_cuon_nom)
  // =========================================================================
  {
    id: 'vn-cuon-01',
    slug: 'goi-cuon-tom-thit-nam-bo',
    title: 'Gỏi cuốn tôm thịt chấm tương phộng',
    description: 'Cuốn bánh tráng trong veo lộ rõ tôm đỏ au, thịt ba chỉ, bún tươi và rau húng quế mát lành, chấm tương đen đậu phộng béo bùi.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'nam',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['goi-cuon-tom-thit-nam-bo'],
    nutrition: { calories: 310, proteinG: 22, fatG: 8, carbG: 38 },
    tags: ['Món cuốn', 'Healthy', 'Mùa hè', 'Đặc sản Nam Bộ'],
    ingredients: [
      { ingredientId: 'SHRIMP', name: 'Tôm sú tươi luộc bóc vỏ chẻ đôi', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ luộc thái mỏng', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bún tươi sợi nhỏ', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'RICE_PAPER', name: 'Bánh tráng dẻo cuốn gỏi', requiredQuantity: 1, unit: 'pack' },
      { ingredientId: 'SCALLION', name: 'Hẹ lá dài & rau húng quế', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'SOY_SAUCE', name: 'Tương đen & bơ đậu phộng', requiredQuantity: 40, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Tôm luộc chín bóc vỏ chẻ đôi sống lưng. Thịt ba chỉ luộc chín tới thái lát mỏng vừa.' },
      { stepNumber: 2, instruction: 'Thấm ướt nhẹ bánh tráng dẻo, đặt xà lách, rau thơm và một lọn bún tươi lên bánh.' },
      { stepNumber: 3, instruction: 'Xếp thịt ba chỉ vào trong, gấp mép bánh 2 bên lại rồi đặt 2-3 nửa con tôm mặt đỏ hướng ra ngoài cùng nhánh hẹ dài ló ra.' },
      { stepNumber: 4, instruction: 'Cuộn tròn chặt tay để thấy rõ lớp tôm thịt đẹp mắt qua lớp bánh tráng trong veo.' },
      { stepNumber: 5, instruction: 'Pha sốt chấm: Xào tỏi với tương đen bơ đậu phộng cho sánh mịn, rắc đậu phộng rang giã dập và ớt băm.' }
    ]
  },
  {
    id: 'vn-cuon-02',
    slug: 'pho-cuon-bo-ha-noi',
    title: 'Phở cuốn bò xào rau thơm Hà Nội',
    description: 'Bánh phở vuông mềm mượt cuốn gọn thịt bò xào tỏi thơm nức mũi và rau xà lách kinh giới, chấm nước mắm chua ngọt thanh tao.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'bac',
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['pho-cuon-bo-ha-noi'],
    nutrition: { calories: 330, proteinG: 24, fatG: 9, carbG: 40 },
    tags: ['Món cuốn', 'Hà Nội', 'Phố Trúc Bạch', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò thăn thái lát mỏng', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bánh phở vuông cán phẳng', requiredQuantity: 1, unit: 'pack' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm thơm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Rau húng Láng & xà lách', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm chấm chua ngọt', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu xào bò', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt bò ướp tỏi băm, tiêu xay và nước mắm 10 phút.' },
      { stepNumber: 2, instruction: 'Xào thịt bò trên chảo lửa cực lớn trong 1 phút cho thịt chín tới mềm mọng, không bị ra nước.' },
      { stepNumber: 3, instruction: 'Trải từng lá bánh phở vuông ra đĩa, đặt xà lách, rau thơm kinh giới và thịt bò xào lên trên.' },
      { stepNumber: 4, instruction: 'Cuộn tròn đều tay thành từng cuốn phở thon dài trắng ngần.' },
      { stepNumber: 5, instruction: 'Bày ra đĩa, chấm cùng nước mắm chua ngọt pha tỏi ớt cà rốt đu đủ giòn.' }
    ]
  },
  {
    id: 'vn-cuon-03',
    slug: 'nom-hoa-chuoi-tai-heo',
    title: 'Nộm hoa chuối tai heo giòn sần sật',
    description: 'Hoa chuối bào mỏng ngâm trắng tinh quyện cùng tai heo luộc giòn sần sật, vị chua ngọt thanh tao cùng lạc rang bùi bùi.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'bac',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['nom-hoa-chuoi-tai-heo'],
    nutrition: { calories: 260, proteinG: 20, fatG: 12, carbG: 18 },
    tags: ['Món nộm', 'Khai vị', 'Giòn sần sật', 'Ăn không ngấy'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Tai heo làm sạch luộc chín giòn', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'CARROT', name: 'Cà rốt nạo sợi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'BEAN_SPROUTS', name: 'Giá đỗ sống nhặt sạch', requiredQuantity: 100, unit: 'g' },
      { ingredientId: 'LIME', name: 'Chanh tươi vắt nước cốt', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt sừng băm & tỏi băm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm trộn gỏi', requiredQuantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Tai heo luộc cùng chút dấm gừng trong 15 phút, vớt ngâm nước đá rồi thái lát thật mỏng.', timerMinutes: 15 },
      { stepNumber: 2, instruction: 'Hoa chuối bào mỏng ngâm vào nước pha chanh muối loãng 15 phút để không bị thâm đen, vớt vắt ráo nước.' },
      { stepNumber: 3, instruction: 'Pha nước trộn nộm: 3 thìa nước mắm, 3 thìa đường, 3 thìa nước cốt chanh, tỏi ớt băm khuấy tan.' },
      { stepNumber: 4, instruction: 'Cho hoa chuối, tai heo, cà rốt, giá đỗ và rau răm vào âu lớn, rưới nước sốt trộn đều tay.' },
      { stepNumber: 5, instruction: 'Để 5 phút cho ngấm, chắt bớt nước nộm, rắc lạc rang giã dập lên trên trước khi dọn đĩa.' }
    ]
  },
  {
    id: 'vn-cuon-04',
    slug: 'goi-ga-xe-phay-bap-cai',
    title: 'Gỏi gà xé phay bắp cải hành tây',
    description: 'Thịt gà ta luộc xé sợi dai ngọt trộn cùng bắp cải bào mỏng giòn rụm, hành tây chua ngọt dịu và rau răm thơm the the.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'trung',
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['goi-ga-xe-phay-bap-cai'],
    nutrition: { calories: 280, proteinG: 32, fatG: 10, carbG: 16 },
    tags: ['Món gỏi', 'Miền Trung', 'Healthy', 'Đặc sản'],
    ingredients: [
      { ingredientId: 'CHICKEN_BREAST', name: 'Thịt gà ta luộc xé miếng vừa', requiredQuantity: 350, unit: 'g' },
      { ingredientId: 'CABBAGE', name: 'Bắp cải bào sợi mỏng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'ONION', name: 'Hành tây thái mỏng ngâm giấm đá', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'LIME', name: 'Nước cốt chanh tươi', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm trộn', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt sừng thái sợi & tiêu', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt gà luộc xé miếng dài vừa ăn. Bắp cải rửa sạch bào thật mỏng để ráo nước.' },
      { stepNumber: 2, instruction: 'Hành tây thái mỏng ngâm nước đá có pha chút giấm 10 phút để hết hăng và giữ độ giòn tan.' },
      { stepNumber: 3, instruction: 'Pha sốt trộn: 2 thìa mắm ngon, 2 thìa đường, 2 thìa cốt chanh, ớt băm và chút tiêu xay.' },
      { stepNumber: 4, instruction: 'Trộn đều thịt gà xé, bắp cải, hành tây cùng nước sốt trong âu lớn khoảng 3 phút.' },
      { stepNumber: 5, instruction: 'Thêm rau răm thái nhỏ và hành phi giòn, bày ra đĩa ăn kèm phồng tôm giòn rụm.' }
    ]
  },
  {
    id: 'vn-cuon-05',
    slug: 'nom-du-du-bo-kho',
    title: 'Nộm đu đủ bò khô phố cổ Hà Nội',
    description: 'Sợi đu đủ xanh nạo giòn sần sật hòa quyện nước mắm giấm chua ngọt cay cay, điểm xuyết từng sợi bò khô nâu óng thơm phức.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'bac',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['nom-du-du-bo-kho'],
    nutrition: { calories: 210, proteinG: 16, fatG: 5, carbG: 26 },
    tags: ['Món nộm', 'Phố Cổ', 'Ăn vặt', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'CARROT', name: 'Đu đủ xanh & cà rốt nạo sợi', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò khô xé sợi / gan bò tẩm vị', requiredQuantity: 100, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Rau kinh giới & rau húng bạc hà', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm pha giấm đường tỏi ớt', requiredQuantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đu đủ xanh và cà rốt nạo sợi dài, ngâm nước muối loãng 10 phút rồi vắt ráo để sợi nộm giòn tan.' },
      { stepNumber: 2, instruction: 'Pha nước trộn nộm chua ngọt chuẩn vị phố cổ: Giấm gạo thơm, đường cát, nước mắm và ớt tươi băm.' },
      { stepNumber: 3, instruction: 'Bốc một nắm sợi đu đủ cà rốt đặt vào đĩa sâu lòng.' },
      { stepNumber: 4, instruction: 'Rải bò khô xé sợi, rau kinh giới, rau húng thái khúc và lạc rang giã vỡ lên trên.' },
      { stepNumber: 5, instruction: 'Rưới đều nước giấm mắm chua ngọt trước khi thưởng thức, trộn đều tay và cảm nhận vị giòn sần sật.' }
    ]
  },
  {
    id: 'vn-cuon-06',
    slug: 'nem-lui-hue-nuong-sa',
    title: 'Nem lụi nướng sả cuốn bánh tráng',
    description: 'Thịt heo xay quết mịn bọc quanh thân cây sả tươi nướng xém cạnh thơm lừng, cuốn bánh tráng rau sống chấm nước lèo bùi ngậy.',
    cuisine: 'vietnamese',
    category: 'mon_cuon_nom',
    region: 'trung',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['nem-lui-hue-nuong-sa'],
    nutrition: { calories: 370, proteinG: 25, fatG: 20, carbG: 22 },
    tags: ['Món nướng', 'Xứ Huế', 'Món cuốn', 'Đặc sản'],
    ingredients: [
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo xay có mỡ dẻo', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Cây sả tươi làm que lụi', requiredQuantity: 8, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Hành tím & tỏi băm nhuyễn', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon & mật ong', requiredQuantity: 25, unit: 'ml' },
      { ingredientId: 'RICE_PAPER', name: 'Bánh tráng cuốn nem', requiredQuantity: 1, unit: 'pack' },
      { ingredientId: 'CUCUMBER', name: 'Dưa chuột & chuối chát', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Trộn giò sống và thịt xay cùng hành tỏi băm, nước mắm, mật ong, tiêu sọ, quết đều tay 10 phút cho dẻo quánh.' },
      { stepNumber: 2, instruction: 'Cây sả bóc bớt vỏ già, thoa dầu ăn lên tay lấy lượng thịt vừa đủ bọc quanh đầu cây sả.' },
      { stepNumber: 3, instruction: 'Nướng nem trên than hoa hoặc nồi chiên không dầu ở 180°C trong 15 phút, trở mặt cho vàng đều xém cạnh.', timerMinutes: 15 },
      { stepNumber: 4, instruction: 'Pha nước lèo chấm Huế: Gan heo băm nhỏ xào với tương đậu phộng và mè rang sánh đặc.' },
      { stepNumber: 5, instruction: 'Dùng bánh tráng cuốn nem lụi cùng rau sống, chuối chát, dưa leo chấm ngập nước lèo bùi béo.' }
    ]
  },

  // =========================================================================
  // 7. MÓN BÚN / PHỞ / MÌ / MIẾN (mon_bun_pho)
  // =========================================================================
  {
    id: 'vn-bun-01',
    slug: 'pho-bo-tai-lan-ha-noi',
    title: 'Phở bò tái lăn Hà Nội nước dùng trong vắt',
    description: 'Thịt bò thăn đảo tái lăn trên chảo lửa ngùn ngụt cùng tỏi gừng, chan nước dùng ninh xương ống thơm hồi quế thảo quả.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'bac',
    cookTimeMinutes: 35,
    servings: 4,
    difficulty: 'hard',
    imageUrl: VIETNAMESE_DISH_IMAGES['pho-bo-tai-lan-ha-noi'],
    nutrition: { calories: 480, proteinG: 34, fatG: 14, carbG: 56 },
    tags: ['Phở', 'Hà Nội', 'Tinh hoa ẩm thực', 'Bữa sáng / tối'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò bắp / thăn mềm', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bánh phở tươi sợi mềm', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng nướng thơm & hoa hồi quế', requiredQuantity: 30, unit: 'g' },
      { ingredientId: 'ONION', name: 'Hành tây & hành củ nướng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & ngò gai thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm truyền thống', requiredQuantity: 30, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Nước dùng ninh xương ống bò cùng gừng nướng, hành củ nướng, hồi quế trong nhiều giờ, vớt bọt liên tục để nước trong veo.' },
      { stepNumber: 2, instruction: 'Thịt bò thái mỏng ngang thớ, ướp với tỏi băm, gừng và chút xíu nước mắm tiêu.' },
      { stepNumber: 3, instruction: 'Làm nóng chảo với lửa lớn, cho thịt bò vào xào tái lăn nhanh trong 45 giây cho dậy mùi thơm xém cạnh.', timerMinutes: 1 },
      { stepNumber: 4, instruction: 'Chần bánh phở qua nước sôi xếp vào tô, đặt thịt bò xào tái lăn lên trên cùng đầu hành hoa chẻ.' },
      { stepNumber: 5, instruction: 'Chan nước dùng đang sôi sùng sục ngập bánh phở, rắc hành ngò thái nhỏ và vắt chanh ớt thưởng thức.' }
    ]
  },
  {
    id: 'vn-bun-02',
    slug: 'bun-cha-ha-noi-than-hoa',
    title: 'Bún chả nướng than hoa Hà Nội',
    description: 'Chả miếng ba chỉ nướng xém vàng ươm và chả băm viên đậm vị, thả trong bát nước mắm ấm chua ngọt dưa góp đu đủ.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'bac',
    cookTimeMinutes: 35,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['bun-cha-ha-noi-than-hoa'],
    nutrition: { calories: 510, proteinG: 32, fatG: 24, carbG: 45 },
    tags: ['Bún chả', 'Hà Nội', 'Đặc sản', 'Ăn trưa'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba chỉ thái miếng mỏng', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt nạc vai xay làm chả viên', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bún tươi lá hoặc sợi rối', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Hành tím & sả băm vắt lấy nước cốt', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Đu đủ & cà rốt làm dưa góp', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm pha nước chấm', requiredQuantity: 45, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Ướp chả miếng và chả viên với nước mắm, mật ong, nước hàng, hành tỏi băm và tiêu xay 20 phút.' },
      { stepNumber: 2, instruction: 'Viên chả băm thành từng miếng tròn dẹt, kẹp vỉ nướng than hoa cùng chả miếng đến khi mỡ xèo xèo vàng xém thơm nức.', timerMinutes: 15 },
      { stepNumber: 3, instruction: 'Làm dưa góp: Cà rốt và đu đủ thái lát mỏng ngâm giấm đường muối giòn tan.' },
      { stepNumber: 4, instruction: 'Pha nước chấm bún chả: Nước sôi ấm, nước mắm, giấm thanh, đường theo tỉ lệ 5:1:1:1 ấm nóng.' },
      { stepNumber: 5, instruction: 'Thả chả nướng nóng hổi và dưa góp vào bát nước mắm, ăn kèm bún tươi và đĩa rau sống tía tô kinh giới.' }
    ]
  },
  {
    id: 'vn-bun-03',
    slug: 'bun-bo-hue-chuan-vi',
    title: 'Bún bò xứ Huế giò heo chả cua sả ớt',
    description: 'Tô bún bò cay nồng thơm lừng mùi sả phi mắm ruốc, nước dùng ngọt đậm đà từ xương ống cùng bắp bò giòn sần sật.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'trung',
    cookTimeMinutes: 40,
    servings: 4,
    difficulty: 'hard',
    imageUrl: VIETNAMESE_DISH_IMAGES['bun-bo-hue-chuan-vi'],
    nutrition: { calories: 530, proteinG: 36, fatG: 22, carbG: 50 },
    tags: ['Bún bò', 'Xứ Huế', 'Cay nồng', 'Đậm vị'],
    ingredients: [
      { ingredientId: 'BEEF_SIRLOIN', name: 'Bắp bò hoa luộc thái lát', requiredQuantity: 350, unit: 'g' },
      { ingredientId: 'PORK_RIBS', name: 'Giò heo / xương ống ninh nước dùng', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bún sợi to cọng tròn Huế', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Sả cây đập dập bó lọn', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt bột Sa Tế cay nồng', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành tây thái mỏng & rau mùi', requiredQuantity: 1, unit: 'bunch' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Ninh xương heo và bắp bò cùng bó sả đập dập, hớt bọt kỹ để nước dùng trong ngọt đậm.', timerMinutes: 30 },
      { stepNumber: 2, instruction: 'Mắm ruốc Huế khuấy tan với nước lạnh để lắng cặn, chắt lấy nước trong trút vào nồi nước dùng.' },
      { stepNumber: 3, instruction: 'Phi thơm dầu màu điều với sả băm, tỏi băm và ớt bột cho vào nồi để tạo màu đỏ cam hấp dẫn.' },
      { stepNumber: 4, instruction: 'Chần bún sợi to vào tô, xếp bắp bò thái mỏng, khoanh giò heo và chả lụa lên trên.' },
      { stepNumber: 5, instruction: 'Chan nước dùng đang sôi lăn tăn, rắc hành tây thái mỏng, hoa chuối bào sợi và vắt chanh thưởng thức.' }
    ]
  },
  {
    id: 'vn-bun-04',
    slug: 'bun-rieu-cua-dong',
    title: 'Bún riêu cua đồng bắp bò giấm bỗng',
    description: 'Bát bún riêu đỏ cam óng ả với tảng riêu cua đồng béo ngậy, đậu phụ rán giòn, thịt bò tái chần và nước dùng chua dịu giấm bỗng.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'bac',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['bun-rieu-cua-dong'],
    nutrition: { calories: 440, proteinG: 30, fatG: 16, carbG: 48 },
    tags: ['Bún riêu', 'Hà Nội', 'Mùa hè', 'Cua đồng'],
    ingredients: [
      { ingredientId: 'CRAB_MEAT', name: 'Cua đồng xay lọc lấy nước riêu', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'TOFU', name: 'Đậu phụ rán vàng giòn', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua bổ múi cau', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò tái chần mềm', requiredQuantity: 200, unit: 'g', isOptional: true },
      { ingredientId: 'NOODLE', name: 'Bún tươi sợi nhỏ', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & kinh giới tía tô', requiredQuantity: 1, unit: 'bunch' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đun nước lọc cua với chút muối trên lửa vừa, hạ nhỏ lửa khi sôi để mảng riêu cua kết tảng nổi lên bề mặt.' },
      { stepNumber: 2, instruction: 'Vớt mảng riêu cua ra bát riêng để không bị nát vỡ.' },
      { stepNumber: 3, instruction: 'Xào cà chua với chút dầu màu điều rồi trút vào nồi nước cua, thêm giấm bỗng nếp chua thanh tao.', timerMinutes: 5 },
      { stepNumber: 4, instruction: 'Cho đậu rán vàng vào nồi nước dùng đun sôi nhỏ lửa cho ngấm vị.' },
      { stepNumber: 5, instruction: 'Cho bún vào tô, thêm riêu cua, thịt bò chần tái, đậu rán, chan nước dùng cà chua nóng hổi rắc hành hoa lên trên.' }
    ]
  },
  {
    id: 'vn-bun-05',
    slug: 'bun-thit-nuong-nam-bo',
    title: 'Bún thịt nướng Nam Bộ chả giò mỡ hành',
    description: 'Thịt nướng vỉ thơm lừng mè rang và sả ớt, ăn kèm bún tươi, mỡ hành xanh mướt, đậu phộng rang giòn và nước mắm chua ngọt.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'nam',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['bun-thit-nuong-nam-bo'],
    nutrition: { calories: 490, proteinG: 28, fatG: 20, carbG: 52 },
    tags: ['Bún thịt nướng', 'Nam Bộ', 'Ăn trưa', 'Đưa miệng'],
    ingredients: [
      { ingredientId: 'PORK_BELLY', name: 'Thịt ba rọi / nạc dăm ướp nướng', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Bún tươi', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành lá làm mỡ hành', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'CUCUMBER', name: 'Dưa leo băm & xà lách rau thơm', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm tỏi ớt chua ngọt', requiredQuantity: 40, unit: 'ml' },
      { ingredientId: 'CARROT', name: 'Đồ chua củ cải cà rốt', requiredQuantity: 1, unit: 'piece' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Thịt thái lát mỏng ướp sả băm, tỏi băm, nước mắm, mật ong, dầu hào và mè trắng 30 phút.' },
      { stepNumber: 2, instruction: 'Nướng thịt trên than hoa hoặc lò nướng 200°C trong 12 phút đến khi thịt vàng óng xém cạnh.', timerMinutes: 12 },
      { stepNumber: 3, instruction: 'Hành lá thái nhỏ cho vào chén với chút muối, xối dầu ăn đun thật sôi vào làm mỡ hành xanh ngắt.' },
      { stepNumber: 4, instruction: 'Xếp rau sống, dưa leo băm và bún tươi vào tô lớn, gắp thịt nướng nóng hổi lên trên.' },
      { stepNumber: 5, instruction: 'Rưới mỡ hành, đồ chua và rắc đậu phộng rang, chan nước mắm chua ngọt trộn đều thưởng thức.' }
    ]
  },
  {
    id: 'vn-bun-06',
    slug: 'mien-ga-nam-huong',
    title: 'Miến gà nấm hương mộc nhĩ thanh tao',
    description: 'Sợi miến dong dai trong vắt nấu trong nước luộc gà ngọt thanh tao, thơm ngát nấm hương rừng và thịt gà xé phay mềm ngọt.',
    cuisine: 'vietnamese',
    category: 'mon_bun_pho',
    region: 'bac',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['mien-ga-nam-huong'],
    nutrition: { calories: 360, proteinG: 29, fatG: 8, carbG: 45 },
    tags: ['Miến gà', 'Hà Nội', 'Thanh đạm', 'Ấm bụng'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Thịt gà luộc xé miếng', requiredQuantity: 350, unit: 'g' },
      { ingredientId: 'NOODLE', name: 'Miến dong làng So ngâm mềm', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Nấm hương rừng ngâm nở', requiredQuantity: 40, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & rau răm thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Miến dong ngâm nước ấm 10 phút cho mềm rồi cắt khúc vừa ăn.' },
      { stepNumber: 2, instruction: 'Nấm hương ngâm nở rửa sạch, xào sơ với chút nước mắm và đầu hành phi cho thơm ngậy.' },
      { stepNumber: 3, instruction: 'Đun sôi nước luộc gà, trút nấm hương vào nấu trong 5 phút để nước dùng thơm mùi nấm.', timerMinutes: 5 },
      { stepNumber: 4, instruction: 'Chần miến vào nồi nước dùng 1 phút rồi vớt ra tô, xếp thịt gà xé phay lên trên.' },
      { stepNumber: 5, instruction: 'Chan nước dùng gà nóng hổi ngập miến, rắc hành hoa rau răm và hạt tiêu cay thơm.' }
    ]
  },

  // =========================================================================
  // 8. MÓN CHAY THANH TỊNH (mon_chay)
  // =========================================================================
  {
    id: 'vn-chay-01',
    slug: 'dau-phu-kho-nam-dong-co',
    title: 'Đậu phụ kho nấm đông cô tiêu đen',
    description: 'Đậu phụ rán vàng óng kho ngấm đượm sốt tương đen cùng nấm đông cô ngọt bùi, thơm nức tiêu sọ xay cay the ấm nồng.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'toan_quoc',
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['dau-phu-kho-nam-dong-co'],
    nutrition: { calories: 210, proteinG: 18, fatG: 9, carbG: 16 },
    tags: ['Món chay', 'Thanh lọc', 'Đậu phụ', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'TOFU', name: 'Đậu phụ cắt miếng chiên vàng', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'MUSHROOM', name: 'Nấm đông cô / nấm đùi gà', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'SOY_SAUCE', name: 'Nước tương ngon & dầu hào chay', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'CHILI', name: 'Ớt tươi & tiêu đen đập dập', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu mè & dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đậu phụ cắt vuông chiên vàng giòn các mặt. Nấm đông cô ngâm nở cắt chân khía chữ thập trên mũ.' },
      { stepNumber: 2, instruction: 'Phi thơm boa-rô trên chảo, cho nấm vào xào sơ cho săn thơm.' },
      { stepNumber: 3, instruction: 'Pha sốt kho: 3 thìa nước tương, 1 thìa dầu hào chay, 1 thìa đường và nửa chén nước lọc.' },
      { stepNumber: 4, instruction: 'Xếp đậu phụ và nấm vào nồi đất, đổ nước sốt kho lửa nhỏ trong 12 phút đến khi nước keo sánh.', timerMinutes: 12 },
      { stepNumber: 5, instruction: 'Rưới 1 thìa dầu mè thơm và rắc nhiều tiêu đen xay lên trên, dùng nóng với cơm trắng.' }
    ]
  },
  {
    id: 'vn-chay-02',
    slug: 'canh-nam-hat-sen-tao-do',
    title: 'Canh nấm hạt sen táo đỏ thanh lọc',
    description: 'Nước canh trong veo ngọt ngào từ củ quả ninh tự nhiên, hạt sen bở tơi bùi béo cùng các loại nấm tươi bổ dưỡng an thần.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'toan_quoc',
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-nam-hat-sen-tao-do'],
    nutrition: { calories: 170, proteinG: 8, fatG: 3, carbG: 28 },
    tags: ['Món chay', 'Bổ dưỡng', 'An thần', 'Thanh nhiệt'],
    ingredients: [
      { ingredientId: 'MUSHROOM', name: 'Nấm đùi gà & nấm kim châm', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'CARROT', name: 'Cà rốt tỉa hoa', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'WINTER_MELON', name: 'Bắp ngọt & củ sen thái lát', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Mùi tàu & boa-rô', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'SOY_SAUCE', name: 'Muối hột & hạt nêm chay', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Hạt sen thông tâm ngâm mềm. Cà rốt và củ quả gọt vỏ cắt miếng vừa ăn.' },
      { stepNumber: 2, instruction: 'Đun sôi 1 lít nước, cho hạt sen và bắp ngọt vào hầm nhỏ lửa 15 phút cho tiết vị ngọt thanh.', timerMinutes: 15 },
      { stepNumber: 3, instruction: 'Cho cà rốt và các loại nấm tươi vào nấu thêm 5 phút cho nấm chín giòn ngọt.', timerMinutes: 5 },
      { stepNumber: 4, instruction: 'Nêm chút muối hột và hạt nêm chay nấm cho vừa vị ngọt dịu thanh tao.' },
      { stepNumber: 5, instruction: 'Múc canh ra tô sứ, rắc ngò gai thái nhỏ lên trên và thưởng thức nóng.' }
    ]
  },
  {
    id: 'vn-chay-03',
    slug: 'mi-xao-chay-rau-nam',
    title: 'Mì xào giòn chay nấm rau củ',
    description: 'Sợi mì xào vàng thơm tơi sợi không bết dính, đảo cùng nấm đùi gà dai giòn, cải ngọt và cà rốt ngập tràn sốt dầu hào chay.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['mi-xao-chay-rau-nam'],
    nutrition: { calories: 310, proteinG: 12, fatG: 11, carbG: 42 },
    tags: ['Món chay', 'Mì xào', 'Dưới 20 phút', 'Nhanh gọn'],
    ingredients: [
      { ingredientId: 'NOODLE', name: 'Mì sợi vàng / mì gói chần sơ', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Nấm đùi gà thái lát mỏng', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'CARROT', name: 'Cà rốt thái sợi', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'CABBAGE', name: 'Cải ngọt / bắp cải', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SOY_SAUCE', name: 'Xì dầu & dầu hào chay', requiredQuantity: 25, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Mì chần qua nước sôi 1 phút rồi xả ngay nước lạnh, trộn chút dầu ăn để sợi mì tơi giòn.' },
      { stepNumber: 2, instruction: 'Phi thơm hành boa-rô, cho nấm đùi gà vào xào lửa lớn cho xém cạnh thơm nức.' },
      { stepNumber: 3, instruction: 'Cho cải ngọt và cà rốt vào đảo chung trong 2 phút với 1 thìa xì dầu.' },
      { stepNumber: 4, instruction: 'Trút sợi mì vào chảo, rưới sốt dầu hào chay đảo đều tay trên lửa lớn 2 phút.', timerMinutes: 2 },
      { stepNumber: 5, instruction: 'Rắc hạt tiêu thơm lừng và trút ra đĩa thưởng thức ngay khi còn nóng.' }
    ]
  },
  {
    id: 'vn-chay-04',
    slug: 'ca-tim-nuong-mo-hanh',
    title: 'Cà tím nướng mỡ hành nước tương tỏi ớt',
    description: 'Cà tím nướng than thơm lừng mùi khói, thịt cà mềm mọng ngọt ngào phủ ngập mỡ hành béo ngậy và nước tương tỏi ớt.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'nam',
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['ca-tim-nuong-mo-hanh'],
    nutrition: { calories: 160, proteinG: 4, fatG: 11, carbG: 14 },
    tags: ['Món chay', 'Dân dã', 'Nam Bộ', 'Ngon miệng'],
    ingredients: [
      { ingredientId: 'BITTER_MELON', name: 'Cà tím dài quả thẳng', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'CHILI', name: 'Ớt tươi băm nhuyễn', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm nhỏ', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SOY_SAUCE', name: 'Nước tương hảo hạng', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn làm mỡ hành', requiredQuantity: 25, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cà tím để nguyên cuống rửa sạch, dùng nĩa xăm vài lỗ nhỏ trên thân quả.' },
      { stepNumber: 2, instruction: 'Nướng cà tím trên than hoa hoặc nồi chiên không dầu ở 190°C trong 15 phút đến khi vỏ cháy xém mềm nhũn.', timerMinutes: 15 },
      { stepNumber: 3, instruction: 'Lột sạch lớp vỏ cháy bên ngoài, xếp phần thịt cà trắng mềm ra đĩa, dùng dĩa tước nhẹ thành dải dài.' },
      { stepNumber: 4, instruction: 'Hành hoa thái nhỏ xối dầu nóng làm mỡ hành xanh mướt, rải đều lên khắp thân cà tím.' },
      { stepNumber: 5, instruction: 'Rưới nước tương pha tỏi ớt đường chua ngọt, rắc thêm đậu phộng rang giã dập lên trên.' }
    ]
  },
  {
    id: 'vn-chay-05',
    slug: 'dau-hu-non-sot-nam-rom',
    title: 'Đậu hũ non sốt nấm rơm dầu hào',
    description: 'Từng lát đậu hũ non mềm mịn như lụa tan ngay đầu lưỡi, ngập trong lớp sốt nấm rơm bóng bẩy đậm đà sánh ngậy.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['dau-hu-non-sot-nam-rom'],
    nutrition: { calories: 180, proteinG: 14, fatG: 7, carbG: 16 },
    tags: ['Món chay', 'Đậu hũ non', 'Dưới 20 phút', 'Mềm mịn'],
    ingredients: [
      { ingredientId: 'TOFU', name: 'Đậu hũ non cây cắt khoanh tròn', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'MUSHROOM', name: 'Nấm rơm tươi cắt đôi', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & ngò rí', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'SOY_SAUCE', name: 'Dầu hào chay & xì dầu', requiredQuantity: 25, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đậu hũ non cắt khoanh tròn dày 1.5cm, xếp ra đĩa sâu lòng đem hấp cách thủy 5 phút cho nóng ấm.' },
      { stepNumber: 2, instruction: 'Nấm rơm cạo sạch chân nấm ngâm nước muối 10 phút rồi vớt ráo.' },
      { stepNumber: 3, instruction: 'Phi thơm boa-rô, cho nấm rơm vào xào lửa lớn trong 2 phút.' },
      { stepNumber: 4, instruction: 'Hòa sốt gồm: 2 thìa dầu hào chay, 1 thìa xì dầu, 1 thìa bột bắp và 4 thìa nước đổ vào chảo đun sánh lại.', timerMinutes: 3 },
      { stepNumber: 5, instruction: 'Rưới nước sốt nấm rơm đang sôi lục bục phủ đều lên đĩa đậu hũ non, rắc tiêu thơm và ngò rí.' }
    ]
  },
  {
    id: 'vn-chay-06',
    slug: 'canh-cai-nau-dau-phu-non',
    title: 'Canh cải xanh gừng đậu phụ thanh mát',
    description: 'Bát canh cải bẹ xanh tươi non nấu cùng gừng tươi đập dập cay nồng và đậu phụ béo mềm, xua tan hàn khí ấm bụng.',
    cuisine: 'vietnamese',
    category: 'mon_chay',
    region: 'toan_quoc',
    cookTimeMinutes: 12,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['canh-cai-nau-dau-phu-non'],
    nutrition: { calories: 125, proteinG: 10, fatG: 5, carbG: 11 },
    tags: ['Món canh', 'Món chay', 'Ấm bụng', 'Dưới 20 phút'],
    ingredients: [
      { ingredientId: 'WATER_SPINACH', name: 'Rau cải bẹ xanh cắt khúc', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'TOFU', name: 'Đậu phụ trắng cắt miếng vuông', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GINGER', name: 'Gừng già đập dập thơm cay', requiredQuantity: 25, unit: 'g' },
      { ingredientId: 'SOY_SAUCE', name: 'Muối hột & hạt nêm chay', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cải xanh rửa sạch, cắt khúc 3cm để ráo. Đậu phụ cắt miếng vuông nhỏ.' },
      { stepNumber: 2, instruction: 'Đun sôi 800ml nước, thả gừng già đập dập vào đun sôi 2 phút cho dậy mùi cay thơm.', timerMinutes: 2 },
      { stepNumber: 3, instruction: 'Thả đậu phụ vào nấu sôi lăn tăn, nêm muối và hạt nêm chay vừa miệng.' },
      { stepNumber: 4, instruction: 'Cho rau cải xanh vào ấn chìm xuống nước, đun sôi bùng lại trong 1.5 phút để rau vừa chín giữ màu xanh mướt.' },
      { stepNumber: 5, instruction: 'Múc canh ra tô ăn nóng, vị đắng nhẹ của cải hòa cùng gừng cay ấm áp.' }
    ]
  },

  // =========================================================================
  // 9. MÓN ĂN SÁNG & DƯỚI 20 PHÚT (mon_nhanh_sang)
  // =========================================================================
  {
    id: 'vn-sang-01',
    slug: 'com-chien-trung-toi-hanh-hoa',
    title: 'Cơm chiên trứng vàng giòn tỏi phi',
    description: 'Hạt cơm nguội vàng óng bọc đều lớp trứng gà bóng bẩy, chiên giòn tơi xốp dậy mùi thơm nức của tỏi phi và hành hoa.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 12,
    servings: 2,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['com-chien-trung-toi-hanh-hoa'],
    nutrition: { calories: 380, proteinG: 14, fatG: 12, carbG: 55 },
    tags: ['Ăn sáng', 'Cơm chiên', 'Dưới 20 phút', 'Tiết kiệm'],
    ingredients: [
      { ingredientId: 'RICE', name: 'Cơm nguội tơi xốp', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà tươi', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm nhiều phi giòn', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đập 1 quả trứng gà vào tô cơm nguội, dùng bao tay bóp nhẹ để lòng đỏ trứng bao bọc đều từng hạt cơm.' },
      { stepNumber: 2, instruction: 'Đun nóng dầu ăn trên chảo lớn, cho tỏi băm vào phi vàng giòn thơm nức rồi vớt 1 nửa ra để riêng.' },
      { stepNumber: 3, instruction: 'Đập quả trứng còn lại vào chảo đảo tơi thành các vụn trứng vàng óng.' },
      { stepNumber: 4, instruction: 'Trút cơm vào chảo đảo liên tục trên lửa lớn trong 5 phút đến khi hạt cơm săn lại nhảy tanh tách.', timerMinutes: 5 },
      { stepNumber: 5, instruction: 'Rưới nước mắm quanh thành chảo cho dậy mùi thơm khói, rắc hành lá và tỏi phi giòn lên trên.' }
    ]
  },
  {
    id: 'vn-sang-02',
    slug: 'banh-mi-op-la-pate',
    title: 'Bánh mì ốp la pate dưa leo',
    description: 'Ổ bánh mì giòn tan kẹp quả trứng ốp la lòng đào béo ngậy, quét đẫm lớp pate Hải Phòng thơm lừng và dưa leo mát rượi.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['banh-mi-op-la-pate'],
    nutrition: { calories: 420, proteinG: 19, fatG: 22, carbG: 38 },
    tags: ['Bánh mì', 'Ăn sáng', 'Dưới 20 phút', 'Quốc dân'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà ốp la lòng đào', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'CUCUMBER', name: 'Dưa leo thái lát mỏng', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Rau mùi tươi', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'SOY_SAUCE', name: 'Xì dầu & tương ớt', requiredQuantity: 15, unit: 'ml' },
      { ingredientId: 'BUTTER', name: 'Bơ thực vật chiên trứng', requiredQuantity: 15, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Làm nóng chảo, cho chút bơ vào đun chảy rồi đập trứng gà vào ốp la lòng đào trong 2 phút.', timerMinutes: 2 },
      { stepNumber: 2, instruction: 'Rạch dọc ổ bánh mì, nướng sơ qua chảo hoặc lò nướng cho vỏ giòn rụm.' },
      { stepNumber: 3, instruction: 'Quết một lớp pate gan mịn màng béo ngậy vào ruột bánh.' },
      { stepNumber: 4, instruction: 'Kẹp trứng ốp la vào giữa, xếp dưa leo, ngò rí tươi mát lên trên.' },
      { stepNumber: 5, instruction: 'Rưới chút xì dầu và tương ớt cay nồng rồi thưởng thức ngay lúc nóng giòn rụm.' }
    ]
  },
  {
    id: 'vn-sang-03',
    slug: 'chao-thit-bam-gung-tia-to',
    title: 'Cháo thịt bằm gừng tía tô giải cảm',
    description: 'Bát cháo hoa sánh mịn nấu từ hạt gạo rang thơm, thịt nạc heo băm ngọt lịm cùng lá tía tô và gừng già giải cảm hiệu quả.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['chao-thit-bam-gung-tia-to'],
    nutrition: { calories: 290, proteinG: 20, fatG: 8, carbG: 35 },
    tags: ['Cháo', 'Giải cảm', 'Ăn sáng', 'Ấm bụng'],
    ingredients: [
      { ingredientId: 'RICE', name: 'Gạo tẻ trộn chút nếp rang vàng', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'GROUND_PORK', name: 'Thịt heo nạc băm nhỏ', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'GINGER', name: 'Gừng già thái chỉ', requiredQuantity: 25, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & lá tía tô thái sợi', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon & tiêu', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gạo rang thơm nấu cùng 1 lít nước sôi trong 15 phút đến khi hạt gạo nở bung sánh mịn.', timerMinutes: 15 },
      { stepNumber: 2, instruction: 'Thịt bằm ướp hành tím, nước mắm và hạt tiêu xào săn thơm.' },
      { stepNumber: 3, instruction: 'Trút thịt bằm và gừng thái chỉ vào nồi cháo đang sôi khuấy đều tay trong 3 phút.' },
      { stepNumber: 4, instruction: 'Lót hành hoa và tía tô thái sợi dưới đáy bát sứ.' },
      { stepNumber: 5, instruction: 'Múc cháo nóng sôi sục lên trên, rắc nhiều tiêu đen xay làm toát mồ hôi giải cảm sảng khoái.' }
    ]
  },
  {
    id: 'vn-sang-04',
    slug: 'mi-tom-xao-bo-trung-long-dao',
    title: 'Mì gói xào bò trứng lòng đào',
    description: 'Sợi mì tôm chần xào giòn dai không nát, hòa cùng thịt bò xào mềm ngọt, rau cải giòn mát và quả trứng ốp lòng đào béo ngậy.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['mi-tom-xao-bo-trung-long-dao'],
    nutrition: { calories: 460, proteinG: 28, fatG: 20, carbG: 44 },
    tags: ['Mì xào', 'Ăn nhanh', 'Dưới 20 phút', 'Sinh viên'],
    ingredients: [
      { ingredientId: 'NOODLE', name: 'Gói mì ăn liền hảo hạng', requiredQuantity: 2, unit: 'pack' },
      { ingredientId: 'BEEF_SIRLOIN', name: 'Thịt bò thăn thái mỏng', requiredQuantity: 200, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà ốp la', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'WATER_SPINACH', name: 'Rau cải ngọt / rau muống', requiredQuantity: 150, unit: 'g' },
      { ingredientId: 'GARLIC', name: 'Tỏi băm thơm', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn', requiredQuantity: 20, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Mì tôm trụng qua nước sôi 1 phút vớt ra ngay, xả nước lạnh trộn chút dầu ăn để sợi mì tơi dai.' },
      { stepNumber: 2, instruction: 'Phi thơm tỏi, xào thịt bò trên lửa lớn trong 1 phút rồi múc riêng ra đĩa.' },
      { stepNumber: 3, instruction: 'Xào rau cải chín tới, cho mì vào đảo nhanh tay cùng gói gia vị mì và 1 thìa xì dầu.', timerMinutes: 2 },
      { stepNumber: 4, instruction: 'Cho thịt bò trở lại chảo đảo đều 30 giây rồi trút ra đĩa.' },
      { stepNumber: 5, instruction: 'Đặt quả trứng ốp la lòng đào lên trên, rạch nhẹ để lòng đỏ béo ngậy tan chảy quyện vào sợi mì.' }
    ]
  },
  {
    id: 'vn-sang-05',
    slug: 'trung-cuon-rau-cu-han-quoc',
    title: 'Trứng cuộn rau củ mềm mịn',
    description: 'Trứng gà đánh mịn cuộn tròn nhiều lớp xen kẽ cà rốt và hành hoa thái hạt lựu xinh xắn, món ăn sáng giàu protein cho cả nhà.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 12,
    servings: 2,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['trung-cuon-rau-cu-han-quoc'],
    nutrition: { calories: 220, proteinG: 16, fatG: 15, carbG: 6 },
    tags: ['Trứng cuộn', 'Ăn sáng', 'Dưới 20 phút', 'Bé thích'],
    ingredients: [
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà tươi', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'CARROT', name: 'Cà rốt băm hạt lựu nhỏ li ti', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành lá băm nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FRESH_MILK', name: 'Sữa tươi không đường (làm mềm trứng)', requiredQuantity: 20, unit: 'ml' },
      { ingredientId: 'COOKING_OIL', name: 'Dầu ăn tráng chảo', requiredQuantity: 10, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Đập trứng ra âu cùng 20ml sữa tươi, cà rốt băm, hành hoa và 1 thìa nước mắm, đánh tan đều.' },
      { stepNumber: 2, instruction: 'Quết một lớp dầu mỏng lên chảo chống dính, đun lửa nhỏ vừa rồi đổ một lớp trứng mỏng tráng đều đáy chảo.' },
      { stepNumber: 3, instruction: 'Khi mặt trứng se lại, dùng đũa cuộn tròn dần về một góc chảo.' },
      { stepNumber: 4, instruction: 'Kéo cuộn trứng lại, đổ tiếp lớp trứng mới vào nối tiếp, lặp lại quá trình cuộn tròn dày dặn.', timerMinutes: 6 },
      { stepNumber: 5, instruction: 'Lấy cuộn trứng ra thớt để nguội 2 phút rồi cắt khoanh tròn 1.5cm xếp ra đĩa.' }
    ]
  },
  {
    id: 'vn-sang-06',
    slug: 'sup-ga-ngo-non-nam-huong',
    title: 'Súp gà ngô non nấm hương trứng hoa',
    description: 'Bát súp nóng hổi sánh óng ánh với những vân trứng hoa bay lượn, thịt gà xé ngọt mềm cùng hạt ngô ngọt giòn bùi.',
    cuisine: 'vietnamese',
    category: 'mon_nhanh_sang',
    region: 'toan_quoc',
    cookTimeMinutes: 18,
    servings: 4,
    difficulty: 'easy',
    imageUrl: VIETNAMESE_DISH_IMAGES['sup-ga-ngo-non-nam-huong'],
    nutrition: { calories: 210, proteinG: 22, fatG: 6, carbG: 19 },
    tags: ['Súp', 'Ăn sáng', 'Dưới 20 phút', 'Khai vị'],
    ingredients: [
      { ingredientId: 'CHICKEN_BREAST', name: 'Ức gà ta luộc xé sợi nhỏ', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', name: 'Trứng gà đánh tan tạo vân', requiredQuantity: 1, unit: 'piece' },
      { ingredientId: 'MUSHROOM', name: 'Nấm hương ngâm nở thái chỉ', requiredQuantity: 40, unit: 'g' },
      { ingredientId: 'SCALLION', name: 'Rau mùi & hành lá', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Hạt nêm & tiêu trắng', requiredQuantity: 15, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Ức gà luộc chín xé sợi mỏng. Giữ lại nước luộc gà ngọt thơm làm nước súp.' },
      { stepNumber: 2, instruction: 'Đun sôi nước luộc gà, cho ngô non ngọt và nấm hương thái chỉ vào nấu trong 5 phút.', timerMinutes: 5 },
      { stepNumber: 3, instruction: 'Hòa 2 thìa bột bắp với nước lọc, từ từ rót vào nồi súp khuấy đều một chiều đến khi sánh mịn óng ả.' },
      { stepNumber: 4, instruction: 'Đánh tan trứng gà, đổ qua rây vào nồi súp đang sôi đồng thời khuấy nhẹ tay để tạo các vân hoa trứng tuyệt đẹp.' },
      { stepNumber: 5, instruction: 'Múc súp ra bát, rắc ngò rí và tiêu sọ trắng thơm ấm nóng.' }
    ]
  },

  // =========================================================================
  // 10. MÓN LẨU & TIỆC GIA ĐÌNH (mon_lau_tiec)
  // =========================================================================
  {
    id: 'vn-lau-01',
    slug: 'lau-rieu-cua-dong-bap-bo-suon-sun',
    title: 'Lẩu riêu cua đồng sườn sụn bắp bò',
    description: 'Nồi lẩu riêu cua bốc khói nghi ngút thơm nồng giấm bỗng, tảng riêu cua vàng ngậy nhúng bắp bò hoa giòn và sườn non sần sật.',
    cuisine: 'vietnamese',
    category: 'mon_lau_tiec',
    region: 'bac',
    cookTimeMinutes: 45,
    servings: 6,
    difficulty: 'hard',
    imageUrl: VIETNAMESE_DISH_IMAGES['lau-rieu-cua-dong-bap-bo-suon-sun'],
    nutrition: { calories: 560, proteinG: 48, fatG: 26, carbG: 34 },
    tags: ['Món lẩu', 'Tiệc gia đình', 'Hà Nội', 'Cực phẩm'],
    ingredients: [
      { ingredientId: 'CRAB_MEAT', name: 'Cua đồng tươi giã nhuyễn lọc lấy riêu', requiredQuantity: 600, unit: 'g' },
      { ingredientId: 'BEEF_SIRLOIN', name: 'Bắp bò hoa thái lát mỏng nhúng lẩu', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'PORK_RIBS', name: 'Sườn sụn heo chần sơ chặt nhỏ', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'TOFU', name: 'Đậu phụ rán giòn phồng', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'TOMATO', name: 'Cà chua chín bổ múi cau', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'NOODLE', name: 'Bún tươi ăn kèm', requiredQuantity: 600, unit: 'g' },
      { ingredientId: 'WATER_SPINACH', name: 'Rau muống chẻ & hoa chuối bào', requiredQuantity: 1, unit: 'bunch' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Sườn sụn chần nước sôi rồi ninh nhỏ lửa 25 phút để sườn mềm giòn sần sật.', timerMinutes: 25 },
      { stepNumber: 2, instruction: 'Nấu nước lọc cua đồng tạo mảng riêu cua lớn, vớt riêu ra đĩa riêng.' },
      { stepNumber: 3, instruction: 'Phi thơm hành khô với dầu màu điều, xào cà chua rồi trút vào nồi nước dùng cùng giấm bỗng thơm nức.' },
      { stepNumber: 4, instruction: 'Đổ nước sườn sụn vào hòa cùng nước riêu cua, nêm gia vị vừa vị chua thanh ngọt béo.' },
      { stepNumber: 5, instruction: 'Đặt nồi lẩu lên bếp từ, thả đậu rán và mảng riêu cua vào, nhúng bắp bò, sườn sụn và rau muống chẻ ăn kèm bún.' }
    ]
  },
  {
    id: 'vn-lau-02',
    slug: 'lau-ga-la-giang-chua-cay',
    title: 'Lẩu gà ta lá giang chua cay Nam Bộ',
    description: 'Thịt gà ta da giòn thịt săn chắc nấu cùng lá giang vò dập chua thanh thanh the mát, làm ấm lòng những ngày mưa.',
    cuisine: 'vietnamese',
    category: 'mon_lau_tiec',
    region: 'nam',
    cookTimeMinutes: 40,
    servings: 5,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['lau-ga-la-giang-chua-cay'],
    nutrition: { calories: 490, proteinG: 42, fatG: 22, carbG: 30 },
    tags: ['Món lẩu', 'Nam Bộ', 'Gà ta', 'Chua cay'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Gà ta nguyên con chặt miếng', requiredQuantity: 1000, unit: 'g' },
      { ingredientId: 'LEMONGRASS', name: 'Sả tươi đập dập & tỏi băm', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'CHILI', name: 'Ớt hiểm đập dập', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Ngò gai & ngò ôm', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'NOODLE', name: 'Bún tươi sợi nhỏ', requiredQuantity: 500, unit: 'g' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm cá cơm ngon', requiredQuantity: 40, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gà chặt miếng vừa ăn, ướp với sả băm, tỏi, ớt hiểm, nước mắm trong 20 phút.' },
      { stepNumber: 2, instruction: 'Phi thơm tỏi và sả cây đập dập, cho thịt gà vào xào săn chắc đều các mặt.' },
      { stepNumber: 3, instruction: 'Đổ 1.5 lít nước vào hầm gà lửa nhỏ trong 20 phút cho gà chín mềm ngọt nước.', timerMinutes: 20 },
      { stepNumber: 4, instruction: 'Lá giang rửa sạch, dùng tay vò nhẹ cho dập lá rồi thả vào nồi nước dùng đun sôi 3 phút cho tiết vị chua dịu thanh.' },
      { stepNumber: 5, instruction: 'Nêm lại nước mắm vừa ăn, nhúng ngò gai ngò ôm và bún tươi thưởng thức nóng hổi.' }
    ]
  },
  {
    id: 'vn-lau-03',
    slug: 'lau-hai-san-thap-cam-chua-cay',
    title: 'Lẩu hải sản tôm mực chua cay',
    description: 'Nồi lẩu hải sản ngập tràn tôm sú tươi roi rói, mực ống giòn sần sật, nước dùng Tom Yum chua cay ngọt đậm vị biển.',
    cuisine: 'vietnamese',
    category: 'mon_lau_tiec',
    region: 'toan_quoc',
    cookTimeMinutes: 35,
    servings: 5,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['lau-hai-san-thap-cam-chua-cay'],
    nutrition: { calories: 430, proteinG: 46, fatG: 12, carbG: 34 },
    tags: ['Món lẩu', 'Hải sản', 'Chua cay', 'Tiệc tùng'],
    ingredients: [
      { ingredientId: 'SHRIMP', name: 'Tôm sú tươi sống', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'SQUID', name: 'Mực ống khía vảy rồng cắt khoanh', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'FISH_FRESHWATER', name: 'Phi lê cá tươi thái lát', requiredQuantity: 300, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Nấm kim châm & nấm đùi gà', requiredQuantity: 250, unit: 'g' },
      { ingredientId: 'TOMATO', name: 'Cà chua & dứa thơm', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'LEMONGRASS', name: 'Sả cây & lá chanh tươi', requiredQuantity: 4, unit: 'piece' },
      { ingredientId: 'NOODLE', name: 'Mì tôm hoặc bún tươi', requiredQuantity: 400, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Hải sản sơ chế sạch sẽ, tôm bỏ chỉ lưng, mực khía bông, cá thái mỏng xếp lên đĩa cùng nấm tươi.' },
      { stepNumber: 2, instruction: 'Phi thơm sả cây, tỏi gừng và ớt băm với chút dầu ăn, xào thơm cà chua và dứa.' },
      { stepNumber: 3, instruction: 'Đổ 1.8 lít nước hầm xương vào đun sôi bùng, vắt nước cốt chanh me và lá chanh vò dập tạo hương thơm lừng.', timerMinutes: 10 },
      { stepNumber: 4, instruction: 'Nêm nếm nước dùng chua chua cay cay hài hòa đậm đà.' },
      { stepNumber: 5, instruction: 'Đặt lên bàn tiệc, nhúng tôm, mực, cá và nấm kim châm ăn liền khi vừa chín tới để cảm nhận độ giòn ngọt mọng nước.' }
    ]
  },
  {
    id: 'vn-lau-04',
    slug: 'lau-nam-thap-cam-thanh-dam',
    title: 'Lẩu nấm thập cẩm gà ta thanh đạm bổ dưỡng',
    description: 'Nước lẩu hầm từ gà ta và các vị thảo mộc thiên nhiên ngọt lịm, nhúng cùng 6 loại nấm tươi giòn dai thanh lọc cơ thể.',
    cuisine: 'vietnamese',
    category: 'mon_lau_tiec',
    region: 'toan_quoc',
    cookTimeMinutes: 40,
    servings: 5,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['lau-nam-thap-cam-thanh-dam'],
    nutrition: { calories: 410, proteinG: 38, fatG: 14, carbG: 32 },
    tags: ['Món lẩu', 'Nấm tươi', 'Bổ dưỡng', 'Healthy'],
    ingredients: [
      { ingredientId: 'CHICKEN_THIGH', name: 'Gà ta thả vườn chặt miếng nhỏ', requiredQuantity: 800, unit: 'g' },
      { ingredientId: 'MUSHROOM', name: 'Thập cẩm nấm (đùi gà, kim châm, hương)', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'CARROT', name: 'Cà rốt & bắp ngọt', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'TOFU', name: 'Đậu phụ non thái lát', requiredQuantity: 2, unit: 'piece' },
      { ingredientId: 'NOODLE', name: 'Mì trứng sợi tươi', requiredQuantity: 400, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gà ta rửa sạch chần sơ nước sôi, cho vào nồi ninh cùng bắp ngọt và cà rốt 25 phút để lấy nước dùng ngọt thanh.', timerMinutes: 25 },
      { stepNumber: 2, instruction: 'Các loại nấm tươi cắt bỏ gốc bẩn, rửa nhẹ tay với nước muối loãng rồi xếp ra khay lớn.' },
      { stepNumber: 3, instruction: 'Nêm nếm nước lẩu thanh đạm với muối khoáng và hạt nêm nấm, không dùng quá nhiều gia vị cay nồng.' },
      { stepNumber: 4, instruction: 'Bày nồi lẩu ra giữa bàn, thả đậu hũ non và một phần nấm hương vào đun sôi.' },
      { stepNumber: 5, instruction: 'Nhúng các loại nấm tươi vào nước lẩu sôi trong 2 phút rồi vớt ra ăn ngay giữ trọn vị giòn ngọt thanh tao.' }
    ]
  },
  {
    id: 'vn-lau-05',
    slug: 'lau-ca-thac-lac-kho-qua',
    title: 'Lẩu cá thác lác khổ qua thanh mát',
    description: 'Chả cá thác lác quết dai dẻo vo viên thả vào nồi nước dùng thanh ngọt, nhúng cùng khổ qua bào mỏng giòn không đắng.',
    cuisine: 'vietnamese',
    category: 'mon_lau_tiec',
    region: 'nam',
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: 'medium',
    imageUrl: VIETNAMESE_DISH_IMAGES['lau-ca-thac-lac-kho-qua'],
    nutrition: { calories: 340, proteinG: 35, fatG: 12, carbG: 22 },
    tags: ['Món lẩu', 'Đặc sản miền Tây', 'Khổ qua', 'Thanh mát'],
    ingredients: [
      { ingredientId: 'FISH_FRESHWATER', name: 'Cá thác lác nạo quết dẻo', requiredQuantity: 400, unit: 'g' },
      { ingredientId: 'BITTER_MELON', name: 'Khổ qua bào mỏng ướp đá lạnh', requiredQuantity: 3, unit: 'piece' },
      { ingredientId: 'SCALLION', name: 'Hành hoa & thì là thái nhỏ', requiredQuantity: 1, unit: 'bunch' },
      { ingredientId: 'FISH_SAUCE', name: 'Nước mắm ngon & tiêu sọ trắng', requiredQuantity: 30, unit: 'ml' },
      { ingredientId: 'NOODLE', name: 'Bún tươi sợi nhỏ', requiredQuantity: 400, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Cá thác lác nêm nước mắm, hành hoa, tiêu sọ trắng, quết liên tục 15 phút đến khi chả cá dẻo dính chặt vào tô.' },
      { stepNumber: 2, instruction: 'Khổ qua bào lát mỏng tang, ngâm vào thau nước đá lạnh 15 phút để khổ qua giòn rụm và bớt đắng.' },
      { stepNumber: 3, instruction: 'Nấu nước dùng từ xương heo ngọt trong, nêm nếm gia vị thanh dịu.' },
      { stepNumber: 4, instruction: 'Dùng muỗng múc từng viên chả cá thác lác thả vào nồi lẩu sôi, khi viên chả nổi lên là chín tới phồng to.' },
      { stepNumber: 5, instruction: 'Gắp khổ qua nhúng nhanh vào nồi lẩu 10 giây rồi vớt ra ăn liền cùng chả cá dai ngọt và bún tươi.' }
    ]
  }
];
