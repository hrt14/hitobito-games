(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const getBest = () => { try { return Number(localStorage.getItem('yahooMarketerBest') || 0); } catch { return 0; } };
  const setBest = (v) => { try { localStorage.setItem('yahooMarketerBest', String(v)); } catch {} };
  const scenarios = [
    {tag:'商品',q:'広告を増やしたのに、商品ページで離脱している。',ctx:'アクセスは伸びたが注文率が低い。商品画像は1枚、説明は短く、発送日の表示も分かりにくい。',m:['アクセス +42%','CVR 0.7%','広告費 ↑'],choices:[
      ['広告予算をさらに増やして母数で押す',0],['商品画像・説明・発送情報を先に改善する',2],['全商品を一律で値下げする',1]],best:1,
      fb:'流入を増やす前に、商品ページで「買える理由」を強くする。Yahoo!ショッピングでは商品画像や商品情報、発送日情報などを商品ページで設定できる。',lesson:'型：流入↑ × CVR低迷 → 先に受け皿を改善。広告は弱いページを救ってくれない。',d:[[4,-5,-7,0],[0,9,5,0],[3,4,-8,0]]},
    {tag:'広告',q:'アイテムマッチのクリックは増えた。でも利益が悪化。',ctx:'クリック数は好調。売上も少し増えたが、広告費の伸びの方が大きい。',m:['クリック +55%','売上 +18%','粗利率 低下'],choices:[
      ['入札・予算を一律でさらに上げる',0],['商品別に売上・粗利・広告効率を見て配分を変える',2],['広告を全部停止して自然流入だけにする',1]],best:1,
      fb:'広告は「売上」だけでなく、商品別の利益まで見て配分する。効率の良い商品へ寄せ、悪い商品はページ・条件改善とセットで見直す。',lesson:'型：売上↑でも広告費↑↑なら勝ちとは限らない。売上 → 粗利 → 広告費の順に残るお金を見る。',d:[[8,0,-9,0],[5,2,10,0],[-8,0,5,0]]},
    {tag:'検索',q:'新商品を出したが、見つけてもらえていない。',ctx:'ページは公開済み。商品情報が薄く、JANなど商品マッチングに使える情報も未確認。',m:['新商品','表示回数 少','在庫 十分'],choices:[
      ['商品情報・カテゴリ・マッチング情報を整えて発見されやすくする',2],['レビューが付くまで何もしない',0],['商品名に無関係な人気ワードを大量に足す',1]],best:0,
      fb:'まず商品データを整え、検索結果や一覧で「何の商品か」が正しく伝わる状態を作る。無関係な語を足すのではなく、商品に必要な情報を正確に揃える。',lesson:'型：表示されない → 広告だけに逃げず、商品データの土台を確認。',d:[[8,4,2,0],[-5,-2,0,0],[-2,-2,-1,0]]},
    {tag:'販促',q:'大型販促が近い。最初に確認すべきものは？',ctx:'販促企画に参加したいが、主力商品の在庫が薄く、発送体制もぎりぎり。',m:['販促期 間近','在庫 1.2週','通常時 発送ぎりぎり'],choices:[
      ['ポイントだけ最大化して目立たせる',1],['在庫・配送・利益条件を確認してから販促設計する',2],['全商品に同じクーポンを付ける',0]],best:1,
      fb:'販促は「売れた後」まで含めて設計する。在庫切れや発送遅延を起こす施策は、短期売上が出ても運営として弱い。',lesson:'型：販促前 → 在庫 → 配送 → 粗利 → 訴求の順で事故を潰す。',d:[[7,0,-9,-2],[5,3,9,4],[4,1,-7,0]]},
    {tag:'ポイント',q:'ポイント施策を強くしたい。どう設計する？',ctx:'利益率の高い商品と低い商品が混在。全商品一律の還元にすると採算が不安。',m:['商品A 粗利高','商品B 粗利低','予算 限定'],choices:[
      ['商品ごとの採算を見てポイント倍率を設計する',2],['全商品を同じ倍率にする',1],['ポイント施策は常に利益を増やすので最大にする',0]],best:0,
      fb:'Yahoo!ショッピングでは商品別にポイント倍率を設定できる。だからこそ、利益率や役割に合わせて使い分けるのが実務的。',lesson:'型：一律施策より商品別採算。ポイントは「無料の売上」ではなく原資を伴う販促。',d:[[5,3,10,1],[3,1,-4,0],[7,1,-10,0]]},
    {tag:'CRM',q:'一度買ったお客様に、もう一度来てもらいたい。',ctx:'消耗品で再購入余地があるが、購入後は何も接点を作っていない。',m:['リピート商材','購入者 増','再訪 少'],choices:[
      ['新規広告だけを増やす',1],['LINE・ニュースレター・クーポンなどで再訪導線を作る',2],['商品価格を毎週変える',0]],best:1,
      fb:'Yahoo!ショッピングにはLINE公式アカウント、ストアニュースレター、クーポンなど継続接点を作る手段がある。再購入商材なら購入後の導線を設計する。',lesson:'型：LTV商材 → 新規獲得だけでなく、再訪・再購入の仕組みを持つ。',d:[[6,0,-5,1],[3,2,6,11],[0,-2,-2,-2]]},
    {tag:'分析',q:'売上が落ちた。最初の一手は？',ctx:'昨日より売上が25%減。原因はまだ特定できていない。',m:['売上 -25%','原因 不明','在庫 一部欠品'],choices:[
      ['とりあえず全広告の予算を倍にする',0],['セッション・CVR・客単価・在庫を分解して落ちた場所を特定する',2],['全商品を5%値下げする',1]],best:1,
      fb:'売上は複数要因の掛け算。原因が分からないまま施策を打つと、効かなかった理由も分からない。まず分解してボトルネックを決める。',lesson:'型：売上変化 → 流入 × CVR × 客単価。さらに在庫・広告・販促条件を確認。',d:[[5,0,-8,0],[4,5,8,2],[4,3,-7,0]]},
    {tag:'クーポン',q:'クーポンを出すなら、何を決めてから？',ctx:'「とりあえず10%OFF」を提案された。客単価を上げたいが、利益も守りたい。',m:['客単価 課題','粗利 中','セット購入 余地'],choices:[
      ['目的・対象・利用条件・採算を決めて設計する',2],['割引率が大きいほど良いので20%OFFにする',0],['競合と同じ割引率にだけ合わせる',1]],best:0,
      fb:'クーポンは目的から逆算する。新規獲得、まとめ買い、再購入など狙いに応じて対象と条件を変え、採算を確認する。',lesson:'型：施策名から考えない。「何を変えたい？」→ 条件設計 → 採算確認。',d:[[3,3,10,4],[8,2,-11,0],[2,1,-5,0]]},
    {tag:'店舗運営',q:'注文が増えた。広告担当として無視していい？',ctx:'販促成功で注文数が急増。受注処理と発送が追いつきにくくなっている。',m:['注文 +70%','発送負荷 高','問合せ 増'],choices:[
      ['広告の数字だけ良ければ続行する',0],['受注・発送キャパを確認し、販促強度を運営と合わせる',2],['商品ページを閉じる',1]],best:1,
      fb:'Yahoo!ショッピングでは受注や発送は出店者側の運営業務。マーケティングも、注文後の運用までつながって初めて成功。',lesson:'型：集客 → 注文 → 受注 → 発送まで一つのファネル。後工程の詰まりもマーケ判断に入れる。',d:[[7,0,-5,-7],[3,4,7,7],[-8,0,1,-2]]},
    {tag:'競合',q:'競合が値下げした。すぐ追随する？',ctx:'自社商品は配送の早さとセット内容で優位。価格差は5%。',m:['競合 -5%','自社 配送◎','セット価値◎'],choices:[
      ['即座に同額まで値下げする',1],['価格以外の強みとCVRを確認し、必要なら条件を調整する',2],['競合のページをそのまま真似る',0]],best:1,
      fb:'価格差だけで判断しない。配送、内容、ポイント、クーポン、ページ訴求など「選ばれる理由」を比較してから打ち手を決める。',lesson:'型：競合値下げ → 即追随ではなく、価値差・CVR・粗利を確認。',d:[[3,3,-7,0],[2,5,9,1],[-1,-2,-3,0]]},
    {tag:'AI活用',q:'AIの改善提案が出た。どう使う？',ctx:'競合比較・広告販促分析から改善候補が複数提示された。',m:['提案 5件','実装工数 限定','優先順位 未決'],choices:[
      ['全部一度に反映する',1],['仮説として受け、影響×工数×検証しやすさで優先する',2],['AI提案は一切使わない',0]],best:1,
      fb:'Yahoo!ショッピングはAIによる運営支援や競合比較、広告・販促分析を案内している。提案は「正解」ではなく、優先順位を付けて検証する材料として使う。',lesson:'型：AI提案 → 仮説 → 優先順位 → 小さく実行 → 数値で検証。',d:[[5,1,-4,0],[4,5,7,2],[-2,0,0,0]]},
    {tag:'商品',q:'アクセスは多いのに、カートに入らない。',ctx:'検索からの流入は十分。価格は競合並みだが、画像と商品説明で違いが伝わっていない。',m:['表示 十分','クリック 十分','カート率 低'],choices:[
      ['画像・ベネフィット・比較情報を改善して選ぶ理由を作る',2],['検索広告を増やす',1],['商品数を増やす',0]],best:0,
      fb:'ボトルネックが商品ページなら、さらに流入を足すより「選ぶ理由」を強くする。ページ改善後に広告を増やす方が学習しやすい。',lesson:'型：上流が足りている → 下流を直す。ファネルの弱点に施策を当てる。',d:[[0,10,6,1],[5,0,-6,0],[1,-1,-2,0]]},
    {tag:'販促',q:'販促施策を評価するとき、売上だけ見ればいい？',ctx:'キャンペーン期間に売上は大きく伸びたが、ポイント・値引き・広告費も増えた。',m:['売上 +60%','販促費 ↑','広告費 ↑'],choices:[
      ['売上が伸びたので成功とする',1],['増分売上だけでなく粗利と販促・広告コストまで見る',2],['注文数だけ比較する',0]],best:1,
      fb:'販促の評価は売上だけで終えない。売上が増えても原資や広告費で利益が消えることがある。',lesson:'型：施策評価 = 増分売上ではなく、増分粗利 − 増分コストまで。',d:[[6,0,-6,0],[4,2,11,1],[2,0,-4,0]]},
    {tag:'検索',q:'検索対策で最も避けたい考え方は？',ctx:'もっと表示回数を増やしたい。担当者から「人気語を全部入れよう」と提案された。',m:['表示 少','関連語 あり','人気語 多数'],choices:[
      ['商品に関連する情報を正確に充実させる',2],['無関係な人気ワードまで詰め込む',0],['商品情報の不足箇所を洗い出す',2]],best:0,
      fb:'検索対策は「関連性を壊してでも語を増やす」ことではない。商品を正しく表す情報を整え、見つけた人に期待通りのページを返す。',lesson:'型：検索 = 表示回数だけでなく、関連性 × クリック後の体験。',d:[[6,4,3,0],[-3,-5,-3,0],[5,4,4,0]]},
    {tag:'LINE',q:'LINE配信の反応を良くしたい。',ctx:'全員に同じ内容を高頻度で送っているが、反応が徐々に落ちている。',m:['配信頻度 高','反応率 ↓','再購入余地 あり'],choices:[
      ['さらに配信回数を増やす',0],['購入タイミングや商品特性に合わせて内容と頻度を見直す',2],['LINEをやめて価格訴求だけにする',1]],best:1,
      fb:'LINEは継続接点として使えるが、接点があること自体が目的ではない。再購入のタイミングや有益性を意識して配信を設計する。',lesson:'型：CRM = 回数ではなく、誰に・いつ・何を。',d:[[0,0,-3,-7],[1,2,4,10],[0,1,-4,-3]]},
    {tag:'優先順位',q:'改善候補が10個。今日1つだけやるなら？',ctx:'アクセス不足、CVR低迷、広告効率悪化など複数課題があるが、主力商品はCVR低迷の影響が最も大きい。',m:['工数 2h','主力 CVR↓','他課題 小'],choices:[
      ['一番売上影響が大きく、検証しやすい主力商品のページ改善',2],['目についたバナーの色変更',0],['全部少しずつ触る',1]],best:0,
      fb:'改善は「全部やる」より、最大ボトルネックに集中した方が因果が分かる。影響が大きく、検証しやすいものから潰す。',lesson:'型：優先度 = インパクト × 確度 ÷ 工数。WIPを増やさない。',d:[[1,10,7,0],[0,1,0,0],[2,2,-2,0]]}
  ];

  const state = {round:0,score:0,streak:0,kpis:{traffic:50,cvr:50,profit:50,repeat:50},deck:[],wrong:[],timer:null,timeLeft:20,sound:true,answered:false};
  const els = {start:$('#startScreen'),game:$('#gameScreen'),result:$('#resultScreen'),round:$('#roundText'),streak:$('#streakText'),score:$('#scoreText'),timer:$('#timerBar'),tag:$('#tag'),question:$('#question'),context:$('#context'),metrics:$('#metrics'),choices:$('#choices'),feedback:$('#feedback'),feedbackIcon:$('#feedbackIcon'),feedbackTitle:$('#feedbackTitle'),feedbackText:$('#feedbackText'),lesson:$('#lessonText'),next:$('#nextBtn'),toast:$('#toast'),sound:$('#soundBtn')};

  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function beep(ok=true){if(!state.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;const c=new A();const o=c.createOscillator(),g=c.createGain();o.frequency.value=ok?640:220;g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.12);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.12);o.onended=()=>c.close();}catch{}}
  function showScreen(name){[els.start,els.game,els.result].forEach(x=>x.classList.remove('active'));els[name].classList.add('active');window.scrollTo(0,0);}
  function startGame(){state.round=0;state.score=0;state.streak=0;state.kpis={traffic:50,cvr:50,profit:50,repeat:50};state.deck=shuffle([...scenarios]).slice(0,10);state.wrong=[];state.answered=false;showScreen('game');renderRound();}
  function renderRound(){clearTimeout(state.timer);state.answered=false;state.timeLeft=20;const s=state.deck[state.round];els.round.textContent=`DAY ${state.round+1} / 10`;els.streak.textContent=`STREAK ${state.streak}`;els.score.textContent=state.score;els.tag.textContent=s.tag;els.question.textContent=s.q;els.context.textContent=s.ctx;els.metrics.innerHTML=s.m.map(x=>`<span class="metric">${x}</span>`).join('');els.feedback.className='feedback';els.choices.innerHTML='';s.choices.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=c[0];b.addEventListener('click',()=>answer(i));els.choices.appendChild(b);});updateKpis();els.timer.style.transition='none';els.timer.style.transform='scaleX(1)';requestAnimationFrame(()=>{els.timer.style.transition='transform 20s linear';els.timer.style.transform='scaleX(0)';});state.timer=setTimeout(()=>answer(-1),20000);}
  function updateKpis(delta){Object.entries(state.kpis).forEach(([k,v])=>{const id={traffic:'trafficKpi',cvr:'cvrKpi',profit:'profitKpi',repeat:'repeatKpi'}[k];$('#'+id).textContent=Math.round(v);const box=document.querySelector(`[data-kpi="${k}"]`);box.classList.remove('up','down');if(delta&&delta[k]){void box.offsetWidth;box.classList.add(delta[k]>0?'up':'down');}});}
  function answer(i){if(state.answered)return;state.answered=true;clearTimeout(state.timer);els.timer.style.transition='none';const s=state.deck[state.round];const timedOut=i<0;const picked=timedOut?0:i;const grade=timedOut?0:s.choices[picked][1];const isBest=!timedOut && picked===s.best;const points=isBest?100+(state.streak*10):grade===2?85:grade===1?35:0;state.score+=points;state.streak=isBest?state.streak+1:0;const deltaArr=s.d[picked]||[0,0,0,0];const keys=['traffic','cvr','profit','repeat'];const delta={};keys.forEach((k,idx)=>{delta[k]=deltaArr[idx];state.kpis[k]=clamp(state.kpis[k]+deltaArr[idx]);});if(!isBest)state.wrong.push({q:s.q,answer:s.choices[s.best][0],lesson:s.lesson});[...els.choices.children].forEach((b,idx)=>{b.disabled=true;if(idx===s.best)b.classList.add('correct');if(!timedOut&&idx===picked&&idx!==s.best)b.classList.add('wrong');});els.feedback.className='feedback show '+(isBest?'good':'bad');els.feedbackIcon.textContent=isBest?'✓':'!';els.feedbackTitle.textContent=timedOut?'TIME UP':isBest?'GOOD DECISION':'BETTER MOVE EXISTS';els.feedbackText.textContent=s.fb;els.lesson.textContent=s.lesson;els.score.textContent=state.score;els.streak.textContent=`STREAK ${state.streak}`;updateKpis(delta);showToast(isBest?`+${points}  GOOD`:`+${points}`);beep(isBest);}
  function showToast(t){els.toast.textContent=t;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),700);}
  function next(){if(!state.answered)return;if(state.round>=9){finish();return;}state.round++;renderRound();}
  function finish(){clearTimeout(state.timer);const old=getBest();const best=Math.max(old,state.score);setBest(best);const rank=state.score>=900?'GROWTH LEAD':state.score>=700?'STRONG OPERATOR':state.score>=500?'EC OPERATOR':'ROOKIE OPERATOR';$('#rankTitle').textContent=rank;$('#finalScore').textContent=state.score;$('#bestText').textContent=`BEST ${best}`;$('#bestStart').textContent=best;$('#rTraffic').textContent=Math.round(state.kpis.traffic);$('#rCvr').textContent=Math.round(state.kpis.cvr);$('#rProfit').textContent=Math.round(state.kpis.profit);$('#rRepeat').textContent=Math.round(state.kpis.repeat);const review=$('#review');if(state.wrong.length){review.innerHTML='<h3>間違えた判断を振り返る</h3>'+state.wrong.slice(0,5).map(x=>`<div class="review-item"><b>${x.q}</b><p>推奨：${x.answer}<br>${x.lesson}</p></div>`).join('');}else{review.innerHTML='<h3>PERFECT SHIFT</h3><div class="review-item"><p>10問すべて最適判断。次は別の10問で反射速度を上げよう。</p></div>';}showScreen('result');}
  $('#startBtn').addEventListener('click',startGame);els.next.addEventListener('click',next);$('#retryBtn').addEventListener('click',startGame);$('#homeBtn').addEventListener('click',()=>showScreen('start'));els.sound.addEventListener('click',()=>{state.sound=!state.sound;els.sound.textContent=state.sound?'SOUND ON':'SOUND OFF';els.sound.setAttribute('aria-pressed',String(state.sound));if(state.sound)beep(true);});
  $('#bestStart').textContent=getBest();
})();
