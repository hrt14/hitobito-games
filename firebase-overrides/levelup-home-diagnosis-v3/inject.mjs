import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const marker = 'data-levelup-state-diagnosis-v3';

if (!fs.existsSync(homePath)) throw new Error('Firebase LEVEL UP home not found for moyamoya finder.');

const categories = {
  approval: {
    title: '相手の反応を背負いすぎている',
    summary: '「相手がどう思ったか」が自分の中で未完了になって、答えの出ない採点を続けている状態に近そうです。',
    apps: ['approval-off', 'task-separation']
  },
  rumination: {
    title: '終わった出来事を、頭の中で再審査している',
    summary: 'もう終わった発言・失敗・出来事を再生して、別の結末がなかったか探し続けている状態に近そうです。',
    apps: ['nukeru', 'mou-owatta']
  },
  expectation: {
    title: '「こうなるはず」と現実のズレが残っている',
    summary: '相手や状況が期待どおりにならなかったことを、まだ自分の中で処理しきれていない状態に近そうです。',
    apps: ['expect-nothing', 'task-separation']
  },
  selfjudge: {
    title: '「自分はちゃんとできたか」の採点が終わっていない',
    summary: '準備・実力・振る舞いをあとから採点し続けて、合格ラインを確定できずにいる状態に近そうです。',
    apps: ['maa-iika', 'mada-dekinai']
  },
  task: {
    title: '未完了のことが、頭のメモリを占領している',
    summary: 'やるべきことが残っている事実そのものが頭に居座り、休むにも始めるにも切り替えにくい状態に近そうです。',
    apps: ['one-thing', '3sec-action']
  },
  uncertainty: {
    title: 'まだ起きていない未来を、先に確定させたくなっている',
    summary: '返事・結果・予定など、自分では今決められないことを先回りして処理しようとしている状態に近そうです。',
    apps: ['levelup-control', 'yotei-made-tsukaeru']
  },
  choice: {
    title: '正解の選択を探しすぎて止まっている',
    summary: '「これでよかったか」「何を選ぶべきか」を考え続けて、自分が本当に望む方向が見えにくくなっている状態に近そうです。',
    apps: ['meaning-map', 'watashi-zukan']
  },
  overload: {
    title: '考えることが多すぎて、原因が一つに見えなくなっている',
    summary: '仕事・予定・人間関係などが同時に頭へ乗り、どれが本当の引っかかりか分離しにくい状態に近そうです。',
    apps: ['extra-load', 'matomaru']
  }
};

const questions = [
  {
    id: 'people',
    text: 'そのモヤモヤには、具体的な「誰か」が関係していますか？',
    evidence: '具体的な相手が関係している',
    yes: { approval: 2, rumination: 1, expectation: 2, selfjudge: 1 },
    no: { task: 2, uncertainty: 2, choice: 1, overload: 1 }
  },
  {
    id: 'past',
    text: '気になっている中心は、すでに起きた出来事ですか？',
    evidence: 'すでに起きたことが中心になっている',
    yes: { rumination: 3, selfjudge: 2, approval: 1 },
    no: { uncertainty: 3, task: 1, choice: 1 }
  },
  {
    id: 'reaction',
    text: '相手の表情・返事・反応を、何度も思い返していますか？',
    evidence: '相手の反応を何度も思い返している',
    yes: { approval: 4, rumination: 2, selfjudge: 1 },
    no: { expectation: 1, task: 1 }
  },
  {
    id: 'should',
    text: '「もっとこうしてくれれば」「普通はこうするはず」が混ざっていますか？',
    evidence: '相手や状況への「こうあるはず」が残っている',
    yes: { expectation: 4, approval: 1 },
    no: { rumination: 1, uncertainty: 1 }
  },
  {
    id: 'replay',
    text: '自分の発言や行動を「あれでよかった？」と頭の中で再生していますか？',
    evidence: '自分の発言や行動を再生している',
    yes: { rumination: 4, selfjudge: 2, approval: 1 },
    no: { expectation: 1, task: 1 }
  },
  {
    id: 'quality',
    text: '準備不足・実力不足・ちゃんとできなかった感じが残っていますか？',
    evidence: '「ちゃんとできたか」の自己採点が残っている',
    yes: { selfjudge: 4, rumination: 1 },
    no: { approval: 1, expectation: 1 }
  },
  {
    id: 'todo',
    text: 'やらなきゃいけないことが残っているだけで、頭が休まりませんか？',
    evidence: '未完了のタスクが頭から離れない',
    yes: { task: 4, overload: 2 },
    no: { uncertainty: 1, choice: 1 }
  },
  {
    id: 'start',
    text: '何から始めるか決めるだけで、もう重くなっていますか？',
    evidence: '始める前の整理だけで重くなっている',
    yes: { task: 3, overload: 2 },
    no: { uncertainty: 1, selfjudge: 1 }
  },
  {
    id: 'future',
    text: 'まだ起きていないことの結果を、今のうちに確定させたくなっていますか？',
    evidence: 'まだ起きていない未来を先に決めたくなっている',
    yes: { uncertainty: 4, approval: 1 },
    no: { rumination: 1, task: 1 }
  },
  {
    id: 'waiting',
    text: '返事・結果・予定など、「待っているもの」がありますか？',
    evidence: '返事・結果・予定など待っているものがある',
    yes: { uncertainty: 3, approval: 1 },
    no: { task: 1, choice: 1 }
  },
  {
    id: 'choice',
    text: '「別の選択の方がよかったかも」が混ざっていますか？',
    evidence: '別の選択肢を何度も比較している',
    yes: { choice: 4, rumination: 1 },
    no: { selfjudge: 1, uncertainty: 1 }
  },
  {
    id: 'values',
    text: '「何が正しいか」は考えられても、「自分は何がいいか」が分からなくなっていますか？',
    evidence: '正解探しで自分の希望が見えにくくなっている',
    yes: { choice: 4, approval: 1 },
    no: { task: 1, expectation: 1 }
  },
  {
    id: 'many',
    text: '原因を1つに絞ろうとしても、仕事・予定・人間関係が一緒に出てきますか？',
    evidence: '複数の問題が同時に頭へ出てくる',
    yes: { overload: 4, task: 1 },
    no: { rumination: 1, approval: 1 }
  },
  {
    id: 'smallmany',
    text: '一つひとつは小さいのに、全部が同時に頭に乗っている感じですか？',
    evidence: '小さな引っかかりが積み重なっている',
    yes: { overload: 4, task: 1 },
    no: { uncertainty: 1, selfjudge: 1 }
  },
  {
    id: 'control',
    text: '自分では決められない部分まで、何とかしようとしていますか？',
    evidence: '自分で決められない部分まで背負っている',
    yes: { uncertainty: 2, approval: 2, expectation: 2 },
    no: { task: 1, choice: 1 }
  },
  {
    id: 'okay',
    text: 'いちばん知りたいのは、「自分は大丈夫だったか」ですか？',
    evidence: '自分が大丈夫だったかを確かめたい',
    yes: { selfjudge: 4, approval: 1, rumination: 1 },
    no: { expectation: 1, task: 1, choice: 1 }
  }
];

const style = `
<style id="levelup-state-diagnosis-v3-style">
  #levelup-state-diagnosis-v2,.lu-v2-sheet{display:none!important}
  .lu-v3{position:relative;overflow:hidden;margin:0 0 18px;border:1px solid rgba(216,255,91,.3);border-radius:22px;background:linear-gradient(145deg,rgba(216,255,91,.1),rgba(255,255,255,.025));padding:20px}
  .lu-v3-kicker{font-size:8px;letter-spacing:.17em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:8px}.lu-v3 h2{margin:0;font-size:clamp(28px,5vw,46px);line-height:1;letter-spacing:-.055em}.lu-v3-lead{margin:9px 0 14px;max-width:64ch;color:#aeb5a5;font-size:11px;line-height:1.65}
  .lu-v3-start-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.lu-v3-start{min-height:48px;border:0;border-radius:999px;background:var(--lime,#d8ff5b);color:#10140c;padding:0 18px;font-size:11px;font-weight:950}.lu-v3-note{font-size:9px;color:#899283}
  .lu-v3-sheet{position:fixed;inset:0;z-index:2147483150;display:none;align-items:flex-end;justify-content:center;padding:14px;background:rgba(4,5,4,.84);backdrop-filter:blur(10px)}.lu-v3-sheet.is-open{display:flex}.lu-v3-panel{width:min(650px,100%);max-height:min(88vh,820px);overflow:auto;border:1px solid rgba(216,255,91,.3);border-radius:24px;background:#0e120c;color:#f6f8f1;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
  .lu-v3-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.lu-v3-top strong{font-size:10px;letter-spacing:.12em}.lu-v3-close{width:38px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:#151914;color:#fff;font-size:18px}
  .lu-v3-progress{height:4px;border-radius:99px;background:#20251d;overflow:hidden;margin-bottom:10px}.lu-v3-progress>span{display:block;height:100%;width:0;background:var(--lime,#d8ff5b);transition:width .2s ease}.lu-v3-step{font-size:8px;letter-spacing:.14em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:7px}.lu-v3-question{font-size:clamp(23px,5vw,32px);line-height:1.12;letter-spacing:-.04em;margin:0 0 16px}
  .lu-v3-answer-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lu-v3-answer{min-height:64px;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:#151914;color:#edf0e9;padding:11px;font-size:13px;font-weight:950}.lu-v3-answer[data-answer="yes"]{border-color:rgba(216,255,91,.42)}.lu-v3-answer[data-answer="unsure"]{grid-column:1/-1;min-height:46px;color:#9ca694;font-size:10px}.lu-v3-answer:active{transform:scale(.985)}
  .lu-v3-nav{display:flex;justify-content:space-between;gap:8px;margin-top:13px}.lu-v3-secondary{min-height:42px;border:1px solid rgba(216,255,91,.25);border-radius:999px;background:#11150e;color:#d8ff5b;padding:0 15px;font-size:10px;font-weight:950}.lu-v3-secondary:disabled{opacity:.3}
  .lu-v3-screen[hidden]{display:none!important}.lu-v3-result-kicker{font-size:8px;letter-spacing:.15em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:6px}.lu-v3-result-title{margin:0;font-size:clamp(26px,5vw,38px);line-height:1.05;letter-spacing:-.05em}.lu-v3-result-summary{margin:10px 0 14px;color:#bac2b3;font-size:11px;line-height:1.65}
  .lu-v3-clues{margin:0 0 15px;padding:12px 13px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:#131711}.lu-v3-clues b{display:block;margin-bottom:6px;font-size:8px;letter-spacing:.12em;color:#8f9989}.lu-v3-clues ul{margin:0;padding-left:18px;color:#d8decf;font-size:10px;line-height:1.65}
  .lu-v3-app-label{margin:0 0 8px;font-size:9px;letter-spacing:.1em;font-weight:950;color:#8f9989}.lu-v3-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.lu-v3-result{display:flex;flex-direction:column;min-height:190px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:#131711;padding:14px}.lu-v3-result:first-child{border-color:rgba(216,255,91,.68)}.lu-v3-role{font-size:8px;letter-spacing:.1em;font-weight:950;color:var(--lime,#d8ff5b)}.lu-v3-result h4{margin:9px 0 7px;font-size:21px;line-height:1.05;letter-spacing:-.04em}.lu-v3-result p{margin:0 0 12px;color:#aeb5a5;font-size:10px;line-height:1.55}.lu-v3-result a{margin-top:auto;display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:999px;background:#20261b;color:#d8ff5b;text-decoration:none;font-size:10px;font-weight:950}
  .lu-v3-result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.lu-v3-disclaimer{margin:12px 0 0;color:#687064;font-size:8px;line-height:1.55}
  @media(max-width:650px){.lu-v3{padding:15px;border-radius:18px}.lu-v3 h2{font-size:32px}.lu-v3-panel{padding:16px}.lu-v3-results{grid-template-columns:1fr}.lu-v3-result{min-height:0}}@media(prefers-reduced-motion:reduce){.lu-v3-progress>span{transition:none}}
</style>`;

const markup = `
<section class="lu-v3" id="levelup-state-diagnosis-v3">
  <div class="lu-v3-kicker">MOYAMOYA FINDER</div>
  <h2>モヤモヤの正体、当てます。</h2>
  <p class="lu-v3-lead">質問に「はい / いいえ」で答えるだけ。いま何に引っかかっているかを絞り込み、最後に今やるLEVEL UPを出します。</p>
  <div class="lu-v3-start-row"><button type="button" class="lu-v3-start" id="lu-v3-start">モヤモヤを特定する →</button><span class="lu-v3-note">入力なし・約5〜7問</span></div>
</section>
<div class="lu-v3-sheet" id="lu-v3-sheet" aria-hidden="true">
  <div class="lu-v3-panel" role="dialog" aria-modal="true" aria-labelledby="lu-v3-title">
    <div class="lu-v3-top"><strong id="lu-v3-title">モヤモヤ特定中</strong><button type="button" class="lu-v3-close" id="lu-v3-close" aria-label="閉じる">×</button></div>
    <section class="lu-v3-screen" id="lu-v3-question-screen">
      <div class="lu-v3-progress" aria-hidden="true"><span id="lu-v3-progress-bar"></span></div>
      <div class="lu-v3-step" id="lu-v3-step">QUESTION 1 / 7</div>
      <h3 class="lu-v3-question" id="lu-v3-question"></h3>
      <div class="lu-v3-answer-grid">
        <button type="button" class="lu-v3-answer" data-answer="yes">はい</button>
        <button type="button" class="lu-v3-answer" data-answer="no">いいえ</button>
        <button type="button" class="lu-v3-answer" data-answer="unsure">どちらとも言えない</button>
      </div>
      <div class="lu-v3-nav"><button type="button" class="lu-v3-secondary" id="lu-v3-back">← 1つ戻る</button><button type="button" class="lu-v3-secondary" id="lu-v3-stop">ここで結果を見る</button></div>
    </section>
    <section class="lu-v3-screen" id="lu-v3-result-screen" hidden>
      <div class="lu-v3-result-kicker">いちばん近いモヤモヤ</div>
      <h3 class="lu-v3-result-title" id="lu-v3-result-title"></h3>
      <p class="lu-v3-result-summary" id="lu-v3-result-summary"></p>
      <div class="lu-v3-clues" id="lu-v3-clues"><b>こう答えたところから見えました</b><ul id="lu-v3-clue-list"></ul></div>
      <p class="lu-v3-app-label">今やるなら、このLEVEL UP</p>
      <div class="lu-v3-results" id="lu-v3-results"></div>
      <div class="lu-v3-result-actions"><button type="button" class="lu-v3-secondary" id="lu-v3-more">なんか違う → 2問追加</button><button type="button" class="lu-v3-secondary" id="lu-v3-restart">最初から</button></div>
      <p class="lu-v3-disclaimer">これは医療的な診断ではなく、LEVEL UPの使い分けのための分類です。</p>
    </section>
  </div>
</div>`;

const script = `
<script ${marker}>
(() => {
  const CATEGORIES=${JSON.stringify(categories)};
  const QUESTIONS=${JSON.stringify(questions)};
  const categoryKeys=Object.keys(CATEGORIES);
  const sheet=document.getElementById('lu-v3-sheet');
  const questionScreen=document.getElementById('lu-v3-question-screen');
  const resultScreen=document.getElementById('lu-v3-result-screen');
  const questionEl=document.getElementById('lu-v3-question');
  const stepEl=document.getElementById('lu-v3-step');
  const progressEl=document.getElementById('lu-v3-progress-bar');
  const backBtn=document.getElementById('lu-v3-back');
  const stopBtn=document.getElementById('lu-v3-stop');
  const moreBtn=document.getElementById('lu-v3-more');
  const cards=[...document.querySelectorAll('.card[data-game]')];
  const bySlug=new Map(cards.map(card=>[card.dataset.game,card]));
  let scores={};
  let history=[];
  let currentQuestion=null;
  let targetQuestions=7;

  const resetScores=()=>{scores=Object.fromEntries(categoryKeys.map(key=>[key,0]))};
  const open=v=>{sheet?.classList.toggle('is-open',v);sheet?.setAttribute('aria-hidden',String(!v));document.documentElement.style.overflow=v?'hidden':''};
  const show=screen=>{questionScreen.hidden=screen!=='question';resultScreen.hidden=screen!=='result'};
  const ranked=()=>categoryKeys.slice().sort((a,b)=>(scores[b]||0)-(scores[a]||0));
  const weight=(obj,key)=>Number(obj?.[key]||0);
  const apply=(question,answer,direction=1)=>{
    const bucket=answer==='yes'?question.yes:answer==='no'?question.no:null;
    if(!bucket)return;
    Object.entries(bucket).forEach(([key,value])=>{scores[key]=(scores[key]||0)+(Number(value)||0)*direction});
  };
  const questionValue=q=>{
    const top=ranked().slice(0,3);
    return top.reduce((sum,key,index)=>sum+Math.abs(weight(q.yes,key)-weight(q.no,key))*(3-index),0)
      + categoryKeys.reduce((sum,key)=>sum+Math.abs(weight(q.yes,key)-weight(q.no,key)),0)*0.08;
  };
  const nextQuestion=()=>{
    const seen=new Set(history.map(item=>item.id));
    if(!seen.has('people'))return QUESTIONS.find(q=>q.id==='people');
    if(!seen.has('past'))return QUESTIONS.find(q=>q.id==='past');
    return QUESTIONS.filter(q=>!seen.has(q.id)).sort((a,b)=>questionValue(b)-questionValue(a))[0]||null;
  };
  const shouldFinish=()=>{
    if(history.length<5)return false;
    const order=ranked();
    const gap=(scores[order[0]]||0)-(scores[order[1]]||0);
    return history.length>=targetQuestions || (targetQuestions===7 && gap>=6);
  };
  const renderQuestion=()=>{
    currentQuestion=nextQuestion();
    if(!currentQuestion || shouldFinish()){renderResult();return}
    show('question');
    const number=history.length+1;
    stepEl.textContent='QUESTION '+number+' / '+targetQuestions;
    progressEl.style.width=Math.min(100,Math.round((history.length/targetQuestions)*100))+'%';
    questionEl.textContent=currentQuestion.text;
    backBtn.disabled=history.length===0;
    stopBtn.disabled=history.length<3;
  };
  const answer=value=>{
    if(!currentQuestion)return;
    apply(currentQuestion,value,1);
    history.push({id:currentQuestion.id,answer:value});
    renderQuestion();
  };
  const undo=()=>{
    const last=history.pop();
    if(!last)return;
    const q=QUESTIONS.find(item=>item.id===last.id);
    if(q)apply(q,last.answer,-1);
    renderQuestion();
  };
  const gameMeta=slug=>{
    const card=bySlug.get(slug);
    if(!card)return null;
    return {
      slug,
      title:card.querySelector('h2')?.textContent?.trim()||slug,
      description:card.querySelector('p')?.textContent?.trim()||'',
      href:card.querySelector('.card-link')?.getAttribute('href')||('/apps/'+slug+'/')
    };
  };
  const availableGames=slugs=>{
    const out=[];
    (slugs||[]).forEach(slug=>{const game=gameMeta(slug);if(game&&!out.some(x=>x.slug===game.slug))out.push(game)});
    if(out.length<2){
      cards.forEach(card=>{
        if(out.length>=2)return;
        const slug=card.dataset.game;
        if(!out.some(x=>x.slug===slug)){const game=gameMeta(slug);if(game)out.push(game)}
      });
    }
    return out.slice(0,2);
  };
  const renderApp=(game,index,category)=>{
    const article=document.createElement('article');
    article.className='lu-v3-result';
    const role=document.createElement('div');
    role.className='lu-v3-role';
    role.textContent=index===0?'まずこれ':'次にこれ';
    const h=document.createElement('h4');
    h.textContent=game.title;
    const p=document.createElement('p');
    p.textContent=index===0?'今の引っかかりを直接動かすための1本。':'同じモヤモヤに戻りにくくするための次の1本。';
    const a=document.createElement('a');
    a.href=game.href+(game.href.includes('?')?'&':'?')+'ref=moyamoya-finder&utm_source=levelup&utm_medium=diagnosis&utm_campaign=moyamoya_finder&moyamoya='+encodeURIComponent(category);
    a.textContent='このLEVEL UPをやる →';
    article.append(role,h,p,a);
    return article;
  };
  const matchedClues=category=>{
    return history
      .filter(item=>item.answer==='yes')
      .map(item=>QUESTIONS.find(q=>q.id===item.id))
      .filter(Boolean)
      .filter(q=>weight(q.yes,category)>0)
      .sort((a,b)=>weight(b.yes,category)-weight(a.yes,category))
      .slice(0,3)
      .map(q=>q.evidence);
  };
  const renderResult=()=>{
    const order=ranked();
    const category=order[0]||'overload';
    const data=CATEGORIES[category]||CATEGORIES.overload;
    show('result');
    document.getElementById('lu-v3-result-title').textContent=data.title;
    document.getElementById('lu-v3-result-summary').textContent='今回の回答では、'+data.summary;
    const clues=matchedClues(category);
    const clueBox=document.getElementById('lu-v3-clues');
    const clueList=document.getElementById('lu-v3-clue-list');
    clueList.innerHTML='';
    if(clues.length){
      clues.forEach(text=>{const li=document.createElement('li');li.textContent=text;clueList.appendChild(li)});
      clueBox.hidden=false;
    }else{
      clueBox.hidden=true;
    }
    const out=document.getElementById('lu-v3-results');
    out.innerHTML='';
    availableGames(data.apps).forEach((game,index)=>out.appendChild(renderApp(game,index,category)));
    const remaining=QUESTIONS.length-history.length;
    moreBtn.hidden=remaining<1 || targetQuestions>=9;
    moreBtn.textContent=remaining>=2?'なんか違う → 2問追加':'なんか違う → 1問追加';
    progressEl.style.width='100%';
    try{
      localStorage.setItem('hitobito-levelup-last-moyamoya-finder',JSON.stringify({category,answers:history,apps:data.apps,at:new Date().toISOString()}));
    }catch{}
  };
  const start=()=>{
    resetScores();
    history=[];
    currentQuestion=null;
    targetQuestions=7;
    open(true);
    renderQuestion();
  };

  document.getElementById('lu-v3-start')?.addEventListener('click',start);
  document.getElementById('lu-v3-close')?.addEventListener('click',()=>open(false));
  sheet?.addEventListener('click',event=>{if(event.target===sheet)open(false)});
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>answer(button.dataset.answer)));
  backBtn?.addEventListener('click',undo);
  stopBtn?.addEventListener('click',()=>{if(history.length>=3)renderResult()});
  moreBtn?.addEventListener('click',()=>{
    targetQuestions=Math.min(9,Math.max(targetQuestions+2,history.length+1));
    show('question');
    renderQuestion();
  });
  document.getElementById('lu-v3-restart')?.addEventListener('click',start);
})();
</script>`;

let html=fs.readFileSync(homePath,'utf8');
if (!html.includes('data-game="')) throw new Error('LEVEL UP moyamoya finder requires app cards before injection.');

if (html.includes('id="levelup-state-diagnosis-v3-style"')) {
  html=html.replace(/<style id="levelup-state-diagnosis-v3-style">[\s\S]*?<\/style>/,style.trim());
} else {
  if(!html.includes('</head>')) throw new Error('LEVEL UP head missing.');
  html=html.replace('</head>',style+'\n</head>');
}

if (html.includes('id="levelup-state-diagnosis-v3"')) {
  html=html.replace(/<section class="lu-v3" id="levelup-state-diagnosis-v3">[\s\S]*?<\/section>\s*<div class="lu-v3-sheet" id="lu-v3-sheet"[\s\S]*?<\/div><\/div>/,markup.trim());
} else {
  const anchor='<section class="lu-v2" id="levelup-state-diagnosis-v2">';
  if(!html.includes(anchor)) throw new Error('LEVEL UP diagnosis v2 anchor missing.');
  html=html.replace(anchor,markup+'\n'+anchor);
}

const existingScript=new RegExp('<script '+marker+'>[\\s\\S]*?<\\/script>');
if (existingScript.test(html)) {
  html=html.replace(existingScript,script.trim());
} else {
  if(!html.includes('</body>')) throw new Error('LEVEL UP body missing.');
  html=html.replace('</body>',script+'\n</body>');
}

fs.writeFileSync(homePath,html);

const finalHome=fs.readFileSync(homePath,'utf8');
for (const required of [
  'levelup-state-diagnosis-v3',
  'モヤモヤの正体、当てます。',
  'モヤモヤを特定する',
  'どちらとも言えない',
  '今やるなら、このLEVEL UP',
  'なんか違う → 2問追加',
  'data-levelup-state-diagnosis-v3',
  'approval-off',
  'nukeru',
  'one-thing'
]) {
  if(!finalHome.includes(required)) throw new Error(`LEVEL UP moyamoya finder missing: ${required}`);
}
console.log('[Firebase] LEVEL UP moyamoya finder injected with adaptive questions and app recommendations.');
