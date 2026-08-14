(() => {
  'use strict';

  const SCENARIOS = [
    {level:1,scene:'友人',context:'友人にメッセージを送って3時間。まだ返信がない。',thought:'「普通、これくらいで返すだろ」',prompt:'いちばん強い「自分側」の行動は？',trap:'normal',skill:'notice',choices:[
      ['なんで返さないの？ と追いメッセージする',0,'相手の返信速度をコントロールしようとしています。','急ぎかどうかをまず自分側で判断する。'],
      ['急ぎなら電話する。急ぎでなければ自分のことをする',2,'相手を待つ時間を、自分の次の行動に戻せました。','期待 → 必要性の判断 → 自分の行動。'],
      ['そのうち返すはず、と何度も画面を見る',0,'「返すはず」のまま待つと、期待が頭の中に残ります。','待つなら「いつまで待つか」を自分で決める。']
    ]},
    {level:1,scene:'家庭',context:'今日はかなり疲れている。家族はいつも通り過ごしている。',thought:'「これくらい察して、家事を代わってくれてもいいのに」',prompt:'「察して」をどう変える？',trap:'mindread',skill:'ask',choices:[
      ['無言で不機嫌になって気づくのを待つ',0,'察してもらうことを前提にしています。','必要なことは、短く具体的に言葉にする。'],
      ['「今日は疲れたから、洗い物お願いできる？」と頼む',2,'察してほしい気持ちを、具体的な依頼に変えました。','依頼しても、相手には断る自由がある。'],
      ['自分が全部やって、あとで評価してもらう',1,'自分で選んだ点は前進ですが、評価を期待すると糸が残ります。','やるなら「自分で選んだ」と決める。']
    ]},
    {level:1,scene:'仕事',context:'部下に資料作成をお願いした。締切は「今日中」とだけ伝えた。',thought:'「まあ、夕方までには出してくるだろう」',prompt:'期待を管理に変えるなら？',trap:'assume',skill:'confirm',choices:[
      ['17時までに必要だと伝え、途中確認の時刻も決める',2,'「やってくれるはず」を、締切と確認に変えました。','重要なことほど、期待ではなく確認可能な条件にする。'],
      ['できる人だから任せて、何も確認しない',0,'能力への信頼と、進行確認は別です。','信頼して任せることと、重要条件を確認することは両立する。'],
      ['遅れたら強く注意すると決める',0,'起きた後の制裁より、起きる前の条件設定が自分側です。','先に完了条件と時刻を揃える。']
    ]},
    {level:1,scene:'店',context:'いつも丁寧な店員が、今日はそっけない。',thought:'「客にはちゃんと感じよくするのが普通だろ」',prompt:'いま切れる糸はどれ？',trap:'normal',skill:'release',choices:[
      ['店員の事情は分からない。必要な用件だけ済ませる',2,'「普通」を相手に押しつけず、自分の目的へ戻りました。','相手の機嫌は相手の領域。自分の用件は自分の領域。'],
      ['態度が直るまでこちらも冷たくする',0,'相手の態度を基準に自分の態度を決めています。','自分の振る舞いは自分で選ぶ。'],
      ['次はきっと丁寧なはずと期待する',1,'怒りは減りますが、まだ相手の行動を前提にしています。','予測はしても、前提にしすぎない。']
    ]},
    {level:2,scene:'仕事',context:'同僚が担当している数字が、会議資料にまだ入っていない。会議は2時間後。',thought:'「担当なんだから入れてあるはずだったのに」',prompt:'仕事で強いのは？',trap:'assume',skill:'backup',choices:[
      ['今すぐ状況を確認し、間に合わない場合の暫定数字を用意する',2,'確認と代替案の両方を自分側に持てました。','重要案件は「相手がやる」＋「来なかった時」をセットにする。'],
      ['担当者の責任なので、そのまま会議に出る',1,'責任範囲は分けられていますが、自分の会議への影響は残ります。','相手の責任と、自分の備えは別に考える。'],
      ['「普通は終わってる」と周囲に愚痴る',0,'期待が現実を変えず、時間だけ使っています。','確認・代替・優先順位へ戻す。']
    ]},
    {level:2,scene:'上司',context:'大きな案件を成功させた。上司からまだ何も言われない。',thought:'「これだけやったんだから、評価されるはず」',prompt:'評価を自分側へ戻すなら？',trap:'result',skill:'ask',choices:[
      ['評価面談で成果と次の期待値を具体的に確認する',2,'評価そのものではなく、確認と交渉を自分側に戻せました。','成果を出すことと、他人が評価することは別。'],
      ['いつか気づいてくれるまでさらに頑張る',0,'「気づいてくれるはず」が強くなっています。','必要なら見える形で伝え、確認する。'],
      ['評価しない上司は間違っていると決める',1,'自分の価値観は明確ですが、相手の評価は変えられません。','評価が合わないなら交渉・異動・転職など自分の選択へ。']
    ]},
    {level:2,scene:'依頼',context:'取引先に重要な確認メールを送った。明日までに返事が必要。',thought:'「大事な件だから読んでるよな」',prompt:'何をする？',trap:'assume',skill:'confirm',choices:[
      ['返信がなければ今日16時に電話する、と自分の確認時刻を決める',2,'相手の返信を待つだけの状態から抜けました。','待つ時にも、自分で次の確認時刻を持てる。'],
      ['重要だからきっと返事が来る、と待つ',0,'重要度はあなたにとっての重要度です。','重要なら、むしろ確認手段を増やす。'],
      ['返事が遅い会社とは今後仕事をしない',1,'選択権は自分側ですが、まず今回の必要行動が先です。','感情の判断より、今必要な確認を先にする。']
    ]},
    {level:2,scene:'チーム',context:'会議でアイデアを出したが、反応が薄かった。',thought:'「これだけ考えたんだから、もっと乗ってくれてもいいのに」',prompt:'CONTROLを上げる選択は？',trap:'result',skill:'release',choices:[
      ['反応は相手の領域。必要なら懸念点を聞いて提案を改善する',2,'反応を要求せず、聞く・改善するへ戻りました。','「賛成してほしい」と「提案を良くする」を分ける。'],
      ['分かっていない相手が悪いと思う',0,'相手の理解を責めても、自分の次の一手がありません。','伝え方・質問・撤退など選べる行動へ。'],
      ['次回はもっと褒めてもらえる案を出す',1,'改善意欲はありますが、褒められることが目的になっています。','目標を「価値が伝わる」に戻す。']
    ]},
    {level:3,scene:'家族',context:'子どもが明日の試験なのにゲームをしている。',thought:'「今まで言ってきたんだから、自分から勉強するべき」',prompt:'課題を分けるなら？',trap:'should',skill:'release',choices:[
      ['必要なら声をかける。勉強するかは本人の選択として扱う',2,'伝える責任と、実際にやる本人の課題を分けました。','関われることはする。でも最終行動まで奪わない。'],
      ['今すぐゲームを取り上げて勉強させる',0,'短期的に動かせても、本人の課題を自分が背負っています。','安全や家庭ルールとは分けて、本人の選択を残す。'],
      ['何も言わず、失敗すれば分かると放置する',1,'手放せていますが、必要な関わりまでゼロにする必要はありません。','期待しないことと、支援しないことは別。']
    ]},
    {level:3,scene:'パートナー',context:'記念日に自分はプレゼントを用意したが、相手からは何もなかった。',thought:'「自分がここまでしたんだから、普通は返してくれる」',prompt:'「お返し期待」を切るには？',trap:'return',skill:'ask',choices:[
      ['欲しかった気持ちは伝える。でも贈るかどうかは相手の自由と分ける',2,'自分の気持ちを隠さず、相手の選択も残せました。','善意と請求書を混ぜない。欲しいことは頼む。'],
      ['次から自分も何もしない',1,'自分の選択に戻っていますが、反撃として決めると相手基準です。','自分が本当にどうしたいかで決める。'],
      ['「これだけしたのに」と責める',0,'善意が見返りの契約に変わっています。','見返りが必要なら、最初から期待ではなく合意にする。']
    ]},
    {level:3,scene:'親子',context:'自分が勧めた進路に、子どもが興味を示さない。',thought:'「この道の方が絶対に将来困らないのに」',prompt:'願いと支配を分けるなら？',trap:'should',skill:'release',choices:[
      ['理由と情報は伝える。最後は本人の選択として扱う',2,'願いを持ちながら、選択権を相手に返せました。','期待を減らす＝無関心ではない。'],
      ['納得するまで説得を続ける',0,'良かれと思っても、相手の選択を自分の正解に寄せ続けています。','情報提供と最終決定を分ける。'],
      ['もう何も相談に乗らない',1,'手放しすぎです。支援と支配は別です。','頼まれた支援はできる。決定は本人。']
    ]},
    {level:3,scene:'友人',context:'以前、友人の引っ越しを丸一日手伝った。今度は自分が手伝ってほしい。',thought:'「あれだけ手伝ったんだから、当然来るよな」',prompt:'一番強い頼み方は？',trap:'return',skill:'ask',choices:[
      ['「今度手伝ってもらえる？」と普通に頼み、断られたら別の手段を探す',2,'過去の善意を請求書にせず、依頼と代替案にしました。','頼むことと、叶うことを分ける。'],
      ['前に手伝ったことを思い出させて断れない雰囲気にする',0,'依頼ではなく、相手の選択を狭めています。','交換条件なら最初に合意する。'],
      ['頼まずに、相手から言ってくるのを待つ',0,'典型的な「察して＋お返し期待」です。','欲しいなら言葉にする。']
    ]},
    {level:4,scene:'自分なら',context:'チームメンバーが、小さなミスのあとすぐ相談してきた。',thought:'「自分ならそれくらい自分で解決してから相談する」',prompt:'YOU ≠ THEM。どう考える？',trap:'myway',skill:'notice',choices:[
      ['自分のやり方は一例。必要なら相談基準をチームで決める',2,'自分の基準を絶対化せず、必要なルールは合意に変えました。','「自分なら」は、相手への義務ではない。'],
      ['自分で考える癖がつくまで相談に答えない',1,'育成意図はありますが、基準が暗黙のままです。','期待ではなく、相談してほしい条件を明示する。'],
      ['普通は先に自分で調べるべきだと注意する',0,'「普通」を使って自分の基準を押しつけています。','必要なら行動基準を具体化する。']
    ]},
    {level:4,scene:'約束',context:'友人が待ち合わせに10分遅れている。連絡はない。',thought:'「約束したんだから時間通り来るのが当然」',prompt:'「当然」ボスの前哨戦。',trap:'normal',skill:'backup',choices:[
      ['連絡して状況を確認し、自分が待つ上限時刻を決める',2,'約束を大切にしつつ、待つ時間は自分で管理できました。','相手を責める前に、自分の次の条件を決める。'],
      ['来るまで待ち続ける',0,'相手の到着まで自分の時間を預けています。','待つにも、自分の上限を持つ。'],
      ['もう二度と会わないとその場で決める',1,'選択は自分側ですが、感情だけで大きな決定をしています。','確認した上で、関係のルールを選び直す。']
    ]},
    {level:4,scene:'善意',context:'困っていた同僚を何度も助けてきた。自分が忙しい日に、相手は定時で帰った。',thought:'「少しくらい手伝ってくれてもいいだろ」',prompt:'善意を自由に戻すなら？',trap:'return',skill:'ask',choices:[
      ['必要なら「30分だけ手伝える？」と頼む。断られたら仕事を組み替える',2,'過去の善意と、今の依頼を分けました。','助けた事実は、相手への自動的な債権ではない。'],
      ['今まで助けた回数を思い出して腹を立てる',0,'見えない貸し借りが期待を増やしています。','欲しい支援は、その都度言葉にする。'],
      ['今後は誰も助けない',1,'期待を減らせますが、自分の善意まで相手に決めさせています。','助けたい時は助ける。見返りとは分ける。']
    ]},
  ];

  const BOSS = [
    {level:5,boss:true,scene:'BOSS',context:'重要な仕事を任せた相手が、締切直前になって「間に合わない」と言ってきた。',thought:'「任せたんだから、最後までやり切るのが当然だろ！」',prompt:'『当然』を倒せ。',trap:'assume',skill:'backup',choices:[
      ['責任を追及することだけに集中する',0,'責任確認は後でもできます。今はまず進行を戻す必要があります。','緊急時は、原因より先に次の一手。'],
      ['現状・残作業を確認し、代替担当や縮小案を即決する',2,'相手を変えるより先に、進行を自分側へ戻せました。','責任は分ける。進行は止めない。'],
      ['「次は絶対にやって」と強く約束させる',1,'再発防止の意図はありますが、約束だけではまた期待になります。','次回は中間確認や完了条件を設計する。']
    ]},
    {level:5,boss:true,scene:'BOSS',context:'大切な人に悩みを話したが、期待していた言葉が返ってこなかった。',thought:'「こんな時くらい、分かってほしいのに」',prompt:'『分かってくれるはず』を倒せ。',trap:'mindread',skill:'ask',choices:[
      ['欲しかった反応を短く伝える。「今日はただ聞いてほしい」',2,'相手に察してもらう期待を、具体的なお願いに変えました。','近い人ほど、言葉にしなくても分かるとは限らない。'],
      ['もうこの人には何も話さない',1,'自分を守る選択ではありますが、一度のズレだけで閉じています。','必要なら伝え方を試してから距離を選べる。'],
      ['本当に大切なら分かるはずだと黙る',0,'関係の近さを、読心能力への期待に変えています。','大切なことほど言葉にする。']
    ]},
    {level:5,boss:true,scene:'FINAL BOSS',context:'何年も努力してきたことが、思った結果にならなかった。',thought:'「ここまで頑張ったんだから、報われるはずだった」',prompt:'最後の期待を、自分側へ。',trap:'result',skill:'release',choices:[
      ['結果が悪いなら全部無駄だったと決める',0,'努力と結果を一つにして、自分の意味まで結果に預けています。','結果は事実。経験・次の選択はまだ自分側に残る。'],
      ['悔しさは認める。その上で、残ったものと次に選べる行動を数える',2,'感情を否定せず、未来の操作権だけ自分に戻しました。','期待しないとは、現実を諦めることではなく次を選べること。'],
      ['次こそ絶対に報われると信じ直す',1,'前向きですが「絶対に」という結果期待が残っています。','願いは持つ。結果は保証しない。行動は選ぶ。']
    ]}
  ];

  const LEVELS = {
    1:'LEVEL 1 / 気づく',
    2:'LEVEL 2 / 確認する',
    3:'LEVEL 3 / 分ける',
    4:'LEVEL 4 / 手放す',
    5:'BOSS / 「当然」'
  };

  const PATTERNS = {
    mindread:['「察して」型','言葉にしなくても気づいてほしい期待が出やすい傾向。必要なことほど「短く頼む」に変えるとCONTROLが戻ります。'],
    normal:['「普通・当然」型','自分の基準を「普通」に変換した瞬間、相手の領域へ入りやすくなります。「ルールなら合意」「好みなら分離」が有効です。'],
    return:['「お返し」型','善意のあとに見えない請求書が生まれやすい傾向。欲しいことは、過去の貸し借りではなく今の依頼として言葉にすると楽になります。'],
    result:['「結果」型','努力や貢献のあとに、評価・反応・成功まで保証される感覚が出やすい傾向。行動と結果を分け、確認・交渉・次の選択へ。'],
    myway:['「自分なら」型','自分ならこうする、を相手の義務に変えやすい傾向。必要な基準だけルール化し、それ以外は違いとして扱うと強くなります。'],
    assume:['「やってくれるはず」型','相手の行動を計画の前提に置きやすい傾向。重要なことほど「確認時刻」と「来なかった場合」を持つと崩れにくくなります。'],
    should:['「こうあるべき」型','相手の成長や選択まで自分が背負いやすい傾向。伝える・支援する・ルールを決めるところまでが自分、最終選択は相手と分けるのがコツです。']
  };

  const SKILL_NAMES = {notice:'気づく',ask:'頼む',confirm:'確認する',backup:'備える',release:'手放す'};

  const el = (id) => document.getElementById(id);
  const ui = {
    start:el('startScreen'),game:el('gameScreen'),report:el('reportScreen'),startBtn:el('startBtn'),retryBtn:el('retryBtn'),shareBtn:el('shareBtn'),soundBtn:el('soundBtn'),
    level:el('levelLabel'),round:el('roundNow'),total:el('roundTotal'),control:el('controlValue'),controlBar:el('controlBar'),expect:el('expectationValue'),expectBar:el('expectationBar'),
    arena:el('arena'),threads:el('threads'),avatar:el('avatar'),eventCard:el('eventCard'),scene:el('eventScene'),context:el('eventContext'),thought:el('eventThought'),prompt:el('eventPrompt'),choices:el('choices'),timerLabel:el('timerLabel'),combo:el('combo'),
    feedback:el('feedback'),feedbackMark:el('feedbackMark'),feedbackKicker:el('feedbackKicker'),feedbackTitle:el('feedbackTitle'),feedbackText:el('feedbackText'),feedbackLesson:el('feedbackLesson'),nextBtn:el('nextBtn'),
    finalScore:el('finalScore'),grade:el('grade'),patternTitle:el('patternTitle'),patternText:el('patternText'),skillGrid:el('skillGrid'),toast:el('toast')
  };

  const state = {index:0,control:50,expectation:20,score:0,combo:0,sound:true,queue:[],mistakes:{},skills:{notice:[0,0],ask:[0,0],confirm:[0,0],backup:[0,0],release:[0,0]},locked:false,lastChoice:null};
  let audioCtx = null;

  function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function buildQueue(){
    const groups=[1,2,3,4].map(level=>shuffle(SCENARIOS.filter(s=>s.level===level)));
    return [...groups[0].slice(0,4),...groups[1].slice(0,4),...groups[2].slice(0,4),...groups[3].slice(0,3),...BOSS];
  }
  function switchScreen(target){[ui.start,ui.game,ui.report].forEach(s=>s.classList.remove('active'));target.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
  function startGame(){
    Object.assign(state,{index:0,control:50,expectation:20,score:0,combo:0,queue:buildQueue(),mistakes:{},skills:{notice:[0,0],ask:[0,0],confirm:[0,0],backup:[0,0],release:[0,0]},locked:false,lastChoice:null});
    ui.total.textContent=state.queue.length;
    switchScreen(ui.game);renderRound();updateHud();sound('start');
  }
  function renderRound(){
    const s=state.queue[state.index];
    if(!s){finish();return;}
    state.locked=false;ui.arena.classList.toggle('boss',!!s.boss);
    ui.level.textContent=LEVELS[s.level];ui.round.textContent=state.index+1;ui.scene.textContent=s.scene;ui.context.textContent=s.context;ui.thought.textContent=s.thought;ui.prompt.textContent=s.prompt;ui.timerLabel.textContent=s.boss?'DECIDE':'THINK';
    ui.eventCard.classList.remove('enter');void ui.eventCard.offsetWidth;ui.eventCard.classList.add('enter');
    const order=shuffle(s.choices.map((choice,idx)=>({choice,idx})));
    ui.choices.innerHTML='';
    order.forEach(({choice,idx},visualIndex)=>{
      const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.choice=idx;b.innerHTML=`<span class="choice-index">${String.fromCharCode(65+visualIndex)}</span><span class="choice-copy"></span>`;b.querySelector('.choice-copy').textContent=choice[0];b.addEventListener('click',()=>choose(idx,b));ui.choices.appendChild(b);
    });
    drawThreads();
  }
  function choose(choiceIndex,button){
    if(state.locked)return;state.locked=true;
    const s=state.queue[state.index],choice=s.choices[choiceIndex],quality=choice[1];state.lastChoice=quality;
    state.skills[s.skill][1]++;
    if(quality===2){state.skills[s.skill][0]++;state.control=Math.min(100,state.control+10+(state.combo>=2?2:0));state.expectation=Math.max(0,state.expectation-7);state.score+=100+Math.min(state.combo,5)*10;state.combo++;goodFx();}
    else if(quality===1){state.control=Math.min(100,state.control+2);state.expectation=Math.min(100,state.expectation+3);state.score+=45;state.combo=0;state.mistakes[s.trap]=(state.mistakes[s.trap]||0)+1;partialFx();}
    else{state.control=Math.max(0,state.control-7);state.expectation=Math.min(100,state.expectation+12);state.combo=0;state.mistakes[s.trap]=(state.mistakes[s.trap]||0)+2;badFx();}
    button.classList.add(quality===2?'hint':'');
    updateHud();showFeedback(s,choice,quality);
  }
  function goodFx(){
    ui.avatar.classList.remove('returning');void ui.avatar.offsetWidth;ui.avatar.classList.add('returning');ui.arena.classList.add('flash-good');setTimeout(()=>ui.arena.classList.remove('flash-good'),480);breakThread();sound('good');vibrate(24);
    if(state.combo>=2){ui.combo.querySelector('b').textContent=state.combo;ui.combo.classList.remove('show');void ui.combo.offsetWidth;ui.combo.classList.add('show');}
  }
  function partialFx(){sound('partial');vibrate(12);}
  function badFx(){ui.arena.classList.add('flash-bad');setTimeout(()=>ui.arena.classList.remove('flash-bad'),480);sound('bad');vibrate([30,35,30]);drawThreads(true);}
  function showFeedback(s,choice,quality){
    ui.feedback.classList.remove('bad','partial');
    if(quality===2){ui.feedbackMark.textContent='✓';ui.feedbackKicker.textContent='CONTROL RETURNED';ui.feedbackTitle.textContent='自分側に戻った。';}
    else if(quality===1){ui.feedback.classList.add('partial');ui.feedbackMark.textContent='△';ui.feedbackKicker.textContent='ALMOST';ui.feedbackTitle.textContent='あと半歩。';}
    else{ui.feedback.classList.add('bad');ui.feedbackMark.textContent='×';ui.feedbackKicker.textContent='EXPECTATION +';ui.feedbackTitle.textContent='相手側に預けた。';}
    ui.feedbackText.textContent=choice[2];ui.feedbackLesson.textContent=choice[3];ui.feedback.setAttribute('aria-hidden','false');ui.feedback.classList.add('open');setTimeout(()=>ui.nextBtn.focus({preventScroll:true}),120);
  }
  function next(){ui.feedback.classList.remove('open');ui.feedback.setAttribute('aria-hidden','true');state.index++;setTimeout(renderRound,120);}
  function updateHud(){ui.control.textContent=Math.round(state.control);ui.expect.textContent=Math.round(state.expectation);ui.controlBar.style.width=`${state.control}%`;ui.expectBar.style.width=`${state.expectation}%`;}
  function drawThreads(extra=false){
    const count=Math.max(1,Math.min(7,Math.ceil(state.expectation/17)+(extra?1:0)));let svg='';
    for(let i=0;i<count;i++){
      const y1=90+i*58+(i%2)*9,y2=442-(i%3)*22;const x1=75+(i%2)*45,x2=500;const bend=300+(i%3)*40;
      svg+=`<path class="thread-line" d="M ${x1} ${y1} Q ${bend} ${140+i*20} ${x2} ${y2}"/>`;
    }
    ui.threads.innerHTML=svg;
  }
  function breakThread(){const lines=[...ui.threads.querySelectorAll('.thread-line')];if(!lines.length)return;const target=lines[lines.length-1];target.classList.add('break');setTimeout(()=>target.remove(),430);}
  function finish(){
    switchScreen(ui.report);const max=state.queue.length*100;const normalized=Math.min(1800,Math.round((state.score/max)*1800));ui.finalScore.textContent=normalized;
    ui.grade.textContent=normalized>=1530?'S':normalized>=1350?'A':normalized>=1080?'B':normalized>=810?'C':'D';
    const sorted=Object.entries(state.mistakes).sort((a,b)=>b[1]-a[1]);const pattern=sorted[0]?.[0]||'assume';ui.patternTitle.textContent=PATTERNS[pattern][0];ui.patternText.textContent=PATTERNS[pattern][1];
    ui.skillGrid.innerHTML='';Object.entries(state.skills).forEach(([key,[ok,total]])=>{const rate=total?Math.round(ok/total*100):0;const div=document.createElement('div');div.className='skill';div.innerHTML=`<span>${SKILL_NAMES[key]}</span><b>${rate}%</b><i style="--v:${rate}%"></i>`;ui.skillGrid.appendChild(div);});
    const best=Math.max(Number(localStorage.getItem('levelup-expect-best')||0),normalized);localStorage.setItem('levelup-expect-best',String(best));sound('finish');
  }
  function sound(type){if(!state.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime;const tones={start:[330,520],good:[520,760],partial:[420,510],bad:[180,120],finish:[440,660,880]}[type]||[440];tones.forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,now+i*.08);g.gain.setValueAtTime(.0001,now+i*.08);g.gain.exponentialRampToValueAtTime(.055,now+i*.08+.01);g.gain.exponentialRampToValueAtTime(.0001,now+i*.08+.12);o.connect(g).connect(audioCtx.destination);o.start(now+i*.08);o.stop(now+i*.08+.14);});}catch(e){}
  }
  function vibrate(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(e){}}
  function toggleSound(){state.sound=!state.sound;ui.soundBtn.setAttribute('aria-pressed',String(state.sound));if(state.sound)sound('good');}
  async function share(){
    const text=`LEVEL UP『期待しない』\nSCORE ${ui.finalScore.textContent}/1800  ${ui.grade.textContent} RANK\n今回の期待パターン：${ui.patternTitle.textContent}\n\n「相手がどうするかは相手。自分はどうする？」`;
    try{await navigator.clipboard.writeText(text);toast('結果をコピーしました');}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('結果をコピーしました');}
  }
  function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),1600);}

  ui.startBtn.addEventListener('click',startGame);ui.retryBtn.addEventListener('click',startGame);ui.nextBtn.addEventListener('click',next);ui.shareBtn.addEventListener('click',share);ui.soundBtn.addEventListener('click',toggleSound);
  document.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&ui.feedback.classList.contains('open'))next();});
})();
