# これは生成物です。直接編集しないでください。

`apps/404-kaiki/` を1枚のHTMLへ束ねたもの。再生成は：

```
node apps/404-kaiki/build-standalone.mjs
```

## なぜここにあるか

`404.hitobito.jp` の Vercel プロジェクトが GitHub に接続されていないため、
main へ push しても再ビルドされない（CLI から手動デプロイされた状態のまま）。

稼働中の drain プロジェクト配下に置くことで `drain.hitobito.jp/kaiki/` として公開している。
一坪王国（`apps/drain/one-tsubo/`）と同じ回避策。

ディレクトリ名は `404` を避けて `kaiki` にしている。
Vercel の not-found 処理と紛らわしいため（衝突するかは未検証）。

## 404.hitobito.jp で見せる

`apps/drain/vercel.json` に、ホストが `404.hitobito.jp` の時だけ
`/` を `/kaiki/` へ書き換えるルールを入れてある。

ドメイン `404.hitobito.jp` を drain プロジェクトへ移すと、
`404.hitobito.jp` のトップでこのゲームが出る。
`drain.hitobito.jp` はホストが一致しないので影響を受けない。

## 本来やるべきこと

Vercel ダッシュボードで `404-kaiki` プロジェクトを直す：

1. Connect Git → `hrt14/hitobito-games`
2. Root Directory → `apps/404-kaiki`
3. Production Branch → `main`
4. Redeploy（ビルドキャッシュ無効）

これが済めば `404.hitobito.jp` が正規の配信先になり、このディレクトリは削除できる。
