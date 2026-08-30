(() => {
  const app = document.getElementById('app');
  const scienceBtn = document.getElementById('scienceBtn');
  const scienceDialog = document.getElementById('scienceDialog');
  const scienceClose = document.getElementById('scienceClose');
  const scienceList = document.getElementById('scienceList');
  const exitBtn = document.getElementById('exitBtn');
  const STORE = 'thick-self:v1';
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());

  const SKILLS = {
    pause:{label:'余白',short:'反射しない',theory:'Equanimity / Non-reactivity',links:[['Baer et al. (2008) FFMQ','https://pubmed.ncbi.nlm.nih.gov/18310597/']],color:'#4b7a60'},
    accept:{label:'受容',short:'追い出さない',theory:'Acceptance',links:[['Ford et al. (2018)','https://pubmed.ncbi.nlm.nih.gov/28703602/']],color:'#6b7f58'},
    distance:{label:'距離',short:'事実と物語を分ける',theory:'Decentering / Defusion',links:[['Macri & Rogge (2024)','https://pubmed.ncbi.nlm.nih.gov/38615492/']],color:'#4a7282'},
    uncertainty:{label:'曖昧さ',short:'未確定を置く',theory:'Tolerance of Uncertainty',links:[['Näsling et al. (2024)','https://pubmed.ncbi.nlm.nih.gov/39036833/']],color:'#806f4d'},
    depth:{label:'奥行き',short:'複数の真実を持つ',theory:'Wise Reasoning / Intellectual Humility',links:[['Grossmann & Brienza (2018)','https://pubmed.ncbi.nlm.nih.gov/31162449/']],color:'#715b7f'},
    lightness:{label:'軽やかさ',short:'欲を持ち、握りすぎない',theory:'Nonattachment / Psychological Flexibility',links:[['Ho et al. (2022)','https://pubmed.ncbi.nlm.nih.gov/35690041/']],color:'#477b78'},
    recovery:{label:'復元',short:'揺れても戻る',theory:'Resilience',links:[['2024 umbrella review','https://pubmed.ncbi.nlm.nih.gov/39429523/']],color:'#7c5f55'},
    dignity:{label:'品位',short:'美学に戻る',theory:'Values-guided action / Self-compassion',links:[['ACT mechanisms (2024)','https://pubmed.ncbi.nlm.nih.gov/38615492/'],['Self-compassion & self-criticism meta-analysis','https://pubmed.ncbi.nlm.nih.gov/33749936/']],color:'#6a6147'}
  };
  const ORDER = Object.keys(SKILLS);

  const EXPLAIN = {
    pause:{point:'余白は「何も感じない」ことではなく、刺激と行動の間に数秒つくることです。',avoid:'勢いのまま攻撃することと、逆に全部飲み込んで自分を消すこと。',real:'一度止まり、事実確認・保留・落ち着いた返答のどれかを選ぶ。'},
    accept:{point:'嫌な感情が出たこと自体は失敗ではありません。まず存在を認めると、感情と行動を分けやすくなります。',avoid:'「こんな感情を持つ自分はダメ」と二重に自分を攻撃すること。',real:'感情を一度「ある」と置き、そのあとで行動だけを選ぶ。'},
    distance:{point:'起きた事実と、頭が足した意味を分けるほど、反芻や決めつけを増やしにくくなります。',avoid:'一つの出来事から「自分の価値」「相手の意図」「未来」まで一気に確定すること。',real:'観察できる事実だけを言い直し、解釈には「そう思っている」を付ける。'},
    uncertainty:{point:'まだ分からないものを、悪い結論で埋めないこと自体が訓練です。',avoid:'不安を早く消すために、根拠のない結論を作ること。',real:'「まだ分からない」を残しつつ、今できる行動だけ進める。'},
    depth:{point:'分厚さは、どちらか一方に単純化せず、相反する二つを同時に持てることでもあります。',avoid:'自分を守るために相手を全否定すること、または揉めないために自分を全否定すること。',real:'自分の立場を持ちながら、別の視点や限界も一つ残す。'},
    lightness:{point:'欲は消さなくていい。目標として持ちながら、それが自分全部を支配しない位置へ戻します。',avoid:'欲をゼロにして無理に清くなることと、100%握りしめて自己価値まで預けること。',real:'「欲しい。でも、これが自分の全部ではない」と持つ。'},
    recovery:{point:'復元は「もう平気」になることではなく、まだ揺れていても生活へ小さく戻ることです。',avoid:'完全に気分が戻るまで停止すること、自己攻撃で無理に動かすこと。',real:'今できる最小の一手を一つだけ置く。'},
    dignity:{point:'後悔は、自分全体を嫌う材料ではなく「次はどう振る舞いたいか」を教える情報として使えます。',avoid:'「自分は最低だ」と人格全体を攻撃し続けることと、恥ずかしさを消すために正当化すること。',real:'美学から外れた言動だけを認め、必要なら修復し、次の具体的な振る舞いへ戻る。'}
  };

  const VARIANT_TAILS = {
    pause:['',' しかも、その場で返事を求められている。',' 今日は少し疲れていて、反射的に返したくなっている。'],
    accept:['',' しかも、こんな感情を持つ自分まで嫌になりかけている。',' 感情を早く消して「ちゃんとした自分」に戻したくなっている。'],
    distance:['',' しかも、頭の中で意味づけがどんどん膨らんでいる。',' 何度も思い返して、自分なりのストーリーが固まりかけている。'],
    uncertainty:['',' しかも、早く答えを出して安心したくなっている。',' 待つのがしんどくて、悪い結論でも確定させたくなっている。'],
    depth:['',' しかも、どちらか一方だけを正しいことにしたくなっている。',' 気持ちを楽にするため、白黒どちらかに決めたくなっている。'],
    lightness:['',' しかも、そのことばかり考えている。',' それを手に入れることと、自分の価値がくっつき始めている。'],
    recovery:['',' しかも、気持ちはまだ完全には戻っていない。',' まだ引きずっているが、今日の生活は続いている。'],
    dignity:['',' しかも、あとから自分で思い返して引っかかっている。',' 「あれは自分らしくなかった」と恥ずかしさが残っている。']
  };

  const BASE = {
    pause:[
      {context:'仕事 / 批判',text:'「この案、正直かなり微妙だと思う」と言われた。',options:[['すぐ反論する',false],['何が微妙かを聞く',true],['今日は返答を保留する',true]],answer:'まず止まり、事実確認か保留を選ぶ。'},
      {context:'家庭 / いら立ち',text:'疲れて帰った瞬間、家族から強い口調で頼み事をされた。',options:[['同じ強さで返す',false],['「今ちょっと余裕がない」と一度伝える',true],['無言で全部引き受ける',false]],answer:'攻撃も服従もせず、状態を一度伝える。'},
      {context:'SNS / 批判',text:'自分を名指しで批判する投稿を見つけた。',options:[['その場で引用して反論する',false],['一度画面を閉じる',true],['相手の人格を分析して書き返す',false]],answer:'まず刺激から距離を取り、返すかどうかは後で選ぶ。'},
      {context:'上司 / 修正',text:'上司から「ここ、全部やり直して」と短く言われた。',options:[['言い方への怒りをその場でぶつける',false],['修正範囲を確認してから返す',true],['何も聞かず全部自分の責任にする',false]],answer:'言い方への反応と、必要な確認を分ける。'},
      {context:'顧客 / 無理な要求',text:'顧客から予定外の追加対応を当然のように求められた。',options:[['即座に断って関係を切る',false],['条件と優先順位を確認する',true],['全部無料で引き受ける',false]],answer:'まず条件を確認し、そのあと境界線を選ぶ。'},
      {context:'部下 / 反論',text:'自分の指示に対して部下から強めに反論された。',options:[['立場を使って黙らせる',false],['反論の根拠を一度聞く',true],['自分の指示をすぐ撤回する',false]],answer:'権限で押し返す前に、反論の情報を取る。'},
      {context:'会議 / 遮られる',text:'話している途中で何度も割り込まれた。',options:[['声を大きくして押し切る',false],['「最後まで話していい？」と落ち着いて戻す',true],['諦めて黙る',false]],answer:'反射で競わず、自分の発言権を落ち着いて取り戻す。'},
      {context:'移動 / マナー',text:'列に並んでいたら、目の前に人が割り込んできた。',options:[['肩をぶつけて抗議する',false],['一呼吸して事実を伝える',true],['ずっと我慢して後で怒り続ける',false]],answer:'一呼吸して、必要なら事実だけ伝える。'},
      {context:'競争 / 挑発',text:'競合の人から、こちらを軽く見るような発言をされた。',options:[['その場で実績を並べて勝ちにいく',false],['必要な部分だけ受け流し、本題に戻る',true],['相手を嫌いだと決める',false]],answer:'挑発への反応より、本来の目的へ戻る。'},
      {context:'成功 / 興奮',text:'大きな成果が出て、周囲から一気に持ち上げられた。',options:[['勢いのまま自分の凄さを語り続ける',false],['喜びつつ、返事は少し落ち着いてする',true],['嬉しくないふりをする',false]],answer:'喜びは残し、行動だけ一拍置く。'},
      {context:'権限 / 即決',text:'自分の一言で大きな方針を決められる場面になった。',options:[['気持ちよく即決する',false],['必要な情報を一つ確認してから決める',true],['責任が怖いので全部他人に任せる',false]],answer:'権限があるときほど、決定の前に一度確認を挟む。'},
      {context:'お金 / 衝動',text:'魅力的な高額オファーを「今日中に」と迫られた。',options:[['逃すのが怖くて即決する',false],['条件を持ち帰って確認する',true],['怪しいと決めつけて即拒否する',false]],answer:'焦らせる刺激と、判断そのものを分ける。'},
      {context:'噂 / 評判',text:'自分についてよくない噂が出ていると聞いた。',options:[['誰が言ったかすぐ特定しにいく',false],['まず何が事実か確認する',true],['全員敵だと思う',false]],answer:'評判への恐怖より先に、事実の範囲を確認する。'},
      {context:'予定 / 変更',text:'楽しみにしていた予定が直前で変更になった。',options:[['相手を責めるメッセージをすぐ送る',false],['一度残念さを置いて、次の選択肢を見る',true],['もう全部どうでもいいと投げる',false]],answer:'残念さを感じたまま、次の行動は別に選ぶ。'},
      {context:'返信 / 強い言葉',text:'腹の立つメッセージが届き、すぐ返したくなった。',options:[['同じ温度で返す',false],['下書きだけして送信は保留する',true],['既読無視で相手を罰する',false]],answer:'返したい衝動は認め、送信だけ遅らせる。'}
    ],
    accept:[
      {context:'比較 / 嫉妬',text:'自分より若い人が、自分より高く評価された。',emotion:'嫉妬'},
      {context:'失敗 / 恥',text:'人前で、自分の大きな勘違いが発覚した。',emotion:'恥ずかしさ'},
      {context:'成功 / 見栄',text:'大きな成果が出て、周囲からかなり褒められた。',emotion:'自慢したい気持ち'},
      {context:'不公平 / 怒り',text:'自分だけ不利な扱いを受けたように感じた。',emotion:'怒り'},
      {context:'友人 / 収入差',text:'親しい人が自分より大きく稼いでいると知った。',emotion:'羨ましさ'},
      {context:'挑戦 / 恐怖',text:'ずっとやりたかった挑戦の直前になった。',emotion:'怖さ'},
      {context:'仕事 / 面倒',text:'重要だと分かっている仕事なのに、どうしても着手したくない。',emotion:'面倒くささ'},
      {context:'家庭 / わだかまり',text:'家族の何気ない一言を何日も引きずっている。',emotion:'恨めしさ'},
      {context:'孤独 / 無視',text:'自分だけ誘われていないことに気づいた。',emotion:'寂しさ'},
      {context:'権力 / 欲',text:'自分の意見をもっと通せる立場が欲しいと思った。',emotion:'権力欲'},
      {context:'評価 / 欲',text:'もっと周囲に自分の実力を認めてほしいと思った。',emotion:'承認欲求'},
      {context:'失注 / 落胆',text:'期待していた案件がなくなった。',emotion:'落胆'},
      {context:'他者 / 軽蔑',text:'相手の理解が遅く、内心かなりイライラした。',emotion:'軽蔑する気持ち'},
      {context:'競争 / 安堵',text:'競合が失敗したと聞いて、少しほっとした。',emotion:'他人の失敗への安堵'},
      {context:'専門性 / 不安',text:'自分より詳しい人が現れ、急に自信が揺らいだ。',emotion:'劣等感'}
    ],
    distance:[
      {context:'返信 / 不安',text:'大事な相手から半日返信がない。',items:[['半日返信がない','fact'],['嫌われた','story'],['何か気に障ることを言った','story'],['今は理由が分からない','fact']],answer:'「半日返信がない」が事実。「嫌われた」は今のところ解釈。'},
      {context:'評価 / 落胆',text:'企画が採用されなかった。',items:[['企画は採用されなかった','fact'],['自分には才能がない','story'],['判断理由はまだ全部分からない','fact'],['もう将来も評価されない','story']],answer:'今回の不採用と、自分全体の才能・将来は分ける。'},
      {context:'会議 / 反芻',text:'自分が話したあと、少し沈黙があった。',items:[['少し沈黙があった','fact'],['みんな呆れた','story'],['自分の発言が原因かは不明','fact'],['恥をかいた','story']],answer:'沈黙は観察できる。周囲の評価はまだ推測。'},
      {context:'上司 / 短文',text:'上司から「あとで話そう」とだけメッセージが来た。',items:[['「あとで話そう」と来た','fact'],['怒られる','story'],['話の内容はまだ分からない','fact'],['評価が下がった','story']],answer:'メッセージの文面だけが事実。内容や評価は未確定。'},
      {context:'人間関係 / 招待',text:'いつもの集まりに今回は声がかからなかった。',items:[['今回は声がかからなかった','fact'],['嫌われて外された','story'],['理由は確認していない','fact'],['関係はもう終わりだ','story']],answer:'「呼ばれなかった」と「嫌われた」は別。'},
      {context:'売上 / 低下',text:'今月の売上が先月より落ちた。',items:[['売上が先月より落ちた','fact'],['事業はもう伸びない','story'],['原因は複数あり得る','fact'],['自分の判断は全部間違いだった','story']],answer:'一か月の数字から事業全体や自己評価まで飛ばさない。'},
      {context:'SNS / 反応',text:'投稿への反応がいつもよりかなり少なかった。',items:[['反応数が少なかった','fact'],['内容がつまらないと思われた','story'],['表示回数など他の要因は未確認','fact'],['自分には発信力がない','story']],answer:'反応数は事実。理由と自己価値はまだ解釈。'},
      {context:'仕事 / 招集',text:'重要そうな会議に自分だけ呼ばれていなかった。',items:[['自分はその会議に呼ばれていない','fact'],['外され始めている','story'],['参加者を決めた理由は未確認','fact'],['信用を失った','story']],answer:'招待の有無と、信用の評価を分ける。'},
      {context:'部下 / 沈黙',text:'部下に提案を伝えたら、返事が短く黙り込んだ。',items:[['返事が短く、その後黙った','fact'],['反発している','story'],['考えている可能性もある','fact'],['自分を尊敬していない','story']],answer:'行動は見える。内心の意味はまだ推測。'},
      {context:'家庭 / ため息',text:'話しかけた直後、相手が大きくため息をついた。',items:[['ため息をついた','fact'],['自分にうんざりしている','story'],['疲れている可能性もある','fact'],['自分が迷惑な存在だ','story']],answer:'ため息という事実と、自分への評価を切り離す。'},
      {context:'顧客 / 保留',text:'提案に対して「検討します」とだけ返ってきた。',items:[['「検討します」と返ってきた','fact'],['実質的に断られた','story'],['結論はまだ出ていない','fact'],['提案は評価されなかった','story']],answer:'保留は保留。断りと決めるのはまだ早い。'},
      {context:'比較 / 称賛',text:'会議で別の人だけが大きく褒められた。',items:[['別の人が褒められた','fact'],['自分は評価されていない','story'],['自分への評価はその場では語られていない','fact'],['自分の価値が下がった','story']],answer:'他人への称賛は、自分への否定と同義ではない。'},
      {context:'締切 / ミス',text:'一度、重要な締切に遅れた。',items:[['締切に遅れた','fact'],['自分はだらしない人間だ','story'],['再発防止は必要','fact'],['もう信頼は戻らない','story']],answer:'行動のミスと人格全体のラベルを分ける。'},
      {context:'職場 / ひそひそ話',text:'近くで同僚が小声で話し、自分を見た気がした。',items:[['小声で話していた','fact'],['自分の悪口だ','story'],['内容は聞こえていない','fact'],['職場で嫌われている','story']],answer:'見えた行動だけ事実。内容は分からない。'},
      {context:'レビュー / 低評価',text:'自分の仕事に低い評価が一件ついた。',items:[['低評価が一件ついた','fact'],['みんな同じ不満を持っている','story'],['一人の評価である','fact'],['自分の仕事は価値がない','story']],answer:'一件の評価を、全体評価や自己価値へ拡大しない。'}
    ],
    uncertainty:[
      {context:'仕事 / 返事待ち',text:'重要な案件の返事が予定日を過ぎても来ない。',items:[['返事がまだ来ていない',false],['相手は断るつもりだ',true],['自分の提案の評価',true],['今日できる別の仕事がある',false]],answer:'相手の意図と評価はまだ分からない。今日できる行動は分けて進める。'},
      {context:'人間関係 / そっけなさ',text:'いつもより相手の反応がそっけなかった。',items:[['今日は反応がそっけなかった',false],['自分に怒っている',true],['相手に別の事情があるか',true],['関係が終わった',true]],answer:'反応がそっけない事実以外は、まだ複数の可能性がある。'},
      {context:'将来 / 新規挑戦',text:'新しい挑戦を始めたが、成果が出るかはまだ分からない。',items:[['成果が出るか',true],['今日の一手をやるか',false],['自分に向いているかの最終結論',true],['今は途中である',false]],answer:'未来の結果は未確定でも、今日の一手は選べる。'},
      {context:'組織 / 再編',text:'会社で組織変更の話が出ているが詳細は未発表だ。',items:[['組織変更の話がある',false],['自分の役割がなくなる',true],['正式な配置',true],['今の担当業務',false]],answer:'変更の存在と、自分への影響の予測を分ける。'},
      {context:'入金 / 遅れ',text:'予定されていた入金がまだ確認できない。',items:[['入金が未確認',false],['相手は払う気がない',true],['遅れの理由',true],['確認連絡を送れる',false]],answer:'意図や理由は未確定。確認という行動はできる。'},
      {context:'市場 / 変化',text:'主要プラットフォームの仕様変更が発表された。',items:[['仕様変更が発表された',false],['自分の売上への最終影響',true],['競合の対応',true],['変更内容を読むこと',false]],answer:'影響は未確定でも、情報収集は今できる。'},
      {context:'顧客 / 予算',text:'顧客が「来期予算を見てから」と言っている。',items:[['予算確認後に判断すると言っている',false],['予算が通るか',true],['契約になるか',true],['次回確認日を決めること',false]],answer:'契約結果は未確定。次の確認点は決められる。'},
      {context:'会議 / 呼び出し',text:'突然、役員との短い面談が予定に入った。',items:[['面談予定が入った',false],['呼ばれた理由',true],['良い話か悪い話か',true],['準備できる事実整理',false]],answer:'理由はまだ不明。準備できることだけ先にする。'},
      {context:'競合 / 新商品',text:'競合が大きな新商品を発表した。',items:[['競合が新商品を発表した',false],['市場シェアへの影響',true],['顧客の反応',true],['競合商品の内容を確認する',false]],answer:'影響の結論は待ち、観察できる情報を集める。'},
      {context:'チーム / 退職の噂',text:'チームメンバーが辞めるらしいという噂を聞いた。',items:[['辞めるという噂を聞いた',false],['本当に退職するか',true],['退職理由',true],['本人に確認する方法を考える',false]],answer:'噂の存在と事実そのものを分ける。'},
      {context:'提案 / 選考',text:'最終選考まで進んだが、結果連絡が来ていない。',items:[['最終選考まで進んだ',false],['採用されるか',true],['相手が何を懸念しているか',true],['待つ間に他案件を進めること',false]],answer:'選考結果は未確定。待ちながら別の行動はできる。'},
      {context:'事業 / 来月',text:'来月の売上が目標に届くか微妙な状況だ。',items:[['現時点の進捗',false],['来月末の最終売上',true],['市場の動き',true],['今日の施策を実行すること',false]],answer:'未来の数字は未確定。今日の施策は確定できる。'},
      {context:'関係 / 今後',text:'大切な相手と距離ができている気がする。',items:[['最近会話が減っている',false],['関係が今後どうなるか',true],['相手の本音',true],['自分から話すかどうか',false]],answer:'関係の未来と相手の内心は未確定。自分の行動は選べる。'},
      {context:'ミス / 影響',text:'仕事でミスに気づいたが、影響範囲がまだ分からない。',items:[['ミスがあった',false],['最終的な影響範囲',true],['誰がどう評価するか',true],['事実確認と報告を始めること',false]],answer:'影響の全貌は未確定でも、確認と報告は始められる。'},
      {context:'昇進 / 結果',text:'昇進候補に入っていると聞いたが正式発表前だ。',items:[['候補だと聞いた',false],['実際に昇進するか',true],['他候補の評価',true],['今の仕事を続けること',false]],answer:'期待は持っていいが、結果はまだ確定していない。'}
    ],
    depth:[
      {context:'成功 / 謙虚',text:'自分の仕事が大成功した。両方持てる2つを選ぶ。',items:[['自分はよくやった','keep'],['成功したから自分は人より上だ','drop'],['運や周囲の助けもあった','keep'],['謙虚でいるため喜ばない','drop']],answer:'「自分はよくやった」と「周囲や運の助けもあった」は両立する。'},
      {context:'対立 / 視点',text:'相手と激しく意見が対立した。両方持てる2つを選ぶ。',items:[['自分の判断には根拠がある','keep'],['自分が正しいなら相手は愚かだ','drop'],['相手にも自分が見えていない事情があるかもしれない','keep'],['揉めないため自分の意見を捨てる','drop']],answer:'自分の根拠と、相手側の事情の可能性を同時に持つ。'},
      {context:'自己評価 / ミス',text:'大きなミスをした。両方持てる2つを選ぶ。',items:[['今回、自分には改善点がある','keep'],['ミスした自分はダメな人間だ','drop'],['これまで積み上げた能力まで消えたわけではない','keep'],['前向きになるため反省しない','drop']],answer:'改善点は認める。でも能力や人格全体まで否定しない。'},
      {context:'家庭 / 口論',text:'大切な家族と激しく言い合いになった。両方持てる2つを選ぶ。',items:[['相手を大切に思っている','keep'],['大切なら怒ってはいけない','drop'],['今は本気で腹が立っている','keep'],['怒っているなら関係は壊れている','drop']],answer:'「大切」と「怒っている」は同時に存在できる。'},
      {context:'マネジメント / 不調',text:'期待している部下の成果が出ていない。両方持てる2つを選ぶ。',items:[['改善を求める必要がある','keep'],['成果が低いから能力がない人だ','drop'],['背景や支援方法も確認できる','keep'],['優しくするなら基準を下げるしかない','drop']],answer:'基準を持つことと、背景を理解することは両立する。'},
      {context:'競争 / 他者成功',text:'ライバルが大きな成功をした。両方持てる2つを選ぶ。',items:[['悔しい','keep'],['悔しいから相手の成功には価値がない','drop'],['相手から学べる点もある','keep'],['学ぶなら負けを認めることになる','drop']],answer:'悔しさと学ぶ姿勢を同時に持つ。'},
      {context:'批判 / 不公平',text:'かなり一方的だと感じる批判を受けた。両方持てる2つを選ぶ。',items:[['批判には不公平な部分がある','keep'],['不公平だから全部無視していい','drop'],['一部には使える情報があるかもしれない','keep'],['学ぶなら相手が正しいことになる','drop']],answer:'不公平さを認めつつ、使える情報だけ拾える。'},
      {context:'撤退 / 判断',text:'長く続けたプロジェクトをやめる判断をした。両方持てる2つを選ぶ。',items:[['やめるのは合理的だと思う','keep'],['合理的なら寂しく感じるのはおかしい','drop'],['それでも寂しさはある','keep'],['寂しいなら続けるべきだ','drop']],answer:'合理的な撤退と寂しさは両立する。'},
      {context:'野心 / 休息',text:'もっと大きな成果を出したいが、かなり疲れている。両方持てる2つを選ぶ。',items:[['もっと成果を出したい','keep'],['休むのは野心がない証拠だ','drop'],['今は休息も必要だ','keep'],['休むなら目標を諦めるべきだ','drop']],answer:'野心と休息の必要性を同時に認める。'},
      {context:'成果 / 誇り',text:'長く努力したことが結果につながった。両方持てる2つを選ぶ。',items:[['自分の努力を誇っていい','keep'],['誇るなら全部自分の力だ','drop'],['環境や他者の助けもあった','keep'],['助けがあったなら自分の努力は大したことない','drop']],answer:'自分の努力への誇りと、他者への感謝は両立する。'},
      {context:'愛情 / 怒り',text:'好きな相手にかなり腹を立てている。両方持てる2つを選ぶ。',items:[['今は怒っている','keep'],['怒るなら本当は好きではない','drop'],['それでも大切に思っている','keep'],['大切なら我慢し続けるべきだ','drop']],answer:'怒りと愛情を同時に持てる。'},
      {context:'自信 / 不確実',text:'自分の判断に自信があるが、情報は完全ではない。両方持てる2つを選ぶ。',items:[['現時点ではこれが最善だと思う','keep'],['自信があるなら間違う可能性は考えない','drop'],['新情報で修正する可能性は残す','keep'],['修正するなら最初から自信を持つべきではない','drop']],answer:'自信と修正可能性を同時に持つ。'},
      {context:'お金 / 満足',text:'もっと稼ぎたいと思う一方、今の生活にも感謝している。両方持てる2つを選ぶ。',items:[['もっと稼ぎたい','keep'],['満足しているなら向上心は不要だ','drop'],['今あるものにも満足している','keep'],['欲があるなら感謝は嘘だ','drop']],answer:'向上心と現在への満足は両立する。'},
      {context:'リーダー / 権限',text:'自分が最終決定者になった。両方持てる2つを選ぶ。',items:[['最終判断の責任は自分にある','keep'],['責任者なら他人の意見は二の次だ','drop'],['他人の自律性や専門性も尊重できる','keep'],['尊重するなら自分は決めない方がいい','drop']],answer:'決定責任と、他者への尊重は両立する。'},
      {context:'謝罪 / 境界線',text:'自分にも非があるが、相手にも問題があった。両方持てる2つを選ぶ。',items:[['自分の非は謝れる','keep'],['謝るなら相手が全部正しいことになる','drop'],['同時に相手へ境界線も伝えられる','keep'],['境界線を言うなら謝らない方がいい','drop']],answer:'謝罪と境界線は同時に成立する。'}
    ],
    lightness:[
      {context:'欲 / 評価',text:'「もっと評価されたい」という欲が強くなっている。',desire:'評価されたい'},
      {context:'欲 / お金',text:'「もっと稼ぎたい」が頭の大部分を占め始めた。',desire:'もっと稼ぎたい'},
      {context:'権力 / 影響力',text:'自分の意見が通る立場になり、もっと決定権が欲しくなった。',desire:'もっと権限が欲しい'},
      {context:'承認 / 賞賛',text:'周囲からもっと「すごい」と言われたくなっている。',desire:'もっと褒められたい'},
      {context:'競争 / 勝敗',text:'どうしてもこの勝負だけは相手に勝ちたい。',desire:'絶対に勝ちたい'},
      {context:'SNS / 数字',text:'フォロワーや反応数が気になって何度も確認してしまう。',desire:'もっと数字を伸ばしたい'},
      {context:'肩書 / 地位',text:'次の肩書きを手に入れることが急に重要に感じている。',desire:'もっと高い肩書きが欲しい'},
      {context:'仕事 / 支配',text:'プロジェクトを自分の思いどおりに進めたくなっている。',desire:'全部コントロールしたい'},
      {context:'議論 / 正しさ',text:'相手に「自分が正しかった」と認めさせたい。',desire:'正しさを認めさせたい'},
      {context:'人間関係 / 好意',text:'この人にどうしても嫌われたくない。',desire:'好かれたい'},
      {context:'完成度 / 完璧',text:'失敗のない完璧な結果にしたくて手放せない。',desire:'完璧にしたい'},
      {context:'事業 / 成長',text:'もっと速く大きく伸ばさなければと焦っている。',desire:'もっと成長したい'},
      {context:'仕事 / 速度',text:'誰よりも早く結果を出したい気持ちが強い。',desire:'最速で結果を出したい'},
      {context:'承認 / 特定の相手',text:'ある一人にだけは、自分の価値を分からせたい。',desire:'この人に認められたい'},
      {context:'競争 / 敗北回避',text:'負けること自体が耐えられず、何としても避けたくなっている。',desire:'絶対に負けたくない'}
    ],
    recovery:[
      {context:'失敗 / 仕事',text:'大きなミスでかなり取り乱した。',options:[['今日必要な連絡を1本だけする',true],['気持ちが0になるまで何もしない',false],['原因を完璧に分析してから動く',false],['自分を責めて気合いを入れる',false]],answer:'気持ちが残ったまま、必要な連絡を1本だけする。'},
      {context:'対人 / 後悔',text:'感情的な言い方をしてしまい、後悔している。',options:[['落ち着いたら必要な部分だけ修復する',true],['恥ずかしいので相手を避け続ける',false],['自分は最低だと反省し続ける',false],['何もなかったことにする',false]],answer:'必要な修復をして、自己攻撃ではなく関係へ戻る。'},
      {context:'失注 / 落胆',text:'期待していた大きな話がなくなった。',options:[['次の予定を1つだけ通常どおりやる',true],['無理に前向きな意味を作る',false],['落ち込んでいる自分を叱る',false],['すぐ別の大目標で埋める',false]],answer:'落胆したままでも、次の予定を一つ通常どおりやる。'},
      {context:'発表 / 恥',text:'人前でうまく話せず、かなり恥ずかしい。',options:[['次の予定だけは通常どおりこなす',true],['頭の中で何度も失敗を再生する',false],['二度と人前で話さないと決める',false],['失敗していないことにする',false]],answer:'恥ずかしさを残しつつ、生活へ一つ戻る。'},
      {context:'応募 / 不採用',text:'本気で狙っていた機会に落ちた。',options:[['今日は小さな通常タスクを一つ終える',true],['自分に向いていないと即断する',false],['元気になるまで全部止める',false],['相手の見る目がないと決める',false]],answer:'結論を急がず、今日は小さな通常タスクへ戻る。'},
      {context:'家庭 / 口論',text:'大切な人と激しく言い合い、気まずい。',options:[['落ち着いたら普通の挨拶から戻す',true],['相手が謝るまで完全に無視する',false],['全部自分が悪かったことにする',false],['関係は終わりだと決める',false]],answer:'解決を急がず、まず普通の接点へ小さく戻る。'},
      {context:'一日 / 浪費',text:'やるつもりだったことをほとんどせず、一日を使ってしまった。',options:[['残り時間で5分だけ一つやる',true],['今日はもう失敗だから全部やめる',false],['夜中まで取り返す',false],['自分は意志が弱いと責める',false]],answer:'一日全体を取り返さず、5分だけ戻る。'},
      {context:'締切 / 遅れ',text:'重要な締切に遅れてしまった。',options:[['必要な連絡と次の提出時刻を決める',true],['言い訳を長く考える',false],['恥ずかしくて連絡を先延ばしする',false],['自分を責め続ける',false]],answer:'自己評価より先に、連絡と次の時刻へ戻る。'},
      {context:'お金 / 損失',text:'判断ミスで予想外の損失が出た。',options:[['今日確認できる数字を一つ整理する',true],['すぐ取り返す勝負をする',false],['何度も自分の判断を罵る',false],['怖くて数字を見ない',false]],answer:'取り返しに走らず、まず一つ事実確認へ戻る。'},
      {context:'批判 / 動揺',text:'厳しい批判を受けて、かなり気持ちが沈んだ。',options:[['必要な仕事を一つだけ通常運転でやる',true],['批判が気にならなくなるまで待つ',false],['相手を論破する文章を作り続ける',false],['自分の価値まで否定する',false]],answer:'気持ちが沈んだままでも、一つ通常運転へ戻る。'},
      {context:'新商品 / 失敗',text:'力を入れた新しい企画がほとんど反応されなかった。',options:[['データを一つ確認して次の小さな改善を決める',true],['才能がないと結論づける',false],['全部作り直す',false],['反応が出るまで宣伝を連打する',false]],answer:'全部を否定せず、一つのデータと小さな改善へ戻る。'},
      {context:'競争 / 敗北',text:'自信があった勝負で明確に負けた。',options:[['今日は相手から学べる点を一つだけメモする',true],['相手の弱点探しを始める',false],['自分はもうダメだと考える',false],['すぐ再戦して取り返す',false]],answer:'悔しさを残したまま、学びを一つ回収する。'},
      {context:'予定 / 中止',text:'ずっと楽しみにしていた予定がなくなった。',options:[['今日の別の楽しみを一つ小さく作る',true],['何もする気がしないので一日捨てる',false],['相手を責め続ける',false],['残念ではないふりをする',false]],answer:'残念さを否定せず、今日に小さな代替を一つ置く。'},
      {context:'決断 / 後悔',text:'自分で選んだ決断が、今のところ裏目に出ている。',options:[['現状でできる修正を一つ決める',true],['過去の自分を何度も責める',false],['全部元に戻そうとする',false],['判断は正しかったと無理に正当化する',false]],answer:'過去の自分への攻撃ではなく、今の修正へ戻る。'},
      {context:'疲労 / 崩れ',text:'疲れて生活リズムが崩れ、予定どおり動けなかった。',options:[['次の食事や睡眠など一つだけ通常に戻す',true],['明日から完璧に立て直す計画を作る',false],['自分は管理できない人間だと責める',false],['そのまま全部崩す',false]],answer:'全部立て直さず、生活の一要素だけ戻す。'}
    ],
    dignity:[
      {context:'会話 / いきがり',text:'知識を見せたくて、必要以上に強い言い方をした。',options:[['「あれは自分らしくなかった」と認め、次は普通に話す',true],['自分は性格が悪いと何度も責める',false],['相手が弱いから仕方ないと正当化する',false],['気まずいので今後その人を避ける',false]],answer:'言動だけを修正対象にして、次は普通の言い方へ戻る。'},
      {context:'他者 / 見下し',text:'相手の知識不足を内心だけでなく言葉でも軽く扱ってしまった。',options:[['必要なら一言フォローし、次は相手を下げずに説明する',true],['自分は最低な人間だと反省し続ける',false],['事実として自分の方が詳しいから問題ない',false],['恥ずかしいので記憶から追い出す',false]],answer:'優位性の事実と、相手を軽く扱うことは別。必要なら修復して戻る。'},
      {context:'会話 / 知ったかぶり',text:'知らないことを、知っているように話してしまった。',options:[['次に触れたら「そこは詳しくなかった」と普通に修正する',true],['バレないよう追加で話を作る',false],['自分は嘘つきだと責め続ける',false],['その話題をする人を避ける',false]],answer:'自分全体を裁かず、事実だけ普通に修正する。'},
      {context:'初心者 / 嘲笑',text:'初心者の質問を、少し馬鹿にするように笑ってしまった。',options:[['次は質問そのものに普通に答える。必要なら軽く謝る',true],['笑われる方にも原因があると考える',false],['自分は優しくない人間だと決める',false],['急に過剰に親切にして帳尻を合わせる',false]],answer:'過剰な自己罰ではなく、次の一回の扱い方を変える。'},
      {context:'成果 / 横取り',text:'チームの成果なのに、自分の手柄のように話してしまった。',options:[['次の機会に貢献した人を具体的に名前に出す',true],['自分は卑しい人間だと落ち込み続ける',false],['リーダーだから自分の手柄でいいと考える',false],['何も話さなくなる',false]],answer:'自己嫌悪ではなく、貢献の配分を次の発言で修正する。'},
      {context:'マネジメント / 威圧',text:'部下に対して、立場を使うような強い言い方をしてしまった。',options:[['必要なら言い方を修正し、要求内容は落ち着いて伝え直す',true],['上司は厳しくて当然だと正当化する',false],['自分には管理職の資格がないと決める',false],['今後何も注意しない',false]],answer:'要求の中身と、威圧的な伝え方を分けて修正する。'},
      {context:'人脈 / 誇示',text:'自分を大きく見せたくて、有名人との関係を必要以上に匂わせた。',options:[['次から事実以上に盛らず、必要な情報だけ話す',true],['恥ずかしいので人前で話さなくなる',false],['みんなやっているから問題ないと考える',false],['もっと大きな話で上書きする',false]],answer:'誇示した自分を攻撃せず、次の発言を事実の大きさに戻す。'},
      {context:'実績 / 誇張',text:'会話の勢いで、自分の実績を少し盛って話した。',options:[['次に同じ話をする時は正確な数字に戻す',true],['バレるまでその数字を使い続ける',false],['自分は信用できない人間だと責める',false],['全部の実績を小さく言うようにする',false]],answer:'盛った部分だけを正確さへ戻す。自己評価全体を下げない。'},
      {context:'会議 / 切り捨て',text:'相手の案を、内容を聞き切る前に「それは無理」と切った。',options:[['次は理由を一つ聞いてから判断する',true],['自分は傲慢だと何度も責める',false],['結局無理な案だから問題ない',false],['今後は全部の案を肯定する',false]],answer:'判断基準は残し、相手を扱うプロセスだけ修正する。'},
      {context:'お金 / 自慢',text:'収入の話で、相手より上だと示したくなる言い方をした。',options:[['次は必要な数字だけ話し、優劣の演出を足さない',true],['お金の話は二度としない',false],['稼いでいるのは事実だから問題ない',false],['自分は嫌な人間だと落ち込む',false]],answer:'事実を隠す必要はない。優劣を作る演出だけ減らす。'},
      {context:'地位 / 判断',text:'相手の肩書きが低いと知って、態度が少し雑になった。',options:[['次のやり取りでは肩書きに関係なく同じ丁寧さに戻す',true],['自分は差別的な人間だと決める',false],['社会は肩書きで決まるから仕方ない',false],['罪悪感から過剰にへりくだる',false]],answer:'自分全体を裁かず、次の態度を自分の基準へ戻す。'},
      {context:'競争 / 他人の失敗',text:'ライバルの失敗を、少し嬉しそうに人へ話してしまった。',options:[['次は失敗を娯楽として広げず、自分の仕事へ戻る',true],['そんな感情を持った自分を嫌う',false],['ライバルだから当然だと正当化する',false],['逆に相手を大げさに褒める',false]],answer:'感情はあっていい。人の失敗を使って自分を上げる行動だけやめる。'},
      {context:'集団 / 仕切りすぎ',text:'自分が一番分かっていると思い、周囲の意見をほぼ聞かずに決めた。',options:[['次の判断で一人だけ先に意見を聞く',true],['自分にはリーダー資格がないと決める',false],['結果が良ければ問題ないと考える',false],['今後は自分で決めない',false]],answer:'決める責任は残し、他者の情報を一つ入れる習慣へ戻す。'},
      {context:'返信 / 皮肉',text:'腹が立って、相手を小さく傷つける皮肉を返した。',options:[['必要なら一言修正し、次は事実と要望だけ返す',true],['相手が先に悪かったから問題ない',false],['自分は性格が悪いと責める',false],['今後は何も言わない',false]],answer:'怒りは否定せず、皮肉という手段だけ修正する。'},
      {context:'家庭 / 上から目線',text:'身近な相手に、分かっていない人へ教えるような上から目線で話した。',options:[['次は結論を押しつけず、まず相手の考えを一つ聞く',true],['家族だからこれくらい普通だと考える',false],['自分は思いやりがないと落ち込み続ける',false],['反省して全部相手に合わせる',false]],answer:'上下を作った話し方だけ修正し、自分の意見は普通に持つ。'}
    ]
  };

  function expand(skill, bases){
    return bases.flatMap((base,index)=>VARIANT_TAILS[skill].map((tail,v)=>({
      ...base,
      id:`${skill}-${String(index+1).padStart(2,'0')}-v${v+1}`,
      core:`${skill}-${String(index+1).padStart(2,'0')}`,
      text:`${base.text}${tail}`
    })));
  }
  const SCENARIOS = Object.fromEntries(ORDER.map(k=>[k,expand(k,BASE[k])]));

  function load(){try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return{}}}
  function save(s){localStorage.setItem(STORE,JSON.stringify(s))}
  function defaultState(){return{version:2,history:[],skill:{},seen:{},lastChallenge:null,lastReturn:null,session:null}}
  let state = Object.assign(defaultState(),load());
  state.version=2; state.history=Array.isArray(state.history)?state.history:[]; state.seen=state.seen||{};
  ORDER.forEach(k=>{if(!state.skill[k])state.skill[k]={attempts:0,score:0,recent:[]};if(!Array.isArray(state.seen[k]))state.seen[k]=[]});
  save(state);

  function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function sessionCount(){return state.history.filter(x=>x.kind==='session').length}
  function pickFor(skill){
    const all=SCENARIOS[skill];
    const recentFull=state.seen[skill].slice(-14);
    const recentCore=new Set(recentFull.map(id=>id.split('-v')[0]));
    let cores=[...new Set(all.map(s=>s.core))].filter(c=>!recentCore.has(c));
    if(!cores.length) cores=[...new Set(all.map(s=>s.core))];
    const core=cores[hash(`${today()}-${skill}-${sessionCount()}-${state.seen[skill].length}`)%cores.length];
    const variants=all.filter(s=>s.core===core);
    const used=new Set(state.seen[skill].filter(id=>id.startsWith(core+'-v')));
    const fresh=variants.filter(s=>!used.has(s.id));
    const pool=fresh.length?fresh:variants;
    return pool[hash(`${core}-${state.seen[skill].length}-${today()}`)%pool.length];
  }
  function pctFor(k){const r=state.skill[k].recent||[];if(!r.length)return null;return Math.round(r.reduce((a,b)=>a+b,0)/r.length*100)}
  function overall(){const vals=ORDER.map(pctFor).filter(v=>v!==null);return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null}
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function haptic(ms=20){try{navigator.vibrate?.(ms)}catch{}}
  function markSkill(k,value){const s=state.skill[k];s.attempts++;s.recent.push(value);if(s.recent.length>7)s.recent.shift();s.score=pctFor(k)||0;save(state)}
  function layersHtml(){return `<div class="layer-stack">${ORDER.map(k=>`<div class="layer" title="${SKILLS[k].label}"><i style="--w:${pctFor(k)??0}%;background:${SKILLS[k].color}"></i></div>`).join('')}</div><div class="layer-labels">${ORDER.map(k=>`<span>${SKILLS[k].label}</span>`).join('')}</div>`}
  function science(){scienceList.innerHTML=ORDER.map(k=>{const s=SKILLS[k];return `<div class="science-item"><b>${s.label} — ${s.short}</b><span>${s.theory}</span>${s.links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${escapeHtml(label)} ↗</a>`).join(' ')}</div>`}).join('')}
  science(); scienceBtn.onclick=()=>scienceDialog.showModal(); scienceClose.onclick=()=>scienceDialog.close(); scienceDialog.addEventListener('click',e=>{if(e.target===scienceDialog)scienceDialog.close()}); exitBtn.onclick=()=>{if(confirm('LEVEL UPホームへ戻りますか？'))location.href='/'};

  function returnCheck(){if(!state.lastChallenge || state.lastReturn===state.lastChallenge.date || state.lastChallenge.date===today())return'';return `<section class="daily-return"><h3>前回の実戦、どうだった？</h3><p>${escapeHtml(state.lastChallenge.text)}</p><div class="mini-choices"><button data-ret="1">できた</button><button data-ret="0.5">気づいた</button><button data-ret="0">思い出せなかった</button></div></section>`}
  function bindReturn(){app.querySelectorAll('[data-ret]').forEach(b=>b.onclick=()=>{state.lastReturn=state.lastChallenge.date;state.history.push({date:today(),kind:'field-return',value:Number(b.dataset.ret)});save(state);renderHome()})}
  function renderHome(){const done=state.history.some(x=>x.kind==='session'&&x.date===today());const ov=overall();app.innerHTML=`<section class="hero"><div class="eyebrow">DAILY RESPONSE TRAINING</div><h1>分厚い自分を<span>つくる。</span></h1><p class="lead">取り乱さない人ではなく、<strong>取り乱しても戻れる人へ。</strong><br>8つの反応の型を、説明ではなく毎日の反復で身につける。</p><div class="hero-actions"><button id="startBtn" class="primary">${done?'今日もう一度、8つ稽古する':'今日の8つを稽古する'}</button><p class="micro">約4分。感情を消す訓練ではありません。各テーマ45パターン、直近の問題は避けて出題します。</p></div></section><section class="thickness-card"><div class="thickness-head"><div><div class="eyebrow">PRACTICE THICKNESS</div><div class="thickness-number">${ov===null?'—':ov}<small> / 100</small></div></div><p class="micro">最近7回のアプリ内練習から算出する独自指標</p></div>${layersHtml()}</section>${returnCheck()}`;document.getElementById('startBtn').onclick=startSession;bindReturn()}

  function startSession(){const items={};ORDER.forEach(k=>{const sc=pickFor(k);items[k]=sc.id;state.seen[k].push(sc.id);if(state.seen[k].length>80)state.seen[k]=state.seen[k].slice(-80)});state.session={date:today(),i:0,skills:[...ORDER],items,scores:{},startedAt:Date.now()};save(state);renderRound()}
  function currentSkill(){return state.session.skills[state.session.i]}
  function currentScenario(){const skill=currentSkill(),id=state.session.items[skill];return SCENARIOS[skill].find(s=>s.id===id)||pickFor(skill)}
  function roundShell(skill,scenario,body){const p=Math.round((state.session.i/ORDER.length)*100);app.innerHTML=`<section class="session-top"><div class="progress-wrap"><div class="progress-track"><i style="--p:${p}%"></i></div><div class="progress-text">${state.session.i+1} / ${ORDER.length}</div></div><div class="skill-pill">${SKILLS[skill].label} · ${SKILLS[skill].short}</div></section><section class="scenario-card"><div class="scenario-context">${escapeHtml(scenario.context)}</div><h2>${escapeHtml(scenario.text)}</h2></section><section class="drill" id="drill">${body}</section>`}
  function explainFor(skill,scenario){const e=EXPLAIN[skill];let real=e.real;let answer=scenario.answer||'';if(skill==='accept')answer=`「${scenario.emotion}がある」と一度認める。`;if(skill==='lightness')answer=`「${scenario.desire}」は残す。ただし自分全部は預けない。`;if(answer)real=`${answer}`;return{...e,real}}
  function finishRound(skill,value,scenario,good=true){state.session.scores[skill]=value;markSkill(skill,value);const drill=document.getElementById('drill');drill.querySelectorAll('button,input').forEach(el=>el.disabled=true);const e=explainFor(skill,scenario);const fb=document.createElement('div');fb.className='feedback'+(good?'':' bad');fb.innerHTML=`<div class="feedback-title">${good?'この反応を残す':'ここを切り替える'}</div><div class="feedback-explain"><div><b>なぜ</b><p>${escapeHtml(e.point)}</p></div><div><b>避けたいこと</b><p>${escapeHtml(e.avoid)}</p></div><div><b>現実では</b><p>${escapeHtml(e.real)}</p></div></div><div class="reward-pop"><div class="reward-layer"><i></i></div><span>${SKILLS[skill].label}の層</span></div><button class="continue-btn" type="button">次へ</button>`;drill.appendChild(fb);fb.querySelector('.continue-btn').onclick=()=>{state.session.i++;save(state);if(state.session.i>=ORDER.length)finishSession();else renderRound()};haptic(good?18:[30,30,30])}

  function renderRound(){const skill=currentSkill(),sc=currentScenario();if(skill==='pause')return drillPause(sc);if(skill==='accept')return drillAccept(sc);if(skill==='distance')return drillDistance(sc);if(skill==='uncertainty')return drillUncertainty(sc);if(skill==='depth')return drillDepth(sc);if(skill==='lightness')return drillLightness(sc);if(skill==='recovery')return drillChoice(skill,sc);if(skill==='dignity')return drillChoice(skill,sc)}
  function shuffleOptions(arr,seed){return arr.map((x,i)=>({x,k:hash(`${seed}-${i}`)})).sort((a,b)=>a.k-b.k).map(o=>o.x)}
  function drillPause(sc){roundShell('pause',sc,`<p class="instruction"><strong>最初の3秒は、何もしない。</strong> 反応したくなる感じだけ見てください。</p><div class="pause-stage"><div class="pause-orb" id="orb"><b id="count">3</b></div><button id="tempt" class="tempt-btn">今すぐ返す</button></div><div id="afterPause"></div>`);let early=0,left=3;const tempt=document.getElementById('tempt'),orb=document.getElementById('orb'),count=document.getElementById('count');tempt.onclick=()=>{early++;tempt.classList.remove('shake');void tempt.offsetWidth;tempt.classList.add('shake');tempt.textContent='反射した。でも、まだ戻れる';haptic(30);setTimeout(()=>{if(!tempt.disabled)tempt.textContent='今すぐ返す'},650)};const timer=setInterval(()=>{left--;count.textContent=left||'✓';if(left<=0){clearInterval(timer);orb.classList.add('safe');tempt.disabled=true;const opts=shuffleOptions(sc.options,sc.id);document.getElementById('afterPause').innerHTML=`<p class="instruction" style="margin-top:15px">間ができました。<strong>次の行動は今選べる。</strong></p><div class="choice-list">${opts.map((x,i)=>`<button class="choice-btn" data-i="${i}">${escapeHtml(x[0])}</button>`).join('')}</div>`;document.querySelectorAll('.choice-btn').forEach(b=>b.onclick=()=>{const ok=opts[Number(b.dataset.i)][1];b.classList.add(ok?'correct':'wrong');finishRound('pause',ok&&early===0?1:ok?0.75:0.2,sc,ok)})}},1000)}
  function drillAccept(sc){roundShell('accept',sc,`<p class="instruction">この感情を<strong>消すか、あるものとして置くか。</strong></p><div class="emotion-zone"><div class="emotion-chip" id="emotion">${escapeHtml(sc.emotion)}</div><div class="accept-actions"><button id="erase">消す</button><button id="place">ここに置く</button></div></div>`);document.getElementById('erase').onclick=()=>finishRound('accept',0.25,sc,false);document.getElementById('place').onclick=()=>{document.getElementById('emotion').classList.add('placed');setTimeout(()=>finishRound('accept',1,sc,true),260)}}
  function drillDistance(sc){roundShell('distance',sc,`<p class="instruction">4つを<strong>事実 / 頭が足した物語</strong>に分ける。</p><div class="sort-list">${sc.items.map((it,i)=>`<div class="sort-row" data-row="${i}"><p>${escapeHtml(it[0])}</p><div class="sort-controls"><button data-v="fact">事実</button><button data-v="story">物語</button></div></div>`).join('')}</div><button id="judge" class="continue-btn" type="button">判定する</button>`);const answers={};document.querySelectorAll('.sort-row').forEach(row=>row.querySelectorAll('button').forEach(b=>b.onclick=()=>{row.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');answers[row.dataset.row]=b.dataset.v}));document.getElementById('judge').onclick=()=>{if(Object.keys(answers).length<sc.items.length)return;let n=0;sc.items.forEach((it,i)=>{if(answers[i]===it[1])n++});finishRound('distance',n/sc.items.length,sc,n>=3)}}
  function drillUncertainty(sc){roundShell('uncertainty',sc,`<p class="instruction"><strong>今はまだ分からないもの</strong>だけを選ぶ。</p><div class="unknown-list">${sc.items.map((it,i)=>`<button class="unknown-btn" data-i="${i}">${escapeHtml(it[0])}</button>`).join('')}</div><button id="judge" class="continue-btn">未確定のまま置く</button>`);const set=new Set();document.querySelectorAll('.unknown-btn').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);set.has(i)?set.delete(i):set.add(i);b.classList.toggle('marked')});document.getElementById('judge').onclick=()=>{let n=0;sc.items.forEach((it,i)=>{if(set.has(i)===it[1])n++});finishRound('uncertainty',n/sc.items.length,sc,n>=3)}}
  function drillDepth(sc){roundShell('depth',sc,`<p class="instruction">どちらかを消さない。<strong>同時に持てる2つ</strong>を選ぶ。</p><div class="depth-grid">${sc.items.map((it,i)=>`<button class="depth-card" data-i="${i}">${escapeHtml(it[0])}</button>`).join('')}</div><button id="judge" class="continue-btn">2つを持つ</button>`);const set=new Set();document.querySelectorAll('.depth-card').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);if(set.has(i)){set.delete(i);b.classList.remove('kept')}else if(set.size<2){set.add(i);b.classList.add('kept')}});document.getElementById('judge').onclick=()=>{if(set.size!==2)return;const ok=[...set].every(i=>sc.items[i][1]==='keep');finishRound('depth',ok?1:0.25,sc,ok)}}
  function drillLightness(sc){roundShell('lightness',sc,`<p class="instruction"><strong>欲を0にはしない。</strong>「持つ。でも握りしめない」位置へ動かす。</p><div class="grip-wrap"><div class="grip-labels"><span>手放す</span><span>握りしめる</span></div><input id="grip" class="grip-slider" type="range" min="0" max="100" value="90"><div class="grip-readout" id="gripRead">90%</div><div class="grip-hint">${escapeHtml(sc.desire)}。欲しい気持ちは残していい。</div></div><button id="judge" class="continue-btn">この持ち方にする</button>`);const input=document.getElementById('grip'),read=document.getElementById('gripRead');input.oninput=()=>read.textContent=input.value+'%';document.getElementById('judge').onclick=()=>{const v=Number(input.value),ok=v>=35&&v<=65;const dist=v<35?35-v:v>65?v-65:0;finishRound('lightness',ok?1:Math.max(.2,1-dist/70),sc,ok)}}
  function drillChoice(skill,sc){const opts=shuffleOptions(sc.options,sc.id);const label=skill==='dignity'?'自己嫌悪ではなく、美学へ戻る反応を選ぶ。':'気持ちが完全に戻るのを待たない。日常へ戻る最初の一歩を選ぶ。';roundShell(skill,sc,`<p class="instruction"><strong>${escapeHtml(label)}</strong></p><div class="choice-list">${opts.map((it,i)=>`<button class="choice-btn" data-i="${i}">${escapeHtml(it[0])}</button>`).join('')}</div>`);document.querySelectorAll('.choice-btn').forEach(b=>b.onclick=()=>{const ok=opts[Number(b.dataset.i)][1];b.classList.add(ok?'correct':'wrong');finishRound(skill,ok?1:.2,sc,ok)})}

  function weakest(){return ORDER.slice().sort((a,b)=>(pctFor(a)??0)-(pctFor(b)??0))[0]}
  function challengeFor(k){const map={pause:'もし今日カッとなったら、返事をする前に10秒置く。',accept:'もし嫌な感情が出たら、「ある」と一度だけ認める。',distance:'もし悪い意味が浮かんだら、観察できる事実を1つだけ言い直す。',uncertainty:'もし理由が分からなかったら、「まだ分からない」で一度止める。',depth:'もし自分が正しいと思ったら、同時に成立する別の見方を1つ残す。',lightness:'もし強く欲しくなったら、「欲しい。でもこれが全部ではない」と一度言う。',recovery:'もし取り乱したら、平静になる前でも日常の小さな1つへ戻る。',dignity:'もし「今の言い方、自分の美学から外れた」と気づいたら、自分を責め続けず、必要な修復を1つだけする。'};return map[k]}
  function finishSession(){const scores=state.session.scores;const avg=Math.round(ORDER.reduce((a,k)=>a+(scores[k]??0),0)/ORDER.length*100);const weak=weakest(),challenge=challengeFor(weak);state.history.push({date:today(),kind:'session',avg,scores,ids:state.session.items,ms:Date.now()-state.session.startedAt});if(state.history.length>120)state.history=state.history.slice(-120);state.lastChallenge={date:today(),skill:weak,text:challenge};state.session=null;save(state);renderSummary(avg,weak,challenge)}
  function renderSummary(avg,weak,challenge){app.innerHTML=`<section class="summary"><div class="summary-hero"><div class="eyebrow">TODAY'S PRACTICE</div><div class="big">${overall()??0}<small> / 100</small></div><h1>今日も、8層を通した。</h1><p>反応の前に余白を作り、抱え、選び、戻り、自分の美学へ帰る練習。</p></div><section class="thickness-card">${layersHtml()}</section><div class="skill-results">${ORDER.map(k=>`<div class="skill-result"><b>${SKILLS[k].label}</b><span>${SKILLS[k].short}</span><i style="--w:${pctFor(k)??0}%"></i></div>`).join('')}</div><section class="field-card"><div class="eyebrow">REAL WORLD TRANSFER</div><h2>今日は「${SKILLS[weak].label}」を現実で1回。</h2><p>アプリ内で分かるだけでは終わらせない。実際の刺激が来たときに思い出す。</p><div class="ifthen">${escapeHtml(challenge)}</div></section><div class="summary-actions"><button id="shareBtn" class="primary">今日の厚みを共有</button><button id="homeBtn" class="secondary">ホームへ戻る</button></div><p class="micro" style="margin-top:12px">厚みスコアは心理検査ではなく、最近のアプリ内練習の安定度を示す独自指標です。</p></section>`;document.getElementById('homeBtn').onclick=renderHome;document.getElementById('shareBtn').onclick=shareResult}
  async function shareResult(){const text=`今日の「心の厚み」 ${overall()??0}/100\n取り乱さない人ではなく、取り乱しても戻れる人へ。\n#分厚い自分`;const url=location.href;try{if(navigator.share){await navigator.share({title:'分厚い自分をつくる',text,url})}else{await navigator.clipboard.writeText(text+'\n'+url);alert('結果をコピーしました')}}catch(e){if(e?.name!=='AbortError')alert('共有できませんでした')}}

  if(state.session?.date===today() && state.session.i<ORDER.length)renderRound();else{state.session=null;save(state);renderHome()}
})();
