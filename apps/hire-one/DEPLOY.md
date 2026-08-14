# 本日の採用、1名。 — deployment handoff

このアプリは、HTML/CSS/JSをそのまま配信する静的サイトとしてデプロイする。

## Vercel設定

- Root Directory: `apps/hire-one`
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: default (`npm install` で可。外部依存なし)

`npm run build` は最初に `smoke-check.mjs` を実行し、以下を確認してから `dist/` を作る。

- `index.html`, `style.css`, `polish.css`, `game.js`, `polish.js` が存在する
- `index.html` が4つのCSS/JSをローカル相対パスで直接読み込む
- `DecompressionStream` / jsDelivr / `document.write(h)` の配信用ラッパーを使っていない

## 重要

単一HTMLへのgzip/base64埋め込み、自己展開HTML、`deploy.html`、CDN固定コミット参照は使わない。

Vercelには `dist/` の5ファイルを通常の静的ファイルとして配信させる。
