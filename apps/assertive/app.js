const STORAGE_KEY = 'hitobito.assertive.stats.v1';
const ROUND_COUNT = 4;
const SLOT_ORDER = ['fact', 'stance', 'ask'];
const SLOT_LABEL = { fact: '事実', stance: '自分の立場', ask: '要望・境界' };

const SCENARIOS = [
  {
    id: 'boss-tonight',
    skill: '断る',
    context: '退勤30分前。今日締切の仕事を抱えている。',
    speaker: '上司',
    line: '「これ、今日中にお願い。そんなに時間かからないよね？」',
    reflexes: [
      { kind: '飲み込む', text: '「……わかりました」', note: '自分の限界を消して、その場だけ終わらせる。' },
      { kind: 'ぶつける', text: '「無理に決まってるじゃないですか」', note: '相手ごと否定して、内容より衝突が主役になる。' },
    ],
    phrases: [
      { id: 'b1f', slot: 'fact', text: '今日は17時までに別件の締切があります。', good: true },
      { id: 'b1s', slot: 'stance', text: '今日中に両方を終えるのは難しいです。', good: true },
      { id: 'b1a', slot: 'ask', text: 'こちらを明日午前にするか、優先順位を決めてもらえますか。', good: true },
      { id: 'b1x1', text: 'いつも急すぎます。', good: false, reason: '相手の人格・傾向の採点より、今回の事実を置く方が話を前に進めやすい。' },
      { id: 'b1x2', text: '私が頑張れば何とかします。', good: false, reason: '本当は難しいのに可能だと見せると、境界が相手に伝わらない。' },
      { id: 'b1x3', text: 'たぶん厳しいかもしれません……。', good: false, reason: '曖昧にすると「少し押せばいける」に聞こえる。難しいなら短く言い切る。' },
    ],
    pushback: {
      line: '「でも、みんな忙しいんだよ。今日やってくれないと困る」',
      options: [
        { id: 'b1p1', order: 0, text: '今日必要なのは分かりました。', good: true },
        { id: 'b1p2', order: 1, text: 'ただ、両方はできないので、どちらを優先するか決めてください。', good: true },
        { id: 'b1px1', text: '分かりました。なんとかします。', good: false, reason: '相手が困ることと、できない量を引き受けることは別。線を消さない。' },
        { id: 'b1px2', text: '困るのはそっちの問題ですよね。', good: false, reason: '境界は保てても、相手を突き放す必要はない。受け止めてから線へ戻る。' },
      ],
    },
    resultTitle: 'NOを、理由で溶かさなかった。',
    rule: '相手が困っていることは受け止められる。でも、できない量まで「できる」に変える必要はない。',
  },
  {
    id: 'ask-colleague',
    skill: '頼む',
    context: '共同資料。自分だけでは締切に間に合わない。',
    speaker: '同僚',
    line: '「進捗どう？ こっちは自分の担当で手いっぱいなんだけど」',
    reflexes: [
      { kind: '飲み込む', text: '「大丈夫。自分でやるよ」', note: '必要な助けを隠して、あとで破綻しやすくする。' },
      { kind: 'ぶつける', text: '「こっちだって手いっぱいだよ」', note: '苦しさ比べにすると、具体的な依頼が消える。' },
    ],
    phrases: [
      { id: 'c1f', slot: 'fact', text: '残り6ページで、私の作業時間だけだと締切を2時間ほど超えます。', good: true },
      { id: 'c1s', slot: 'stance', text: 'このまま一人で抱えるより、今分担を相談したいです。', good: true },
      { id: 'c1a', slot: 'ask', text: '図表2点だけ、16時までにお願いできますか。', good: true },
      { id: 'c1x1', text: '少しくらい手伝ってくれてもよくない？', good: false, reason: '「少しくらい」は量も期限も不明。相手が判断できる具体的な依頼にする。' },
      { id: 'c1x2', text: 'もういい、自分でやる。', good: false, reason: '頼む前に諦めると、必要な調整の機会を自分で閉じてしまう。' },
      { id: 'c1x3', text: '本当に本当に申し訳ないんだけど……。', good: false, reason: '謝罪を重ねるより、必要な状況と依頼を短く伝える方が判断しやすい。' },
    ],
    pushback: {
      line: '「今日？ それはちょっと急じゃない？」',
      options: [
        { id: 'c1p1', order: 0, text: '急な相談になったのはその通りです。', good: true },
        { id: 'c1p2', order: 1, text: '難しければ、1点だけでも可能か教えてください。', good: true },
        { id: 'c1px1', text: 'やっぱり何でもない。', good: false, reason: '相手の最初の反応だけで依頼を消さず、可能な範囲を一度確認する。' },
        { id: 'c1px2', text: '前に私も手伝ったよね？', good: false, reason: '貸し借りで圧をかけるより、今回できる範囲を相談する。' },
      ],
    },
    resultTitle: '頼むことを、借りにしなかった。',
    rule: 'アサーティブな依頼は、相手に断る余地を残したまま、必要なことを具体的に言う。',
  },
  {
    id: 'meeting-disagree',
    skill: '異論',
    context: '会議。全員が賛成ムードだが、数字に懸念がある。',
    speaker: '進行役',
    line: '「じゃあ、この案で決定でいいですね？」',
    reflexes: [
      { kind: '飲み込む', text: '（空気を壊したくない。黙っておこう）', note: '必要な情報を持っていても、雰囲気を優先して消す。' },
      { kind: 'ぶつける', text: '「その案、普通に危ないと思います」', note: '案の検討より、相手の判断への評価に聞こえやすい。' },
    ],
    phrases: [
      { id: 'm1f', slot: 'fact', text: '一点、先月の返品率が想定より4ポイント高いです。', good: true },
      { id: 'm1s', slot: 'stance', text: 'この数字を確認せず確定するのはリスクがあると思います。', good: true },
      { id: 'm1a', slot: 'ask', text: '返品要因だけ10分確認してから決めませんか。', good: true },
      { id: 'm1x1', text: 'みんな本当にこれでいいんですか？', good: false, reason: '全員を試す言い方より、自分が見ている具体的な懸念を出す。' },
      { id: 'm1x2', text: '私だけ違うかもしれませんが……。', good: false, reason: '異論を出す前から小さくしすぎない。根拠があるなら、その根拠を先に置く。' },
      { id: 'm1x3', text: '絶対やめた方がいいです。', good: false, reason: '結論を強く断定するより、事実と懸念を分けると検討しやすい。' },
    ],
    pushback: {
      line: '「そこはもう前回話したよ。時間もないし進めよう」',
      options: [
        { id: 'm1p1', order: 0, text: '時間がないのは分かります。', good: true },
        { id: 'm1p2', order: 1, text: 'その上で、返品率の変化だけは決定前に確認したいです。', good: true },
        { id: 'm1px1', text: 'じゃあもういいです。', good: false, reason: '一度押されたことと、懸念が消えたことは別。重要なら短く再提示する。' },
        { id: 'm1px2', text: '前回の議論が雑だったからです。', good: false, reason: '過去の議論を攻撃するより、今確認したい一点へ戻す。' },
      ],
    },
    resultTitle: '空気より、必要な一点を出せた。',
    rule: '異論は「相手が間違い」と言うことではない。見えている事実と懸念を、検討できる形で出す。',
  },
  {
    id: 'family-boundary',
    skill: '境界',
    context: '家で休んでいる時間。家族が予定を当然のように入れてくる。',
    speaker: '家族',
    line: '「明日の午前、これやっておいて。家にいるでしょ？」',
    reflexes: [
      { kind: '飲み込む', text: '「……うん、いいよ」', note: '休む予定を「予定なし」として消してしまう。' },
      { kind: 'ぶつける', text: '「勝手に予定入れないでよ」', note: '必要な境界より、怒りそのものが前に出る。' },
    ],
    phrases: [
      { id: 'f1f', slot: 'fact', text: '明日の午前は家にいるけど、休む時間にしています。', good: true },
      { id: 'f1s', slot: 'stance', text: 'その時間は空いている扱いにはしたくないです。', good: true },
      { id: 'f1a', slot: 'ask', text: '午後ならできるので、そこでもいい？', good: true },
      { id: 'f1x1', text: '家にいるからって暇じゃない。', good: false, reason: '反論だけで終わらず、「いつならできる／何は守る」を具体的にする。' },
      { id: 'f1x2', text: 'まあ、今回だけなら……。', good: false, reason: '守りたい線があるなら、今回だけ消す前に一度言葉にする。' },
      { id: 'f1x3', text: '普通、先に聞かない？', good: false, reason: '「普通」の採点より、自分がどう扱ってほしいかを伝える。' },
    ],
    pushback: {
      line: '「休むだけでしょ？ すぐ終わるからお願い」',
      options: [
        { id: 'f1p1', order: 0, text: 'すぐ終わる用事なのは分かった。', good: true },
        { id: 'f1p2', order: 1, text: 'でも午前は休むので、やるなら午後にします。', good: true },
        { id: 'f1px1', text: 'そこまで言うならやるよ。', good: false, reason: '相手が繰り返しただけで、自分の予定まで自動的に変える必要はない。' },
        { id: 'f1px2', text: 'だからそういうところが嫌なんだよ。', good: false, reason: '今回の境界から、相手全体の評価へ広げない。' },
      ],
    },
    resultTitle: '休む時間を、「空き」にしなかった。',
    rule: '境界線は相手を罰するためではなく、自分が何をする／しないかを明確にするために引く。',
  },
  {
    id: 'client-discount',
    skill: '交渉',
    context: '取引先から、合意後に追加の値下げを求められた。',
    speaker: '取引先',
    line: '「長い付き合いなんだから、あと20%くらい何とかならない？」',
    reflexes: [
      { kind: '飲み込む', text: '「分かりました。今回だけ……」', note: '判断条件を確認せず、関係を守るために条件を手放す。' },
      { kind: 'ぶつける', text: '「それはさすがに無茶です」', note: '要求を評価する前に、自分が出せる条件を示す方が交渉になる。' },
    ],
    phrases: [
      { id: 'd1f', slot: 'fact', text: '今の価格は、今回の作業範囲を前提に見積もっています。', good: true },
      { id: 'd1s', slot: 'stance', text: '同じ範囲のまま20%下げるのは難しいです。', good: true },
      { id: 'd1a', slot: 'ask', text: '予算を優先するなら、作業範囲を減らす案を一緒に見ませんか。', good: true },
      { id: 'd1x1', text: 'うちも利益が必要なので。', good: false, reason: '自社事情だけで押し返すより、価格と作業範囲の関係を具体化する。' },
      { id: 'd1x2', text: '長い付き合いをそう使われるのは困ります。', good: false, reason: '関係性の評価より、今回変えられる条件へ戻す。' },
      { id: 'd1x3', text: '本当に厳しいんですが、少しなら……。', good: false, reason: '線が曖昧だと値下げ幅の押し合いになる。まず何が難しいかを明確にする。' },
    ],
    pushback: {
      line: '「他社ならもっと安いよ。これじゃ社内を通せないな」',
      options: [
        { id: 'd1p1', order: 0, text: '社内予算が重要なのは分かります。', good: true },
        { id: 'd1p2', order: 1, text: '価格を下げるなら、範囲を調整する条件で相談させてください。', good: true },
        { id: 'd1px1', text: 'じゃあ他社に頼んでください。', good: false, reason: '選択肢は相手にある。ただし、こちらから関係を切る言い方にする必要はない。' },
        { id: 'd1px2', text: '分かりました、10%なら下げます。', good: false, reason: '圧が強くなったことだけを理由に、決めていた条件を自動で動かさない。' },
      ],
    },
    resultTitle: '関係ではなく、条件を交渉できた。',
    rule: '交渉は相手に勝つことではない。守る条件と動かせる条件を分け、代案を出す。',
  },
  {
    id: 'friend-money',
    skill: '断る',
    context: '友人から、少額だが貸したくないお金を頼まれた。',
    speaker: '友人',
    line: '「今月だけ1万円貸して。来月絶対返すから」',
    reflexes: [
      { kind: '飲み込む', text: '「……分かった」', note: '嫌だと思っているのに、関係を失う怖さだけで決める。' },
      { kind: 'ぶつける', text: '「そういうの人に頼むのやめた方がいいよ」', note: '断ることと、相手の生き方を指導することは別。' },
    ],
    phrases: [
      { id: 'fmf', slot: 'fact', text: 'お金を貸してほしいという話だね。', good: true },
      { id: 'fms', slot: 'stance', text: '友人とのお金の貸し借りはしないと決めています。', good: true },
      { id: 'fma', slot: 'ask', text: 'なので今回は貸せません。', good: true },
      { id: 'fmx1', text: '今ちょっと余裕なくて……。', good: false, reason: '本当の線が「貸し借りしない」なら、架空の事情に置き換えず短く伝える。' },
      { id: 'fmx2', text: '絶対返せるの？', good: false, reason: '返済可能性を審査し始めると、「条件次第では貸す」話に変わる。自分の方針へ戻る。' },
      { id: 'fmx3', text: '普通そんなこと友達に頼まないよ。', good: false, reason: '断るために相手を恥じさせる必要はない。' },
    ],
    pushback: {
      line: '「え、信用してないってこと？ 友達なのに？」',
      options: [
        { id: 'fmp1', order: 0, text: '信用の話に聞こえたんだね。', good: true },
        { id: 'fmp2', order: 1, text: 'でも誰に対しても貸し借りはしないので、今回は貸せません。', good: true },
        { id: 'fmpx1', text: 'そういう意味じゃないから、じゃあ貸すよ。', good: false, reason: '誤解されたことと、自分の方針を変えることは別。説明して線を保てる。' },
        { id: 'fmpx2', text: 'そういう言い方するならなおさら貸さない。', good: false, reason: '断る理由を相手への罰に変えず、自分の方針として保つ。' },
      ],
    },
    resultTitle: 'NOを、相手への評価にしなかった。',
    rule: '断るとき、相手を悪者にする必要はない。「私はこうする」を短く保てばいい。',
  },
  {
    id: 'joke-stop',
    skill: '境界',
    context: '複数人の場。自分をネタにした冗談が繰り返されている。',
    speaker: '知人',
    line: '「また遅刻？ ほんと時間にルーズな人だよね（笑）」',
    reflexes: [
      { kind: '飲み込む', text: '「ははは……」', note: '笑って合わせると、やめてほしいという情報が相手に届かない。' },
      { kind: 'ぶつける', text: '「それ面白くないから」', note: '止めることはできても、相手を切る強さまで足す必要はない。' },
    ],
    phrases: [
      { id: 'jsf', slot: 'fact', text: '遅刻したことはその通りです。', good: true },
      { id: 'jss', slot: 'stance', text: 'ただ、それを人前で繰り返しネタにされるのは嫌です。', good: true },
      { id: 'jsa', slot: 'ask', text: 'そのいじりはここでやめてください。', good: true },
      { id: 'jsx1', text: 'こっちだって言いたいことあるけど？', good: false, reason: '反撃材料を出すと、やめてほしい境界が口論へ変わる。' },
      { id: 'jsx2', text: 'できれば、あんまり言わないでほしいかも。', good: false, reason: 'やめてほしいなら、程度をぼかさず短く頼む。' },
      { id: 'jsx3', text: 'そういう冗談、本当に性格悪いよ。', good: false, reason: '行動を止めてほしいのであって、相手の人格を判定する必要はない。' },
    ],
    pushback: {
      line: '「え、冗談じゃん。そんな本気にする？」',
      options: [
        { id: 'jsp1', order: 0, text: '冗談のつもりなのは分かった。', good: true },
        { id: 'jsp2', order: 1, text: '私は嫌なので、その話題でいじるのはやめてください。', good: true },
        { id: 'jspx1', text: 'ごめん、気にしすぎた。', good: false, reason: '相手の意図が冗談でも、自分が嫌だという境界まで取り消す必要はない。' },
        { id: 'jspx2', text: '冗談なら何言ってもいいと思ってる？', good: false, reason: '議論を広げず、「私はこれをやめてほしい」に戻る。' },
      ],
    },
    resultTitle: '「嫌」を、説明しすぎず言えた。',
    rule: '境界は、相手が悪意を認めてから引くものではない。自分がやめてほしい行動を具体的に言う。',
  },
  {
    id: 'interrupt',
    skill: '異論',
    context: '会議で、自分の説明中に何度も話をかぶせられる。',
    speaker: '同僚',
    line: '「いや、それより先に結論だけ言って。つまり何？」',
    reflexes: [
      { kind: '飲み込む', text: '「あ、すみません……」', note: '必要な説明まで切って、相手のペースだけに合わせる。' },
      { kind: 'ぶつける', text: '「最後まで聞いてもらえます？」', note: '苛立ちを乗せると、必要な発言時間の確保より対立が目立つ。' },
    ],
    phrases: [
      { id: 'inf', slot: 'fact', text: '結論はあと30秒で言えます。', good: true },
      { id: 'ins', slot: 'stance', text: '前提を一つだけ共有してから結論を伝えたいです。', good: true },
      { id: 'ina', slot: 'ask', text: '30秒だけ続けてもいいですか。', good: true },
      { id: 'inx1', text: 'さっきから話を遮られてます。', good: false, reason: '過去の回数を責めるより、今ほしい「30秒」を具体的に取る。' },
      { id: 'inx2', text: 'じゃあ結論だけ言います。', good: false, reason: '本当に必要な前提があるなら、相手の急かしだけで捨てず短い時間を要求する。' },
      { id: 'inx3', text: 'そんな急がなくてもいいじゃないですか。', good: false, reason: '相手の姿勢を変えようとするより、自分の発言に必要な時間を言う。' },
    ],
    pushback: {
      line: '「みんな時間ないから、手短にね」',
      options: [
        { id: 'inp1', order: 0, text: 'はい、手短にします。', good: true },
        { id: 'inp2', order: 1, text: '30秒で前提と結論まで話します。', good: true },
        { id: 'inpx1', text: '分かりました、もういいです。', good: false, reason: '短くすることと、発言自体を消すことは別。必要な発言は残せる。' },
        { id: 'inpx2', text: '私の話だけ急かすのはおかしくないですか。', good: false, reason: '公平さの議論へ広げる前に、今必要な発言時間を確保する。' },
      ],
    },
    resultTitle: '発言権を、怒鳴らず取り戻せた。',
    rule: '会話の主導権は、相手を黙らせなくても取り戻せる。必要な時間・順番を具体的に言う。',
  },
  {
    id: 'delivery',
    skill: '頼む',
    context: '依頼した成果物が、約束の日を過ぎても届いていない。',
    speaker: '担当者',
    line: '「すみません、ちょっと立て込んでいて。なるべく早く出します」',
    reflexes: [
      { kind: '飲み込む', text: '「分かりました。お願いします」', note: '「なるべく早く」のままでは、自分の次工程を決められない。' },
      { kind: 'ぶつける', text: '「約束守ってください」', note: '不満は正当でも、次に必要なのは責めることより具体的な日時。' },
    ],
    phrases: [
      { id: 'dvf', slot: 'fact', text: '当初の納期は昨日で、こちらの次工程が止まっています。', good: true },
      { id: 'dvs', slot: 'stance', text: '「なるべく早く」では予定を組めない状態です。', good: true },
      { id: 'dva', slot: 'ask', text: '今日18時までに、提出できる日時を確定してもらえますか。', good: true },
      { id: 'dvx1', text: '本当に困ってます。', good: false, reason: '困っていることに加え、相手が次に何をすればいいかまで具体化する。' },
      { id: 'dvx2', text: 'もう信用できません。', good: false, reason: '信頼の評価より、今必要な「確定日時」を取りにいく。' },
      { id: 'dvx3', text: 'できるだけ急いでください。', good: false, reason: '同じ曖昧さを返さず、日時で合意できる形にする。' },
    ],
    pushback: {
      line: '「正確な時間はまだ言えないんですよね……」',
      options: [
        { id: 'dvp1', order: 0, text: 'まだ完成時刻を確定できないのは分かりました。', good: true },
        { id: 'dvp2', order: 1, text: 'では18時までに、見込みだけでも日時で連絡してください。', good: true },
        { id: 'dvpx1', text: 'じゃあ分かったら連絡ください。', good: false, reason: '連絡の期限まで消すと、また待ち続ける状態に戻る。' },
        { id: 'dvpx2', text: 'それじゃ仕事にならないですよ。', good: false, reason: '評価をぶつけるより、「次にいつ何を知らせてほしいか」を残す。' },
      ],
    },
    resultTitle: '不満を、次の約束へ変えた。',
    rule: '「ちゃんとして」ではなく、誰が・何を・いつまでに、まで言えると要求が現実に動きやすい。',
  },
  {
    id: 'scope-creep',
    skill: '交渉',
    context: '合意した仕事に、追加作業が当然のように足された。',
    speaker: '依頼者',
    line: '「ついでにこの集計も入れておいて。すぐできるでしょ？」',
    reflexes: [
      { kind: '飲み込む', text: '「はい、やっておきます」', note: '追加の量・納期・条件を確認せず、元の合意を自分で広げる。' },
      { kind: 'ぶつける', text: '「それ、契約外ですけど」', note: '事実は示せても、そこで会話を閉じる必要はない。条件調整へ進める。' },
    ],
    phrases: [
      { id: 'scf', slot: 'fact', text: 'その集計は、今の作業範囲には入っていません。', good: true },
      { id: 'scs', slot: 'stance', text: '追加するなら、今の納期か作業量の調整が必要です。', good: true },
      { id: 'sca', slot: 'ask', text: '追加を優先するなら、どの作業と入れ替えるか決めませんか。', good: true },
      { id: 'scx1', text: 'また追加ですか。', good: false, reason: '回数への不満より、今回の範囲と調整条件を明確にする。' },
      { id: 'scx2', text: 'まあ、すぐ終わるならやります。', good: false, reason: '「すぐ」を確認せず引き受けると、境界が作業量に合わせて動き続ける。' },
      { id: 'scx3', text: 'そんなの聞いてません。', good: false, reason: '過去の合意を確認したら、次に「追加なら何を動かすか」へ進む。' },
    ],
    pushback: {
      line: '「細かいこと言わずに、そこまでセットでお願いしたいんだけど」',
      options: [
        { id: 'scp1', order: 0, text: 'セットでほしい意図は分かりました。', good: true },
        { id: 'scp2', order: 1, text: '追加するなら、納期か既存作業のどちらかを調整させてください。', good: true },
        { id: 'scpx1', text: 'じゃあ今回だけやります。', good: false, reason: '圧がかかった瞬間に条件を消すと、「追加は押せば通る」という合意になる。' },
        { id: 'scpx2', text: '細かいかどうかは関係ないです。', good: false, reason: '相手の評価に反論するより、自分の条件を短く繰り返す。' },
      ],
    },
    resultTitle: '追加要求を、条件調整に戻せた。',
    rule: '要求を拒絶するだけでなく、「入れるなら何を動かすか」に変えると交渉になる。',
  },
];

const els = {
  homeView: document.querySelector('#homeView'),
  gameView: document.querySelector('#gameView'),
  resultView: document.querySelector('#resultView'),
  restartBtn: document.querySelector('#restartBtn'),
  startBtn: document.querySelector('#startBtn'),
  homeStats: document.querySelector('#homeStats'),
  roundLabel: document.querySelector('#roundLabel'),
  progressBar: document.querySelector('#progressBar'),
  skillBadge: document.querySelector('#skillBadge'),
  sceneContext: document.querySelector('#sceneContext'),
  speakerName: document.querySelector('#speakerName'),
  sceneLine: document.querySelector('#sceneLine'),
  reflexStage: document.querySelector('#reflexStage'),
  reflexTray: document.querySelector('#reflexTray'),
  reflexHint: document.querySelector('#reflexHint'),
  buildStage: document.querySelector('#buildStage'),
  responseLane: document.querySelector('#responseLane'),
  phrasePool: document.querySelector('#phrasePool'),
  buildFeedback: document.querySelector('#buildFeedback'),
  sayBtn: document.querySelector('#sayBtn'),
  voiceStage: document.querySelector('#voiceStage'),
  builtSpeech: document.querySelector('#builtSpeech'),
  spokeBtn: document.querySelector('#spokeBtn'),
  silentBtn: document.querySelector('#silentBtn'),
  pushbackStage: document.querySelector('#pushbackStage'),
  pushbackSpeaker: document.querySelector('#pushbackSpeaker'),
  pushbackLine: document.querySelector('#pushbackLine'),
  pushbackPool: document.querySelector('#pushbackPool'),
  pushbackLane: document.querySelector('#pushbackLane'),
  pushbackFeedback: document.querySelector('#pushbackFeedback'),
  lockBtn: document.querySelector('#lockBtn'),
  roundResultStage: document.querySelector('#roundResultStage'),
  roundResultTitle: document.querySelector('#roundResultTitle'),
  roundRule: document.querySelector('#roundRule'),
  roundSkillChange: document.querySelector('#roundSkillChange'),
  nextRoundBtn: document.querySelector('#nextRoundBtn'),
  resultKept: document.querySelector('#resultKept'),
  resultSummary: document.querySelector('#resultSummary'),
  skillResults: document.querySelector('#skillResults'),
  weakTitle: document.querySelector('#weakTitle'),
  weakAdvice: document.querySelector('#weakAdvice'),
  retryBtn: document.querySelector('#retryBtn'),
  shareBtn: document.querySelector('#shareBtn'),
  shareFeedback: document.querySelector('#shareFeedback'),
};

const state = {
  scenarios: [],
  round: 0,
  reflexDismissed: 0,
  slotIndex: 0,
  chosen: {},
  buildMistakes: 0,
  pushMistakes: 0,
  pushIndex: 0,
  pushChosen: [],
  spoke: false,
  roundScores: [],
  retrySkill: null,
};

function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      sessions: Number(parsed.sessions || 0),
      skills: parsed.skills && typeof parsed.skills === 'object' ? parsed.skills : {},
      last: parsed.last || null,
    };
  } catch {
    return { sessions: 0, skills: {}, last: null };
  }
}

function saveStats(stats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {}
}

function dayNumber() {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

function seededValue(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function shuffle(items, seed = Date.now()) {
  const copy = [...items];
  let s = Number(seed) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function historicalAverage(skill, stats = loadStats()) {
  const item = stats.skills?.[skill];
  if (!item?.attempts) return null;
  return Math.round(item.total / item.attempts);
}

function weakestHistoricalSkill() {
  const stats = loadStats();
  const skills = [...new Set(SCENARIOS.map((s) => s.skill))];
  const ranked = skills
    .map((skill) => ({ skill, avg: historicalAverage(skill, stats) ?? 101 }))
    .sort((a, b) => a.avg - b.avg);
  return ranked[0]?.avg <= 100 ? ranked[0].skill : null;
}

function buildScenarioSet(preferredSkill = null) {
  const seed = dayNumber() + seededValue(preferredSkill || 'daily');
  const shuffled = shuffle(SCENARIOS, seed);
  const picks = [];
  const target = preferredSkill || weakestHistoricalSkill();
  if (target) {
    const preferred = shuffled.find((s) => s.skill === target);
    if (preferred) picks.push(preferred);
  }
  for (const scenario of shuffled) {
    if (picks.length >= ROUND_COUNT) break;
    if (picks.some((p) => p.id === scenario.id)) continue;
    const duplicateSkill = picks.some((p) => p.skill === scenario.skill);
    if (!duplicateSkill || picks.length >= 3) picks.push(scenario);
  }
  for (const scenario of shuffled) {
    if (picks.length >= ROUND_COUNT) break;
    if (!picks.some((p) => p.id === scenario.id)) picks.push(scenario);
  }
  return picks.slice(0, ROUND_COUNT);
}

function showView(view) {
  [els.homeView, els.gameView, els.resultView].forEach((el) => el.classList.remove('active'));
  view.classList.add('active');
  els.restartBtn.classList.toggle('hidden', view === els.homeView);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showStage(stage) {
  [els.reflexStage, els.buildStage, els.voiceStage, els.pushbackStage, els.roundResultStage]
    .forEach((el) => el.classList.add('hidden'));
  stage.classList.remove('hidden');
  stage.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function renderHomeStats() {
  const stats = loadStats();
  if (!stats.sessions) {
    els.homeStats.classList.add('hidden');
    return;
  }
  const weak = Object.entries(stats.skills)
    .filter(([, v]) => v?.attempts)
    .map(([skill, v]) => ({ skill, avg: Math.round(v.total / v.attempts) }))
    .sort((a, b) => a.avg - b.avg)[0];
  const lastCount = stats.last?.rounds || ROUND_COUNT;
  els.homeStats.innerHTML = `<strong>前回 ${lastCount}場面</strong> ・ 累計 ${stats.sessions}セッション${weak ? ` ・ 次は「${escapeHtml(weak.skill)}」を優先` : ''}`;
  els.homeStats.classList.remove('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function currentScenario() { return state.scenarios[state.round]; }

function startSession(preferredSkill = null) {
  state.scenarios = buildScenarioSet(preferredSkill);
  state.round = 0;
  state.roundScores = [];
  state.retrySkill = preferredSkill;
  showView(els.gameView);
  renderRound();
}

function resetRoundState() {
  state.reflexDismissed = 0;
  state.slotIndex = 0;
  state.chosen = {};
  state.buildMistakes = 0;
  state.pushMistakes = 0;
  state.pushIndex = 0;
  state.pushChosen = [];
  state.spoke = false;
}

function renderRound() {
  resetRoundState();
  const s = currentScenario();
  els.roundLabel.textContent = `${state.round + 1} / ${state.scenarios.length}`;
  els.progressBar.style.width = `${((state.round + 1) / state.scenarios.length) * 100}%`;
  els.skillBadge.textContent = s.skill;
  els.sceneContext.textContent = s.context;
  els.speakerName.textContent = s.speaker;
  els.sceneLine.textContent = s.line;
  renderReflexes(s);
  renderBuild(s);
  renderPushback(s);
  showStage(els.reflexStage);
}

function renderReflexes(s) {
  els.reflexTray.innerHTML = '';
  els.reflexHint.textContent = 'カードを左右へ払う / タップでもOK';
  els.reflexHint.classList.remove('done');
  s.reflexes.forEach((item, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'reflex-card';
    card.innerHTML = `<span class="kind">${escapeHtml(item.kind)}</span><strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.note)}</small>`;
    attachSwipe(card, index % 2 === 0 ? -1 : 1);
    els.reflexTray.append(card);
  });
}

function attachSwipe(card, fallbackDirection) {
  let startX = 0;
  let deltaX = 0;
  let dragging = false;
  let moved = false;

  const dismiss = (direction) => {
    if (card.dataset.dismissed === '1') return;
    card.dataset.dismissed = '1';
    card.classList.remove('dragging');
    card.style.removeProperty('transform');
    card.classList.add(direction < 0 ? 'dismiss-left' : 'dismiss-right');
    state.reflexDismissed += 1;
    if (state.reflexDismissed >= 2) {
      els.reflexHint.textContent = '受け身にも攻撃にも乗らない。次は自分の線を作る。';
      els.reflexHint.classList.add('done');
      setTimeout(() => showStage(els.buildStage), 360);
    }
  };

  card.addEventListener('pointerdown', (event) => {
    if (card.dataset.dismissed === '1') return;
    startX = event.clientX;
    deltaX = 0;
    moved = false;
    dragging = true;
    card.classList.add('dragging');
    card.setPointerCapture?.(event.pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 8) moved = true;
    const rotate = Math.max(-10, Math.min(10, deltaX / 16));
    card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
  });

  const finish = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    if (Math.abs(deltaX) >= 62) dismiss(Math.sign(deltaX));
    else card.style.removeProperty('transform');
  };
  card.addEventListener('pointerup', finish);
  card.addEventListener('pointercancel', finish);
  card.addEventListener('click', () => {
    if (card.dataset.dismissed === '1' || moved) return;
    dismiss(fallbackDirection);
  });
}

function renderBuild(s) {
  els.buildFeedback.textContent = '';
  els.buildFeedback.className = 'feedback';
  els.sayBtn.classList.add('hidden');
  document.querySelectorAll('.response-slot').forEach((slot, index) => {
    slot.classList.remove('filled', 'error');
    slot.querySelector('small').textContent = 'まだ空いています';
    slot.onclick = () => undoFromSlot(index);
  });

  els.phrasePool.innerHTML = '';
  const phrases = shuffle(s.phrases, dayNumber() + state.round * 97 + 11);
  phrases.forEach((phrase) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `phrase ${phrase.good ? 'good' : 'bad'}`;
    button.dataset.id = phrase.id;
    button.textContent = phrase.text;
    button.addEventListener('click', () => choosePhrase(phrase, button));
    els.phrasePool.append(button);
  });
}

function choosePhrase(phrase, button) {
  if (state.slotIndex >= SLOT_ORDER.length || button.classList.contains('used')) return;
  const expected = SLOT_ORDER[state.slotIndex];
  const currentSlot = document.querySelector(`.response-slot[data-slot="${expected}"]`);
  if (phrase.good && phrase.slot === expected) {
    state.chosen[expected] = phrase;
    button.classList.add('used');
    currentSlot.classList.add('filled');
    currentSlot.querySelector('small').textContent = phrase.text;
    state.slotIndex += 1;
    els.buildFeedback.textContent = state.slotIndex < SLOT_ORDER.length
      ? `次は「${SLOT_LABEL[SLOT_ORDER[state.slotIndex]]}」。`
      : '3本で十分。長く弁明せず、これで返す。';
    els.buildFeedback.className = 'feedback good';
    if (state.slotIndex >= SLOT_ORDER.length) els.sayBtn.classList.remove('hidden');
    return;
  }

  state.buildMistakes += 1;
  currentSlot.classList.remove('error');
  void currentSlot.offsetWidth;
  currentSlot.classList.add('error');
  const message = phrase.good
    ? `その言葉は使える。ただ、今は「${SLOT_LABEL[expected]}」を先に置く。`
    : phrase.reason;
  els.buildFeedback.textContent = message;
  els.buildFeedback.className = 'feedback warn';
}

function undoFromSlot(index) {
  if (index >= state.slotIndex) return;
  for (let i = index; i < SLOT_ORDER.length; i += 1) {
    const key = SLOT_ORDER[i];
    const selected = state.chosen[key];
    if (selected) {
      const button = els.phrasePool.querySelector(`[data-id="${CSS.escape(selected.id)}"]`);
      button?.classList.remove('used');
    }
    delete state.chosen[key];
    const slot = document.querySelector(`.response-slot[data-slot="${key}"]`);
    slot.classList.remove('filled', 'error');
    slot.querySelector('small').textContent = 'まだ空いています';
  }
  state.slotIndex = index;
  els.sayBtn.classList.add('hidden');
  els.buildFeedback.textContent = `「${SLOT_LABEL[SLOT_ORDER[index]]}」から組み直せます。`;
  els.buildFeedback.className = 'feedback';
}

function builtSentence() {
  return SLOT_ORDER.map((slot) => state.chosen[slot]?.text || '').filter(Boolean).join(' ');
}

function renderPushback(s) {
  els.pushbackSpeaker.textContent = s.speaker;
  els.pushbackLine.textContent = s.pushback.line;
  els.pushbackLane.innerHTML = '';
  els.pushbackFeedback.textContent = '';
  els.pushbackFeedback.className = 'feedback';
  els.lockBtn.classList.add('hidden');
  els.pushbackPool.innerHTML = '';
  shuffle(s.pushback.options, dayNumber() + state.round * 131 + 23).forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'push-option';
    button.dataset.id = option.id;
    button.textContent = option.text;
    button.addEventListener('click', () => choosePushback(option, button));
    els.pushbackPool.append(button);
  });
}

function choosePushback(option, button) {
  if (button.classList.contains('used') || state.pushIndex >= 2) return;
  if (option.good && option.order === state.pushIndex) {
    state.pushChosen.push(option);
    state.pushIndex += 1;
    button.classList.add('used');
    const line = document.createElement('div');
    line.className = 'pushback-line';
    line.textContent = option.text;
    els.pushbackLane.append(line);
    els.pushbackFeedback.textContent = state.pushIndex === 1
      ? '受け止めた。次は、最初に決めた線へ戻る。'
      : '相手の反応は残っていても、自分の線は消えていない。';
    els.pushbackFeedback.className = 'feedback good';
    if (state.pushIndex >= 2) els.lockBtn.classList.remove('hidden');
    return;
  }

  state.pushMistakes += 1;
  const message = option.good
    ? 'その言葉も使える。先に相手の言葉を短く受け止めてから、自分の線へ戻る。'
    : option.reason;
  els.pushbackFeedback.textContent = message;
  els.pushbackFeedback.className = 'feedback warn';
}

function goVoice() {
  els.builtSpeech.textContent = builtSentence();
  showStage(els.voiceStage);
}

function goPushback(spoke) {
  state.spoke = spoke;
  showStage(els.pushbackStage);
}

function finishRound() {
  const s = currentScenario();
  const penalty = state.buildMistakes * 10 + state.pushMistakes * 14 + (state.spoke ? 0 : 4);
  const score = Math.max(42, 100 - penalty);
  state.roundScores.push({ skill: s.skill, score, mistakes: state.buildMistakes + state.pushMistakes, id: s.id });
  els.roundResultTitle.textContent = s.resultTitle;
  els.roundRule.textContent = s.rule;
  const hist = historicalAverage(s.skill);
  els.roundSkillChange.innerHTML = `<span>${escapeHtml(s.skill)}の今回</span><strong>${score}</strong>${hist !== null ? `<span>過去平均 ${hist}</span>` : '<span>初回記録</span>'}`;
  els.nextRoundBtn.textContent = state.round + 1 >= state.scenarios.length ? '結果を見る →' : '次の場面 →';
  showStage(els.roundResultStage);
}

function nextRound() {
  state.round += 1;
  if (state.round >= state.scenarios.length) {
    finishSession();
    return;
  }
  renderRound();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aggregateSession() {
  const bySkill = {};
  for (const item of state.roundScores) {
    bySkill[item.skill] ||= [];
    bySkill[item.skill].push(item.score);
  }
  return Object.entries(bySkill).map(([skill, values]) => ({
    skill,
    score: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  }));
}

function weakAdviceFor(skill) {
  const map = {
    '断る': 'NOの理由を増やしすぎず、「できない／しない」と次の選択肢を短く置く場面をもう一度。',
    '頼む': '謝り倒す前に、相手が判断できる量・期限・範囲まで具体化する場面をもう一度。',
    '異論': '相手の案を否定するより、自分が見ている事実と懸念を一点にして出す場面をもう一度。',
    '境界': '相手の意図を裁かず、「私はここまではする／これはしない」を短く保つ場面をもう一度。',
    '交渉': '押されたら譲るではなく、守る条件と動かせる条件を分けて代案にする場面をもう一度。',
  };
  return map[skill] || '相手の反応と、自分が決める線を分ける場面をもう一度。';
}

function commitSession(aggregate) {
  const stats = loadStats();
  stats.sessions += 1;
  for (const item of aggregate) {
    stats.skills[item.skill] ||= { attempts: 0, total: 0 };
    stats.skills[item.skill].attempts += 1;
    stats.skills[item.skill].total += item.score;
  }
  stats.last = {
    at: new Date().toISOString(),
    rounds: state.roundScores.length,
    scores: aggregate,
  };
  saveStats(stats);
}

function finishSession() {
  const aggregate = aggregateSession();
  commitSession(aggregate);
  const weak = [...aggregate].sort((a, b) => a.score - b.score)[0];
  state.retrySkill = weak?.skill || null;
  els.resultKept.textContent = `${state.roundScores.length}回`;
  const cleanRounds = state.roundScores.filter((r) => r.mistakes === 0).length;
  els.resultSummary.textContent = cleanRounds === state.roundScores.length
    ? '受け身にも攻撃にも戻らず、4つの会話を最後まで通せました。'
    : `${cleanRounds}場面は迷わず通過。迷った場面も、線を消さずに言い直せました。`;
  els.skillResults.innerHTML = aggregate.map((item) => `
    <div class="skill-result">
      <span>${escapeHtml(item.skill)}</span>
      <div class="skill-meter"><i style="width:${Math.max(8, item.score)}%"></i></div>
      <b>${item.score}</b>
    </div>`).join('');
  els.weakTitle.textContent = weak ? `次は「${weak.skill}」を先に。` : 'もう一度、別の場面へ。';
  els.weakAdvice.textContent = weakAdviceFor(weak?.skill);
  els.shareFeedback.textContent = '';
  showView(els.resultView);
}

async function shareResult() {
  const aggregate = aggregateSession();
  const weak = [...aggregate].sort((a, b) => a.score - b.score)[0];
  const text = [
    '言いたいことを、ちゃんと言える。',
    `今日は${state.roundScores.length}場面で、自分の線を言葉にした。`,
    weak ? `次に鍛える：${weak.skill}` : '',
  ].filter(Boolean).join('\n');
  const shareData = { title: '言いたいことを、ちゃんと言える。', text, url: location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      els.shareFeedback.textContent = '共有メニューを開きました。';
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${location.href}`);
    els.shareFeedback.textContent = '結果をコピーしました。';
  } catch (error) {
    if (error?.name === 'AbortError') return;
    els.shareFeedback.textContent = '共有できませんでした。';
  }
}

els.startBtn.addEventListener('click', () => startSession());
els.restartBtn.addEventListener('click', () => {
  showView(els.homeView);
  renderHomeStats();
});
els.sayBtn.addEventListener('click', goVoice);
els.spokeBtn.addEventListener('click', () => goPushback(true));
els.silentBtn.addEventListener('click', () => goPushback(false));
els.lockBtn.addEventListener('click', finishRound);
els.nextRoundBtn.addEventListener('click', nextRound);
els.retryBtn.addEventListener('click', () => startSession(state.retrySkill));
els.shareBtn.addEventListener('click', shareResult);

renderHomeStats();
