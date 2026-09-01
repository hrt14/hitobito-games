(() => {
  const KEY = 'levelup-bedtime-world-v1';
  const TODAY = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());

  const WORLDS = {
    train: {
      name: '夜行列車の世界',
      short: '誰も知らない駅を、ひと駅ずつ。',
      symbol: '◐',
      landmarks: ['月明かりのホーム','水上の駅','星屑トンネル','眠らない食堂車','朝焼けの終着駅','霧の交換駅','天文台ホーム','海を渡る鉄橋','夜だけの市場駅','白い森の停車場','雲上の分岐駅','星明かりの車庫','風の谷の駅','まだ地図にない終点'],
      routes: [
        ['最後尾のデッキへ行く','風とレールの音だけが聞こえる。'],
        ['まだ名前のない駅で降りる','ホームの先に小さな灯りがある。'],
        ['食堂車の奥の扉を開ける','今まで気づかなかった車両が続いている。']
      ],
      fragments: [
        ['sound','遠くで鳴る、低い汽笛'],['light','窓に流れる青い灯り'],['touch','少し冷たい手すり'],
        ['smell','木の床と夜気の匂い'],['detail','誰もいない席に置かれた鍵'],['motion','ゆっくり揺れるカーテン']
      ]
    },
    sky: {
      name: '空に浮かぶ街',
      short: '雲の上の区画を、毎晩ひとつ開ける。',
      symbol: '◇',
      landmarks: ['雲の門','風の商店街','空中庭園','透明な図書館','夜明けの塔','吊り橋区画','空の温室','雲海劇場','風車広場','星見の学校','静かな高架街','飛行船ドック','雨の回廊','最上層の庭'],
      routes: [
        ['屋上から細い橋を渡る','橋の下は雲だけ。向こうに灯りが見える。'],
        ['閉店後の商店街を歩く','ひとつだけシャッターが開いている。'],
        ['空中庭園の奥へ進む','植物の間から階段が下へ続いている。']
      ],
      fragments: [
        ['sound','旗が風を切る音'],['light','足元から透ける街の灯り'],['touch','乾いた夜風'],
        ['smell','雨上がりの雲の匂い'],['detail','空に浮いた小さな標識'],['motion','遠くを横切る飛行船']
      ]
    },
    hotel: {
      name: '森の奥のホテル',
      short: '泊まるたび、使える部屋が増えていく。',
      symbol: '▱',
      landmarks: ['玄関ホール','古いラウンジ','温室','地下回廊','屋根裏の展望室','中庭の離れ','雨音の書斎','地下の浴場','森側の食堂','閉じた客室棟','ガラスの廊下','夜の音楽室','湖畔の別館','朝だけ開く屋上'],
      routes: [
        ['消灯後のラウンジへ戻る','暖炉だけがまだ残っている。'],
        ['温室の奥の扉を開ける','夜にだけ咲く花が光っている。'],
        ['誰も使わない階段を上がる','最上階から森が一望できる。']
      ],
      fragments: [
        ['sound','古い時計の小さな音'],['light','暖炉の残り火'],['touch','厚い絨毯の感触'],
        ['smell','木と雨の匂い'],['detail','部屋番号のない鍵'],['motion','廊下の先で揺れるカーテン']
      ]
    },
    sea: {
      name: '月の港',
      short: '夜の海沿いを、港から先へ。',
      symbol: '≈',
      landmarks: ['月の桟橋','灯台通り','夜市','青い入江','海上ホテル','波止場倉庫街','白い防波堤','海底窓のカフェ','潮風の坂道','島へ渡る小舟','静かな造船所','星見の浜','夜明け前の魚市場','沖に浮かぶ庭園'],
      routes: [
        ['桟橋の一番先まで歩く','水面の下にもうひとつ街が見える。'],
        ['灯台の裏道へ入る','海沿いに細い階段が続いている。'],
        ['夜市の最後の店をのぞく','地図にはない場所の切符を売っている。']
      ],
      fragments: [
        ['sound','岸壁に当たる小さな波'],['light','水面で揺れる月明かり'],['touch','潮風の冷たさ'],
        ['smell','海と木の桟橋の匂い'],['detail','濡れていない古い切符'],['motion','ゆっくり離れていく小舟']
      ]
    }
  };

  const app = document.getElementById('app');
  let state = load();
  let screen = state.world ? 'home' : 'intro';
  let selectedRoute = 0;
  let selectedFragments = [];

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        world: raw.world || null,
        nights: Number(raw.nights || 0),
        lastCompleted: raw.lastCompleted || null,
        history: Array.isArray(raw.history) ? raw.history.slice(-12) : []
      };
    } catch {
      return { world: null, nights: 0, lastCompleted: null, history: [] };
    }
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function world() { return WORLDS[state.world]; }
  function alreadyTonight() { return state.lastCompleted === TODAY(); }
  function nightIndex() {
    const raw = alreadyTonight() ? Math.max(0, state.nights - 1) : state.nights;
    return Math.min(raw, world().landmarks.length - 1);
  }
  function tonightPlace() { return world().landmarks[nightIndex()]; }

  function top(extra='') {
    return `<div class="topline"><div class="brand">LEVEL UP · NIGHT</div>${extra}</div>`;
  }

  function render() {
    if (screen === 'intro') return renderIntro();
    if (screen === 'home') return renderHome();
    if (screen === 'portal') return renderPortal();
    if (screen === 'fragments') return renderFragments();
    if (screen === 'dark') return renderDark();
    if (screen === 'done') return renderDone();
    if (screen === 'settings') return renderSettings();
  }

  function renderIntro() {
    app.innerHTML = `${top()}
      <section class="hero">
        <p class="eyebrow">寝る前が楽しみになるイメトレ</p>
        <h1>今夜から、<br>寝る前に続きがある。</h1>
        <p class="lead">毎晩ひとつだけ、頭の中の世界を先へ進めます。アプリを見るのは入口まで。続きは、布団で目を閉じてから。</p>
      </section>
      <div class="teaser">
        <div class="teaser-kicker">最初にひとつだけ選ぶ</div>
        <div class="teaser-title">どの世界に通う？</div>
        <p class="teaser-sub">毎晩ちがう世界を転々とせず、同じ場所の続きを育てます。</p>
      </div>
      <div class="world-grid">
        ${Object.entries(WORLDS).map(([id,w])=>`<button class="world-card" data-world="${id}"><span class="world-symbol">${w.symbol}</span><strong>${w.name}</strong><span>${w.short}</span></button>`).join('')}
      </div>
      <p class="note">睡眠を治療するアプリではありません。寝る前の時間を、楽しみに変えるための想像ルーティンです。</p>`;
    app.querySelectorAll('[data-world]').forEach(btn => btn.addEventListener('click', () => {
      state.world = btn.dataset.world;
      state.nights = 0;
      state.history = [];
      state.lastCompleted = null;
      save();
      screen = 'home';
      render();
    }));
  }

  function renderHome() {
    const w = world();
    const idx = nightIndex();
    const completed = alreadyTonight();
    app.innerHTML = `${top('<button class="icon-btn" id="settings">世界</button>')}
      <section class="hero">
        <p class="eyebrow">${w.name}</p>
        <h1>${completed ? '今夜の続きを、もう見た。' : '今夜も、続きがある。'}</h1>
        <p class="lead">${completed ? '続きはもう頭の中にあります。もう一度入りたいなら、同じ入口を開けます。' : '布団に入ったら、今日の新しい場所をひとつだけ開けます。'}</p>
      </section>
      <div class="map">
        <div class="map-head"><strong>あなたの世界</strong><span>${state.nights}夜ぶん進行</span></div>
        <div class="map-track">
          ${w.landmarks.map((name,i)=>`<div class="landmark ${i===idx?'current':''} ${i>idx?'locked':''}"><small>${i<idx?'OPEN':i===idx?'TONIGHT':'SOON'}</small><b>${i>idx?'まだ見えない場所':name}</b></div>`).join('')}
        </div>
      </div>
      <div class="teaser">
        <div class="teaser-kicker">${completed?'今夜の場所':'今夜、新しく開く場所'}</div>
        <div class="teaser-title">${tonightPlace()}</div>
        <p class="teaser-sub">入口だけ見たら、スマホは伏せます。</p>
      </div>
      <div class="stack">
        <button class="primary" id="enter">${completed?'もう一度、入口を見る':'布団に入った。入口を開く'}</button>
        <button class="secondary" id="peek">これまでの夜を見る</button>
      </div>
      <p class="note">“早く寝なきゃ”ではなく、“続きが見たいから布団へ行く”を狙うアプリです。</p>`;
    document.getElementById('settings').onclick = () => { screen='settings'; render(); };
    document.getElementById('enter').onclick = () => { selectedRoute = state.nights % 3; selectedFragments = []; screen='portal'; render(); };
    document.getElementById('peek').onclick = () => {
      const hist = state.history.length ? state.history.map(h=>`${h.date} — ${h.place}`).join('\n') : 'まだありません';
      alert(hist);
    };
  }

  function renderPortal() {
    const w = world();
    app.innerHTML = `${top('<button class="icon-btn" id="back">戻る</button>')}
      <p class="eyebrow">今夜の入口</p>
      <h2 class="screen-title">${tonightPlace()}</h2>
      <p class="screen-copy">今日は、どこから入る？ ひとつ選んだら、次は頭の中に持っていく“3つの手がかり”を選びます。</p>
      <div class="portal" aria-hidden="true"><div class="portal-label">TONIGHT</div><div class="moon"></div><div class="horizon"></div><div class="path"></div><div class="door"></div></div>
      <div class="route-list">
        ${w.routes.map((r,i)=>`<button class="route ${i===selectedRoute?'selected':''}" data-route="${i}"><span class="route-no">${i+1}</span><span><strong>${r[0]}</strong><span>${r[1]}</span></span></button>`).join('')}
      </div>
      <button class="primary" id="next">この入口から入る</button>`;
    document.getElementById('back').onclick = () => { screen='home'; render(); };
    app.querySelectorAll('[data-route]').forEach(btn => btn.onclick = () => { selectedRoute = Number(btn.dataset.route); renderPortal(); });
    document.getElementById('next').onclick = () => { screen='fragments'; render(); };
  }

  function renderFragments() {
    const w = world();
    app.innerHTML = `${top('<button class="icon-btn" id="back">戻る</button>')}
      <p class="eyebrow">3つだけ持っていく</p>
      <h2 class="screen-title">頭の中の世界に、材料を渡す。</h2>
      <p class="screen-copy">見えるもの・聞こえるもの・触れる感じ。気になるものを3つ選ぶと、今夜の入口が完成します。</p>
      <div class="slot-row">${[0,1,2].map(i=>`<div class="slot ${selectedFragments[i]!=null?'filled':''}">${selectedFragments[i]!=null?w.fragments[selectedFragments[i]][1]:'空き'}</div>`).join('')}</div>
      <div class="fragments">
        ${w.fragments.map((f,i)=>`<button class="fragment ${selectedFragments.includes(i)?'selected':''}" data-fragment="${i}"><small>${labelFor(f[0])}</small><strong>${f[1]}</strong></button>`).join('')}
      </div>
      <button class="primary" id="close" ${selectedFragments.length===3?'':'disabled'} style="${selectedFragments.length===3?'':'opacity:.38'}">目を閉じる準備ができた</button>`;
    document.getElementById('back').onclick = () => { screen='portal'; render(); };
    app.querySelectorAll('[data-fragment]').forEach(btn => btn.onclick = () => {
      const i = Number(btn.dataset.fragment);
      if (selectedFragments.includes(i)) selectedFragments = selectedFragments.filter(x=>x!==i);
      else if (selectedFragments.length < 3) selectedFragments.push(i);
      renderFragments();
    });
    const close = document.getElementById('close');
    if (selectedFragments.length===3) close.onclick = () => { screen='dark'; render(); };
  }

  function labelFor(type){ return ({sound:'SOUND',light:'LIGHT',touch:'TOUCH',smell:'SCENT',detail:'DETAIL',motion:'MOTION'})[type] || 'CUE'; }

  function renderDark() {
    const w = world();
    const r = w.routes[selectedRoute];
    const cues = selectedFragments.map(i=>w.fragments[i][1]);
    app.innerHTML = `<section class="dark-screen">
      <div class="tiny">ここから先は画面を見ない</div>
      <h2>${r[0]}</h2>
      <p>${r[1]}<br><br>${cues.join('。')}。<br><br>この3つだけ持って、あとは好きに続きを見てください。</p>
      <div class="dim">途中で筋書きが変わってもOK。うまく想像できなくてもOK。眠ってしまったら、そのままで成功です。</div>
      <button class="primary finish-btn" id="finish">画面を伏せる</button>
    </section>`;
    document.getElementById('finish').onclick = completeNight;
  }

  function completeNight() {
    const wasDone = alreadyTonight();
    const w = world();
    const place = tonightPlace();
    if (!wasDone) {
      state.history.push({ date: TODAY(), place, route: w.routes[selectedRoute][0] });
      state.history = state.history.slice(-12);
      state.lastCompleted = TODAY();
      state.nights += 1;
      save();
    }
    screen = 'done';
    render();
  }

  function renderDone() {
    const nextIdx = Math.min(state.nights, world().landmarks.length - 1);
    const next = world().landmarks[nextIdx];
    app.innerHTML = `<section class="dark-screen">
      <div class="tiny">GOOD NIGHT</div>
      <h2>続きは、明日の夜。</h2>
      <p>アプリはここで終わりです。今夜はさっきの入口から、好きなところまで進んでください。</p>
      <div class="dim">次に開く場所：<strong>${next}</strong><br>今は見なくて大丈夫。</div>
      <button class="secondary" id="home" style="margin-top:24px">ホームへ戻る</button>
    </section>`;
    document.getElementById('home').onclick = () => { screen='home'; render(); };
  }

  function renderSettings() {
    const w = world();
    app.innerHTML = `${top('<button class="icon-btn" id="back">戻る</button>')}
      <p class="eyebrow">世界の設定</p>
      <h2 class="screen-title">今は「${w.name}」に通っています。</h2>
      <p class="screen-copy">世界を変えると、今までの夜の記録はこの端末から消えます。</p>
      <div class="stack">
        <button class="secondary" id="reset">別の世界を選び直す</button>
        <button class="quiet" id="clear">この世界の進行だけ最初から</button>
      </div>`;
    document.getElementById('back').onclick = () => { screen='home'; render(); };
    document.getElementById('reset').onclick = () => {
      if (confirm('世界を選び直しますか？')) { state={world:null,nights:0,lastCompleted:null,history:[]}; save(); screen='intro'; render(); }
    };
    document.getElementById('clear').onclick = () => {
      if (confirm('進行を最初からに戻しますか？')) { state.nights=0; state.lastCompleted=null; state.history=[]; save(); screen='home'; render(); }
    };
  }

  render();
})();
