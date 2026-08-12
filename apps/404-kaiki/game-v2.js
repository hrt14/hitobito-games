(() => {
  const STORAGE_KEY = 'hitobito_404_case01_v1';
  const fresh = {
    started:false, brief:false, searchedOld:false, foundPhoto:false,
    readArchive:false, timeFound:false, clockSet:false, platform13:false,
    finished:false, wrongPhotoTaps:0, view:'home'
  };
  let state = load();
  let activeSearch = 'current';
  let hintVisible = false;
  let hintTimer = null;
  let toastTimer = null;
  let audioCtx = null;
  let humNodes = [];

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const app = $('#app');
  const views = $$('.view');
  const dock = $('#dock');

  function load(){
    try { return {...fresh, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; }
    catch { return {...fresh}; }
  }
  function save(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  function set(patch, opts={}){
    state = {...state, ...patch};
    save();
    hintVisible = false;
    render();
    if(opts.sound) pulseSound(opts.sound);
    armHint();
  }
  function vibration(pattern=25){ if(navigator.vibrate) navigator.vibrate(pattern); }

  function ensureAudio(){
    if(audioCtx) { if(audioCtx.state === 'suspended') audioCtx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    try {
      audioCtx = new AC();
      const master = audioCtx.createGain(); master.gain.value = .012; master.connect(audioCtx.destination);
      const osc = audioCtx.createOscillator(); osc.type='sine'; osc.frequency.value=47;
      const gain = audioCtx.createGain(); gain.gain.value=.55; osc.connect(gain).connect(master); osc.start();
      const osc2 = audioCtx.createOscillator(); osc2.type='triangle'; osc2.frequency.value=94.2;
      const gain2 = audioCtx.createGain(); gain2.gain.value=.08; osc2.connect(gain2).connect(master); osc2.start();
      humNodes=[osc,osc2,master];
    } catch {}
  }
  function pulseSound(kind='soft'){
    ensureAudio(); if(!audioCtx) return;
    const now=audioCtx.currentTime;
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    const conf = kind==='glitch' ? [108,.032,.16,'sawtooth'] : kind==='deep' ? [61,.045,.28,'triangle'] : [244,.018,.1,'sine'];
    osc.type=conf[3]; osc.frequency.setValueAtTime(conf[0],now);
    if(kind==='glitch') osc.frequency.exponentialRampToValueAtTime(54,now+conf[2]);
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(conf[1],now+.012); gain.gain.exponentialRampToValueAtTime(.0001,now+conf[2]);
    osc.connect(gain).connect(audioCtx.destination); osc.start(now); osc.stop(now+conf[2]+.02);
  }

  function openView(name){
    state.view = name;
    if(name === 'case' && !state.brief) state.brief = true;
    if(name === 'message' && !state.brief) state.brief = true;
    save();
    hintVisible=false;
    views.forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    dock.classList.toggle('is-hidden', name === 'home' || name === 'terminal');
    render();
    armHint();
    window.scrollTo(0,0);
  }

  function clues(){ return [state.brief, state.searchedOld, state.foundPhoto, state.timeFound].filter(Boolean).length; }
  function objective(){
    if(!state.brief) return 'まず調査依頼を確認する。';
    if(!state.searchedOld) return '駅の過去記録を検索する。';
    if(!state.foundPhoto) return '監視カメラ写真の違和感を探す。';
    if(!state.readArchive) return '追加された古い構内図を確認する。';
    if(!state.clockSet) return '端末の時計を23:48に合わせる。';
    if(!state.platform13) return 'MAPに現れた13番ホームを調べる。';
    if(!state.finished) return '13番ホームに落ちた紙片を拾う。';
    return 'CASE 01 調査完了。';
  }
  function hintTarget(){
    if(!state.brief) return 'case';
    if(!state.searchedOld) return 'search';
    if(!state.foundPhoto) return 'photo';
    if(!state.readArchive) return 'file';
    if(!state.clockSet) return 'clock';
    if(!state.platform13) return 'map';
    return null;
  }
  function hintText(){
    const t=hintTarget();
    return {
      case:'未確認の調査依頼があります。',
      search:'改修前の駅記録を探してください。',
      photo:'監視画像の奥に、記録と合わないものがあります。',
      file:'新しく保存された1996年の構内図を確認してください。',
      clock:'記録の時刻と調査端末を同期できます。',
      map:'地図に割り込んだ場所を直接調べてください。'
    }[t] || '';
  }
  function armHint(){
    clearTimeout(hintTimer);
    if(state.finished || state.view==='terminal') return;
    hintTimer=setTimeout(()=>{ hintVisible=true; render(); }, 14000);
  }

  function render(){
    const count = clues();
    $('#progressText').textContent = `${count} / 4`;
    $('#progressBar').style.width = `${count * 25}%`;
    $('#objectiveText').textContent = objective();
    $('#caseDot').classList.toggle('is-hidden', state.brief);
    $('#messageDot').classList.toggle('is-hidden', state.brief && !hintVisible);
    $('#fileDot').classList.toggle('is-hidden', !state.searchedOld && !state.foundPhoto);
    $('#photoDot').classList.toggle('is-hidden', state.foundPhoto);
    $('#mapDot').classList.toggle('is-hidden', !state.clockSet);
    $('#caseBadge').textContent = state.finished ? 'CASE 02?' : 'CASE 01';
    $('#clockText').textContent = state.clockSet ? '23:48' : '23:47';
    $('#clockBtn').classList.toggle('is-ready', state.timeFound && !state.clockSet);
    $('#time2348').classList.toggle('is-key', state.timeFound);
    $('#clockHint').textContent = state.timeFound ? '廃止記録に「23:48」の記載がある。' : '現在時刻と同期中';

    let notice = state.finished ? '02:13 / UNKNOWN CALLER' : state.platform13 ? 'あなたは、そこにいますか？' : state.timeFound ? '端末時刻の手動同期が許可されました。' : state.searchedOld ? 'ARCHIVEに資料が追加されました。' : '新しい調査依頼が届いています。';
    if(hintVisible && hintText()) notice = hintText();
    $('#homeNoticeText').textContent = notice;
    app.classList.toggle('haunted', state.clockSet || state.platform13);

    $$('.app-icon').forEach(x=>x.classList.remove('needs-attention'));
    const target=hintTarget();
    if(hintVisible && target && target!=='clock') $(`.app-icon[data-open="${target}"]`)?.classList.add('needs-attention');
    $('#clockBtn').classList.toggle('needs-attention', hintVisible && target==='clock');

    renderMessages(); renderSearch(activeSearch); renderFiles(); renderMap(); renderPhoto();
  }

  function renderMessages(){
    const items = [
      ['system','404 SECURE CHANNEL / CONNECTED'],
      ['msg','調査員さん？ この駅、12番ホームまでしかないはずなんです。','','投稿者 / M'],
      ['msg','でも昨日、終電のあとに「13」の表示を見ました。階段を降りたところで電波が切れて……','','投稿者 / M'],
      ['msg me','写真か記録は残っていますか？'],
      ['msg','監視カメラの画像を送ります。時刻は23:47ごろです。奥の方、何か変じゃないですか。','','投稿者 / M']
    ];
    if(state.searchedOld) items.push(['system','ARCHIVE RECORD FOUND / 1996']);
    if(state.foundPhoto) items.push(['msg','その人、駅員じゃないです。あの日はホーム閉鎖後、誰も残っていなかったはず。','','投稿者 / M']);
    if(state.timeFound) items.push(['msg','23:48……。掲示板の噂と同じ時刻です。端末の時計、合わせられますか？','','調査室 / K']);
    if(state.clockSet) items.push(['msg corrupt','み つ け た','','UNKNOWN']);
    if(hintVisible && hintTarget()) items.push(['msg system', `HINT / ${hintText()}`]);
    $('#messageThread').innerHTML = items.map(x => x[0]==='system' || x[0]==='msg system' ? `<div class="msg system">${x[1]}</div>` : `<div class="${x[0]}">${x[1]}${x[3]?`<small>${x[3]}</small>`:''}</div>`).join('');
  }

  const results = {
    current:[
      {site:'港北交通局',title:'港北中央駅 構内案内',body:'1〜12番線。1996年の大規模改修により地下連絡通路の一部を閉鎖。'},
      {site:'路線情報アーカイブ',title:'港北中央駅 — 駅データ',body:'開業1964年。現在のホーム数：12。地下設備の一部は非公開。'}
    ],
    old:[
      {site:'市立図書館デジタル資料',title:'港北中央駅 改修工事資料（1996）',body:'旧地下ホームを含む改修前平面図。閲覧資料番号 KHC-1996-13。',archive:true},
      {site:'港北新聞 1996.06.14',title:'中央駅、旧地下線の使用を終了',body:'利用者減少により旧地下線を閉鎖。閉鎖後の設備について交通局は回答せず。'}
    ],
    rumor:[
      {site:'消失済み掲示板 / CACHE',title:'【駅】13番ホームを見た',body:'23:48だけ案内表示が変わる。階段を降りても絶対に電車には乗るな。'},
      {site:'404',title:'result_not_found / kohhoku_13',body:'このページは削除されたか、最初から存在しません。'}
    ]
  };

  function renderSearch(type='current'){
    activeSearch=type;
    const root=$('#searchResults'); if(!root) return;
    root.innerHTML = results[type].map((r,i)=>{
      const saved=r.archive && state.searchedOld;
      return `<button class="result-card ${r.site==='404'?'glitch-result':''} ${saved?'saved':''}" data-result="${type}-${i}"><small>${r.site}</small><h3>${r.title}</h3><p>${r.body}</p></button>`;
    }).join('');
    $$('.query-chips button').forEach(b=>{
      b.classList.toggle('is-active',b.dataset.query===type);
      b.classList.toggle('hint-query',hintVisible && hintTarget()==='search' && b.dataset.query==='old');
    });
    $$('[data-result]',root).forEach(btn=>btn.onclick=()=>{
      const [q,idx]=btn.dataset.result.split('-'); const item=results[q][Number(idx)];
      if(item.archive && !state.searchedOld){
        vibration([25,35,45]);
        set({searchedOld:true},{sound:'soft'});
        discovery('ARCHIVE EXTRACTED','1996年の改修前構内図を FILE に保存しました。');
        glitchBurst();
      } else { pulseSound('soft'); }
    });
  }

  function renderFiles(){
    const list=[];
    if(state.searchedOld){
      list.push(`<article class="file-card is-new" id="archiveFile"><div class="file-meta"><b>改修前構内図 / 1996</b><span>ARCHIVE / KHC-1996-13</span></div><div class="file-content"><div class="mini-map compact">${[9,10,11,12].map(n=>`<div class="mini-platform"><span>${n}番線</span><span>OPEN</span></div>`).join('')}<button id="old13" class="mini-platform old13 ${state.readArchive?'is-open':''}"><span>13番線</span><span>CLOSED</span></button></div><p class="file-note">地下連絡通路の先に、現在の構内図から削除されたホームが存在している。</p>${state.readArchive?`<div class="archive-clue">旧13番線 — 1996年6月14日閉鎖。<br><b>保守点検記録：最終入線 23:48</b></div>`:'<div class="archive-clue">13番線の点検記録だけ、別紙扱いになっている。</div>'}</div></article>`);
    }
    list.push(`<article class="file-card"><div class="file-meta"><b>現行構内図</b><span>LIVE / MAP-001</span></div><div class="file-content"><div class="file-summary"><span class="map-count">12</span><p>現行資料では12番線まで。1996年以前の地下設備は削除されている。</p></div></div></article>`);
    if(state.foundPhoto) list.push(`<article class="file-card"><div class="file-meta"><b>CAM 12-B / 静止画</b><span>EVIDENCE</span></div><div class="file-content"><p class="file-note">23:47:51。閉鎖後の12番ホーム奥に人影。駅の勤務記録では該当者なし。</p></div></article>`);
    $('#fileList').innerHTML=list.join('');
    $('#fileCount').textContent=String(1+(state.searchedOld?1:0)+(state.foundPhoto?1:0));
    const old13=$('#old13');
    if(old13) old13.onclick=()=>{
      if(!state.readArchive){
        vibration([30,35,30]);
        set({readArchive:true,timeFound:true},{sound:'deep'});
        discovery('時刻を特定','旧13番線の最終入線記録は 23:48。端末の時計と同期できます。');
      } else pulseSound('soft');
    };
  }

  function renderPhoto(){
    $('#cctv').classList.toggle('found',state.foundPhoto);
    $('#photoFinding').classList.toggle('is-hidden',!state.foundPhoto);
    $('#photoFinding').innerHTML=state.foundPhoto?'<strong>異常を記録しました。</strong><br>23:47:51 / 12番ホーム奥。閉鎖後の構内に人影。勤務者一覧と一致なし。':'';
    $('#cctvTime').textContent=state.clockSet?'23:48:00':'23:47:51';
    const cap=$('#photoCaption');
    cap.classList.remove('is-wrong','is-hint');
    if(state.foundPhoto) cap.textContent='人影は記録した。FILEに証拠が保存されている。';
    else if(hintVisible && hintTarget()==='photo') { cap.textContent='奥の柱の間で、輪郭が一瞬だけ変わっている。'; cap.classList.add('is-hint'); }
    else if(state.wrongPhotoTaps>=2) { cap.textContent='そこではない。奥の方で、何かが一瞬動いた。'; cap.classList.add('is-wrong'); }
    else cap.textContent='画面の中で、記録と食い違う場所を探す。';
  }

  function scanPhoto(e){
    if(state.foundPhoto) return;
    const frame=$('#cctv').getBoundingClientRect();
    const x=(e.clientX-frame.left)/frame.width, y=(e.clientY-frame.top)/frame.height;
    const hit = x>.67 && x<.98 && y>.25 && y<.75;
    const feedback=$('#scanFeedback');
    feedback.style.left=`${Math.max(5,Math.min(95,x*100))}%`; feedback.style.top=`${Math.max(8,Math.min(92,y*100))}%`;
    feedback.classList.remove('ping'); void feedback.offsetWidth; feedback.classList.add('ping');
    if(hit){
      vibration([20,30,70]);
      set({foundPhoto:true},{sound:'glitch'});
      discovery('ANOMALY DETECTED','23:47:51。閉鎖後の12番ホームに、勤務記録にない人影。');
      glitchBurst();
    } else {
      set({wrongPhotoTaps:(state.wrongPhotoTaps||0)+1});
      vibration(10); pulseSound('soft');
    }
  }

  function renderMap(){
    const p=$('#platforms');
    p.innerHTML=[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<div class="platform">${n}</div>`).join('') + (state.clockSet?'<button id="p13" class="platform thirteen">13 / UNKNOWN</button>':'');
    $('#mapSubtitle').textContent=state.clockSet?'現在地情報に異常':'現行構内図';
    $('#mapState').textContent=state.clockSet?'ERROR':'LIVE';
    $('#mapHint').textContent=state.platform13?'地下連絡通路への経路を捕捉。地図上には登録されていない。':state.clockSet?'MAPデータに存在しないホームが割り込んでいる。位置情報：取得不能。':'現在の構内図には12番ホームまでしか存在しない。';
    $('.station-map').classList.toggle('is-locked',state.platform13);
    $('#hiddenStairs').classList.toggle('is-hidden',!state.clockSet);
    $('#enter13').classList.toggle('is-hidden',!state.platform13);
    const p13=$('#p13'); if(p13) p13.onclick=()=>{
      if(!state.platform13){
        vibration([40,55,60]); set({platform13:true},{sound:'glitch'}); glitchBurst();
        discovery('ROUTE LOCKED','存在しない地下連絡通路への経路を捕捉しました。');
      }
    };
  }

  function discovery(title,body){
    clearTimeout(toastTimer);
    $('#toastTitle').textContent=title; $('#toastBody').textContent=body;
    $('#discoveryToast').classList.add('is-show');
    toastTimer=setTimeout(()=>$('#discoveryToast').classList.remove('is-show'),2500);
  }
  function glitchBurst(){ $('#screen').classList.add('glitch'); setTimeout(()=>$('#screen').classList.remove('glitch'),450); }

  $$('[data-open]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.open)));
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>openView('home')));
  $$('[data-home]').forEach(b=>b.addEventListener('click',()=>openView('home')));

  $$('.query-chips button').forEach(b=>b.addEventListener('click',()=>{ activeSearch=b.dataset.query; renderSearch(activeSearch); pulseSound('soft'); armHint(); }));

  $('#cctv').addEventListener('click',scanPhoto);
  $('#cctv').addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ const r=$('#cctv').getBoundingClientRect(); scanPhoto({clientX:r.left+r.width*.84,clientY:r.top+r.height*.48}); } });
  $('#photoHotspot').addEventListener('click',e=>{ e.stopPropagation(); const r=$('#cctv').getBoundingClientRect(); scanPhoto({clientX:r.left+r.width*.84,clientY:r.top+r.height*.48}); });

  $('#clockBtn').addEventListener('click',()=>{ ensureAudio(); $('#clockSheet').classList.add('is-open'); $('#clockSheet').setAttribute('aria-hidden','false'); pulseSound('soft'); });
  $('[data-close-clock]').addEventListener('click',closeClock);
  function closeClock(){ $('#clockSheet').classList.remove('is-open'); $('#clockSheet').setAttribute('aria-hidden','true'); }
  $$('[data-time]').forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.dataset.time==='23:48' && !state.timeFound){ $('#clockHint').textContent='その時刻を示す根拠がまだない。'; vibration(15); pulseSound('soft'); return; }
    if(btn.dataset.time==='23:48'){
      closeClock(); set({clockSet:true},{sound:'deep'}); vibration([35,40,55]); glitchBurst();
      discovery('TIME SYNC ERROR','23:48。MAPデータに未登録の座標が割り込みました。');
      setTimeout(()=>openView('map'),700);
    } else { closeClock(); if(state.clockSet) set({clockSet:false,platform13:false}); }
  }));

  $('#enter13').addEventListener('click',()=>{ ensureAudio(); pulseSound('deep'); openView('terminal'); setTimeout(()=>vibration([18,80,18]),350); });
  $('#pickupClue').addEventListener('click',()=>{
    vibration([70,60,110]); set({finished:true},{sound:'glitch'}); $('#ending').classList.add('is-open');
  });
  $('#endingHome').addEventListener('click',()=>{
    $('#ending').classList.remove('is-open'); openView('home'); $('#caseBadge').textContent='CASE 02?'; $('#homeNoticeText').textContent='02:13 / UNKNOWN CALLER'; pulseSound('glitch');
  });

  $('#homeNotice').addEventListener('click',()=>openView(state.brief?'message':'case'));
  $('#startBtn').addEventListener('click',()=>{
    ensureAudio(); state.started=true; save(); $('#intro').classList.remove('is-open'); pulseSound('deep'); openView('case');
  });

  document.addEventListener('visibilitychange',()=>{ if(document.hidden && audioCtx) audioCtx.suspend(); });

  if(state.started) $('#intro').classList.remove('is-open');
  if(state.finished){ state.view='home'; save(); $('#ending').classList.remove('is-open'); }
  openView(state.view || 'home');
  render();
})();