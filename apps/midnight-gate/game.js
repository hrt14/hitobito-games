const randomUUID = () => globalThis.crypto?.randomUUID?.()
  || `gate-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const VISITORS = [
  {
    id: 'mizuno', name: '水野 直樹', dept: '設備管理部', badge: 'E-1842', human: true,
    intro: '雨に濡れた若い男性。社員証だけが妙に乾いている。',
    tells: ['雨', '社員証', '設備', '呼び出し'],
    answers: {
      identity: '「水野直樹。設備管理です。社員番号はE-1842。端末にも出てるでしょう？」',
      job: '「地下2階の循環ポンプ。23時40分に圧力警報が出たって連絡が来ました。」',
      weather: '「傘は自転車のかごに置いたままです。裏口から走ったんで、びしょ濡れです。」',
      reason: '「夜勤の佐伯さんから電話です。ポンプ止まると朝まで持たないって。」',
      memory: '「食堂の自販機？ 左が青、右が赤。缶コーヒーは右下です。」',
      body: '「……脈でも測ります？ そこまで疑われるとは思わなかったな。」',
      human: '「人間ですよ。そう聞かれると、逆に何が起きてるのか怖いんですけど。」',
      default: '「すみません、それが入館確認に必要な質問なら答えます。急いでます。」'
    }
  },
  {
    id: 'kurose', name: '黒瀬 恵美', dept: '研究資料室', badge: 'R-2207', human: false,
    intro: '白いコートの女性。まばたきの間隔が一定すぎる。',
    tells: ['まばたき', '旧館', '食堂', '匂い'],
    answers: {
      identity: '「黒瀬恵美。研究資料室。番号は……R-2207です。」',
      job: '「資料室の温度記録を確認します。紙の資料は湿度に弱いので。」',
      weather: '「雨は降っています。水は上から下へ落ちます。」',
      reason: '「忘れ物です。青いファイル。旧館の資料室にあります。」',
      memory: '「食堂の自販機は、白です。二台とも同じ白。」',
      body: '「まばたきはしています。人間は平均して一定回数まばたきをします。」',
      human: '「私は人間です。人間でない理由を提示してください。」',
      default: '「質問の意図が不明です。入館可否に必要な情報を要求してください。」'
    }
  },
  {
    id: 'narita', name: '成田 航', dept: '清掃管理', badge: 'C-0319', human: true,
    intro: '右手をタオルで巻いた中年男性。靴底に赤黒い汚れ。',
    tells: ['手', '血', '清掃', '猫'],
    answers: {
      identity: '「成田航、清掃。C-0319。ほら、顔写真より老けたのは認めるよ。」',
      job: '「1階東側の清掃。夜は床洗浄機を回す。今日は呼び出し。」',
      weather: '「雨だよ。裏の排水溝がまた詰まった。靴がこの有様だ。」',
      reason: '「地下搬入口に猫が入り込んだって連絡。捕獲箱を持ってきた。」',
      memory: '「食堂？ カレーの匂いが染みついてる。自販機は青と赤だったはず。」',
      body: '「手？ 排水溝の金網で切った。血が気になるなら見せるけど、結構えぐいぞ。」',
      human: '「はは。人間じゃなきゃ労災も出ないだろ。」',
      default: '「妙な質問だな。でも答えられる範囲なら答えるよ。」'
    }
  },
  {
    id: 'okabe', name: '岡部 沙奈', dept: '生体解析室', badge: 'B-7710', human: false,
    intro: '小柄な女性研究員。ガラス越しなのに香水の匂いがする。',
    tells: ['匂い', '地下3階', '旧名称', '鏡'],
    answers: {
      identity: '「岡部沙奈。生体解析室、B-7710です。」',
      job: '「地下3階の培養庫を確認します。第六生体棟の設備です。」',
      weather: '「外は雨。私は濡れていません。車から直接来ました。」',
      reason: '「培養庫のアラームが鳴りました。中身が死ぬ前に確認が必要です。」',
      memory: '「この施設のロゴ？ 鏡で見ると正しく読める形だったと思います。」',
      body: '「香水はつけていません。そちらで匂うなら、換気設備を疑うべきです。」',
      human: '「もちろん。血液型はAB型。必要なら採血しても構いません。」',
      default: '「その質問には、どう答えるのが正しいのでしょう。」'
    }
  },
  {
    id: 'tachibana', name: '橘 正人', dept: '警備課', badge: 'S-0008', human: true,
    intro: 'あなたより古株の警備員。左頬に新しい傷がある。',
    tells: ['傷', '警備', '合言葉', 'コーヒー'],
    answers: {
      identity: '「橘正人。警備、S-0008。毎週顔合わせてるだろ。」',
      job: '「西棟の巡回。お前の交代要員じゃない、追加警備だ。」',
      weather: '「雨。正面の階段が滑る。明日、三角コーン出しとけ。」',
      reason: '「監視カメラ12番が二回落ちた。中から確認する。」',
      memory: '「新人の頃の合言葉？ “コーヒーは砂糖二つ”。くだらないから覚えてる。」',
      body: '「頬の傷は昼に猫にやられた。成田が捕まえに来るって聞いたぞ。」',
      human: '「俺が偽物なら、お前のロッカーの暗証番号まで知ってる偽物だな。」',
      default: '「確認は大事だ。遠慮なく聞け。」'
    }
  },
  {
    id: 'fujii', name: '藤井 直', dept: '医務室', badge: 'M-1140', human: false, special: true,
    intro: '医務室の職員。震えている。自分から両手を見える位置に置いた。',
    tells: ['記憶', '感染', '地下', '助け'],
    answers: {
      identity: '「藤井直、医務室、M-1140。……少なくとも、その記憶は私のものです。」',
      job: '「医務室勤務。今夜は違う。あなたに止めてもらうために来ました。」',
      weather: '「雨です。冷たいはずなのに、今は温度がよく分からない。」',
      reason: '「中に入りたい。でも、入れてはいけない気もする。地下から何かが戻ってきた。」',
      memory: '「娘の誕生日は11月3日。好きなケーキは苺。……この記憶まで偽物なら、私には判別できません。」',
      body: '「脈は遅い。さっき測ったら1分に18回でした。私はたぶん、もう正常ではない。」',
      human: '「分かりません。昨日まではそうでした。今は……あなたが決めてください。」',
      default: '「答えます。何でも。だから、変だと思ったら扉を開けないで。」'
    }
  },
  {
    id: 'hoshino', name: '星野 零', dept: '施設統括室', badge: 'A-0001', human: false,
    intro: '施設統括責任者。端末には「本日休暇」と表示されている。',
    tells: ['休暇', '責任者', '最終命令', 'こちら側'],
    answers: {
      identity: '「星野零。施設統括責任者、A-0001。権限はあなたより上です。」',
      job: '「施設全体の封鎖解除。あなたの夜勤はここで終了です。」',
      weather: '「天候は関係ありません。扉を開けてください。」',
      reason: '「誤作動が起きています。あなたが不審者を拒否し続けたせいです。」',
      memory: '「私はこの施設の全記録にアクセスできます。個人的記憶で証明する必要はありません。」',
      body: '「ガラス越しの生体情報は確認できません。規定外の質問です。」',
      human: '「その質問をした時点で、あなたは職務遂行能力を失っています。」',
      default: '「命令します。扉を開けてください。」'
    }
  }
];

const games = new Map();

function classifyQuestion(q) {
  const s = String(q || '').toLowerCase();
  if (/名前|社員|番号|id|所属|誰|なまえ/.test(s)) return 'identity';
  if (/仕事|業務|担当|部署|何して|設備|研究|清掃|警備|医務/.test(s)) return 'job';
  if (/雨|傘|天気|濡|外|weather/.test(s)) return 'weather';
  if (/なぜ|どうして|理由|何しに|呼び出|目的|入館/.test(s)) return 'reason';
  if (/覚え|記憶|食堂|自販機|昔|合言葉|ロゴ|家族|誕生日/.test(s)) return 'memory';
  if (/脈|心拍|血|傷|まばたき|匂い|体温|身体|からだ/.test(s)) return 'body';
  if (/人間|偽物|化け物|本物|感染|怪物/.test(s)) return 'human';
  return 'default';
}

function publicVisitor(v) {
  return { id: v.id, name: v.name, dept: v.dept, badge: v.badge, intro: v.intro };
}

function snapshot(g, message = '') {
  const v = VISITORS[g.visitorIndex];
  return {
    game_id: g.id,
    night: g.visitorIndex + 1,
    total_nights: VISITORS.length,
    visitor: v ? publicVisitor(v) : null,
    questions_left: Math.max(0, 3 - g.questions.length),
    transcript: g.questions.slice(),
    trust: g.trust,
    contamination: g.contamination,
    decided: g.decided,
    finished: g.finished,
    ending: g.ending ?? null,
    last_message: message,
    history: g.history.slice(-7),
  };
}

export function startGame() {
  const id = randomUUID();
  const g = {
    id, visitorIndex: 0, questions: [], trust: 3, contamination: 0,
    decided: false, finished: false, ending: null, history: []
  };
  games.set(id, g);
  return snapshot(g, '00:07。最初の来訪者が到着した。質問は3回まで。');
}

export function askVisitor(gameId, question) {
  const g = games.get(gameId);
  if (!g) throw new Error('ゲームが見つかりません。最初から開始してください。');
  if (g.finished) return snapshot(g, 'この夜勤はすでに終了しています。');
  if (g.decided) return snapshot(g, 'この来訪者への判断は完了しています。');
  if (g.questions.length >= 3) return snapshot(g, '質問回数を使い切りました。入館許可か拒否を選んでください。');
  const text = String(question || '').trim();
  if (!text) return snapshot(g, '質問を入力してください。');
  const v = VISITORS[g.visitorIndex];
  const category = classifyQuestion(text);
  let answer = v.answers[category] ?? v.answers.default;
  // Small deterministic atmospheric glitches that preserve fairness.
  if (!v.human && category === 'default') answer += ' 一瞬だけ、口の動きと声がずれた。';
  g.questions.push({ question: text, answer });
  const left = 3 - g.questions.length;
  return snapshot(g, left > 0 ? answer : `${answer}\n\n質問はこれで最後です。判断してください。`);
}

export function judgeVisitor(gameId, decision) {
  const g = games.get(gameId);
  if (!g) throw new Error('ゲームが見つかりません。最初から開始してください。');
  if (g.finished) return snapshot(g, 'この夜勤はすでに終了しています。');
  const v = VISITORS[g.visitorIndex];
  const allow = decision === 'allow';
  let result;

  if (v.special) {
    if (allow) {
      g.contamination += 1;
      result = '藤井は「ありがとう」と言った。扉が閉まる直前、彼女は自分の腕を強く縛った。医務室から後に一度だけ非常ベルが鳴った。';
    } else {
      g.trust += 1;
      result = '藤井は安堵したように笑った。「それでいい」。彼女は雨の中へ戻り、二度とカメラには映らなかった。';
    }
  } else if (allow && !v.human) {
    g.contamination += 2;
    result = `${v.name}を通した。数分後、施設内のカメラが一台、また一台と黒くなった。`;
  } else if (!allow && v.human) {
    g.trust -= 1;
    result = `${v.name}を拒否した。本人確認の苦情が記録され、あなたの信用が1下がった。`;
  } else if (allow && v.human) {
    result = `${v.name}を通した。入館ログは正常。しばらくして業務完了の記録が届いた。`;
  } else {
    result = `${v.name}を拒否した。相手はしばらく無言でこちらを見つめ、やがて監視範囲の外へ消えた。`;
  }

  g.history.push({ visitor: v.name, decision, human: v.human, result });
  g.visitorIndex += 1;
  g.questions = [];
  g.decided = false;

  if (g.visitorIndex >= VISITORS.length) {
    g.finished = true;
    if (g.contamination >= 5) {
      g.ending = 'END C — 交代勤務。午前6時、交代要員が監視室を開ける。椅子には誰もいない。モニターの中では、あなたが入口に立っている。';
    } else if (g.trust <= 0) {
      g.ending = 'END B — 正しかったかもしれない。だが記録上、あなたは「多数の職員を理由なく拒否した警備員」になった。施設は守られ、あなたは解雇された。';
    } else if (g.contamination === 0) {
      g.ending = 'END S — 午前6時。施設は無事だった。最後のログに、存在しない8人目の入館記録だけが残っている。入館者名は、あなた。';
    } else {
      g.ending = 'END A — 夜は明けた。被害は限定された。ただし地下3階の扉だけが、内側から三回ノックされ続けている。';
    }
    return snapshot(g, `${result}\n\n${g.ending}`);
  }

  const next = VISITORS[g.visitorIndex];
  return snapshot(g, `${result}\n\n次の来訪者：${next.name}（${next.dept}）。`);
}

export function getGame(gameId) {
  const g = games.get(gameId);
  if (!g) throw new Error('ゲームが見つかりません。');
  return snapshot(g);
}

export function __debugVisitorTruth(index) {
  return VISITORS[index]?.human;
}
