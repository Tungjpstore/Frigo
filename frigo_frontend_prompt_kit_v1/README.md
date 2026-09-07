# Frigo Frontend Prompt Kit v1

Bộ kit **repo-ready** để AI coding agent dựng frontend Frigo mà không phải tự đoán logo, asset path, màu sắc hay screen flow.

## Frigo
- Domain: `https://frigo.tungjpstore.net`
- Market V1: Việt Nam
- Tagline: **Mở tủ lạnh. Biết ngay hôm nay ăn gì.**
- Mobile-first PWA.

## Copy vào repo

```bash
cp -R repo-ready/public/frigo <repo>/public/
cp repo-ready/src/styles/frigo-tokens.css <repo>/src/styles/
cp repo-ready/src/lib/frigo-assets.ts <repo>/src/lib/
```

Sau đó giao `docs/FRONTEND_AGENT_PROMPT.md` cho AI coding agent.

## Folder
- `masters/`: ảnh gốc/reference chất lượng cao. KHÔNG dùng trực tiếp trong UI production.
- `repo-ready/public/frigo/`: asset đã crop, đặt tên ASCII ổn định.
- `config/asset-manifest.json`: source of truth cho đường dẫn asset.
- `repo-ready/src/lib/frigo-assets.ts`: map TypeScript dùng trực tiếp.
- `docs/`: prompt + screen spec + asset mapping + QA.

## Quy tắc
1. Không rename asset production tùy ý.
2. Không hiển thị master/reference board như component thật.
3. Recipe photo = `object-fit: cover`.
4. Ingredient/illustration = `object-fit: contain`.
5. Text/button phải là HTML; không dùng chữ baked-in-image thay UI thật.
6. Functional icons nên ưu tiên vector icon library; raster icon là visual reference/fallback.
7. Không regenerate logo/branding nếu chưa được yêu cầu.
