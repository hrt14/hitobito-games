import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseAppsDir = path.join(root, '.dist', 'firebase', 'apps');
const VERSION = '2026-08-21-v2';
const MARKER = 'data-levelup-real-bridge';

// These apps already operate directly on the user's real situation, current state,
// actual tasks, or have a dedicated REAL LIFE / builder mode. Do not layer a second
// generic flow over their stronger native experience.
const NATIVE_REAL_APPS = new Set([
  'asa-glide','asa-tanoshimi','chou-tsukareta','extra-load','habit-raid','hontono-shimekiri',
  'life-plus-one','meaning-map','meeting-respawn','mou-haratta','name-it','nukeru','nou-keshigomu',
  'one-thing','sore-honto','todo-raid','watashi-zukan','yotei-made-tsukaeru','zenbu-yaranai'
]);

const TYPES = {
  relief: new Set([
    'already-90','approval-off','anger-first-aid','expect-nothing','kanji-warukatta','kininaranai',
    'levelup-mood','mou-owatta','omoisadameru','saiten-shinai','seikan-switch','soredemo-ii-hi',
    'zenbu-fukusen'
  ]),
  action: new Set([
    '3sec-action','ato-5min','ato-ikkai','atsumaru','boundary','fail-forward','help-me','meeting-timebox',
    'my-job','suteru-yuki','timecraft','today-last-day','kotowaru'
  ]),
  awareness: new Set(['arigatou-sagashi','jinsei-title','main-character']),
  skill: new Set(['big-tech-interview','levelup-smalltalk','web-marketer-owned-site','web-marketer-rakuten','yahoo-shopping-marketer']),
  judgment: new Set([
    '100-turns','dont-change-people','idea-lenses-40','jinshin-shoaku','levelup-control','mada-dekinai',
    'matomaru','reflex-7','task-separation','thinking-stairs','uchite','viewpoint-exam'
  ]),
};

const GROUP_COPY = {
  relief: {
    metric: '頭の引っかかり',
    title: '今の1件で、同じ型を使う。',
    situation: 'いま頭に残っている出来事は？',
    action: 'このアプリの考え方を使うと、何だけ残せる？',
    placeholder: '例：事実だけ確認して、変えられることがなければここで終える。',
    ctas: ['今の1件で使う','現実で1回だけ試す','自分のケースに当てる'],
    intros: ['練習問題ではなく、いまの出来事で1回。','効くかどうかは、現実の1件で確かめる。','正解を覚えるより、自分の件で使ってみる。'],
  },
  action: {
    metric: '動きにくさ',
    title: '現実の次の1手まで落とす。',
    situation: 'いま止まっている・抱えていることは？',
    action: '30秒以内にできる最初の1手は？',
    placeholder: '例：資料を開いて、見出しを1つだけ書く。',
    ctas: ['現実の1手を決める','今やる1個に変える','自分のタスクで使う'],
    intros: ['ゲームの中で終わらせず、現実の1手まで。','次に動けるサイズまで小さくする。','「分かった」を「1回やった」に変える。'],
  },
  awareness: {
    metric: 'ぼんやり度',
    title: '今の自分を1件だけ観察する。',
    situation: 'いま自分の中で気になっていることは？',
    action: 'このアプリを通すと、何が1つ見える？',
    placeholder: '例：自分は結果より、安心できる余白を優先していた。',
    ctas: ['今の自分で1回見る','現実の気づきを1つ取る','自分のケースに当てる'],
    intros: ['診断ではなく、今の自分を1回観察する。','気づきを結論にせず、現実の1件で確かめる。','ゲーム外の自分にも同じ傾向があるかを見る。'],
  },
  skill: {
    metric: '判断の迷い',
    title: '次の実務で使う形にする。',
    situation: '次にこのスキルを使いたい実務は？',
    action: 'その場で最初に何を見る・聞く・決める？',
    placeholder: '例：まず売上をアクセス×CVR×単価に分けて、一番落ちている所を見る。',
    ctas: ['実務の1件に当てる','次の仕事で使う形にする','現実の判断を1つ作る'],
    intros: ['知識ではなく、次の実務の最初の判断まで。','覚えた型を、次の1件へ接続する。','現場で使える一文にして持ち帰る。'],
  },
  judgment: {
    metric: '判断の迷い',
    title: '現実の1件を同じ基準で仕分ける。',
    situation: 'いま判断に迷っていることは？',
    action: 'このゲームと同じ基準なら、次に何を選ぶ？',
    placeholder: '例：変えられない反応は外して、自分が確認できる1点だけ聞く。',
    ctas: ['現実の1件を仕分ける','今の判断に使う','自分のケースで1回'],
    intros: ['ゲームの正解ではなく、現実の判断に移す。','同じ型を、自分の1件で再現する。','迷いをゼロにせず、判断基準を1つ残す。'],
  },
  general: {
    metric: '引っかかり',
    title: '現実の1件へ持ち出す。',
    situation: 'いま、この考え方を使えそうなことは？',
    action: '現実で1回だけやるなら？',
    placeholder: '例：次に似た場面が来たら、最初の1手だけ同じ型で選ぶ。',
    ctas: ['現実で1回使う','自分のケースに当てる','次の1件へ持ち出す'],
    intros: ['アプリの中だけで終わらせない。','自分の1件で使って、合うか確かめる。','今日1回だけ、現実へ持ち出す。'],
  }
};

const SPECIAL = {
  'expect-nothing': {
    situation: 'いま「相手がこうしてくれるはず」と思っていることは？',
    action: '相手を変えず、自分側でできる次の一手は？',
    placeholder: '例：返事を待ち続けず、16時に一度だけ確認する。'
  },
  'approval-off': {
    situation: 'いま「どう思われたか」が気になっている出来事は？',
    action: '評価は相手に返して、自分が選べる行動だけ残すなら？',
    placeholder: '例：必要なら一度だけ補足し、それ以上は相手の評価に任せる。'
  },
  'anger-first-aid': {
    situation: 'いま腹が立っている・引っかかっていることは？',
    action: '反応する前に、事実と次の一手を1つずつ残すなら？',
    placeholder: '例：返信は今しない。事実だけメモして10分後に見直す。'
  },
  'kanji-warukatta': {
    situation: '「感じ悪かったかな」と気になっている場面は？',
    action: '事実・直せる気遣い・未確認の評価を分けたあと、やることは？',
    placeholder: '例：必要なら一文だけ補足する。それ以上は予測しない。'
  },
  'kininaranai': {
    situation: 'いま拾うか迷っている小さな違和感は？',
    action: '放っておいて困る？ 困らないなら何もしない、と決めるなら？',
    placeholder: '例：今日困らないので、この件は拾わず通す。'
  },
  'levelup-mood': {
    situation: 'いま機嫌を持っていかれている出来事は？',
    action: '出来事を変えず、自分の状態を1段だけ戻すなら何をする？',
    placeholder: '例：5分歩いてから、次のメール1通だけ返す。'
  },
  'mou-owatta': {
    situation: '終わったのに、まだ頭の中で再生していることは？',
    action: '次回変える1点だけ残して終了するなら？',
    placeholder: '例：次回は冒頭で結論を先に言う。今回はここで終了。'
  },
  'omoisadameru': {
    situation: '「こうなるはず」と違った現実は？',
    action: 'もう起きた事実を確定して、変えられる部分だけ残すなら？',
    placeholder: '例：予定変更は確定。残り時間で最優先の1件だけやる。'
  },
  'saiten-shinai': {
    situation: '誰かを見て、自分の採点が始まりそうになった場面は？',
    action: '他人について分かったことだけ残し、自分への評価を切るなら？',
    placeholder: '例：この人は結果を出した。以上。自分の価値の話にはしない。'
  },
  'seikan-switch': {
    situation: 'いま別の見方へ切り替えたい出来事は？',
    action: '受容・感謝・喜ばれる・そわかのどれか1つを使うなら？',
    placeholder: '例：変えられない部分は受け入れ、今日できる親切を1つやる。'
  },
  'soredemo-ii-hi': {
    situation: '予定が崩れて「今日はもうダメ」と感じていることは？',
    action: '失った時間を取り返さず、残りをいい日にする1つは？',
    placeholder: '例：残り2時間は仕事を増やさず、散歩して夕食だけ整える。'
  },
  'zenbu-fukusen': {
    situation: 'いま「最悪だった」と意味を決め切りそうな出来事は？',
    action: '意味を未確定にしたまま置くなら、どんな一文にする？',
    placeholder: '例：まだ伏線かもしれない。意味は今決めない。'
  },
  '3sec-action': {
    situation: 'いま考え込んで止まっていることは？',
    action: '3秒で「やる・捨てる・任せる」のどれにする？ 最初の一手は？',
    placeholder: '例：やる。ファイルを開いてタイトルだけ書く。'
  },
  'ato-5min': {
    situation: '大きすぎて手が止まっていることは？',
    action: '5分で終わる最小単位にすると？',
    placeholder: '例：資料全体ではなく、1ページ目の見出し3つだけ作る。'
  },
  'ato-ikkai': {
    situation: '「意味ない・効率悪い」とやめたくなっていることは？',
    action: '根拠がまだ足りないなら、あと1回だけ何を試す？',
    placeholder: '例：今日もう1回だけ投稿し、数字を記録してから判断する。'
  },
  'boundary': {
    situation: 'いま自分の領域へ入れすぎている仕事・期待は？',
    action: '今やることと、今は入れないことを1つずつ決めるなら？',
    placeholder: '例：自分は判断だけする。相手の作業代行までは引き受けない。'
  },
  'fail-forward': {
    situation: '完成するまで出せずに止まっているものは？',
    action: '60点で反応を取れる最小版は？',
    placeholder: '例：見出しと数字だけの3枚を先に見せる。'
  },
  'help-me': {
    situation: 'いま自分だけで抱えている仕事は？',
    action: '自分・人・AI・上司・外注へ分けると、どこへ何を渡す？',
    placeholder: '例：AIにたたき台、田中さんに集計、自分は最終判断だけ。'
  },
  'meeting-timebox': {
    situation: 'いま時間超過しそうな会議・打合せは？',
    action: '残り時間で「切る話」と「必ず決めること」を1つずつ決めるなら？',
    placeholder: '例：事例の深掘りは切る。担当と期限だけ決めて終える。'
  },
  'my-job': {
    situation: 'いま「自分がやるべき？」と迷っている依頼は？',
    action: 'やる・相手がやる・別料金のどれ？ 返す一文は？',
    placeholder: '例：別料金。調査までは今回範囲外なので追加対応として提案する。'
  },
  'suteru-yuki': {
    situation: '全部魅力的で捨てられない選択肢は？',
    action: '本当に残す1つと、今回は捨てる1つは？',
    placeholder: '例：売上に直結するLP改善を残し、新SNS企画は今月やらない。'
  },
  'today-last-day': {
    situation: '今日の残り時間に詰め込もうとしていることは？',
    action: '今日が最後なら、それでも残す1つは？',
    placeholder: '例：家族との夕食を残す。細かい資料修正は明日に回す。'
  },
  'kotowaru': {
    situation: 'いま断りたい・条件を変えたい依頼は？',
    action: '関係を壊さず、境界線が伝わる一文は？',
    placeholder: '例：今週は対応できません。来週水曜なら30分だけ可能です。'
  },
  'jinsei-title': {
    situation: 'いま一つの意味で固まっている出来事は？',
    action: '同じ事実に、もう1つ別タイトルをつけるなら？',
    placeholder: '例：「失敗した日」→「次のやり方が1つ分かった日」。'
  },
  'main-character': {
    situation: '周囲の「普通」に引っ張られている選択は？',
    action: '自分が主人公なら、次の1シーンで何を選ぶ？',
    placeholder: '例：みんなに合わせず、今日は自分の企画を1時間だけ進める。'
  },
  'dont-change-people': {
    situation: 'いま「相手が変われば」と思っていることは？',
    action: '相手を変えず、距離・頼み方・配置のどれを変える？',
    placeholder: '例：口頭依頼をやめ、期限と担当を書いたメッセージにする。'
  },
  'idea-lenses-40': {
    situation: '打ち手が出なくて詰まっている課題は？',
    action: '分ける・替える・借りる・なくす・逆にする等から1つ使うと？',
    placeholder: '例：全部作るのをやめ、最重要機能だけの小さい版に分ける。'
  },
  'jinshin-shoaku': {
    situation: '協力してほしいのに、押しつけになりそうな相手・場面は？',
    action: '相手の自己像・自律性・面子を守りながら頼む一文は？',
    placeholder: '例：詳しいあなたの見立てを聞きたい。AとBならどちらが現実的？'
  },
  'levelup-control': {
    situation: 'いま変えられないものまで抱えていることは？',
    action: '変えられない方を外し、自分が動かせる一手だけ残すなら？',
    placeholder: '例：相手の反応は外す。明日10時に確認メールを1通送る。'
  },
  'mada-dekinai': {
    situation: '「向いてない・才能がない」と決めそうになっていることは？',
    action: '「まだ」に通して、戦略変更・助け・部分練習のどれを試す？',
    placeholder: '例：まだできない。最初の10問だけ別の人に解き方を聞く。'
  },
  'matomaru': {
    situation: 'いま散らかっていて説明しにくい案件は？',
    action: '「要するに・なぜ・だから」の3行にすると？',
    placeholder: '例：要するにCVR低下。なぜ＝商品ページ離脱。だから＝上位3商品を修正。'
  },
  'reflex-7': {
    situation: 'いま判断に迷っている日常の1件は？',
    action: '7つの反射のうち、今いちばん使う1つと次の一手は？',
    placeholder: '例：「まず理解」を使う。結論を出す前に相手の前提を1つ聞く。'
  },
  'task-separation': {
    situation: 'いま自分が背負っている「誰かの課題」は？',
    action: '相手の課題を返して、自分の課題だけ残すなら？',
    placeholder: '例：本人が提出するかは本人の課題。自分は期限を伝えるまで。'
  },
  'thinking-stairs': {
    situation: 'いま同じ考え方で詰まっていることは？',
    action: '反応・因果・前提・構造・切替のどの段へ移る？ 何を見る？',
    placeholder: '例：前提へ上がる。「そもそも今日中に必要か」を確認する。'
  },
  'uchite': {
    situation: 'いま打ち手が1つしか見えていない課題は？',
    action: '聞く・調べる・試す・任せる・やめる等から、別方向の1手は？',
    placeholder: '例：自分で考え続けず、顧客3人に直接聞く。'
  },
  'viewpoint-exam': {
    situation: 'いま一つの見方に固まっている出来事は？',
    action: '事実は変えず、別の見方を1つ作るなら？',
    placeholder: '例：「拒否された」ではなく「条件が合わなかった可能性もある」。'
  },
  'big-tech-interview': {
    situation: '次に答えのない問いへ答える場面は？',
    action: '最初の30秒で、前提・分解・概算のどれから入る？',
    placeholder: '例：まず「成功」の定義を置き、ユーザー×頻度×単価に分ける。'
  },
  'levelup-smalltalk': {
    situation: '次に雑談が必要になりそうな相手・場面は？',
    action: '最初の一言と、続けるための質問を1つずつ作るなら？',
    placeholder: '例：「今日暑いですね」→「この辺よく来るんですか？」'
  },
  'web-marketer-owned-site': {
    situation: 'いま自社ECで一番気になっている数字・課題は？',
    action: 'セッション・CVR・単価のどこから見て、最初に何を確認する？',
    placeholder: '例：CVR。商品別CVRを見て、流入上位で落ちている3商品を出す。'
  },
  'web-marketer-rakuten': {
    situation: 'いま楽天店舗で一番気になっている数字・課題は？',
    action: 'アクセス・転換率・客単価のどこから見て、最初に何を確認する？',
    placeholder: '例：アクセス。R-Karteで検索流入とRPP流入の前年差を見る。'
  },
  'yahoo-shopping-marketer': {
    situation: 'いまYahoo!ショッピングで一番気になっている数字・課題は？',
    action: '商品・検索・広告・販促・CRMのどこから見て、最初に何を確認する？',
    placeholder: '例：検索。流入上位クエリと掲載順位、アイテムマッチの費用対効果を見る。'
  }
};

function typeFor(slug) {
  for (const [type, slugs] of Object.entries(TYPES)) if (slugs.has(slug)) return type;
  return 'general';
}

function escJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function markHtml(html, value) {
  if (new RegExp(`${MARKER}=["']`, 'i').test(html)) {
    return html.replace(new RegExp(`${MARKER}=["'][^"']*["']`, 'i'), `${MARKER}="${value}"`);
  }
  return html.replace(/<html(\s|>)/i, `<html ${MARKER}="${value}"$1`);
}

function configFor(slug, purpose) {
  const type = typeFor(slug);
  const base = GROUP_COPY[type] || GROUP_COPY.general;
  const special = SPECIAL[slug] || {};
  return {
    slug,
    version: VERSION,
    purpose: purpose || '',
    type,
    metric: special.metric || base.metric,
    title: special.title || base.title,
    situation: special.situation || base.situation,
    action: special.action || base.action,
    placeholder: special.placeholder || base.placeholder,
    ctas: base.ctas,
    intros: base.intros,
  };
}

function bridgeStyle() {
  return `
<style id="levelup-real-bridge-style">
  .lurb-launcher{box-sizing:border-box;width:min(100%,440px);margin:14px auto 0;padding:14px;border:1px solid rgba(127,127,127,.22);border-radius:18px;background:rgba(127,127,127,.10);color:inherit;text-align:left}
  .lurb-launcher[data-floating="true"]{position:fixed;z-index:2147483000;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(calc(100% - 24px),420px);box-shadow:0 16px 44px rgba(0,0,0,.28);backdrop-filter:blur(14px)}
  .lurb-launcher small{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;opacity:.62;margin-bottom:5px}
  .lurb-launcher p{margin:0 0 10px;font-size:12px;line-height:1.55;opacity:.82}
  .lurb-open{width:100%;min-height:48px;border:1px solid currentColor;border-radius:14px;background:currentColor;color:Canvas;font:inherit;font-weight:900;cursor:pointer;padding:10px 14px}
  .lurb-dialog{border:0;padding:0;background:transparent;color:inherit;width:min(calc(100% - 24px),460px);max-height:calc(100dvh - 28px)}
  .lurb-dialog::backdrop{background:rgba(0,0,0,.68);backdrop-filter:blur(5px)}
  .lurb-shell{box-sizing:border-box;max-height:calc(100dvh - 28px);overflow:auto;border:1px solid rgba(127,127,127,.26);border-radius:24px;background:Canvas;color:CanvasText;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.36)}
  .lurb-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
  .lurb-kicker{font-size:9px;font-weight:900;letter-spacing:.13em;opacity:.55}
  .lurb-head h2{font-size:24px;line-height:1.15;margin:5px 0 0;letter-spacing:-.035em}
  .lurb-close{width:44px;height:44px;min-width:44px;border:1px solid rgba(127,127,127,.25);border-radius:14px;background:transparent;color:inherit;font-size:20px;cursor:pointer}
  .lurb-purpose{font-size:11px;line-height:1.55;opacity:.65;margin:0 0 14px}
  .lurb-field{display:grid;gap:6px;margin:12px 0}
  .lurb-field>span,.lurb-meter-title{font-size:11px;font-weight:850;line-height:1.45}
  .lurb-field textarea{box-sizing:border-box;width:100%;min-height:86px;resize:vertical;border:1px solid rgba(127,127,127,.28);border-radius:15px;background:rgba(127,127,127,.08);color:inherit;padding:12px;font:inherit;font-size:16px;line-height:1.5;outline:none}
  .lurb-field textarea:focus{border-color:currentColor;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 12%,transparent)}
  .lurb-meter{border:1px solid rgba(127,127,127,.22);border-radius:16px;padding:11px 12px;margin:12px 0;background:rgba(127,127,127,.06)}
  .lurb-meter-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.lurb-meter-head strong{font-size:22px}.lurb-meter input{width:100%;margin:10px 0 2px}.lurb-scale{display:flex;justify-content:space-between;font-size:9px;opacity:.5}
  .lurb-primary{width:100%;min-height:50px;border:0;border-radius:15px;background:CanvasText;color:Canvas;font:inherit;font-weight:900;padding:10px 14px;cursor:pointer}.lurb-primary:disabled{opacity:.34;cursor:not-allowed}
  .lurb-step[hidden]{display:none!important}.lurb-action-preview{border-left:3px solid currentColor;padding:10px 12px;margin:12px 0;background:rgba(127,127,127,.07);border-radius:0 12px 12px 0}.lurb-action-preview small{display:block;font-size:9px;opacity:.5;margin-bottom:5px}.lurb-action-preview strong{font-size:14px;line-height:1.5}
  .lurb-delta{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0}.lurb-delta>div{border:1px solid rgba(127,127,127,.22);border-radius:16px;padding:12px;text-align:center}.lurb-delta small{display:block;font-size:9px;opacity:.5}.lurb-delta b{font-size:28px}.lurb-delta i{font-style:normal;opacity:.45}.lurb-result-copy{font-size:14px;line-height:1.6;font-weight:750;margin:12px 0}.lurb-history{font-size:10px;line-height:1.55;opacity:.62;margin:8px 0 14px}.lurb-privacy{font-size:9px;line-height:1.45;opacity:.45;margin:12px 0 0}
  @media(prefers-reduced-motion:reduce){.lurb-dialog::backdrop{backdrop-filter:none}}
</style>`;
}

function bridgeRuntime(config) {
  return `
<script id="levelup-real-bridge-runtime">
(() => {
  'use strict';
  const cfg = ${escJson(config)};
  const key = 'levelup-real-bridge:' + cfg.slug + ':v1';
  let launcher = null;
  let dialog = null;
  let scanTimer = 0;

  function readRuns(){ try{ const v=JSON.parse(localStorage.getItem(key)||'{}'); return Array.isArray(v.runs)?v.runs:[]; }catch{return [];} }
  function saveRun(run){ try{ const runs=readRuns().slice(-29); runs.push(run); localStorage.setItem(key,JSON.stringify({runs,updatedAt:Date.now()})); return runs; }catch{return [];} }
  function visible(el){ if(!el || el.hidden || el.getAttribute('aria-hidden')==='true') return false; const s=getComputedStyle(el); if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0) return false; const r=el.getBoundingClientRect(); return r.width>0 && r.height>0; }
  function host(){
    const selectors=['#resultScreen','#reportScreen','#doneScreen','#savedScreen','.result-screen','.report-screen','.done-screen','.saved-screen','[data-screen="result"]'];
    for(const selector of selectors){ for(const el of document.querySelectorAll(selector)){ if(visible(el)) return el; } }
    return null;
  }
  function variant(list){ const n=readRuns().length; return list && list.length ? list[n % list.length] : ''; }
  function removeFloating(){ if(launcher && launcher.dataset.floating==='true'){ launcher.remove(); launcher=null; } }
  function ensureLauncher(forceFloating=false){
    const h=host();
    if(!h && !forceFloating) return;
    if(launcher && launcher.isConnected){ if(h && launcher.dataset.floating==='true'){ launcher.remove(); launcher=null; } else return; }
    launcher=document.createElement('section');
    launcher.className='lurb-launcher';
    launcher.setAttribute('aria-label','現実で1回使う');
    if(!h) launcher.dataset.floating='true';
    launcher.innerHTML='<small>REAL LIFE / 1 REP</small><p>'+escapeHtml(variant(cfg.intros))+'</p><button class="lurb-open" type="button">'+escapeHtml(variant(cfg.ctas))+'</button>';
    (h||document.body).appendChild(launcher);
    launcher.querySelector('.lurb-open').addEventListener('click',openDialog);
  }
  function escapeHtml(v){ return String(v||'').replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); }
  function ensureDialog(){
    if(dialog) return dialog;
    dialog=document.createElement('dialog');
    dialog.className='lurb-dialog';
    dialog.innerHTML='<div class="lurb-shell">'+
      '<div class="lurb-head"><div><div class="lurb-kicker">REAL LIFE TRANSFER</div><h2>'+escapeHtml(cfg.title)+'</h2></div><button class="lurb-close" type="button" aria-label="閉じる">×</button></div>'+
      '<p class="lurb-purpose">'+escapeHtml(cfg.purpose)+'</p>'+
      '<div class="lurb-step" data-step="input">'+
        '<label class="lurb-field"><span>'+escapeHtml(cfg.situation)+'</span><textarea data-role="situation" maxlength="180" placeholder="そのまま短く書く"></textarea></label>'+
        '<div class="lurb-meter"><div class="lurb-meter-head"><span class="lurb-meter-title">今の'+escapeHtml(cfg.metric)+'</span><strong><b data-role="before-value">6</b><small>/10</small></strong></div><input data-role="before" type="range" min="0" max="10" step="1" value="6" aria-label="今の'+escapeHtml(cfg.metric)+'"><div class="lurb-scale"><span>低い</span><span>高い</span></div></div>'+
        '<label class="lurb-field"><span>'+escapeHtml(cfg.action)+'</span><textarea data-role="action" maxlength="180" placeholder="'+escapeHtml(cfg.placeholder)+'"></textarea></label>'+
        '<button class="lurb-primary" data-role="apply" type="button" disabled>この1手だけ残す →</button>'+
      '</div>'+
      '<div class="lurb-step" data-step="after" hidden>'+
        '<div class="lurb-action-preview"><small>現実で残す1手</small><strong data-role="preview"></strong></div>'+
        '<div class="lurb-meter"><div class="lurb-meter-head"><span class="lurb-meter-title">整理した後の'+escapeHtml(cfg.metric)+'</span><strong><b data-role="after-value">6</b><small>/10</small></strong></div><input data-role="after" type="range" min="0" max="10" step="1" value="6" aria-label="整理した後の'+escapeHtml(cfg.metric)+'"><div class="lurb-scale"><span>低い</span><span>高い</span></div></div>'+
        '<p class="lurb-privacy">下がっていなくてもOK。Beforeと同じ値から始めています。</p>'+
        '<button class="lurb-primary" data-role="finish" type="button">Before / Afterを見る →</button>'+
      '</div>'+
      '<div class="lurb-step" data-step="result" hidden>'+
        '<div class="lurb-delta"><div><small>BEFORE</small><b data-role="before-result">6</b></div><i>→</i><div><small>AFTER</small><b data-role="after-result">6</b></div></div>'+
        '<p class="lurb-result-copy" data-role="result-copy"></p><div class="lurb-history" data-role="history"></div>'+
        '<button class="lurb-primary" data-role="close-result" type="button">この1手を現実でやる</button>'+
        '<p class="lurb-privacy">入力した文章は保存しません。端末にはBefore/Afterの数値と回数だけ保存します。</p>'+
      '</div>'+
    '</div>';
    document.body.appendChild(dialog);
    const q=(r)=>dialog.querySelector('[data-role="'+r+'"]');
    const inputStep=dialog.querySelector('[data-step="input"]'), afterStep=dialog.querySelector('[data-step="after"]'), resultStep=dialog.querySelector('[data-step="result"]');
    const situation=q('situation'), action=q('action'), before=q('before'), beforeValue=q('before-value'), after=q('after'), afterValue=q('after-value'), apply=q('apply');
    function valid(){ apply.disabled=String(situation.value||'').trim().length<2 || String(action.value||'').trim().length<2; }
    situation.addEventListener('input',valid); action.addEventListener('input',valid); before.addEventListener('input',()=>beforeValue.textContent=before.value); after.addEventListener('input',()=>afterValue.textContent=after.value);
    dialog.querySelector('.lurb-close').addEventListener('click',()=>closeDialog());
    dialog.addEventListener('click',(e)=>{ if(e.target===dialog) closeDialog(); });
    apply.addEventListener('click',()=>{
      if(apply.disabled) return;
      q('preview').textContent=String(action.value||'').trim();
      after.value=before.value; afterValue.textContent=before.value;
      inputStep.hidden=true; afterStep.hidden=false; resultStep.hidden=true;
      try{ window.LevelUpTelemetry?.step?.('real-bridge-after'); }catch{}
    });
    q('finish').addEventListener('click',()=>{
      const b=Number(before.value), a=Number(after.value), delta=b-a;
      q('before-result').textContent=String(b); q('after-result').textContent=String(a);
      q('result-copy').textContent=delta>=3?'かなり下がった。今の1手を現実で試す。':delta>=1?'少し下がった。今の1手を残して進む。':delta===0?'数値は同じ。効果を作らず、決めた1手だけ持ち帰る。':'少し上がった。無理に効いたことにせず、この型が合うかは保留にする。';
      const runs=saveRun({before:b,after:a,delta:delta,at:Date.now()});
      const lighter=runs.filter(r=>Number(r.delta)>0).length; const avg=runs.length?runs.reduce((s,r)=>s+Number(r.delta||0),0)/runs.length:0;
      q('history').textContent=runs.length===1?'初回の現実転移を記録しました。':('現実で '+runs.length+'回中 '+lighter+'回、自己評価が軽減。平均変化 '+(avg>=0?'−':'＋')+Math.abs(avg).toFixed(1)+'。');
      inputStep.hidden=true; afterStep.hidden=true; resultStep.hidden=false;
      try{ window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete',{detail:{slug:cfg.slug,delta:delta}})); window.LevelUpTelemetry?.action?.('real-bridge-'+(delta>0?'lighter':delta===0?'same':'heavier')); window.LevelUpTelemetry?.complete?.('real-bridge'); }catch{}
    });
    q('close-result').addEventListener('click',()=>closeDialog());
    return dialog;
  }
  function resetDialog(){
    const d=ensureDialog();
    d.querySelector('[data-step="input"]').hidden=false; d.querySelector('[data-step="after"]').hidden=true; d.querySelector('[data-step="result"]').hidden=true;
    const s=d.querySelector('[data-role="situation"]'), a=d.querySelector('[data-role="action"]'), b=d.querySelector('[data-role="before"]'), av=d.querySelector('[data-role="after"]');
    s.value=''; a.value=''; b.value='6'; av.value='6'; d.querySelector('[data-role="before-value"]').textContent='6'; d.querySelector('[data-role="after-value"]').textContent='6'; d.querySelector('[data-role="apply"]').disabled=true;
  }
  function openDialog(){ resetDialog(); const d=ensureDialog(); if(typeof d.showModal==='function') d.showModal(); else d.setAttribute('open',''); try{window.LevelUpTelemetry?.action?.('real-bridge-open');}catch{} }
  function closeDialog(){ if(!dialog) return; if(typeof dialog.close==='function' && dialog.open) dialog.close(); else dialog.removeAttribute('open'); removeFloating(); }
  function scan(){ const h=host(); if(h) ensureLauncher(false); else if(launcher && launcher.dataset.floating!=='true') launcher=null; }
  window.addEventListener('levelup:played',()=>setTimeout(()=>ensureLauncher(true),350));
  window.addEventListener('levelup:quality-complete',()=>setTimeout(()=>ensureLauncher(true),350));
  document.addEventListener('click',(e)=>{ const id=e.target && e.target.id || ''; if(/retry|again|start/i.test(id)) removeFloating(); },true);
  const observer=new MutationObserver(()=>{ clearTimeout(scanTimer); scanTimer=setTimeout(scan,120); });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
  setTimeout(scan,700); setTimeout(scan,2200);
})();
</script>`;
}

if (!fs.existsSync(firebaseAppsDir)) {
  throw new Error(`Missing Firebase apps directory: ${firebaseAppsDir}`);
}

const levelupEntries = Object.entries(GAME_META).filter(([, meta]) => meta?.[0] === 'levelup');
let injected = 0;
let native = 0;
let missing = 0;

for (const [slug, meta] of levelupEntries) {
  const indexPath = path.join(firebaseAppsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) {
    missing += 1;
    console.warn(`[levelup-real-bridge] missing built app: ${slug}`);
    continue;
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  if (NATIVE_REAL_APPS.has(slug)) {
    html = markHtml(html, 'native');
    fs.writeFileSync(indexPath, html, 'utf8');
    native += 1;
    continue;
  }

  html = markHtml(html, VERSION);
  if (!html.includes('id="levelup-real-bridge-style"')) {
    html = html.replace(/<\/head>/i, `${bridgeStyle()}\n</head>`);
  }
  if (!html.includes('id="levelup-real-bridge-runtime"')) {
    html = html.replace(/<\/body>/i, `${bridgeRuntime(configFor(slug, meta?.[1]))}\n</body>`);
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  injected += 1;
}

console.log(`[levelup-real-bridge] injected=${injected} native=${native} missing=${missing} total=${levelupEntries.length}`);
