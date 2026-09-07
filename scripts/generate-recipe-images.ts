/**
 * Dedicated AI Image Generator for 59 Vietnamese Authentic Dishes.
 * Pre-configured with hyper-realistic culinary photography prompts
 * ready for batch generation when Gemini 3.1 Flash Image quota resets.
 */

export interface RecipeImagePrompt {
  id: string;
  slug: string;
  title: string;
  category: string;
  prompt: string;
  targetFilename: string;
}

export const RECIPE_IMAGE_PROMPTS: RecipeImagePrompt[] = [
  // 1. Món Canh / Súp
  {
    id: 'vn-canh-01',
    slug: 'canh-chua-ca-loc-nam-bo',
    title: 'Canh chua cá lóc Nam Bộ',
    category: 'mon_canh',
    prompt: 'Professional food photography of Canh Chua Ca Loc Nam Bo (Southern Vietnamese Sweet and Sour Fish Soup). A steaming rustic white ceramic bowl filled with clear sweet and sour golden broth, fresh snakehead fish steak, sliced pineapple, ripe red tomatoes, okra, bean sprouts, topped with chopped saw-tooth herb, rice paddy herb, fried crisp garlic, and thin red chili slices. Served on a dark wooden table with natural soft daylight, culinary magazine editorial photo, hyper-realistic, 8k.',
    targetFilename: 'canh-chua-ca-loc-nam-bo.webp'
  },
  {
    id: 'vn-canh-02',
    slug: 'canh-cua-dong-rau-day-mong-toi',
    title: 'Canh cua đồng mồng tơi mướp hương',
    category: 'mon_canh',
    prompt: 'Professional food photography of Canh Cua Dong Mong Toi Muop (Northern Vietnamese Freshwater Crab Roe Soup). Deep ceramic bowl with rich floating golden crab roe clusters on top of emerald green Malabar spinach and tender sponge gourd slices in hot savory broth. Served with small bowl of crunchy salted white eggplants (ca phao), authentic Hanoi home cooking style, natural warm lighting, 8k resolution.',
    targetFilename: 'canh-cua-dong-rau-day-mong-toi.webp'
  },
  {
    id: 'vn-canh-03',
    slug: 'canh-kho-qua-nhoi-thit',
    title: 'Canh khổ qua nhồi thịt',
    category: 'mon_canh',
    prompt: 'Authentic Vietnamese food photography of Canh Kho Qua Nhoi Thit (Stuffed Bitter Melon Soup). Whole bright green bitter melons filled with juicy seasoned minced pork and wood ear mushrooms, tied with scallion ribbon, submerged in crystal clear steaming broth, garnished with chopped cilantro and cracked black pepper, rustic ceramic bowl, soft natural daylight, hyper-detailed, 8k.',
    targetFilename: 'canh-kho-qua-nhoi-thit.webp'
  },
  {
    id: 'vn-canh-04',
    slug: 'canh-suon-bi-dao',
    title: 'Canh sườn hầm bí đao',
    category: 'mon_canh',
    prompt: 'Editorial food photograph of Canh Suon Bi Dao (Pork Rib and Winter Melon Soup). Tender braised pork ribs with bone and translucent chunks of cooked green winter melon in sweet clear broth, garnished with scallions and culantro, in a stoneware bowl, steaming hot, culinary magazine style, 8k.',
    targetFilename: 'canh-suon-bi-dao.webp'
  },
  {
    id: 'vn-canh-05',
    slug: 'canh-bi-do-thit-bam',
    title: 'Canh bí đỏ thịt bằm hạt sen',
    category: 'mon_canh',
    prompt: 'Food photography of Canh Bi Do Thit Bam (Pumpkin Soup with Minced Pork). Golden orange pumpkin cubes cooked tender in rich savory broth with seasoned minced pork, topped with chopped herbs and cracked pepper, warm rustic earthenware bowl, inviting cozy mood, 8k resolution.',
    targetFilename: 'canh-bi-do-thit-bam.webp'
  },
  {
    id: 'vn-canh-06',
    slug: 'canh-ngao-nau-chua-thi-la',
    title: 'Canh ngao nấu chua thì là',
    category: 'mon_canh',
    prompt: 'Hanoi style Canh Ngao Nau Chua (Clam Sour Soup with Fresh Dill). A beautiful white bowl filled with plump fresh clams in open shells, red tomato wedges, pineapple slices, fragrant green dill fronds and scallions floating in tart clear broth, natural soft light, sharp focus, 8k.',
    targetFilename: 'canh-ngao-nau-chua-thi-la.webp'
  },

  // 2. Món Kho / Rim
  {
    id: 'vn-kho-01',
    slug: 'thit-kho-trung',
    title: 'Thịt kho tàu nước dừa trứng cút',
    category: 'mon_kho',
    prompt: 'Close-up food photography of Thit Kho Tau (Vietnamese Braised Pork Belly with Eggs). Glossy caramelized amber pork belly cubes with translucent melt-in-mouth fat layers, whole boiled golden eggs coated in savory sweet coconut caramel reduction, garnished with red bird-eye chili and green onion, served in a traditional Vietnamese clay pot, glistening sauce, 8k.',
    targetFilename: 'thit-kho-trung.webp'
  },
  {
    id: 'vn-kho-02',
    slug: 'ca-loc-kho-to-tieu-den',
    title: 'Cá lóc kho tộ tiêu đen',
    category: 'mon_kho',
    prompt: 'Authentic food photography of Ca Loc Kho To (Claypot Braised Snakehead Fish). Thick caramelized fish cutlets simmering in dark savory fish sauce and coconut caramel glaze, topped with cracked coarse black peppercorns, crispy pork lardons, and fresh red chilies, served in authentic dark burnt clay pot, bubbling hot, 8k.',
    targetFilename: 'ca-loc-kho-to-tieu-den.webp'
  },
  {
    id: 'vn-kho-03',
    slug: 'ga-ta-kho-gung-sa',
    title: 'Gà ta kho gừng sả',
    category: 'mon_kho',
    prompt: 'Culinary photography of Ga Kho Gung (Braised Chicken with Fresh Ginger). Golden free-range chicken pieces coated in thick aromatic amber sauce, studded with julienned fresh yellow ginger, minced lemongrass and chopped scallions, rustic Vietnamese home table, appetizing sheen, 8k.',
    targetFilename: 'ga-ta-kho-gung-sa.webp'
  },
  {
    id: 'vn-kho-04',
    slug: 'suon-heo-xao-chua-ngot',
    title: 'Sườn heo xào chua ngọt',
    category: 'mon_kho',
    prompt: 'Mouthwatering food photography of Suon Xao Chua Ngot (Vietnamese Sweet and Sour Pork Ribs). Glossy red-amber bite-sized caramelized pork ribs coated in sticky sweet-tangy tomato glaze, tossed with sweet white onions and bell peppers, sprinkled with toasted sesame seeds, white ceramic plate, professional culinary studio lighting, 8k.',
    targetFilename: 'suon-heo-xao-chua-ngot.webp'
  },
  {
    id: 'vn-kho-05',
    slug: 'tom-rim-man-ngot',
    title: 'Tôm rim mặn ngọt',
    category: 'mon_kho',
    prompt: 'Close up photo of Tom Rim Man Ngot (Caramelized Savory Shrimp). Glistening bright orange prawns caramelized in fish sauce, sugar, garlic and black pepper, with crispy shells and juicy meat, garnished with finely chopped scallions and red chilies, vibrant colors, 8k.',
    targetFilename: 'tom-rim-man-ngot.webp'
  },
  {
    id: 'vn-kho-06',
    slug: 'thit-ba-chi-kho-cu-cai',
    title: 'Thịt ba chỉ kho củ cải trắng',
    category: 'mon_kho',
    prompt: 'Traditional Vietnamese Thit Kho Cu Cai (Braised Pork Belly with Daikon Radish). Rich caramelized pork belly chunks and tender translucent daikon radish cubes braised to perfection in savory fish sauce sauce, sprinkled with cracked pepper and scallions, vintage ceramic bowl, 8k.',
    targetFilename: 'thit-ba-chi-kho-cu-cai.webp'
  },

  // 3. Món Xào
  {
    id: 'vn-xao-01',
    slug: 'rau-muong-xao-toi',
    title: 'Rau muống xào tỏi',
    category: 'mon_xao',
    prompt: 'Top-down professional culinary photo of Rau Muong Xao Toi (Stir-fried Water Spinach with Garlic). Glossy emerald green tender water spinach stems and leaves, tossed with abundant golden crispy fried crushed garlic cloves, glistening with fragrant oil, white oval ceramic plate, vibrant and fresh, 8k.',
    targetFilename: 'rau-muong-xao-toi.webp'
  },
  {
    id: 'vn-xao-02',
    slug: 'bo-xao-can-toi-hanh-tay',
    title: 'Bò xào cần tỏi hành tây',
    category: 'mon_xao',
    prompt: 'Stir-fried Beef with Celery, Leeks, and Onion (Bo Xao Can Toi). Tender, thinly sliced seared beef strips stir-fried with crunchy green celery, white onion wedges, and red ripe tomato, glossy savory oyster sauce coating, steaming hot from the wok, 8k.',
    targetFilename: 'bo-xao-can-toi-hanh-tay.webp'
  },
  {
    id: 'vn-xao-03',
    slug: 'muc-xao-can-toi-dua',
    title: 'Mực ống xào cần tỏi dứa',
    category: 'mon_xao',
    prompt: 'Delicious Vietnamese Stir-fried Squid with Pineapple and Celery (Muc Xao Chua Ngot). Diamond-scored curled tender squid tubes, juicy yellow pineapple wedges, bright red tomatoes, and fresh green celery, glazed in light sweet-sour reduction, white plate, 8k.',
    targetFilename: 'muc-xao-can-toi-dua.webp'
  },
  {
    id: 'vn-xao-04',
    slug: 'thit-bo-xao-bong-cai',
    title: 'Thịt bò xào bông cải xanh',
    category: 'mon_xao',
    prompt: 'Stir-fried Beef with Broccoli and Carrot (Bo Xao Bong Cai). Juicy sliced beef medallions, vibrant green broccoli florets and flower-cut orange carrots, glistening in savory soy garlic sauce, clean healthy presentation, 8k.',
    targetFilename: 'thit-bo-xao-bong-cai.webp'
  },
  {
    id: 'vn-xao-05',
    slug: 'su-su-xao-trung-ga',
    title: 'Su su xào trứng gà',
    category: 'mon_xao',
    prompt: 'Stir-fried Chayote with Egg (Su Su Xao Trung). Shredded tender green chayote squash tossed with golden scrambled eggs and sliced scallions, lightly seasoned, fresh light texture, homey ceramic dish, 8k.',
    targetFilename: 'su-su-xao-trung-ga.webp'
  },
  {
    id: 'vn-xao-06',
    slug: 'dau-cove-xao-thit-bo',
    title: 'Đậu cô ve xào thịt bò',
    category: 'mon_xao',
    prompt: 'Stir-fried Green Beans with Marinated Beef. Crisp bright green French beans cut on bias, tossed with tender sliced beef and minced garlic, glistening finish, white rectangular platter, 8k.',
    targetFilename: 'dau-cove-xao-thit-bo.webp'
  },

  // 4. Món Chiên / Rán
  {
    id: 'vn-chien-01',
    slug: 'dau-phu-sot-ca-chua',
    title: 'Đậu phụ lướt ván sốt cà chua',
    category: 'mon_chien',
    prompt: 'Close-up editorial photo of Dau Phu Sot Ca Chua (Fried Tofu in Tomato Sauce). Golden crisp tofu cubes submerged in rich, glossy red tomato sauce with visible fresh tomato pulp, garnished with abundant emerald chopped scallions, white porcelain bowl, 8k.',
    targetFilename: 'dau-phu-sot-ca-chua.webp'
  },
  {
    id: 'vn-chien-02',
    slug: 'trung-chien-thit-bam-nam-rom',
    title: 'Trứng chiên thịt bằm nấm rơm',
    category: 'mon_chien',
    prompt: 'Fluffy golden Vietnamese Omelet with Minced Pork and Straw Mushrooms (Trung Chien Thit Bam). Puffed golden brown edge, sliced into neat wedges showing savory minced pork and mushroom filling, scattered with scallions, 8k.',
    targetFilename: 'trung-chien-thit-bam-nam-rom.webp'
  },
  {
    id: 'vn-chien-03',
    slug: 'canh-ga-chien-nuoc-mam',
    title: 'Cánh gà chiên nước mắm tỏi ớt',
    category: 'mon_chien',
    prompt: 'Crispy Vietnamese Fish Sauce Chicken Wings (Canh Ga Chien Nuoc Mam). Deep-golden, blistered crunchy chicken wings drenched in sticky caramelized fish sauce, garlic, and chili glaze, garnished with fresh cilantro, finger-licking look, 8k.',
    targetFilename: 'canh-ga-chien-nuoc-mam.webp'
  },
  {
    id: 'vn-chien-04',
    slug: 'cha-ca-hai-phong',
    title: 'Chả cá chiên thì là hạt tiêu',
    category: 'mon_chien',
    prompt: 'Hai Phong Style Pan-fried Dill Fish Cakes (Cha Ca Thi La). Puffy golden round fish patties speckled with aromatic green dill and cracked black peppercorns, stacked on banana leaf with dipping sauce, 8k.',
    targetFilename: 'cha-ca-hai-phong.webp'
  },
  {
    id: 'vn-chien-05',
    slug: 'nem-ran-truyen-thong-ha-noi',
    title: 'Nem rán truyền thống Hà Nội',
    category: 'mon_chien',
    prompt: 'Hanoi Traditional Fried Spring Rolls (Nem Ran / Cha Gio). Golden crackling crispy rice paper rolls cut in half revealing pork, mushroom, vermicelli, and egg filling, served with fresh herbs, lettuce, and amber nuoc cham dipping bowl with pickled carrots, 8k.',
    targetFilename: 'nem-ran-truyen-thong-ha-noi.webp'
  },
  {
    id: 'vn-chien-06',
    slug: 'ca-ro-phi-chien-gion-mam-gung',
    title: 'Cá rô phi chiên giòn chấm mắm gừng',
    category: 'mon_chien',
    prompt: 'Crispy Deep-fried Whole Tilapia Fish (Ca Chien Gion). Whole scored fish fried to crispy golden perfection, crunchy fins and head, served with spicy ginger fish sauce dip and lime wedge on banana leaf platter, 8k.',
    targetFilename: 'ca-ro-phi-chien-gion-mam-gung.webp'
  },

  // 5. Món Hấp / Luộc
  {
    id: 'vn-hap-01',
    slug: 'ga-ta-hap-la-chanh',
    title: 'Gà ta hấp lá chanh da giòn',
    category: 'mon_hap_luoc',
    prompt: 'Steamed Free-Range Chicken with Lime Leaves (Ga Hap La Chanh). Chopped succulent yellow-skinned chicken pieces arranged neatly on plate, sprinkled with finely sliced kaffir lime leaves, served with salt, pepper, and lime dipping sauce, 8k.',
    targetFilename: 'ga-ta-hap-la-chanh.webp'
  },
  {
    id: 'vn-hap-02',
    slug: 'thit-ba-chi-luoc-mam-tom',
    title: 'Thịt ba chỉ luộc mắm tôm cà pháo',
    category: 'mon_hap_luoc',
    prompt: 'Boiled Pork Belly Slices (Thit Ba Chi Luoc). Perfectly thin sliced tender pork belly with alternating layers of pink meat and white fat, served alongside foamy purple fermented shrimp paste (mam tom) with chili and lime, and crunchy white eggplants, 8k.',
    targetFilename: 'thit-ba-chi-luoc-mam-tom.webp'
  },
  {
    id: 'vn-hap-03',
    slug: 'ca-dieu-hong-hap-hanh-gung',
    title: 'Cá điêu hồng hấp hành gừng',
    category: 'mon_hap_luoc',
    prompt: 'Steamed Red Tilapia with Ginger and Scallions (Ca Hap Hanh Gung). Whole fresh fish steamed in light soy sauce broth, smothered in curled shredded scallions, matchstick ginger, and red chili slivers, sizzling sesame oil drizzle, 8k.',
    targetFilename: 'ca-dieu-hong-hap-hanh-gung.webp'
  },
  {
    id: 'vn-hap-04',
    slug: 'rau-cu-luoc-kho-quet',
    title: 'Rau củ luộc thập cẩm kho quẹt',
    category: 'mon_hap_luoc',
    prompt: 'Southern Vietnamese Boiled Garden Vegetables with Caramelized Dip (Rau Luoc Kho Quet). Colorful platter of steamed broccoli florets, carrots, and chayote surrounding a sizzling rustic clay pot filled with caramelized fish sauce, crispy pork cracklings, and dried shrimp, 8k.',
    targetFilename: 'rau-cu-luoc-kho-quet.webp'
  },
  {
    id: 'vn-hap-05',
    slug: 'muc-hap-gung-sa',
    title: 'Mực ống hấp gừng sả',
    category: 'mon_hap_luoc',
    prompt: 'Steamed Squid with Lemongrass and Ginger (Muc Hap Gung Sa). Tender plump white squid cut into thick rings, steamed with sliced ginger, bruised lemongrass stalks, and red chili, served with spicy green chili salt dip, 8k.',
    targetFilename: 'muc-hap-gung-sa.webp'
  },
  {
    id: 'vn-hap-06',
    slug: 'tom-hap-nuoc-dua-tuoi',
    title: 'Tôm hấp nước dừa tươi',
    category: 'mon_hap_luoc',
    prompt: 'Fresh Prawns Steamed in Fresh Coconut Juice (Tom Hap Nuoc Dua). Vibrant scarlet red cooked prawns arranged elegantly inside or around a fresh young coconut shell, steaming and succulent, served with lime pepper dip, 8k.',
    targetFilename: 'tom-hap-nuoc-dua-tuoi.webp'
  },

  // 6. Món Cuốn / Nộm / Gỏi
  {
    id: 'vn-cuon-01',
    slug: 'goi-cuon-tom-thit-nam-bo',
    title: 'Gỏi cuốn tôm thịt chấm tương phộng',
    category: 'mon_cuon_nom',
    prompt: 'Fresh Vietnamese Spring Rolls (Goi Cuon Tom Thit). Translucent rice paper rolls showing bright pink shrimp halves, pork belly slices, green lettuce, fresh mint, and chives, served with thick dark peanut hoisin dipping sauce topped with crushed roasted peanuts and chili, 8k.',
    targetFilename: 'goi-cuon-tom-thit-nam-bo.webp'
  },
  {
    id: 'vn-cuon-02',
    slug: 'pho-cuon-bo-ha-noi',
    title: 'Phở cuốn bò Hà Nội',
    category: 'mon_cuon_nom',
    prompt: 'Hanoi Rolled Pho (Pho Cuon Bo). Silky soft white steamed rice noodle sheets rolled around tender stir-fried garlic beef and fragrant Vietnamese herbs, stacked neatly on dark ceramic plate with sweet garlic chili fish sauce, 8k.',
    targetFilename: 'pho-cuon-bo-ha-noi.webp'
  },
  {
    id: 'vn-cuon-03',
    slug: 'nom-hoa-chuoi-tai-heo',
    title: 'Nộm hoa chuối tai heo',
    category: 'mon_cuon_nom',
    prompt: 'Banana Blossom Salad with Crispy Pig Ears (Nom Hoa Chuoi). Finely shredded purple-tinged banana blossoms tossed with crunchy thin-sliced pig ears, carrots, fresh mint, roasted peanuts, and sweet sour lime dressing, piled high on ceramic plate, 8k.',
    targetFilename: 'nom-hoa-chuoi-tai-heo.webp'
  },
  {
    id: 'vn-cuon-04',
    slug: 'goi-ga-xe-phay-bap-cai',
    title: 'Gỏi gà xé phay bắp cải',
    category: 'mon_cuon_nom',
    prompt: 'Shredded Chicken and Cabbage Salad (Goi Ga Xe Phay). Succulent shredded free-range poached chicken tossed with shredded green cabbage, pickled red onions, Vietnamese coriander (rau ram), roasted peanuts, and fried shallots in tart dressing, 8k.',
    targetFilename: 'goi-ga-xe-phay-bap-cai.webp'
  },
  {
    id: 'vn-cuon-05',
    slug: 'nom-du-du-bo-kho',
    title: 'Nộm đu đủ bò khô',
    category: 'mon_cuon_nom',
    prompt: 'Hanoi Green Papaya Salad with Beef Jerky (Nom Du Du Bo Kho). Shredded crunchy green papaya and carrot mound topped with spiced dark beef jerky strands, roasted peanuts, Vietnamese balm herb, drizzled with sweet-tangy garlic vinegar dressing, 8k.',
    targetFilename: 'nom-du-du-bo-kho.webp'
  },
  {
    id: 'vn-cuon-06',
    slug: 'nem-lui-hue-nuong-sa',
    title: 'Nem lụi nướng sả',
    category: 'mon_cuon_nom',
    prompt: 'Hue Lemongrass Grilled Pork Skewers (Nem Lui Hue). Charred savory pork meat wrapped around natural lemongrass stalks, served with rice paper, green banana, cucumber, herbs, and warm rich liver peanut dipping sauce, 8k.',
    targetFilename: 'nem-lui-hue-nuong-sa.webp'
  },

  // 7. Món Bún / Phở / Miến
  {
    id: 'vn-bun-01',
    slug: 'pho-bo-tai-lan-ha-noi',
    title: 'Phở bò tái lăn Hà Nội',
    category: 'mon_bun_pho',
    prompt: 'Hanoi Pho Bo Tai Lan (Wok-seared Beef Pho). Deep ceramic bowl with rich steaming aromatic beef broth, silky flat rice noodles, wok-seared beef slices with garlic, generous chopped scallions, culantro, and fresh lime wedge on side, rising steam, authentic 8k.',
    targetFilename: 'pho-bo-tai-lan-ha-noi.webp'
  },
  {
    id: 'vn-bun-02',
    slug: 'bun-cha-ha-noi-than-hoa',
    title: 'Bún chả nướng than hoa Hà Nội',
    category: 'mon_bun_pho',
    prompt: 'Authentic Hanoi Bun Cha. Bowl of warm amber dipping sauce with charcoal-grilled caramelized pork patties and pork belly strips, pickled green papaya and carrot, plate of pure white vermicelli noodles, and overflowing basket of fresh herbs (perilla, mint, lettuce), 8k.',
    targetFilename: 'bun-cha-ha-noi-than-hoa.webp'
  },
  {
    id: 'vn-bun-03',
    slug: 'bun-bo-hue-chuan-vi',
    title: 'Bún bò xứ Huế giò heo',
    category: 'mon_bun_pho',
    prompt: 'Hue Spicy Beef Noodle Soup (Bun Bo Hue). A rich, deep red and orange spicy lemongrass and shrimp paste broth, thick cylindrical rice vermicelli, tender beef shank slices, pork knuckle, crab cake balls, topped with sliced onions and herbs, lime and chili, 8k.',
    targetFilename: 'bun-bo-hue-chuan-vi.webp'
  },
  {
    id: 'vn-bun-04',
    slug: 'bun-rieu-cua-dong',
    title: 'Bún riêu cua đồng giấm bỗng',
    category: 'mon_bun_pho',
    prompt: 'Crab Paste Vermicelli Soup (Bun Rieu Cua). Vibrant orange-red tomato broth with floating soft freshwater crab roe clusters, crispy fried golden tofu cubes, tender beef slices, rice vermicelli, fresh water spinach curls and shredded banana blossom, 8k.',
    targetFilename: 'bun-rieu-cua-dong.webp'
  },
  {
    id: 'vn-bun-05',
    slug: 'bun-thit-nuong-nam-bo',
    title: 'Bún thịt nướng Nam Bộ',
    category: 'mon_bun_pho',
    prompt: 'Southern Vietnamese Grilled Pork Noodle Bowl (Bun Thit Nuong). Rice vermicelli bowl topped with charred aromatic grilled lemongrass pork slices, crispy spring rolls, pickled daikon and carrot, roasted peanuts, scallion oil, and nuoc cham dressing, 8k.',
    targetFilename: 'bun-thit-nuong-nam-bo.webp'
  },
  {
    id: 'vn-bun-06',
    slug: 'mien-ga-nam-huong',
    title: 'Miến gà nấm hương',
    category: 'mon_bun_pho',
    prompt: 'Chicken Glass Noodle Soup with Shiitake Mushrooms (Mien Ga). Clear, glistening golden chicken broth with chewy translucent glass noodles, shredded poached chicken breast, wild shiitake mushrooms, chopped culantro and cilantro, steaming warm, 8k.',
    targetFilename: 'mien-ga-nam-huong.webp'
  },

  // 8. Món Chay Thanh Tịnh
  {
    id: 'vn-chay-01',
    slug: 'dau-phu-kho-nam-dong-co',
    title: 'Đậu phụ kho nấm đông cô',
    category: 'mon_chay',
    prompt: 'Vegetarian Braised Tofu with Shiitake Mushrooms (Dau Phu Kho Nam). Golden fried tofu triangles and plump brown shiitake mushrooms simmered in glossy dark soy caramel reduction with black peppercorns and sliced red chili in an earthenware pot, 8k.',
    targetFilename: 'dau-phu-kho-nam-dong-co.webp'
  },
  {
    id: 'vn-chay-02',
    slug: 'canh-nam-hat-sen-tao-do',
    title: 'Canh nấm hạt sen táo đỏ',
    category: 'mon_chay',
    prompt: 'Clear Vegetarian Lotus Seed and Mushroom Soup (Canh Nam Hat Sen). Elegant porcelain bowl with crystal clear sweet broth, soft lotus seeds, red dates, enoki and beech mushrooms, carrot slices, and fresh cilantro, soothing zen aesthetic, 8k.',
    targetFilename: 'canh-nam-hat-sen-tao-do.webp'
  },
  {
    id: 'vn-chay-03',
    slug: 'mi-xao-chay-rau-nam',
    title: 'Mì xào giòn chay nấm rau củ',
    category: 'mon_chay',
    prompt: 'Crispy Vegetarian Stir-fried Egg Noodles with Mushrooms and Bok Choy. Golden bird-nest style crispy noodle bed topped with glossy savory glazed king oyster mushrooms, straw mushrooms, bok choy, and baby corn, 8k.',
    targetFilename: 'mi-xao-chay-rau-nam.webp'
  },
  {
    id: 'vn-chay-04',
    slug: 'ca-tim-nuong-mo-hanh',
    title: 'Cà tím nướng mỡ hành',
    category: 'mon_chay',
    prompt: 'Grilled Whole Eggplant with Scallion Oil (Ca Tim Nuong Mo Hanh). Charred whole Japanese eggplant split lengthwise, tender melt-in-mouth pulp smothered in fragrant bright green scallion oil, seasoned soy garlic sauce, and crushed roasted peanuts, 8k.',
    targetFilename: 'ca-tim-nuong-mo-hanh.webp'
  },
  {
    id: 'vn-chay-05',
    slug: 'dau-hu-non-sot-nam-rom',
    title: 'Đậu hũ non sốt nấm rơm',
    category: 'mon_chay',
    prompt: 'Silken Tofu with Straw Mushrooms in Vegetarian Sauce (Dau Hu Non Sot Nam). Round slices of silky white delicate tofu drenched in glossy brown mushroom reduction sauce with halved straw mushrooms, scallions, and cracked pepper, 8k.',
    targetFilename: 'dau-hu-non-sot-nam-rom.webp'
  },
  {
    id: 'vn-chay-06',
    slug: 'canh-cai-nau-dau-phu-non',
    title: 'Canh cải xanh gừng đậu phụ',
    category: 'mon_chay',
    prompt: 'Mustard Greens Soup with Ginger and Soft Tofu (Canh Cai Nau Dau Hu). Vibrant emerald mustard greens and soft white tofu cubes in clear golden ginger-infused broth, light and refreshing rustic bowl, 8k.',
    targetFilename: 'canh-cai-nau-dau-phu-non.webp'
  },

  // 9. Món Ăn Sáng & ≤ 20 phút
  {
    id: 'vn-sang-01',
    slug: 'com-chien-trung-toi-hanh-hoa',
    title: 'Cơm chiên trứng vàng giòn',
    category: 'mon_nhanh_sang',
    prompt: 'Golden Garlic Egg Fried Rice (Com Chien Trung). Fluffy individual rice grains coated in rich egg yolk, wok-fried with crispy golden garlic chips and green scallions, served in a steaming bowl with chopsticks, vibrant golden sheen, 8k.',
    targetFilename: 'com-chien-trung-toi-hanh-hoa.webp'
  },
  {
    id: 'vn-sang-02',
    slug: 'banh-mi-op-la-pate',
    title: 'Bánh mì ốp la pate dưa leo',
    category: 'mon_nhanh_sang',
    prompt: 'Vietnamese Breakfast Baguette with Fried Egg and Pate (Banh Mi Op La). Ultra-crispy toasted airy baguette stuffed with a runny sunny-side-up fried egg with golden runny yolk, rich liver pate, sliced cucumber, cilantro, and chili sauce drizzle, 8k.',
    targetFilename: 'banh-mi-op-la-pate.webp'
  },
  {
    id: 'vn-sang-03',
    slug: 'chao-thit-bam-gung-tia-to',
    title: 'Cháo thịt bằm gừng tía tô',
    category: 'mon_nhanh_sang',
    prompt: 'Comforting Minced Pork Rice Porridge (Chao Thit Bam). Silky smooth steaming rice congee with seasoned minced pork, topped with shredded ginger, finely ribboned purple perilla leaves, scallions, and generous ground black pepper, ceramic bowl, 8k.',
    targetFilename: 'chao-thit-bam-gung-tia-to.webp'
  },
  {
    id: 'vn-sang-04',
    slug: 'mi-tom-xao-bo-trung-long-dao',
    title: 'Mì gói xào bò trứng lòng đào',
    category: 'mon_nhanh_sang',
    prompt: 'Vietnamese Stir-fried Instant Noodles with Beef and Soft-Boiled Egg. Wok-tossed wavy ramen noodles with tender sliced beef, bok choy, topped with a soft-boiled egg with dripping golden yolk, cracked pepper, quick and delicious street food style, 8k.',
    targetFilename: 'mi-tom-xao-bo-trung-long-dao.webp'
  },
  {
    id: 'vn-sang-05',
    slug: 'trung-cuon-rau-cu-han-quoc',
    title: 'Trứng cuộn rau củ mềm mịn',
    category: 'mon_nhanh_sang',
    prompt: 'Rolled Vegetable Egg Omelet (Tamagoyaki / Trung Cuon). Delicate yellow egg rolls studded with finely diced orange carrots and green scallions, sliced cleanly into round bite-sized pieces on a minimalist wooden board, 8k.',
    targetFilename: 'trung-cuon-rau-cu-han-quoc.webp'
  },
  {
    id: 'vn-sang-06',
    slug: 'sup-ga-ngo-non-nam-huong',
    title: 'Súp gà ngô non nấm hương',
    category: 'mon_nhanh_sang',
    prompt: 'Chicken Sweetcorn and Egg Drop Soup (Sup Ga Ngo Non). Glossy translucent thick soup filled with sweet yellow corn kernels, shredded chicken breast, sliced shiitake mushrooms, delicate whisked egg ribbons, and fresh cilantro, 8k.',
    targetFilename: 'sup-ga-ngo-non-nam-huong.webp'
  },

  // 10. Món Lẩu & Tiệc Gia Đình
  {
    id: 'vn-lau-01',
    slug: 'lau-rieu-cua-dong-bap-bo-suon-sun',
    title: 'Lẩu riêu cua đồng sườn sụn bắp bò',
    category: 'mon_lau_tiec',
    prompt: 'Grand Vietnamese Crab Roe Hotpot Feast (Lau Rieu Cua Bap Bo). Bubbling central pot of aromatic tomato crab broth with golden crab roe clusters, surrounded by platters of thinly sliced raw beef shank, pork rib cartilage, fried tofu, fresh vermicelli, and shaved banana blossoms, 8k.',
    targetFilename: 'lau-rieu-cua-dong-bap-bo-suon-sun.webp'
  },
  {
    id: 'vn-lau-02',
    slug: 'lau-ga-la-giang-chua-cay',
    title: 'Lẩu gà ta lá giang chua cay',
    category: 'mon_lau_tiec',
    prompt: 'Southern Vietnamese Chicken and Sour River Leaf Hotpot (Lau Ga La Giang). Bubbling hotpot containing tender free-range chicken bone pieces and bruised sour giang leaves in tangy broth, served with fresh herbs, lemongrass, and vermicelli, 8k.',
    targetFilename: 'lau-ga-la-giang-chua-cay.webp'
  },
  {
    id: 'vn-lau-03',
    slug: 'lau-hai-san-thap-cam-chua-cay',
    title: 'Lẩu hải sản chua cay',
    category: 'mon_lau_tiec',
    prompt: 'Spicy Tom Yum Style Vietnamese Seafood Hotpot (Lau Hai San). Steaming hot pot with red spicy-sour broth, surrounded by fresh tiger prawns, curled squid, fish fillets, enoki mushrooms, and green vegetables, festive party spread, 8k.',
    targetFilename: 'lau-hai-san-thap-cam-chua-cay.webp'
  },
  {
    id: 'vn-lau-04',
    slug: 'lau-nam-thap-cam-thanh-dam',
    title: 'Lẩu nấm thập cẩm gà ta',
    category: 'mon_lau_tiec',
    prompt: 'Nourishing Wild Mushroom Hotpot (Lau Nam Thap Cam). Steaming clear herbal broth with an elaborate presentation of 6 varieties of fresh mushrooms (king oyster, shiitake, enoki, shimeji, straw, wood ear), tofu, and corn, wholesome and appetizing, 8k.',
    targetFilename: 'lau-nam-thap-cam-thanh-dam.webp'
  },
  {
    id: 'vn-lau-05',
    slug: 'lau-ca-thac-lac-kho-qua',
    title: 'Lẩu cá thác lác khổ qua',
    category: 'mon_lau_tiec',
    prompt: 'Mekong Delta Featherback Fish Paste and Bitter Melon Hotpot (Lau Ca Thac Lac Kho Qua). Clear bubbling fish broth with hand-scooped chewy fish paste balls, served with huge mound of paper-thin ice-chilled bitter melon curls and fresh dill, 8k.',
    targetFilename: 'lau-ca-thac-lac-kho-qua.webp'
  }
];
