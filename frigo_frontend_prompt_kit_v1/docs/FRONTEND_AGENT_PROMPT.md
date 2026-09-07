# FRONTEND IMPLEMENTATION PROMPT — FRIGO

You are the senior coding agent implementing the real Frigo frontend inside the repository.

Do not return only a plan. Inspect the repo, create/edit files, run build/typecheck/lint, fix errors, and continue until the requested frontend is working.

## Read first
1. `README.md`
2. `docs/BRAND_GUIDE.md`
3. `docs/SCREEN_SPEC.md`
4. `docs/ASSET_USAGE.md`
5. `docs/QA_CHECKLIST.md`
6. `config/design-tokens.json`
7. `config/asset-manifest.json`
8. inspect `repo-ready/public/frigo/reference/screen_reference.png`
9. inspect `repo-ready/public/frigo/reference/ui_components_board.png`

## Source of truth
Brand: **Frigo**
Domain: `https://frigo.tungjpstore.net`
Locale V1: `vi-VN`
Tagline: **Mở tủ lạnh. Biết ngay hôm nay ăn gì.**

Do not regenerate or redesign the Frigo identity. Use provided assets.

## Install kit
If not already present:
- copy `repo-ready/public/frigo` into project `public/frigo`
- copy `repo-ready/src/styles/frigo-tokens.css`
- copy `repo-ready/src/lib/frigo-assets.ts`

Use `FRIGO_ASSETS` for production paths. Do not invent remote image URLs.

## Visual rules
Colors are fixed:
#22C55E / #0F3D2E / #DDF7E3 / #FFFDF6 / #EF4444 / #FACC15

Mobile-first.
Radius 16–24px.
Soft shadows.
Food-first.
Cream/white surfaces.
Deep green typography.
One dominant green CTA per viewport.

Avoid enterprise dashboard aesthetics, dark admin style, glassmorphism overload, neon gradients, tiny text.

## Required screens
Implement:
`/`
`/onboarding`
`/scan`
`/scan/:id/review`
`/fridge`
`/ingredients/:id`
`/recipes`
`/recipes/:slug`
`/cook/:slug`
`/shopping`
`/notifications`
`/profile`
`/settings`
`/plus`

## App shell
Bottom nav:
Trang chủ / Tủ lạnh / Quét / Món ăn / Tôi.
Quét is centered and visually dominant.

## Core components
Build reusable:
AppShell, BottomNav, TopBar, PrimaryButton, SecondaryButton, SearchBar, FilterPills,
StatusChip, IngredientRow, IngredientChip, RecipeCard, FridgeSummaryCard,
ScanProgress, EmptyState, QuantityStepper, ShoppingRow, Sheet/Modal,
NotificationCard, PaywallCard, skeletons.

Use tokens, not random ad-hoc values.

## Assets
- Recipe WebP: `object-fit: cover`
- Ingredient/illustration PNG: `object-fit: contain`
- Reference boards: never user-facing
- Text/buttons must be real HTML, not baked image text
- Functional icons may use vector library if crisper; keep Frigo visual language

## Demo data
Inventory:
Trứng gà 6 quả
Thịt ba chỉ 400g
Cà chua 4 quả
Rau muống 1 bó
Đậu phụ 2 bìa

Recipes:
Thịt kho trứng
Đậu phụ sốt cà chua
Rau muống xào tỏi
Canh chua cá
Cơm chiên trứng
Gà kho gừng

Use the included production recipe images.

## Scan state machine
idle -> selected -> uploading -> processing -> ready -> confirm
error -> retry

Ready state must show editable ingredient name, quantity, unit and confidence.
Never auto-write AI scan result into inventory without explicit confirmation.

## Behavior
Home answers “Hôm nay ăn gì?” immediately.
Use-soon foods are prominent.
Recipe detail clearly shows have/need/missing.
Cooking completion shows before/after quantity and requires confirmation.
Shopping list stays simple.
Implement `Không muốn mua thêm gì`.

## Backend incomplete?
Use typed mock adapters/fixtures while keeping API layer separable.
The whole frontend must remain navigable and demonstrable.

## PWA
Use `/frigo/app-icons/icon-192.png`, `/frigo/app-icons/icon-512.png`, and maskable icon.
Theme `#22C55E`, background `#FFFDF6`.

## Before finishing
Run lint, typecheck, tests if present, production build.
Check asset paths.
Check 360, 390, 430px.
Run through `docs/QA_CHECKLIST.md`.
Fix issues; do not merely list them.
