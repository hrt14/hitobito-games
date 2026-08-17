(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito-reflex7-v1';
  const SESSION_LENGTH = 10;

  const SKILLS = {
    control: { code:'CONTROL', jp:'変えられる方へ', title:'変えられる方へ。', takeaway:'もし動かせないことに捕まったら → 自分が変えられる一手を探す。' },
    end: { code:'END', jp:'ゴールから逆算', title:'先に、終わりを決める。', takeaway:'もし判断に迷ったら → 「どうなれば成功？」を先に決める。' },
    first: { code:'FIRST', jp:'重要を先に', title:'重要を、先に守る。', takeaway:'もし急ぎに追われたら → 重要な一つを先に確保する。' },
    both: { code:'BOTH', jp:'双方の利益', title:'勝ち負けにしない。', takeaway:'もし利害がぶつかったら → 両方が得る条件を一つ探す。' },
    listen: { code:'LISTEN', jp:'まず理解する', title:'答える前に、理解する。', takeaway:'もし反対されたら → 反論より先に理由を聞く。' },
    plus: { code:'PLUS', jp:'第三案をつくる', title:'二択の外へ出る。', takeaway:'もしAかBで詰まったら → 両方の良さを残す第三案を作る。' },
    reset: { code:'RESET', jp:'自分を整える', title:'消耗したまま走らない。', takeaway:'もし質が落ち始めたら → 短く整えてから戻る。' },
  };

  const QUESTIONS = [
    q('control','会議で自分の案が却下された。最初にするなら？',['相手が間違っている理由を考え続ける','次に改善できる点を一つ拾う','評価されなかったことを周囲に話す'],1,'結果そのものは戻せない。次に変えられる材料へ注意を戻す。'),
    q('control','雨で予定していた屋外イベントが中止になった。',['天気が悪いことに腹を立てる','代替プランを決める','予報が外れた理由を調べ続ける'],1,'天気は動かせない。残った時間の使い方は動かせる。'),
    q('control','取引先から返信が来ない。締切は近い。',['返信が来るまで何度も受信箱を見る','待ちながら進められる部分を先に進める','相手の事情を想像し続ける'],1,'相手の返信は直接操作できない。自分側で進められる範囲へ戻る。'),
    q('control','SNSで自分への否定的なコメントを見つけた。',['相手の考えを変えるまで説明する','必要な改善点だけ確認して自分の行動へ戻る','何人が同意しているか何度も確認する'],1,'他人の評価は完全には制御できない。使える情報だけ拾う。'),
    q('control','電車が止まり、約束に遅れそう。',['遅延に苛立ち続ける','連絡して代替ルートを探す','駅員に何度も理由を聞く'],1,'遅延は戻せないが、連絡と次の移動は選べる。'),
    q('control','チームメンバーの作業が遅れている。',['本人の性格を直そうとする','期限・役割・支援方法を再調整する','不満を抱えたまま自分で全部やる'],1,'人そのものより、役割・条件・自分の働きかけを変える。'),
    q('control','昨日のミスが頭から離れない。',['何度も場面を再生する','再発防止を一つ決めて今日へ戻る','自分を責め続ける'],1,'過去は変えられない。次の一回の行動は変えられる。'),
    q('control','上司の機嫌が悪い。',['機嫌を直すことを最優先する','必要な確認だけして自分の仕事を進める','原因が自分かずっと推測する'],1,'他人の機嫌ではなく、自分の対応と仕事に集中する。'),
    q('end','新しい企画を頼まれた。最初の質問は？',['何から作り始めるか','成功した状態は何か','誰に手伝ってもらうか'],1,'手段より先に「終わったとき何が実現していれば成功か」を置く。'),
    q('end','プレゼン資料を作る。最初に決めるなら？',['使うフォント','相手に最後に何を判断してほしいか','スライド枚数'],1,'見た目や量より、相手に起きてほしい変化から逆算する。'),
    q('end','旅行の計画で意見が割れている。',['有名スポットを全部入れる','この旅行で何を一番味わいたいか揃える','安い順に予約する'],1,'目的が揃えば、手段の比較がしやすくなる。'),
    q('end','1時間だけ仕事する時間ができた。',['目についたメールから返す','1時間後に何が終わっていれば価値が高いか決める','簡単な作業を大量に片づける'],1,'時間を埋める前に、到達点を決める。'),
    q('end','チームで新サービスを考える。',['機能を100個出す','誰の何がどう良くなるサービスか言葉にする','競合の画面を真似する'],1,'完成像を共有してから機能を選ぶ。'),
    q('end','資格勉強を始めたい。',['教材をたくさん買う','いつ何ができれば合格圏か決める','とりあえず動画を見る'],1,'ゴールと基準が先。教材はその後に選ぶ。'),
    q('end','会議が長引きそう。',['議題を増やす','この会議で決めることを確認する','全員に一度ずつ話してもらう'],1,'会議の終了条件を明確にすると脱線を減らせる。'),
    q('end','部屋を片づけることにした。',['目につく物から動かす','どんな状態なら完了か決める','収納用品を買いに行く'],1,'完成状態を定義すると、必要な行動だけ選びやすい。'),
    q('first','重要な資料を作成中に、急ぎだが重要度の低い連絡が来た。',['すぐ返信する','資料の区切りまで集中し返信時間を決める','通知を見ながら資料を続ける'],1,'緊急に見えるものへ反射する前に、重要な時間を守る。'),
    q('first','朝、メールが30件たまっている。今日は重要な企画もある。',['全部既読にしてから企画する','企画の時間を先に確保する','簡単な返信だけ続ける'],1,'重要な仕事は「空いたらやる」ではなく先に場所を取る。'),
    q('first','締切が違うタスクが6個ある。',['一番簡単なものから全部やる','重要度と期限で今日の一つを決める','全部少しずつ触る'],1,'量ではなく重要度で順番を決める。'),
    q('first','大切な人との予定中に仕事の通知が鳴った。',['すぐ確認する','緊急でなければ予定を守る','片手で返信しながら会話する'],1,'選んだ重要時間を、割り込みから守る。'),
    q('first','明日の重要会議の準備が未完成。雑務も多い。',['雑務をゼロにしてから準備する','会議準備に先にまとまった時間を置く','どちらも5分ずつ交互にやる'],1,'重要な準備を後回しにしない。'),
    q('first','体調は少し悪いが、仕事は山積み。',['全部予定どおりやる','本当に重要なものだけ残し回復時間を確保する','休まず細切れで続ける'],1,'重要なのは「全部」ではない。長期的に必要なものを優先する。'),
    q('first','今週やりたい改善施策が10個ある。',['全部開始する','最重要の1〜2個だけ完了させる','思いつく順に少しずつやる'],1,'重要な少数を選び、WIPを増やさない。'),
    q('first','チャットで次々に質問が来る。集中作業も必要。',['来るたび即答する','返信時間をまとめて集中枠を守る','通知だけ読んで作業する'],1,'反応速度より、大事な成果を生む時間を守る。'),
    q('both','価格交渉で相手は値下げ、自分は利益を守りたい。',['どちらかが折れるまで押す','数量や契約期間など別条件も含めて双方が得る形を探す','今回は断って終わる'],1,'一つの条件だけで勝敗にせず、交換できる価値を広げる。'),
    q('both','同僚と同じ会議室を同じ時間に使いたい。',['早く予約した方が勝ち','時間をずらす・別室・オンラインなど双方の目的が満たせる案を探す','相手に譲って不満を残す'],1,'自分だけ勝つ／負ける以外の条件を探す。'),
    q('both','顧客は納期短縮を希望。品質も落とせない。',['無理ですと断る','先に必要な範囲だけ納品する案を相談する','品質を黙って下げる'],1,'目的を分解すると、双方の重要条件を守れることがある。'),
    q('both','家族は外食、自分は家で休みたい。',['どちらかに合わせる','近場で短時間だけ一緒に食べるなど両方を満たす案を探す','不機嫌なまま外食する'],1,'要求の奥の目的を見れば、両立案が作れる。'),
    q('both','部下は成長機会が欲しい。自分は品質を守りたい。',['難しい仕事は任せない','小さな範囲を任せ、レビュー地点を決める','全部任せて失敗から学ばせる'],1,'成長と品質を対立させず、仕組みで両立させる。'),
    q('both','取引先と責任範囲でもめている。',['契約書だけを盾に押し切る','双方が困っている点を並べ、再発防止を含む分担を作る','全部こちらで引き取る'],1,'勝敗より、次も成立する関係と条件を作る。'),
    q('both','予算を2部署で取り合っている。',['声が大きい方が取る','共通KPIへの効果で配分案を作る','半分ずつにする'],1,'公平な分け方より、双方の目的に効く設計を探す。'),
    q('both','友人と旅行先の希望が真逆。',['多数決する','お互いの「何を楽しみたいか」を聞き、両方入る旅程を探す','今回は別々に行く'],1,'立場ではなく目的を理解すると共通案が見つかる。'),
    q('listen','自分の提案に「それは難しい」と言われた。',['すぐメリットを説明し直す','何が難しいと感じるのか聞く','賛成してくれる人を探す'],1,'説得の前に、相手が見ている問題を理解する。'),
    q('listen','部下が「この仕事きついです」と言った。',['気合いで乗り切ろうと言う','どの部分が一番きついか聞く','自分の若い頃の話をする'],1,'解決策を出す前に、相手の具体的な状態を把握する。'),
    q('listen','顧客が怒って電話してきた。',['すぐ正しい手順を説明する','何が起きて何に困っているか最後まで聞く','担当外だと伝える'],1,'相手が理解されたと感じる前に説明を始めない。'),
    q('listen','家族から「最近話を聞いてくれない」と言われた。',['そんなことないと反論する','そう感じた具体的な場面を聞く','忙しかった理由を説明する'],1,'自分の意図ではなく、相手の経験を先に理解する。'),
    q('listen','会議で意見が真っ向から反対された。',['論破する材料を探す','相手の前提と懸念を要約して確認する','議論を打ち切る'],1,'相手の論点を正確に言える状態になってから自分の意見へ進む。'),
    q('listen','後輩が同じミスをした。',['前にも言ったと指摘する','本人がどう判断したのか順番を聞く','自分で直す'],1,'行動の背景を理解すると、再発防止の打ち手が変わる。'),
    q('listen','レビューで厳しいコメントをもらった。',['自分の意図を説明する','相手が何を期待していたか聞く','コメントした人を避ける'],1,'防御する前に期待値のズレを確認する。'),
    q('listen','友人が悩みを話している。',['すぐ解決策を3つ出す','まず何が一番つらいか聞く','自分の似た体験を話す'],1,'助言より先に、相手が何を感じているかを理解する。'),
    q('plus','デザイン案Aは見やすい。Bは印象的。どちらか選ぶ必要がある。',['多数決する','見やすさを保ちつつ印象を強くする第三案を試す','上司に決めてもらう'],1,'違いを消すのではなく、両方の強みを材料に新しい案を作る。'),
    q('plus','営業は機能追加、開発はシンプル化を求めている。',['どちらかの部署を優先する','顧客価値を基準に「少数の強い機能」に再設計する','機能を半分ずつ採用する'],1,'妥協の平均ではなく、対立からより良い設計を作る。'),
    q('plus','出社派とリモート派で意見が割れた。',['曜日を半分ずつにする','仕事の種類ごとに最適な場所を選ぶ運用を作る','多数決で決める'],1,'立場ではなく価値を組み合わせて新しい運用を作る。'),
    q('plus','速さを求める人と品質を求める人がいる。',['速さを優先する','小さく早く出して検証し、重要部分だけ品質を上げる','品質を優先する'],1,'対立する強みを工程設計で両立する。'),
    q('plus','新規客を増やす案と既存客を大事にする案が競合。',['予算を半分ずつにする','既存客の紹介で新規客も増える仕組みを考える','新規だけに集中する'],1,'別々の目的を一つの仕組みでつなげられないか考える。'),
    q('plus','文章案が二つ。片方は簡潔、片方は温かい。',['簡潔な方を使う','短さを保ちながら温度感を足した第三稿を作る','両方つなげる'],1,'違いは新しい質を作る材料になる。'),
    q('plus','初心者向けにすると上級者が物足りない。',['初心者に合わせる','基本は簡単、必要な人だけ深掘りできる二層構造にする','上級者に合わせる'],1,'どちらかを捨てず、構造で両立できる。'),
    q('plus','二人の専門家の意見が反対。',['肩書きが上の人を採用する','それぞれの前提が成立する条件を整理して新しい仮説を作る','平均を取る'],1,'違いを比較するだけでなく、新しい理解へ統合する。'),
    q('reset','集中力が落ち、同じ行を3回読んでいる。',['そのまま粘る','数分離れて水分・姿勢・呼吸を整える','別の仕事を同時に始める'],1,'消耗した状態で時間だけ伸ばさず、短く回復して質を戻す。'),
    q('reset','睡眠不足なのに夜まで仕事が残っている。',['全部終わるまで寝ない','重要な一つだけ終え、睡眠を確保する','カフェインを増やす'],1,'長期的な性能を削って一晩だけ延ばさない。'),
    q('reset','会議が連続して頭が重い。次の作業まで10分。',['SNSを見る','画面から離れ、歩く・水を飲むなど短く切り替える','そのままメールを処理する'],1,'刺激を足すより、回復する行動を入れる。'),
    q('reset','イライラしたまま重要なメールを書いている。',['勢いで送る','下書きして少し置き、落ち着いて読み直す','長文で全部説明する'],1,'状態が判断を歪めるときは、整えてから重要行動へ戻る。'),
    q('reset','運動不足が続き、午後に集中できない。',['仕事時間をさらに増やす','短い散歩を日程に固定する','週末にまとめて運動する'],1,'能力を使うだけでなく、能力を維持する時間を予定に入れる。'),
    q('reset','学習を続けているが、最近ほとんど頭に入らない。',['時間を倍にする','睡眠・休憩・学び方を見直す','教材を追加する'],1,'努力量だけでなく、学べる状態そのものを整える。'),
    q('reset','休日なのに仕事の通知を見続けている。',['念のため全部確認する','緊急連絡の条件を決め、それ以外は閉じる','返信はしないが読む'],1,'休む時間を守ることも、次の成果を作る仕事の一部。'),
    q('reset','最近ずっと同じやり方で成果が伸びない。',['さらに同じ量をこなす','振り返りの時間を作り、やり方を更新する','目標を下げる'],1,'自分を整えるのは休息だけでなく、学習と更新も含む。'),
  ];

  function q(skill, text, options, correct, why) { return { skill, text, options, correct, why }; }
  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen','gameScreen','feedbackScreen','resultScreen'];
  const state = { session:[], index:0, score:0, correct:0, streak:0, bestStreak:0, times:[], startedAt:0, timer:null, answered:false, sound:true, sessionBySkill:{} };

  function loadStats(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { sessions:saved.sessions||0,total:saved.total||0,correct:saved.correct||0,totalMs:saved.totalMs||0,level:saved.level||0,skills:saved.skills||{} };
    } catch { return {sessions:0,total:0,correct:0,totalMs:0,level:0,skills:{}}; }
  }
  function saveStats(stats){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(stats));}catch{} }
  function timeLimit(){ const s=loadStats(); return s.level>=3?4.2:s.level>=1?5:6; }
  function show(id){ screens.forEach(s=>$(s).classList.toggle('is-active',s===id)); }
  function shuffle(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }
  function weightedPool(){
    const stats=loadStats();
    const pool=[];
    for(const question of QUESTIONS){
      const s=stats.skills[question.skill];
      const acc=s?.seen ? s.correct/s.seen : .65;
      const copies=acc<.55?4:acc<.72?3:acc<.85?2:1;
      for(let i=0;i<copies;i++) pool.push(question);
    }
    return pool;
  }
  function buildSession(){
    const picked=[]; const used=new Set(); const pool=shuffle(weightedPool());
    for(const item of pool){ if(!used.has(item.text)){picked.push(item);used.add(item.text);} if(picked.length===SESSION_LENGTH)break; }
    const missingSkills=Object.keys(SKILLS).filter(skill=>!picked.some(q=>q.skill===skill));
    for(const skill of missingSkills){
      const replacement=shuffle(QUESTIONS.filter(q=>q.skill===skill && !used.has(q.text)))[0];
      if(replacement){ const idx=picked.findIndex((q,i)=>i>6 || picked.filter(x=>x.skill===q.skill).length>1); if(idx>=0)picked[idx]=replacement; }
    }
    return shuffle(picked);
  }
  function updateStart(){
    const s=loadStats();
    $('startSessions').textContent=s.sessions;
    $('startAccuracy').textContent=s.total?`${Math.round(s.correct/s.total*100)}%`:'—';
    $('startSpeed').textContent=s.total?`${(s.totalMs/s.total/1000).toFixed(1)}s`:'—';
    $('ruleTime').textContent=`${timeLimit().toFixed(timeLimit()%1?1:0)}秒`;
  }
  function beep(ok=true){
    if(!state.sound)return;
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=ok?640:190;g.gain.setValueAtTime(.025,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.09);o.start();o.stop(c.currentTime+.1);
    }catch{}
    if(navigator.vibrate) navigator.vibrate(ok?12:[18,28,18]);
  }
  function start(){
    clearInterval(state.timer);
    Object.assign(state,{session:buildSession(),index:0,score:0,correct:0,streak:0,bestStreak:0,times:[],answered:false,sessionBySkill:{}});
    show('gameScreen'); renderQuestion();
  }
  function renderQuestion(){
    clearInterval(state.timer); state.answered=false;
    const item=state.session[state.index], skill=SKILLS[item.skill];
    $('progress').style.width=`${((state.index+1)/SESSION_LENGTH)*100}%`;
    $('roundLabel').textContent=`${String(state.index+1).padStart(2,'0')} / ${SESSION_LENGTH}`;
    $('streakLabel').textContent=`STREAK ${state.streak}`;
    $('scoreLabel').textContent=state.score;
    $('skillName').textContent=skill.code; $('skillJp').textContent=skill.jp; $('sceneNo').textContent=`SCENE ${String(state.index+1).padStart(2,'0')}`; $('scenarioText').textContent=item.text;
    const choices=$('choices'); choices.innerHTML='';
    item.options.forEach((text,i)=>{const b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML=`<span class="choice-no">${i+1}</span><span>${text}</span>`;b.addEventListener('click',()=>answer(i));choices.appendChild(b);});
    const limit=timeLimit(); state.startedAt=performance.now(); const timer=$('timerFill'); timer.style.transition='none';timer.style.width='100%';timer.classList.remove('is-danger');requestAnimationFrame(()=>{timer.style.transition=`width ${limit}s linear`;timer.style.width='0%';});
    state.timer=setInterval(()=>{const elapsed=(performance.now()-state.startedAt)/1000;if(limit-elapsed<1.6)timer.classList.add('is-danger');if(elapsed>=limit){clearInterval(state.timer);timeout();}},80);
  }
  function timeout(){ if(state.answered)return; answer(-1,true); }
  function answer(choice,timedOut=false){
    if(state.answered)return; state.answered=true; clearInterval(state.timer);
    const item=state.session[state.index], skill=SKILLS[item.skill]; const ms=Math.min(performance.now()-state.startedAt,timeLimit()*1000); const ok=choice===item.correct;
    state.times.push(ms); const ss=state.sessionBySkill[item.skill]||(state.sessionBySkill[item.skill]={seen:0,correct:0,ms:0});ss.seen++;ss.correct+=ok?1:0;ss.ms+=ms;
    if(ok){state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);const speedBonus=Math.max(0,Math.round((timeLimit()*1000-ms)/(timeLimit()*100)));state.score+=100+speedBonus;}else state.streak=0;
    beep(ok); $('feedbackMark').textContent=ok?'✓':'×'; $('feedbackMark').classList.toggle('is-wrong',!ok); $('feedbackKicker').textContent=ok?'GOOD REFLEX':timedOut?'TIME UP':'REWIRE THIS'; $('feedbackKicker').classList.toggle('is-wrong',!ok); $('feedbackTitle').textContent=skill.title; $('feedbackText').textContent=item.why; $('feedbackSkill').textContent=skill.code; $('feedbackTime').textContent=timedOut?'TIME UP':`${(ms/1000).toFixed(1)}s`; show('feedbackScreen');
  }
  function next(){ if(state.index>=SESSION_LENGTH-1){finish();return;}state.index++;show('gameScreen');renderQuestion(); }
  function finish(){
    const stats=loadStats(); const sessionMs=state.times.reduce((a,b)=>a+b,0); stats.sessions++;stats.total+=SESSION_LENGTH;stats.correct+=state.correct;stats.totalMs+=sessionMs;
    for(const [skill,s] of Object.entries(state.sessionBySkill)){const old=stats.skills[skill]||{seen:0,correct:0,totalMs:0};old.seen+=s.seen;old.correct+=s.correct;old.totalMs+=s.ms;stats.skills[skill]=old;}
    const accuracy=state.correct/SESSION_LENGTH; if(accuracy>=.9 && sessionMs/SESSION_LENGTH<3600)stats.level=Math.min(3,(stats.level||0)+1);else if(accuracy<.6)stats.level=Math.max(0,(stats.level||0)-1);saveStats(stats);
    const avg=sessionMs/SESSION_LENGTH; const speedPart=Math.max(0,Math.min(1,1-avg/(timeLimit()*1000))); const reflex=Math.round(accuracy*75+speedPart*25);
    const weak=Object.keys(SKILLS).sort((a,b)=>sessionSkillScore(a)-sessionSkillScore(b))[0];
    $('reflexScore').textContent=reflex; $('resultAccuracy').textContent=`${Math.round(accuracy*100)}%`; $('resultSpeed').textContent=`${(avg/1000).toFixed(1)}s`; $('resultStreak').textContent=state.bestStreak; $('weakSkill').textContent=SKILLS[weak].code; $('weakText').textContent=`「${SKILLS[weak].jp}」の反射を、次のセッションでは多めに出題します。`; $('ifThenText').textContent=SKILLS[weak].takeaway; show('resultScreen');
  }
  function sessionSkillScore(skill){ const s=state.sessionBySkill[skill]; if(!s)return .72; return (s.correct/s.seen)*.8 + Math.max(0,1-(s.ms/s.seen)/(timeLimit()*1000))*.2; }

  $('startButton').addEventListener('click',start);$('nextButton').addEventListener('click',next);$('retryButton').addEventListener('click',start);$('soundButton').addEventListener('click',()=>{state.sound=!state.sound;$('soundButton').setAttribute('aria-pressed',String(state.sound));$('soundButton').textContent=state.sound?'♪':'×';});
  document.addEventListener('keydown',(e)=>{if(!$('gameScreen').classList.contains('is-active'))return;const n=Number(e.key);if(n>=1&&n<=3)answer(n-1);});
  updateStart();
})();
