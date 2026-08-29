(() => {
  const app = document.getElementById('app');
  const resetBtn = document.getElementById('resetBtn');
  const AXES = [
    { key:'warm', label:'親しみやすさ' },
    { key:'drive', label:'押しの強さ' },
    { key:'steady', label:'安定感' },
    { key:'open', label:'本音の見えやすさ' }
  ];
  const SELF_Q = [
    { q:'意見が割れたとき、あなたはどっち？', a:['まず相手の話を最後まで聞く','自分の結論を先に出す'], v:[{warm:2,drive:-1},{drive:2,warm:-1}] },
    { q:'初対面の集まりでは？', a:['自分から話しかける','様子を見てから入る'], v:[{warm:2,open:1},{steady:1,open:-1}] },
    { q:'頼まれごとが重なったら？', a:['できる範囲をすぐ伝える','なんとか全部引き受ける'], v:[{drive:1,steady:2},{warm:1,steady:-2}] },
    { q:'失敗した直後のあなたは？', a:['原因を切り分けて次へ行く','しばらく頭の中で反省する'], v:[{steady:2,drive:1},{steady:-2,open:1}] },
    { q:'仲のいい人に悩みを話す？', a:['かなり話す','解決してから話す'], v:[{open:2,warm:1},{open:-2,steady:1}] },
    { q:'誰かが遅刻してきたら？', a:['理由を聞く前にまず受け入れる','次からどうするかをすぐ決める'], v:[{warm:2},{drive:2,steady:1}] },
    { q:'「それ違うと思う」と感じたら？', a:['角が立っても言う','関係性を見て言い方を変える'], v:[{drive:2,open:1},{warm:2,steady:1}] },
    { q:'疲れている日に誘われたら？', a:['今日は無理、と断る','相手が楽しみにしていたら行く'], v:[{drive:1,steady:2},{warm:2,steady:-1}] }
  ];
  const PEER_Q = [
    { q:'この人に相談すると、最初に返ってくるのは？', a:['「それは大変だったね」','「じゃあこうしよう」'], v:[{warm:2,open:1},{drive:2,steady:1}] },
    { q:'初対面の人からはどう見られそう？', a:['話しかけやすい','ちょっと近寄りがたい'], v:[{warm:2,open:1},{drive:1,open:-1}] },
    { q:'予定外のトラブルが起きたときは？', a:['かなり慌てる','意外と落ち着いている'], v:[{steady:-2,open:1},{steady:2}] },
    { q:'本音はわかりやすい？', a:['顔や言葉に出る','仲良くても読めないときがある'], v:[{open:2},{open:-2,steady:1}] },
    { q:'お願いを断るのは？', a:['必要ならちゃんと断る','結局引き受けがち'], v:[{drive:2,steady:1},{warm:1,drive:-1}] },
    { q:'人がミスしたときは？', a:['まず事情を聞く','改善点をすぐ言う'], v:[{warm:2},{drive:2}] },
    { q:'この人が場にいると？', a:['空気がやわらかくなる','話が前に進む'], v:[{warm:2},{drive:2,steady:1}] },
    { q:'弱いところを見せるタイプ？', a:['わりと見せる','かなり見せない'], v:[{open:2,warm:1},{open:-2,steady:1}] }
  ];
  let state = { mode:'self', i:0, answers:[], token:null, selfScores:null };
  const params = new URLSearchParams(location.search);
  function b64e(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function b64d(s){ try { const pad='='.repeat((4-s.length%4)%4); return JSON.parse(decodeURIComponent(escape(atob((s+pad).replace(/-/g,'+').replace(/_/g,'/'))))); } catch(e){ return null; } }
  function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,n)); }
  function uid(){ return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-5); }
  function calc(answers, qs){ const raw={warm:0,drive:0,steady:0,open:0}; answers.forEach((ans,i)=>{ const v=qs[i].v[ans]; Object.keys(v).forEach(k=>raw[k]+=v[k]); }); const scores={}; Object.keys(raw).forEach(k=>scores[k]=clamp(Math.round(50+raw[k]*7))); return scores; }
  function archetype(s){ const sorted=AXES.map(a=>({k:a.key,l:a.label,v:s[a.key]})).sort((a,b)=>b.v-a.v); const hi=sorted[0], lo=sorted[3]; const names={warm:'人の温度を上げる人',drive:'前に進める人',steady:'落ち着きを持ち込む人',open:'本音が伝わる人'}; return {title:names[hi.k], text:`いちばん強く出ているのは「${hi.l}」。一方で「${lo.l}」は控えめ。強みと見え方のクセが、同時に出るタイプです。`}; }
  function gap(a,b){ return Math.round(AXES.reduce((sum,x)=>sum+Math.abs(a[x.key]-b[x.key]),0)/4); }
  function avg(list){ const out={warm:0,drive:0,steady:0,open:0}; if(!list.length)return out; AXES.forEach(a=>out[a.key]=Math.round(list.reduce((s,r)=>s+r.scores[a.key],0)/list.length)); return out; }
  function savedKey(id){return `how-seen-responses:${id}`}
  function getResponses(id){ try{return JSON.parse(localStorage.getItem(savedKey(id))||'[]')}catch(e){return[]} }
  function addResponse(id, scores){ const list=getResponses(id); const sig=JSON.stringify(scores); if(!list.some(x=>JSON.stringify(x.scores)===sig)){list.push({scores,at:Date.now()});localStorage.setItem(savedKey(id),JSON.stringify(list));} return list; }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function bars(scores){return AXES.map(a=>`<div class="bar-row"><b>${a.label}</b><div class="bar-track"><div class="bar-fill" style="width:${scores[a.key]}%"></div></div><span>${scores[a.key]}</span></div>`).join('')}
  function compareBars(self,peer){return AXES.map(a=>`<div class="compare-row"><strong>${a.label}</strong><div class="duo"><div class="duo-line"><span>自分</span><div class="duo-track"><div class="duo-fill" style="width:${self[a.key]}%"></div></div><b>${self[a.key]}</b></div><div class="duo-line peer"><span>他人</span><div class="duo-track"><div class="duo-fill" style="width:${peer[a.key]}%"></div></div><b>${peer[a.key]}</b></div></div></div>`).join('')}
  function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
  async function share(title,text,url){ if(navigator.share){try{await navigator.share({title,text,url});return}catch(e){if(e.name==='AbortError')return}} try{await navigator.clipboard.writeText(`${text}\n${url}`);toast('リンクをコピーしました')}catch(e){prompt('このリンクをコピーしてください',url)} }
  function base(){ return `${location.origin}${location.pathname}`; }
  function renderHome(){ resetBtn.hidden=true; app.innerHTML=`<section class="hero"><div class="eyebrow">SELF × OTHERS</div><h1>他人から<br>どう見えてる？</h1><p class="lead">自分が思う自分と、他人から見える自分。<br><strong>いちばんズレているのはどこ？</strong></p><div class="stack"><button class="primary" id="start">8つの二択で診断する</button><p class="micro">約60秒。入力なし。診断後に友達へ送ると、本当の「見え方のズレ」を測れます。</p></div></section>`; document.getElementById('start').onclick=()=>{state={mode:'self',i:0,answers:[]};renderQuestion()}; }
  function renderQuestion(){ resetBtn.hidden=false; const qs=state.mode==='peer'?PEER_Q:SELF_Q; const item=qs[state.i]; app.innerHTML=`<div class="progress"><i style="width:${((state.i)/qs.length)*100}%"></i></div><section class="question-card"><div class="q-num">${state.mode==='peer'?'FRIEND VIEW':'YOUR VIEW'} · ${state.i+1}/${qs.length}</div><h2 class="question">${escapeHtml(item.q)}</h2><div class="choices">${item.a.map((x,n)=>`<button class="choice" data-a="${n}">${escapeHtml(x)}</button>`).join('')}</div></section>`; app.querySelectorAll('.choice').forEach(btn=>btn.onclick=()=>{state.answers.push(Number(btn.dataset.a));state.i++; if(state.i<qs.length){renderQuestion()}else{const s=calc(state.answers,qs); state.mode==='peer'?renderPeerResult(s):renderSelfResult(s)}}); }
  function renderSelfResult(scores){ const id=uid(); state.selfScores=scores; state.token={id,self:scores}; localStorage.setItem('how-seen-last',JSON.stringify(state.token)); renderDashboard(state.token); }
  function renderDashboard(token, imported=false){ resetBtn.hidden=false; const s=token.self; const arc=archetype(s); const responses=getResponses(token.id); const peer=responses.length?avg(responses):null; const invite=`${base()}?ask=${encodeURIComponent(b64e(token))}`; let peerHtml=''; if(peer){const g=gap(s,peer); peerHtml=`<section class="gap-card"><div class="friend-badge">友達 ${responses.length}人の平均</div><h2 class="section-title">自分と他人のズレ</h2><div class="gap-number">${g}<small> / 100</small></div><div class="gap-label">数字が大きいほど「自分が思う自分」と「人から見える自分」が違います。</div><div class="compare">${compareBars(s,peer)}</div><div class="callout">${gapMessage(s,peer,g)}</div></section>`} else peerHtml=`<section class="plain-card"><h2 class="section-title" style="margin-top:0">ここからが本番。</h2><p class="lead" style="font-size:15px">今出たのは「自分が思う自分」。友達に見てもらうと、初めて<strong>本当のズレ</strong>が出ます。</p><div class="notice">友達は名前入力なしで8問に答えます。回答はサーバー保存されず、返却リンクをあなたが開いたときだけこの端末に追加されます。</div></section>`; app.innerHTML=`${imported?'<div class="notice">友達の回答をこの端末に追加しました。</div><div class="spacer"></div>':''}<section class="result-card"><div class="result-tag">あなたが思う、あなた</div><h1 class="result-title">${arc.title}</h1><p class="result-sub">${arc.text}</p><div class="bars">${bars(s)}</div></section>${peerHtml}<section class="share-box"><button class="primary" id="askFriend">友達に「どう見える？」と聞く</button><button class="secondary" id="shareResult">今の結果をシェア</button></section><h2 class="section-title">共有するときの一言</h2><div class="plain-card" style="margin-top:0"><strong>「これ、私に当たってる？ 8問だけ答えてみて」</strong><p class="micro">“診断を見て”ではなく“あなたの目で判定して”なので、相手も参加しやすい設計です。</p></div>`; document.getElementById('askFriend').onclick=()=>share('他人からどう見えてる？診断','私って実際どう見えてる？ 8問だけで終わるので判定して。',invite); document.getElementById('shareResult').onclick=()=>share('他人からどう見えてる？診断',`私の自己イメージは「${arc.title}」だった。あなたはどう思う？`,invite); }
  function gapMessage(self,peer,g){ const diffs=AXES.map(a=>({label:a.label,d:peer[a.key]-self[a.key]})).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)); const d=diffs[0]; if(Math.abs(d.d)<8)return 'かなり自己認識が一致しています。自分の見え方を、かなり正確につかめているタイプです。'; return d.d>0?`最大の発見は「${d.label}」。自分で思っているより、周りには強く見えています。`:`最大の発見は「${d.label}」。自分で思っているほど、周りには強く見えていません。`; }
  function renderPeerIntro(token){ resetBtn.hidden=true; state={mode:'peer',i:0,answers:[],token,selfScores:token.self}; app.innerHTML=`<section class="hero"><div class="friend-badge">友達から判定依頼が届いています</div><h1>この人、<br>実際どう見える？</h1><p class="lead">本人の自己評価は見せません。あなたの印象だけで8問答えてください。</p><div class="stack"><button class="primary" id="peerStart">匿名で8問に答える</button><p class="micro">名前・メール・文章入力なし。約60秒。</p></div></section>`; document.getElementById('peerStart').onclick=renderQuestion; }
  function renderPeerResult(scores){ const self=state.selfScores; const g=gap(self,scores); const returnPayload={id:state.token.id,self,peer:scores}; const ret=`${base()}?back=${encodeURIComponent(b64e(returnPayload))}`; const arc=archetype(scores); app.innerHTML=`<section class="result-card"><div class="result-tag">あなたから見た、この人</div><h1 class="result-title">${arc.title}</h1><p class="result-sub">あなたの回答だけで出した見え方です。</p><div class="bars">${bars(scores)}</div></section><section class="gap-card"><h2 class="section-title" style="margin-top:0">本人の自己像とのズレ</h2><div class="gap-number">${g}<small> / 100</small></div><div class="gap-label">本人が自分をどう見ているかとの差です。</div><div class="compare">${compareBars(self,scores)}</div></section><div class="share-box"><button class="primary" id="sendBack">本人に結果を返す</button><button class="secondary" id="meToo">私も診断する</button></div>`; document.getElementById('sendBack').onclick=()=>share('見え方診断の結果','答えたよ。結果を追加して見てみて。',ret); document.getElementById('meToo').onclick=()=>{history.replaceState({},'',base());renderHome()}; }
  function boot(){ resetBtn.onclick=()=>{history.replaceState({},'',base());renderHome()}; const ask=b64d(params.get('ask')||''); const back=b64d(params.get('back')||''); if(back&&back.id&&back.self&&back.peer){ const token={id:back.id,self:back.self}; addResponse(back.id,back.peer); localStorage.setItem('how-seen-last',JSON.stringify(token)); history.replaceState({},'',base()); renderDashboard(token,true); return; } if(ask&&ask.id&&ask.self){renderPeerIntro(ask);return} const last=(()=>{try{return JSON.parse(localStorage.getItem('how-seen-last'))}catch(e){return null}})(); if(last&&last.id&&last.self){renderDashboard(last);return} renderHome(); }
  boot();
})();
