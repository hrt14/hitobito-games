(()=>{
  const app=document.getElementById('app');
  const reset=document.getElementById('resetBtn');
  const clamp=n=>Math.max(10,Math.min(90,Math.round(n)));
  const AXES={
    privacy:{left:'人前',right:'1対1',name:'場所'},
    effort:{left:'結果',right:'努力・工夫',name:'どこを見る？'},
    detail:{left:'短い一言',right:'具体的',name:'言葉の解像度'},
    action:{left:'言葉',right:'行動・信頼',name:'褒め方の形'},
    timing:{left:'あとで',right:'その場で',name:'タイミング'},
    calm:{left:'盛大に',right:'静かに',name:'温度'},
    thanks:{left:'称賛',right:'感謝・役立ち',name:'刺さる意味'}
  };
  const Q=[
    {scene:'仕事・学校',q:'大きなことをやり切った。いちばん嬉しいのは？',a:'みんなの前で「今回すごかった！」',b:'帰り際に1対1で「本当に良かった」と言われる',A:{privacy:-24,calm:-10},B:{privacy:24,calm:12}},
    {scene:'成果が出たとき',q:'褒められるなら、どっちを見てほしい？',a:'「結果を出したのがすごい」',b:'「あの工夫と粘りが良かった」',A:{effort:-26,detail:-4},B:{effort:26,detail:12}},
    {scene:'日常',q:'嬉しいのはどっち？',a:'「さすが！」「すごい！」と短く言われる',b:'「ここが良かった」と具体的に言われる',A:{detail:-27,calm:-5},B:{detail:27,calm:7}},
    {scene:'信頼されるとき',q:'「評価されてる」と感じるのは？',a:'ちゃんと言葉で褒めてもらう',b:'次の大事なことを任せてもらう',A:{action:-28},B:{action:28,thanks:5}},
    {scene:'タイミング',q:'良かったことを伝えられるなら？',a:'少し後でも、落ち着いて伝えてほしい',b:'良かった瞬間にすぐ反応してほしい',A:{timing:-25,calm:10},B:{timing:25}},
    {scene:'テンション',q:'同じ「すごい」でも、どっちが好き？',a:'テンション高く、盛大に喜んでくれる',b:'落ち着いて、本気でそう思っている感じ',A:{calm:-28,privacy:-5},B:{calm:28,detail:6}},
    {scene:'パートナー・仲間',q:'どっちの言葉の方が残る？',a:'「本当に能力あるよね」',b:'「いてくれて助かった。ありがとう」',A:{thanks:-27},B:{thanks:27,action:7}},
    {scene:'細かい日常',q:'褒める回数は、どっちがいい？',a:'小さなことでも、その都度反応してほしい',b:'毎回じゃなくていい。本当に思った時だけでいい',A:{timing:15,detail:-7,calm:-5},B:{timing:-8,detail:10,calm:12}},
    {scene:'比較',q:'こんな褒められ方なら、どっちが嬉しい？',a:'「みんなの中でも一番よかった」',b:'「前よりここがすごく良くなった」',A:{privacy:-8,effort:-14,thanks:-5},B:{effort:18,detail:13,privacy:5}},
    {scene:'最高の締め',q:'最後の一言。どっちが刺さる？',a:'「さすが。次も期待してる！」',b:'「あれ、ちゃんと見てた。任せてよかった」',A:{calm:-10,detail:-7,thanks:-5},B:{calm:14,detail:18,action:15,thanks:12}}
  ];
  let i=0,answers=[];
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1700);}
  function enc(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function dec(x){try{const p='='.repeat((4-x.length%4)%4);return JSON.parse(decodeURIComponent(escape(atob((x+p).replace(/-/g,'+').replace(/_/g,'/')))));}catch(e){return null;}}
  function calc(){
    const s={privacy:50,effort:50,detail:50,action:50,timing:50,calm:50,thanks:50};
    answers.forEach((choice,n)=>{const add=choice===0?Q[n].A:Q[n].B;Object.entries(add).forEach(([k,v])=>{if(k in s)s[k]+=v;});});
    Object.keys(s).forEach(k=>s[k]=clamp(s[k]));
    return s;
  }
  function strongest(s){return Object.entries(s).map(([k,v])=>({k,v,d:Math.abs(v-50)})).sort((a,b)=>b.d-a.d);}
  function makeResult(s){
    const st=strongest(s);
    let title='ちゃんと見て、伝えて型';
    let one='大げささより「あなたのことを見ていた」が伝わる褒め方が効きます。';
    if(s.action>=67){title='言葉より、信頼で褒めて型';one='褒め言葉だけより「任せる・頼る・覚えている」という行動が評価として伝わります。';}
    if(s.thanks>=68&&s.detail>=58){title='「ありがとう」が刺さる型';one='能力を持ち上げるより、何が助かったかまで伝わると強く残ります。';}
    if(s.privacy>=66&&s.detail>=62){title='1対1で、具体的に型';one='人前で盛り上げるより、二人の場で「どこが良かったか」を具体的に言われると刺さります。';}
    if(s.privacy<=36&&s.calm<=40){title='盛大に称えて型';one='良かったことは隠さず、その場で、周りにも分かるくらい喜んでもらうと効きます。';}
    if(s.effort>=68&&s.detail>=60){title='努力を見抜いて型';one='結果だけでなく、そこまでの工夫・粘り・変化を言葉にしてもらうと「見てくれてた」が伝わります。';}
    if(s.detail<=35&&s.timing>=60){title='一言リアクション型';one='長い講評より、その瞬間の「いいね」「助かった」が一番気持ちよく入ります。';}
    const place=s.privacy>=55?'できれば1対1で':'人前でもOK。むしろ隠さなくていい';
    const target=s.effort>=55?'結果だけでなく、努力・工夫・変化を拾う':'まず結果や達成をはっきり認める';
    const wording=s.detail>=55?'「どこが良かったか」まで具体的に':'長く説明せず、短くストレートに';
    const form=s.action>=55?'言葉に加えて、任せる・頼る・覚えておく':'まずは言葉でちゃんと伝える';
    const timing=s.timing>=55?'良いと思ったその場で':'少し後でも、落ち着いて伝える';
    const tone=s.calm>=55?'盛りすぎず、落ち着いて本気で':'テンション高めに、喜びを見せて';
    const meaning=s.thanks>=55?'「何が助かったか」「どう役立ったか」も伝える':'「すごい」「能力がある」と称賛する';
    const recipe=[place,target,wording,form].slice(0,3);
    const work=s.thanks>=55
      ?`「${s.detail>=55?'あの進め方、途中の整理がすごく分かりやすかった。':''}本当に助かった。${s.action>=55?'次もここは任せたい。':''}」`
      :`「${s.detail>=55?'あの判断、特に最後のまとめ方が良かった。':'今回かなり良かった。'}${s.action>=55?'次も任せたい。':''}」`;
    const partner=s.thanks>=55
      ?`「${s.detail>=55?'今日あれを先にやってくれたの、ちゃんと気づいてた。':''}すごく助かった。ありがとう。」`
      :`「${s.detail>=55?'さっきの対応、あの言い方すごく良かった。':'今日ほんと良かった。'}${s.calm<50?'めちゃくちゃいい。':''}」`;
    let dont=[];
    if(s.privacy>=63)dont.push('人前で急に持ち上げすぎる');
    if(s.detail>=63)dont.push('「すごい」「さすが」だけで終える');
    if(s.effort>=63)dont.push('結果だけ見て、途中の工夫を無視する');
    if(s.action>=63)dont.push('言葉では褒めるのに、任せない・信頼しない');
    if(s.thanks>=63)dont.push('能力だけを評価して「何が助かったか」を言わない');
    if(s.calm>=63)dont.push('テンションを盛りすぎて社交辞令っぽくする');
    if(!dont.length)dont=['褒め方を作り込みすぎて、不自然にする'];
    return{title,one,s,recipe,work,partner,dont:dont.slice(0,3),tips:{timing,tone,meaning},top:st.slice(0,3).map(x=>x.k)};
  }
  async function share(r,url){
    const text=`私の「褒め方」取説は『${r.title}』でした。褒めるとき、これ見て。`;
    if(navigator.share){try{await navigator.share({title:'私の褒め方 取説',text,url});return;}catch(e){if(e.name==='AbortError')return;}}
    try{await navigator.clipboard.writeText(text+'\n'+url);toast('共有リンクをコピーしました');}catch(e){prompt('このリンクをコピーしてください',url);}
  }
  function home(){
    reset.hidden=true;
    app.innerHTML=`<section><div class="eyebrow">PRAISE MANUAL</div><h1>私の褒め方<br>取説</h1><p class="lead">褒められるなら、<strong>人前？ 1対1？ 結果？ 努力？ 言葉？ 行動？</strong><br>10問で「私に刺さる褒め方」を相手に渡せる取説にします。</p><div class="hero-grid"><div class="mini"><b>場所</b><span>人前 / 1対1</span></div><div class="mini"><b>中身</b><span>結果 / 努力・工夫</span></div><div class="mini"><b>形</b><span>言葉 / 行動・信頼</span></div></div><button class="primary" id="start" type="button">10問で作る</button><p class="micro">約90秒・入力なし。完成した取説はパートナー、上司、部下、友達へそのまま送れます。</p></section>`;
    document.getElementById('start').onclick=()=>{i=0;answers=[];question();};
  }
  function question(){
    reset.hidden=false;
    const q=Q[i];
    app.innerHTML=`<div class="progress-wrap"><div class="progress-meta"><span>PRAISE MANUAL</span><span>${i+1} / ${Q.length}</span></div><div class="progress"><i style="width:${((i+1)/Q.length)*100}%"></i></div></div><section class="card"><div class="qnum">QUESTION ${String(i+1).padStart(2,'0')}</div><div class="scene">${esc(q.scene)}</div><h2 class="question">${esc(q.q)}</h2><div class="choices"><button class="choice" data-a="0" type="button">${esc(q.a)}</button><button class="choice" data-a="1" type="button">${esc(q.b)}</button></div></section>`;
    app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{answers.push(+b.dataset.a);i++;i<Q.length?question():result(makeResult(calc()),false);});
  }
  function axisHtml(k,v){
    const a=AXES[k],right=v>=50,chosen=right?a.right:a.left,strength=Math.abs(v-50)*2;
    return `<div class="axis"><div class="axis-top"><span class="axis-name">${esc(a.name)}</span><span class="axis-value">${esc(chosen)} ${Math.round(50+strength/2)}%</span></div><div class="bar"><i style="width:${v}%"></i></div><div class="bar-labels"><span>${esc(a.left)}</span><span>${esc(a.right)}</span></div></div>`;
  }
  function result(r,shared){
    reset.hidden=false;
    if(!r||!r.s)return home();
    const safeScores={};Object.keys(AXES).forEach(k=>safeScores[k]=clamp(Number(r.s[k])||50));r.s=safeScores;
    const payload=enc(r);const url=`${location.origin}${location.pathname}?r=${encodeURIComponent(payload)}`;
    const axes=['privacy','effort','detail','action','timing','calm','thanks'];
    const recipe=Array.isArray(r.recipe)?r.recipe:[];const dont=Array.isArray(r.dont)?r.dont:[];
    app.innerHTML=`${shared?'<span class="badge">共有された「褒め方」取説</span>':''}<section class="result-head"><div class="result-kicker">YOUR PRAISE MANUAL</div><h2 class="result-title">${esc(r.title)}</h2><p class="result-sub">${esc(r.one)}</p></section><section class="manual"><small>${shared?'HOW TO PRAISE THIS PERSON':'MY PRAISE MANUAL'}</small><h2>${shared?'この人を褒めるなら':'私に刺さる褒め方'}</h2><p class="one-line">${esc(r.one)}</p><div class="axis-list">${axes.map(k=>axisHtml(k,r.s[k])).join('')}</div><div class="recipe"><div class="recipe-label">3-STEP RECIPE</div><strong>この順番なら、かなり伝わりやすい。</strong><ol>${recipe.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div><p class="score-note">％は10問への回答から算出した「好みの傾き」です。人との優劣や一般人口での順位を示すものではありません。</p></section><section class="section"><h3>そのまま使える褒め方</h3><div class="examples"><div class="example"><b>仕事で</b><p>${esc(r.work)}</p></div><div class="example"><b>パートナー・友達に</b><p>${esc(r.partner)}</p></div><div class="example dont"><b>逆に、これは刺さりにくい</b><p>${dont.map(x=>'・'+esc(x)).join('<br>')}</p></div></div></section><section class="section"><h3>細かい取扱メモ</h3><div class="examples"><div class="example"><b>タイミング</b><p>${esc(r.tips?.timing||'自然なタイミングで')}</p></div><div class="example"><b>温度</b><p>${esc(r.tips?.tone||'本気で伝える')}</p></div><div class="example"><b>褒める意味</b><p>${esc(r.tips?.meaning||'良かった点を伝える')}</p></div></div></section>${shared?`<section class="section"><h3>これを送ってきた人へ</h3><p class="share-note">全部を完璧に守る必要はありません。次に「よかった」と思ったとき、この取説の1つだけ使えば十分です。</p></section><div class="share"><button class="primary" id="mine" type="button">自分の「褒め方」取説も作る</button></div>`:`<section class="section"><h3>これ、相手に渡してOK。</h3><p class="share-note">「どう褒めたらいいか迷ったら、これ見て。」で送れるようにしています。</p><p class="hint">共有リンクには結果だけを含めます。10問の回答内容そのものは相手に表示しません。</p></section><div class="share"><button class="primary" id="send" type="button">この取説を送る</button><button class="secondary" id="again" type="button">もう一度やる</button></div>`}`;
    if(shared){document.getElementById('mine').onclick=()=>{history.replaceState({},'',location.pathname);home();};}
    else{document.getElementById('send').onclick=()=>share(r,url);document.getElementById('again').onclick=()=>{history.replaceState({},'',location.pathname);home();};}
  }
  reset.onclick=()=>{history.replaceState({},'',location.pathname);home();};
  const raw=new URLSearchParams(location.search).get('r');const shared=raw&&dec(raw);
  shared&&shared.s?result(shared,true):home();
})();
