# hitobito-games

Hitobito のスマートフォン向け Web ゲームをまとめるリポジトリです。

## Apps

- `apps/one-tsubo` — **一坪王国 / ONE-TSUBO KINGDOM**  3×3の小さな土地に訪れる木・池・家・猫・祠などを残す／入れ替えることで、毎回ちがう王国を24ターンで作るミニ箱庭ゲーム。
- `apps/drain` — **水、抜いてみた。 / DRAIN IT.**  水位が下がるほど隠れていた生物・人工物・歴史物が露出する、水抜き探索ゲーム。
- `apps/cycle` — **CYCLE**  草から捕食者、死骸、分解者、土へつながる食物連鎖と生態系の循環を育てるゲーム。
- `apps/chain` — **CHAIN**  食物連鎖の頂点から「何を食べる？」を選び続け、生産者と太陽まで逆向きにたどる探索ゲーム。
- `apps/whale-fall` — **クジラが死んだら / WHALE FALL**  一頭のクジラが深海へ沈み、スカベンジャー・富栄養化した海底・骨を利用する生物・化学合成系へと命が受け渡される過程を、触って進めるインタラクティブWebアニメーション。
- `apps/404-kaiki` — **404怪異調査クラブ / 404**  中学生3人組「404部」で町を歩き、近づくだけで調査が進む探索型の都市伝説ホラー。操作は移動だけ。戦闘もHPも無く、怪異ごとに違う方法で生き延びる。CASE 01「口裂け女」＝夜の住宅街を**逃げ切る**、CASE 02「くねくね」＝夏の夕方の田園を**見ないで帰る**、CASE 03「テケテケ」＝放課後の学校と線路を**上がってやり過ごす**、CASE 04「人面犬」＝夜の商店街で**緑のラインを信じない**、CASE 05「きさらぎ駅」＝終電後の無人駅で**変化に気づく**、CASE 06「八尺様」＝真昼の集落から夜の家へ入り、朝まで**持ちこたえる**。設計は [`SPEC.md`](./apps/404-kaiki/SPEC.md)、各CASEの実装範囲は [`CASE01_SLICE.md`](./apps/404-kaiki/CASE01_SLICE.md)・[`CASE02_SLICE.md`](./apps/404-kaiki/CASE02_SLICE.md)・[`CASE03_SLICE.md`](./apps/404-kaiki/CASE03_SLICE.md)・[`CASE04_SLICE.md`](./apps/404-kaiki/CASE04_SLICE.md)・[`CASE05_SLICE.md`](./apps/404-kaiki/CASE05_SLICE.md)・[`CASE06_SLICE.md`](./apps/404-kaiki/CASE06_SLICE.md)。

## 共通品質基準

すべてのゲームで [`GAME_QUALITY.md`](./GAME_QUALITY.md) を適用する。

- 「動く」だけを完成としない。
- 実際にプレイして、進行不能・分かりにくさ・操作の違和感・弱い報酬・つまらない画面を発見し、修正後に再プレイする。
- 説明文より、画面・動き・配置・演出・操作そのものから意味を伝える。
- 成長・進行は数字だけでなく画面変化として見せる。
- 各ゲームには `QUALITY.md` で固有の主役・ゲームループ・到達目標を定義する。

## 方針

- 新規の小〜中規模ゲームは原則 `apps/<game-slug>` に追加する。
- スマートフォン Web を最優先にする。
- 数字より、画面そのものの変化で進行を感じさせる。
- ゲーム固有データと共通ロジックを分離し、将来の共通パッケージ化に備える。
- ホスティングと公開ルールは [`HOSTING_POLICY.md`](./HOSTING_POLICY.md) と [`deploy-targets.json`](./deploy-targets.json) を正とする。

## Human Playtest（人間の実機テスト）

Vercel / Cloudflare / Firebase に公開する前に、PCをローカル試遊サーバーにして、同じWi-Fiのスマホから人間が実際にゲームをプレイできます。

### Windows：普段はダブルクリックだけ

リポジトリ内の次のファイルをダブルクリックします。

```text
START_HUMAN_TEST.bat
```

自動的に次を行います。

1. GitHub の最新版を `git pull --ff-only` で確認
2. 初回だけ必要な npm パッケージをインストール
3. PCを同一LAN向けのローカルサーバーとして起動
4. ブラウザで「人間テストプレイ」ハブを自動表示
5. PCのLAN IPを使ったスマホ接続用QRコードを表示
6. QRを読んだスマホから、`apps/*/index.html` のゲーム一覧を選んで試遊

スマホとPCは同じWi-Fiに接続してください。

初回に Windows Defender Firewall の確認が出た場合は、**プライベート ネットワーク**で Node.js の通信を許可します。パブリック ネットワークへの許可は不要です。

終了は黒いウィンドウで `Ctrl+C`、またはウィンドウを閉じます。サーバーを終了するとスマホからもアクセスできなくなります。

### コマンドから起動する場合

```bash
npm install
npm run human-test
```

PC側では `http://127.0.0.1:4173/__test/` が開きます。スマホ側のURLは起動時に検出したLAN IP（例 `http://192.168.x.x:4173/__test/`）になり、QRにも同じURLが入ります。

AAA LAB はこの人間テスト画面にのみ載せ、production hosting へは自動deployしません。

この試遊環境はインターネットへ公開する仕組みではありません。同じLAN内からのみアクセスする前提です。

## Local Test（開発者向け）

Vercel / Cloudflare / Firebase にデプロイしなくても、Node.js だけでPC上の確認ができます。

```bash
git pull
npm run dev
```

起動後:

- トップ: `http://localhost:4173/`
- 各ゲーム: `http://localhost:4173/apps/<game-slug>/`
- 例: `http://localhost:4173/apps/404-kaiki/`

終了はターミナルで `Ctrl+C`。

静的配信の簡易チェックは次で実行できます。

```bash
npm run check
```

`apps/*/index.html` がローカルHTTP経由で正常配信できるかを一括確認します。

### Windows で初回だけ必要なもの

1. Git をインストール
2. Node.js 18 以上をインストール
3. 任意の作業フォルダでリポジトリを取得

```bash
git clone https://github.com/hrt14/hitobito-games.git
cd hitobito-games
npm install
```

このリポジトリは ES Modules を使うゲームを含むため、HTMLファイルをダブルクリックして `file://` で開くのではなく、必ずローカルHTTPサーバー経由で確認します。

## Deploy

詳細は [`HOSTING_POLICY.md`](./HOSTING_POLICY.md) を参照。

現在の基本配置:

- **Vercel** — `games.hitobito.jp` ポータル、`404.hitobito.jp`、`working-planet.hitobito.jp`
- **Cloudflare Pages** — 小〜中規模の通常ゲームをまとめて配信
- **Firebase Hosting** — LEVEL UP 系
- **AAA LAB** — サーバー公開なし。人間テストプレイのみ

作業中の commit と本番 deploy は分離し、複数ゲームを直したあと作業セッションの区切りでまとめて deploy する。
