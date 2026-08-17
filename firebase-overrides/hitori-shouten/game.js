(() => {
  const $ = (id) => document.getElementById(id);
  const yen = (n) => '¥' + Math.max(0, Math.round(n)).toLocaleString('ja-JP');
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const vibrate = (ms=15) => { try { navigator.vibrate?.(ms); } catch {} };

  const baseState = () => ({
    day:1,cash:100000,totalRevenue:0,customers:0,leads:0,insight:4,fit:12,system:0,price:30000,
    hours:8,opsHours:0,lp:false,used:new Set(),dailyRevenue:0,
    history:{customer:0,sales:0,build:0,scale:0,system:0,trap:0,ads:0},
    messages:[], runSeed:Math.floor(Math.random()*999999)
  });
  let s = baseState();

  const sale = (count) => {
    count = Math.max(0, Math.floor(count));
    if (!count) return 0;
    const revenue = count * s.price;
    s.customers += count; s.totalRevenue += revenue; s.cash += revenue; s.dailyRevenue += revenue;
    s.leads = Math.max(0, s.leads - count);
    s.history.sales += 1;
    return revenue;
  };
  const feedback = (headline, body, tone='good') => {
    const box=$('feedback'); box.className='feedback '+tone;
    box.innerHTML='<small>いま起きたこと</small><b>'+headline+'</b><p>'+body+'</p>';
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  };
  const actions = {
    interview:{title:'見込み客3人に聞く',tag:'CUSTOMER',hours:2,desc:'困りごとと「今お金を払っている方法」を聞く。',run(){
      s.insight+=10;s.fit+=6;s.leads+=2;s.history.customer++;return ['欲しいものが少し見えた','「機能」より、解決したい場面が具体的になった。','good'];
    }},
    direct:{title:'未完成でも1人に売る',tag:'SELL',hours:2,desc:'説明して、その場で買うか聞く。',run(){
      s.history.customer++;
      if(s.fit<24){s.fit+=8;s.insight+=6;s.leads+=2;return ['売れなかった。でも理由が取れた','断られた理由から商品適合 +8%。これは前進。','warn'];}
      const n=s.fit>=68?2:1;const r=sale(n);s.fit+=3;s.insight+=2;
      return [n+'人が買った',yen(r)+'の売上。売って初めて分かる反応も増えた。','good'];
    }},
    follow:{title:'昨日の見込み客に再連絡',tag:'SELL',hours:1,desc:'迷っている人へ、短く確認する。',run(){
      if(s.leads<=0){s.history.trap++;return ['連絡する相手がいない','先に見込み客を作る必要がある。','warn'];}
      if(s.fit<22){s.fit+=5;s.insight+=4;return ['まだ売れない','ただし「何が足りないか」は明確になった。','warn'];}
      const n=Math.min(s.leads,s.fit>65?2:1);const r=sale(n);return ['追客が売上になった',yen(r)+'。新規集客より近い人を先に。','good'];
    }},
    prototype:{title:'最小版を作る',tag:'PRODUCT',hours:4,desc:'売るために必要な部分だけ作る。',run(){
      s.history.build++;const gain=s.insight>=18?12:4;s.fit+=gain;return ['商品が前進した','顧客理解があるほど、作る時間が商品適合につながる。 +'+gain+'%','good'];
    }},
    polish:{title:'商品を完璧に磨く',tag:'PRODUCT',hours:5,desc:'細部まで作り込み、完成度を上げる。',run(){
      s.history.build++;s.history.trap++;const gain=s.insight>=38?5:1;s.fit+=gain;return ['5時間かけて、見た目は良くなった','商品適合は +'+gain+'%。顧客の反応なしでは伸びにくい。','warn'];
    }},
    logo:{title:'ロゴを作り込む',tag:'BRAND',hours:3,desc:'色・書体・細部を整える。',run(){
      s.cash-=5000;s.history.trap++;return ['ロゴは良くなった','3時間と5,000円を使った。売上・顧客理解は変化なし。','bad'];
    }},
    name:{title:'会社名を考え直す',tag:'BRAND',hours:3,desc:'もっと良い名前がないか練り直す。',run(){
      s.history.trap++;return ['いい名前を思いついた','でも顧客も売上も増えていない。','bad'];
    }},
    research:{title:'競合を徹底調査する',tag:'RESEARCH',hours:3,desc:'サイトやSNSを見続けて比較する。',run(){
      s.insight+=2;s.history.trap++;return ['競合には詳しくなった','顧客理解 +2。直接聞くより時間がかかった。','warn'];
    }},
    social:{title:'SNSに3投稿する',tag:'ATTRACT',hours:2,desc:'役立つ投稿を作って発信する。',run(){
      s.leads+=3;s.history.scale++;return ['見込み客が少し増えた','反応した3人が見込み客になった。','good'];
    }},
    lp:{title:'販売ページを作る',tag:'SELLING SYSTEM',hours:4,desc:'誰向け・悩み・提案・価格を1ページに。',run(){
      s.lp=true;s.history.build++;if(s.fit>=35){s.fit+=3;return ['24時間売れる場所ができた','商品適合があるので、集客を受け止められる。','good'];}
      return ['販売ページは完成','ただし、まだ「何が売れるか」の確信は弱い。','warn'];
    }},
    price:{title:'価格を20%上げて試す',tag:'PRICE',hours:1,desc:'価値が伝わる相手へ新価格を提示する。',run(){
      const old=s.price;s.price=Math.round(s.price*1.2/1000)*1000;s.history.sales++;
      return ['単価を上げた',yen(old)+' → '+yen(s.price)+'。同じ顧客数でも売上を伸ばせる。','good'];
    }},
    referral:{title:'購入者に紹介を頼む',tag:'REFERRAL',hours:1,desc:'同じ悩みの人を1人だけ紹介してもらう。',run(){
      if(s.customers<2){s.history.trap++;return ['まだ頼める購入者が少ない','まず最初の顧客を作ろう。','warn'];}
      const n=Math.min(7,Math.max(2,Math.floor(s.customers*.7)));s.leads+=n;s.history.sales++;return ['近い見込み客が増えた',n+'人の紹介。既存顧客が次の顧客を連れてきた。','good'];
    }},
    narrow:{title:'一番反応する客に絞る',tag:'FOCUS',hours:2,desc:'全員向けをやめ、反応の強い層に寄せる。',run(){
      s.fit+=10;s.insight+=6;s.history.customer++;return ['「誰に売るか」が鋭くなった','対象を狭めたら商品適合 +10%。','good'];
    }},
    ad:{title:'広告に2万円入れる',tag:'SCALE',hours:2,desc:'販売ページへ一気に人を集める。',run(){
      s.cash-=20000;s.history.scale++;s.history.ads++;
      if(!s.lp||s.fit<45){s.leads+=4;return ['人は来た。でも売れない','広告は不確実さを拡大した。2万円を消化。','bad'];}
      const n=1+Math.floor((s.fit-45)/18);const r=sale(n);return ['広告が勝ち筋を増幅した',yen(r)+'の売上。売れる型があると集客が効く。','good'];
    }},
    partnership:{title:'提携先1社に営業する',tag:'CHANNEL',hours:3,desc:'顧客を持つ相手に一緒に売る提案。',run(){
      const n=s.fit>=45?8:3;s.leads+=n;s.history.scale++;return ['新しい販売経路ができた',n+'人の見込み客につながった。','good'];
    }},
    newidea:{title:'新しい事業案を始める',tag:'NEW IDEA',hours:4,desc:'今の事業とは別の可能性を試す。',run(){
      s.history.trap++;return ['新しい案はワクワクする','4時間使ったが、今の勝ち筋は1ミリも太くなっていない。','bad'];
    }},
    outsource:{title:'定型作業を外注する',tag:'SYSTEM',hours:2,desc:'繰り返し作業を手順化して任せる。',run(){
      s.cash-=25000;s.system+=22;s.history.system++;return ['自分の時間が戻る仕組みを作った','2.5万円で仕組み化 +22%。固定業務が減る。','good'];
    }},
    automate:{title:'問い合わせを自動化',tag:'SYSTEM',hours:3,desc:'よくある質問と案内を自動化する。',run(){
      s.cash-=15000;s.system+=18;s.history.system++;return ['問い合わせ対応を減らした','仕組み化 +18%。顧客が増えても詰まりにくい。','good'];
    }},
    template:{title:'納品をテンプレ化する',tag:'SYSTEM',hours:2,desc:'毎回ゼロから作る部分をなくす。',run(){
      s.system+=14;s.history.system++;return ['1件ごとの作業が軽くなった','仕組み化 +14%。売上と時間を切り離し始めた。','good'];
    }},
    upsell:{title:'既存客に上位版を提案',tag:'SELL',hours:2,desc:'新規集客せず、すでに価値を感じた人へ提案。',run(){
      if(s.customers<2)return ['提案する既存客が少ない','まず購入者を増やそう。','warn'];
      const n=Math.max(1,Math.floor(s.customers*.25));const r=Math.round(n*s.price*.55);s.totalRevenue+=r;s.cash+=r;s.dailyRevenue+=r;s.history.sales++;
      return ['既存客から追加売上',yen(r)+'。新規を増やさず売上が増えた。','good'];
    }}
  };

  const stagePool = () => {
    if(s.day<=4) return ['interview','direct','prototype','polish','logo','name','research','social'];
    if(s.day<=8) return ['interview','direct','follow','prototype','lp','price','referral','narrow','ad','social','research','newidea'];
    return ['follow','price','referral','narrow','ad','partnership','outsource','automate','template','upsell','newidea','polish'];
  };
  const seeded = (salt) => {
    let x=(s.runSeed + s.day*7919 + salt*104729) % 2147483647;
    x=(x*48271)%2147483647; return x/2147483647;
  };
  const draw = () => {
    const pool=stagePool();
    const chosen=[];
    const push=(id)=>{if(id&&pool.includes(id)&&!chosen.includes(id))chosen.push(id)};
    if(s.day<=4) push(s.day%2?'interview':'direct');
    else if(s.leads>0) push('follow'); else push('direct');
    if(s.day>=9 && s.opsHours>=2.2) push(s.day%2?'outsource':'template');
    if(s.day>=5 && !s.lp) push('lp');
    if(chosen.length<3) push(s.day<=4?(s.day%2?'logo':'polish'):(s.day%3===0?'newidea':'ad'));
    const rest=pool.filter(x=>!chosen.includes(x)).sort((a,b)=>seeded(a.length+a.charCodeAt(0))-seeded(b.length+b.charCodeAt(0)));
    for(const id of rest){if(chosen.length>=4)break;push(id)}
    return chosen.slice(0,4);
  };
  const monthlyPace = () => Math.round((s.totalRevenue/Math.max(1,s.day))*20);
  const recalcOps = () => {
    const raw=s.customers*.5;
    s.opsHours=clamp(raw*(1-clamp(s.system,0,95)/110),0,6.2);
  };
  const availableTomorrow = () => clamp(8-s.opsHours,1.5,8);

  function renderScene(){
    recalcOps();
    const el=$('scene'); el.className='scene';
    if(s.fit>=30) el.classList.add('fit');
    if(s.customers>=2) el.classList.add('c1');
    if(s.customers>=6) el.classList.add('c2');
    if(s.customers>=11) el.classList.add('c3');
    if(s.system>=18) el.classList.add('system');
    if(s.system>=42) el.classList.add('system2');
    if(s.opsHours>=3.4) el.classList.add('backlog');
  }
  function render(){
    recalcOps();
    $('dayText').textContent='DAY '+s.day;
    $('cashText').textContent=yen(s.cash);
    $('customerText').textContent=s.customers+'人';
    $('fitText').textContent=clamp(Math.round(s.fit),0,100)+'%';
    $('opsText').textContent=s.opsHours.toFixed(1)+'h';
    $('hoursText').textContent='使える '+s.hours.toFixed(1)+'h';
    const pace=monthlyPace();$('paceText').innerHTML=yen(pace)+' <em>/ 月</em>';
    $('goalBar').style.width=clamp(pace/1000000*100,0,100)+'%';
    renderScene();
    [...document.querySelectorAll('.card')].forEach(card=>{
      const a=actions[card.dataset.id];
      if(!a)return;
      card.disabled=s.used.has(card.dataset.id)||a.hours>s.hours;
    });
    $('endDayBtn').disabled=false;
  }
  function renderCards(){
    s.used=new Set();
    const ids=draw();
    $('actions').innerHTML=ids.map(id=>{
      const a=actions[id];
      return `<button class="card" type="button" data-id="${id}">
        <span class="tag">${a.tag}</span><span class="cost">${a.hours}h</span>
        <h3>${a.title}</h3><p>${a.desc}</p><div class="after"></div>
      </button>`;
    }).join('');
    document.querySelectorAll('.card').forEach(card=>card.addEventListener('click',()=>choose(card)));
    render();
  }
  function choose(card){
    const id=card.dataset.id,a=actions[id];
    if(!a||s.used.has(id)||a.hours>s.hours)return;
    s.hours-=a.hours;s.used.add(id);
    const [head,body,tone]=a.run();
    s.fit=clamp(s.fit,0,100);s.system=clamp(s.system,0,100);s.cash=Math.max(0,s.cash);
    card.classList.add('used');card.querySelector('.after').textContent=head;
    feedback(head,body,tone);vibrate(tone==='bad'?[20,30,20]:12);render();
    const possible=[...document.querySelectorAll('.card')].some(c=>!s.used.has(c.dataset.id)&&actions[c.dataset.id].hours<=s.hours);
    if(!possible) $('endDayBtn').textContent='明日へ →';
  }
  function endDay(){
    if(s.day>=12){finish();return;}
    if(s.lp && s.fit>=42){
      const chanceBase=(s.fit-35)/22;
      const n=Math.min(3,Math.floor(chanceBase)+(s.leads>=3?1:0));
      if(n>0){const r=sale(Math.min(n,Math.max(1,s.leads)));if(r>0)feedback('寝ている間にも売れた',yen(r)+'。販売ページが働いた。','good');}
    }
    s.day++;
    recalcOps();
    s.hours=Math.round(availableTomorrow()*10)/10;
    $('endDayBtn').textContent='今日を終える →';
    renderCards();
    if(s.opsHours>=3.5) feedback('固定業務が '+s.opsHours.toFixed(1)+'h','売上は増えた。でも明日の「考えて売る時間」が削られている。','warn');
    else feedback('DAY '+s.day+' 開始','使える時間は '+s.hours.toFixed(1)+'h。一番レバレッジの高い一手は？','good');
  }
  function profile(){
    const h=s.history, pace=monthlyPace();
    if(h.trap>=5) return ['仕事してる感に吸われる型','見た目・調査・新アイデアに時間を使った。次は「顧客に聞く → そのまま売る」を先に2回やってから作る。'];
    if(h.build>h.customer+2) return ['作ってから売る型','作る判断が顧客理解より先行した。次は売れなかった理由を集めてから、必要な部分だけ作る。'];
    if(h.ads>=2 && s.fit<50) return ['広告先行型','勝ち筋が固まる前に集客を増やした。次は少人数へ直接売り、商品適合が高まってから広告で増幅する。'];
    if(s.customers>=7 && s.system<25) return ['売れて抱える型','顧客は増えたが、固定業務も自分に残った。次は売れ始めた瞬間にテンプレ・外注・自動化へ時間を移す。'];
    if(pace>=1000000 && s.system>=35) return ['勝ち筋集中型','顧客を見て、小さく売り、売れた型へ集中し、最後に仕組み化できた。この順番を反射にする。'];
    if(h.customer>=4 && h.sales>=4) return ['顧客起点型','顧客の反応を取りながら販売まで進めた。次は「売れた後だけ拡大」と「早めの仕組み化」で伸ばす。'];
    return ['迷いながら前進型','次の周回では、①顧客に聞く ②未完成でも売る ③売れた理由だけ作る ④売れたら仕組みにする、の順で試す。'];
  }
  function finish(){
    recalcOps();
    const pace=monthlyPace(), fit=clamp(s.fit,0,100), sys=clamp(s.system,0,100);
    const score=clamp(Math.round(Math.min(45,pace/1000000*45)+fit*.18+sys*.17+Math.min(12,s.customers)*1.2-Math.max(0,s.opsHours-4)*3-s.history.trap*1.5),0,100);
    const won=pace>=1000000 && s.opsHours<=4.2;
    $('resultTitle').textContent=won?'月商100万円ペース、到達。':'12日間、終了。';
    $('scoreText').textContent=score;$('rPace').textContent=yen(pace);$('rCustomers').textContent=s.customers+'人';$('rFit').textContent=Math.round(fit)+'%';$('rSystem').textContent=Math.round(sys)+'%';
    const [t,b]=profile();$('habitTitle').textContent=t;$('habitBody').textContent=b;
    $('result').classList.remove('hidden');
    try{const best=Math.max(score,Number(localStorage.getItem('hitori-shouten-best')||0));localStorage.setItem('hitori-shouten-best',String(best));}catch{}
    vibrate(won?[40,50,40]:20);
  }
  function reset(showIntro=false){
    s=baseState();$('result').classList.add('hidden');$('endDayBtn').textContent='今日を終える →';
    feedback('売上につながる一手を先に。','今日は8時間。何に使う？','good');renderCards();
    if(showIntro)$('intro').classList.remove('hidden');
  }

  $('startBtn').addEventListener('click',()=>{$('intro').classList.add('hidden');reset(false)});
  $('endDayBtn').addEventListener('click',endDay);
  $('restartBtn').addEventListener('click',()=>reset(true));
  $('retryBtn').addEventListener('click',()=>reset(false));
  renderCards();
})();
