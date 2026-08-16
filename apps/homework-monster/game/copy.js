// 宿題モンスター — ゲーム内テキスト
//
// 禁止コピー（仕様 11.2）はここで一元管理して混入を防ぐ。
// 「サボる」「ノルマ」「連続記録」「お腹をすかせている」「頑張りが足りない」
// のような、できなかったことを責める表現は使わない。

export const COPY = {
  title: '宿題モンスター',
  tagline: '大きすぎる宿題は、ひとくちにしよう。',

  opening: {
    line1: 'この子は、宿題を食べて育つらしい。',
    line2: 'でも、まだ口がとても小さい。',
    cry: 'きゅる……',
    cta: '宿題をひとくち作る',
  },

  home: {
    startFirst: '宿題をひとくち作る',
    startAgain: 'つづきのひとくちを作る',
    welcomeBack: 'おかえり。今日はどのひとくちにする？',
    greeting: 'いっしょに、ひとくちだけ。',
    bitesLabel: 'たべたひとくち',
    listBtn: '宿題リスト',
    bookBtn: 'ずかん',
    recordBtn: 'きろく',
  },

  subject: {
    heading: 'どの宿題にする？',
    continueLabel: '前回のつづき',
  },

  input: {
    heading: 'モンスターに見せてみよう',
    titleLabel: 'なまえ（書かなくてもいい）',
    titlePlaceholder: 'れい：算数のプリント',
    kindLabel: 'どんな宿題？',
    amountLabel: 'どれくらい？（書かなくてもいい）',
    cta: 'モンスターに見せる',
  },

  chunk: {
    heading: 'この宿題、そのまま食べられるかな？',
    tooBig: 'わあ、大きい！ このままじゃ口に入らないぞ。',
    makeBite: 'ひとくちにしてあげよう。',
    oneQuestion: 'これなら食べられそう！',
    justOpen: 'まずは開くところまで小さくできた！',
    confirm: 'これならできそう',
    smaller: 'もっと小さく',
    smallest: 'これがいちばん小さいひとくち',
    customPrompt: '自分でもっと小さく書く',
    customPlaceholder: 'れい：えんぴつを持つ',
    sizeLabel: 'ひとくちの大きさ',
  },

  focus: {
    label: 'いまのひとくち',
    start: 'このひとくちだけ、やってみよう。',
    done: 'できた！',
    tooBig: 'まだ大きい',
    rest: 'ちょっと休む',
    timerLabel: 'タイマー（つかわなくてもいい）',
    timerNone: 'なし',
    timerDone: '時間になったよ。どうだった？',
  },

  resize: {
    heading: 'このひとくちは、まだ少し大きかったみたい。',
    sub: 'もっと小さくしよう。',
    measuring: 'モンスターが大きさをはかっている……',
    counted: 'ちいさくできた！',
  },

  feeding: {
    transform: 'できた！ ごはんに変わった！',
    give: 'モンスターにあげよう',
    hint: 'ドラッグしても、タップしてもいいよ',
    eating: 'もぐもぐ……',
  },

  result: {
    heading: 'できた！',
    grewLabel: '育ったもの',
    didLabel: '今回できたこと',
    more: 'もうひとくち',
    finish: '今日はここまで',
    colorPrompt: '体の色をえらべるようになった！',
    namePrompt: '名前をつけてあげよう',
    namePlaceholder: 'れい：もぐもぐ',
    nameConfirm: 'この名前にする',
    nameSkip: 'あとできめる',
  },

  breakScreen: {
    heading: 'モンスターも、ひとやすみ。',
    sub: 'いつでも戻ってきていいよ。',
    back: '戻る',
    finish: '今日はここまで',
  },

  end: {
    heading: '今日のひとくち、ごちそうさま！',
    back: 'モンスターの部屋へ',
  },

  records: {
    heading: 'きろく',
    bites: 'たべさせたひとくち',
    starts: 'はじめた回数',
    resizes: 'ちいさくできた数',
    returns: '休んだあと戻れた数',
    subjectHeading: '食べた ごはんの しゅるい',
    footer: 'ここにある数は、へらない。休んでも、そのままのこる。',
    back: '戻る',
  },

  settings: {
    heading: 'せってい',
    bgm: 'BGM',
    sfx: '音',
    reducedMotion: '動きをひかえめにする',
    furigana: 'ふりがなをつける',
    exportData: 'データを書き出す',
    exportEvents: 'テスト記録を書き出す',
    reset: '最初からやり直す',
    resetConfirm: '本当に最初からやり直す？ 先にバックアップを書き出すよ。',
    resetYes: 'やり直す',
    resetNo: 'やめる',
    back: '戻る',
  },

  common: {
    back: '戻る',
    close: 'とじる',
  },
};

// 分解階層のいちばん上（そのままの宿題）に使う表示名
export const WHOLE_LABEL = '宿題を全部やる';
