(() => {
  'use strict';
  const ROUND_COUNT=10,ROUND_MS=8000,FEEDBACK_MS=1600,START_LOAD=50;
  const patterns={
    control:{code:'CONTROL',name:'変えられる一手だけ。',short:'変えられる一手',advice:'相手・結果・天気より、自分が次に動かせる一手へ戻る。'},
    one:{code:'ONE THING',name:'一個だけ。',short:'一個だけ',advice:'「全部」を見つけたら、次の一個だけ決める。'},
    enough:{code:'ENOUGH',name:'十分で出す。',short:'十分で出す',advice:'必要以上の完成度を足さず、目的を満たしたら一度出す。'},
    end:{code:'END LOOP',name:'ここで終わり。',short:'ここで終わり',advice:'学びを一つ拾ったら、終わった出来事をもう働かせない。'},
    hold:{code:'HOLD',name:'今は保留。',short:'今は保留',advice:'今決める必要がないことは、決める日時だけ決めて頭から下ろす。'}
  };
  const questions=[
    {cat:'WORK',scene:'今日中に3つの仕事が同時に来た。',pattern:'one',good:'まず一個だけ終わらせる。',bad:'3つ全部を頭に載せたまま進める。'},
    {cat:'MEETING',scene:'会議で自分の案が通らなかった。',pattern:'control',good:'次に変えられる提案の出し方だけ考える。',bad:'相手が納得するまで頭の中で説得を続ける。'},
    {cat:'OUTPUT',scene:'資料は目的を満たしている。でも少し気になる。',pattern:'enough',good:'一度出して、反応を見て直す。',bad:'気になる箇所がゼロになるまで出さない。'},
    {cat:'PAST',scene:'昨日の言い方がまずかった気がする。',pattern:'end',good:'次に変える一つを決めて、ここで終える。',bad:'会話を何度も脳内再生して正解を探す。'},
    {cat:'FUTURE',scene:'来月の予定がまだ確定していない。',pattern:'hold',good:'確認する日を決めて、今日は保留する。',bad:'決まるまで毎日いろんな可能性を考える。'},
    {cat:'MESSAGE',scene:'送ったメッセージにまだ返信がない。',pattern:'control',good:'必要なら期限後に一度だけ確認する。',bad:'相手がどう思ったかを何通りも想像する。'},
    {cat:'TASK',scene:'やることリストが20個ある。',pattern:'one',good:'次の25分でやる一個だけ選ぶ。',bad:'20個を何度も見直して全部を気にする。'},
    {cat:'QUALITY',scene:'80点で十分な社内メモを作っている。',pattern:'enough',good:'目的を満たしたら保存して終える。',bad:'読み手が絶対に迷わない完璧な文章まで磨く。'},
    {cat:'MISTAKE',scene:'終わった仕事で小さなミスを見つけた。',pattern:'end',good:'再発防止を一つ残して閉じる。',bad:'なぜあの時気づけなかったかを何度も考える。'},
    {cat:'DECISION',scene:'半年後に続けるかどうか迷う仕事がある。',pattern:'hold',good:'判断日と見る条件を決め、今日は戻る。',bad:'毎日「辞める？続ける？」を最初から考える。'},
    {cat:'PEOPLE',scene:'相手の機嫌が悪そうに見える。',pattern:'control',good:'必要な確認だけして、自分の仕事へ戻る。',bad:'自分のせいかもしれないと原因を探し続ける。'},
    {cat:'DAY',scene:'朝の予定より2時間遅れて動き始めた。',pattern:'one',good:'残り時間で一番大事な一個を選ぶ。',bad:'失った2時間と今日の全部を同時に取り戻す。'},
    {cat:'DRAFT',scene:'たたき台を頼まれた。締切は今日。',pattern:'enough',good:'粗くても判断できる形まで作って出す。',bad:'最終版の品質まで整えてから見せる。'},
    {cat:'AFTER',scene:'会議が終わったあと、反省点が3つ浮かんだ。',pattern:'end',good:'一番大事な改善を一つメモして閉じる。',bad:'全部の発言を思い出して採点する。'},
    {cat:'WAIT',scene:'来週の返事次第で方針が変わる。',pattern:'hold',good:'返事が来るまでの仮方針だけ決める。',bad:'全分岐の計画を今のうちに完成させる。'},
    {cat:'REQUEST',scene:'相手から「もっと売上を伸ばして」と言われた。',pattern:'control',good:'自分が提案できる次の施策に分解する。',bad:'売上という結果そのものを自分の責任として抱える。'},
    {cat:'INBOX',scene:'未読の連絡が8件ある。',pattern:'one',good:'緊急度を見て、一件ずつ処理する。',bad:'8件全部の返事を頭の中で同時に考える。'},
    {cat:'DETAIL',scene:'誰も気づかない細部が少しズレている。',pattern:'enough',good:'目的への影響が小さければ先へ進む。',bad:'見つけた以上、完全に揃えるまで止まらない。'},
    {cat:'REVIEW',scene:'出した案に厳しいコメントが一つ来た。',pattern:'end',good:'使える指摘を一つ拾って次へ進む。',bad:'コメントの言い方まで何度も思い返す。'},
    {cat:'UNKNOWN',scene:'まだ情報が足りず、正解が決められない。',pattern:'hold',good:'必要な情報と再判断の時だけ決める。',bad:'今ある情報だけで正解を出し切ろうとする。'}
  ];
  const $=id=>document.getElementById(id);
  const els={intro:$('introScreen'),play:$('playScreen'),result:$('resultScreen'),hud:$('hudMini'),start:$('startBtn'),retry:$('retryBtn'),round:$('roundLabel'),loadBar:$('loadBar'),loadWord:$('loadWord'),loadValue:$('loadValue'),combo:$('combo'),category:$('category'),scene:$('scene'),card:$('scenarioCard'),timer:$('timerBar'),choices:$('choices'),feedback:$('feedback'),feedbackMark:$('feedbackMark'),feedbackCode:$('feedbackCode'),feedbackTitle:$('feedbackTitle'),feedbackText:$('feedbackText'),microcopy:$('microcopy'),resultLoad:$('resultLoad'),resultTitle:$('resultTitle'),accuracy:$('accuracy'),avgTime:$('avgTime'),maxCombo:$('maxCombo'),weakName:$('weakName'),weakAdvice:$('weakAdvice'),mantra:$('mantra')};
  let deck=[],index=0,load=START_LOAD,combo=0,maxCombo=0,correct=0,locked=false,roundStart=0,timerId=null,answerTimes=[],misses={};
  function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function pickDeck(){const byPattern=Object.keys(patterns).flatMap(key=>shuffle(questions.filter(q=>q.pattern===key)).slice(0,2));return shuffle(byPattern).slice(0,ROUND_COUNT)}
  function showScreen(target){[els.intro,els.play,els.result].forEach(s=>s.classList.toggle('active',s===target))}
  function setLoad(next){load=Math.max(0,Math.min(100,next));els.loadBar.style.width=`${load}%`;els.loadWord.textContent=`LOAD ${load}`;els.loadValue.textContent=load}
  function startGame(){deck=pickDeck();index=0;load=START_LOAD;combo=0;maxCombo=0;correct=0;locked=false;answerTimes=[];misses={};els.combo.textContent='0';els.hud.hidden=false;setLoad(load);showScreen(els.play);renderRound()}
  function renderRound(){if(index>=deck.length){finishGame();return}locked=false;const q=deck[index];els.round.textContent=`${String(index+1).padStart(2,'0')} / ${ROUND_COUNT}`;els.category.textContent=q.cat;els.scene.textContent=q.scene;els.feedback.hidden=true;els.feedback.classList.remove('bad');els.microcopy.textContent='直感で選ぶ。正解後は1.6秒で次へ。';els.card.classList.remove('shake','pop');const items=shuffle([{type:'good',text:q.good,label:patterns[q.pattern].short},{type:'bad',text:q.bad,label:'余計な負荷'}]);els.choices.innerHTML='';items.forEach(item=>{const btn=document.createElement('button');btn.className='choice';btn.type='button';btn.dataset.type=item.type;btn.innerHTML=`<span class="badge">${item.type==='good'?'−':'＋'}</span><span><b>${escapeHtml(item.text)}</b><small>${item.type==='good'?'残す考え方':'手放す考え方'}</small></span><span class="arrow">→</span>`;btn.addEventListener('click',()=>answer(btn,item.type==='good',q));els.choices.appendChild(btn)});roundStart=performance.now();startTimer(q)}
  function startTimer(q){clearInterval(timerId);const started=performance.now();els.timer.style.transition='none';els.timer.style.width='100%';requestAnimationFrame(()=>{els.timer.style.transition=`width ${ROUND_MS}ms linear`;els.timer.style.width='0%'});timerId=setInterval(()=>{if(performance.now()-started>=ROUND_MS){clearInterval(timerId);timeout(q)}},100)}
  function answer(btn,isCorrect,q){if(locked)return;locked=true;clearInterval(timerId);const elapsed=Math.min(ROUND_MS,performance.now()-roundStart);answerTimes.push(elapsed);[...els.choices.children].forEach(b=>{b.disabled=true;if(b.dataset.type==='good')b.classList.add('correct')});const p=patterns[q.pattern];if(isCorrect){correct++;combo++;maxCombo=Math.max(maxCombo,combo);setLoad(load-8);btn.classList.add('correct');els.feedbackMark.textContent='−8';els.feedback.classList.remove('bad');els.card.classList.add('pop')}else{combo=0;misses[q.pattern]=(misses[q.pattern]||0)+1;setLoad(load+10);btn.classList.add('wrong');els.feedbackMark.textContent='+10';els.feedback.classList.add('bad');els.card.classList.add('shake')}els.combo.textContent=combo;els.feedbackCode.textContent=p.code;els.feedbackTitle.textContent=p.name;els.feedbackText.textContent=p.advice;els.feedback.hidden=false;els.microcopy.textContent=isCorrect?'余計な荷物を一つ下ろした。':'正解の型だけ見て、次で取り返す。';setTimeout(()=>{index++;renderRound()},FEEDBACK_MS)}
  function timeout(q){if(locked)return;locked=true;combo=0;misses[q.pattern]=(misses[q.pattern]||0)+1;answerTimes.push(ROUND_MS);setLoad(load+10);els.combo.textContent='0';[...els.choices.children].forEach(b=>{b.disabled=true;if(b.dataset.type==='good')b.classList.add('correct')});const p=patterns[q.pattern];els.feedbackMark.textContent='+10';els.feedback.classList.add('bad');els.feedbackCode.textContent=p.code;els.feedbackTitle.textContent=p.name;els.feedbackText.textContent=p.advice;els.feedback.hidden=false;els.card.classList.add('shake');els.microcopy.textContent='時間切れ。正解の型だけ見て次へ。';setTimeout(()=>{index++;renderRound()},FEEDBACK_MS)}
  function finishGame(){clearInterval(timerId);els.hud.hidden=true;showScreen(els.result);const accuracy=Math.round(correct/ROUND_COUNT*100),avg=(answerTimes.reduce((a,b)=>a+b,0)/Math.max(1,answerTimes.length)/1000).toFixed(1);els.resultLoad.textContent=load;els.accuracy.textContent=`${accuracy}%`;els.avgTime.textContent=`${avg}s`;els.maxCombo.textContent=maxCombo;if(load<=18)els.resultTitle.innerHTML='余計な荷物を<br>かなり下ろせた。';else if(load<=38)els.resultTitle.innerHTML='必要な思考へ<br>戻れている。';else els.resultTitle.innerHTML='まだ頭に<br>荷物を足している。';const weakKey=Object.keys(patterns).sort((a,b)=>(misses[b]||0)-(misses[a]||0))[0]||'one';els.weakName.textContent=patterns[weakKey].short;els.weakAdvice.textContent=patterns[weakKey].advice;els.mantra.textContent=load<=30?'必要な分だけ考える。':'全部やらなくていい。今の一手だけ。';saveProgress({accuracy,avg:Number(avg),maxCombo,load,weak:weakKey})}
  function saveProgress(run){try{const key='levelup-extra-load-v1',prev=JSON.parse(localStorage.getItem(key)||'{}'),best=Math.max(prev.bestAccuracy||0,run.accuracy),plays=(prev.plays||0)+1;localStorage.setItem(key,JSON.stringify({plays,bestAccuracy:best,last:run,updatedAt:new Date().toISOString()}));window.dispatchEvent(new CustomEvent('levelup:played',{detail:{slug:'extra-load',score:run.accuracy}}))}catch{}}
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  els.start.addEventListener('click',startGame);els.retry.addEventListener('click',startGame);
})();
