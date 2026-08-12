(() => {
  const STORAGE_KEY = 'hitobito_404_case01_v1';
  const fresh = { started:false, brief:false, searchedOld:false, foundPhoto:false, readArchive:false, timeFound:false, clockSet:false, platform13:false, finished:false, view:'home' };
  let state = load();

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const app = $('#app');
  const views = $$('.view');
  const dock = $('#dock');

  function load(){ try { return {...fresh, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; } catch { return {...fresh}; } }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function set(patch){ state = {...state,...patch}; save(); render(); }
  function vibration(pattern=25){ if(navigator.vibrate) navigator.vibrate(pattern); }

  function openView(name){
    state.view = name; save();
    views.forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    dock.classList.toggle('is-hidden', name === 'home' || name === 'terminal');
    if(name === 'case' && !state.brief) set({brief:true});
    if(name === 'message' && !state.brief) set({brief:true});
    render();
    window.scrollTo(0,0);
  }

  function clues(){ return [state.brief, state.searchedOld, state.foundPhoto, state.timeFound].filter(Boolean).length; }
  function objective(){
    if(!state.brief) return 'まず調査依頼を確認する。';
    if(!state.searchedOld) return '駅の過去記録を検索する。';
    if(!state.foundPhoto) return '監視カメラ写真の違和感を探す。';
    if(!state.readArchive) return '追加された古い構内図を確認する。';
    if(!state.timeFound) return '廃止記録から出現時刻を特定する。';
    if(!state.clockSet) return '端末の時計を23:48に合わせる。';
    if(!state.platform13) return 'MAPに現れた13番ホームを調べる。';
    if(!state.finished) return '13番ホームに落ちた紙片を拾う。';
    return 'CASE 01 調査完了。';
  }

  function render(){
    const count = clues();
    $('#progressText').textContent = `${count} / 4`;
    $('#progressBar').style.width = `${count * 25}%`;
    $('#objectiveText').textContent = objective();
    $('#caseDot').classList.toggle('is-hidden', state.brief);
    $('#messageDot').classList.toggle('is-hidden', state.brief);
    $('#fileDot').classList.toggle('is-hidden', !state.searchedOld && !state.foundPhoto);
    $('#photoDot').classList.toggle('is-hidden', state.foundPhoto);
    $('#mapDot').classList.toggle('is-hidden', !state.clockSet);
    $('#clockText').textContent = state.clockSet ? '23:48' : '23:47';
    $('#time2348').classList.toggle('is-key', state.timeFound);
    $('#clockHint').textContent = state.timeFound ? '廃止記録に「23:48」の記載がある。' : '現在時刻と同期中';
    $('#homeNoticeText').textContent = state.platform13 ? 'あなたは、そこにいますか？' : state.timeFound ? '端末時刻の手動同期が許可されました。' : state.searchedOld ? 'ARCHIVEに資料が追加されました。' : '新しい調査依頼が届いています。';
    app.classList.toggle('haunted', state.clockSet || state.platform13);
    renderMessages(); renderSearch(); renderFiles(); renderMap(); renderPhoto();
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
    $('#messageThread').innerHTML = items.map(x => x[0]==='system' ? `<div class="msg system">${x[1]}</div>` : `<div class="${x[0]}">${x[1]}${x[3]?`<small>${x[3]}</small>`:''}</div>`).join('');
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
    const root=$('#searchResults'); if(!root) return;
    root.innerHTML = results[type].map((r,i)=>`<button class="result-card ${r.site==='404'?'glitch-result':''}" data-result="${type}-${i}"><small>${r.site}</small><h3>${r.title}</h3><p>${r.body}</p></button>`).join('');
    $$('.query-chips button').forEach(b=>b.classList.toggle('is-active',b.dataset.query===type));
    $$('[data-result]',root).forEach(btn=>btn.onclick=()=>{
      const [q,idx]=btn.dataset.result.split('-'); const item=results[q][Number(idx)];
      if(item.archive && !state.searchedOld){ vibration([25,40,25]); set({searchedOld:true}); toastGlitch(); }
    });
  }

  function renderFiles(){
    const list=[`<article class="file-card"><div class="file-meta"><b>現行構内図</b><span>LIVE / MAP-001</span></div><div class="file-content"><div class="mini-map">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<div class="mini-platform"><span>${n}番線</span><span>OPEN</span></div>`).join('')}</div><p class="file-note">現行資料では12番線まで。13番線の記載はない。</p></div></article>`];
    if(state.searchedOld){
      list.push(`<article class="file-card" id="archiveFile"><div class="file-meta"><b>改修前構内図 / 1996</b><span>ARCHIVE / KHC-1996-13</span></div><div class="file-content"><div class="mini-map">${[9,10,11,12].map(n=>`<div class="mini-platform"><span>${n}番線</span><span>OPEN</span></div>`).join('')}<button id="old13" class="mini-platform old13"><span>13番線</span><span>CLOSED</span></button></div><p class="file-note">地下連絡通路の先に、現在の構内図から削除されたホームが存在している。</p>${state.readArchive?`<div class="archive-clue">旧13番線 — 1996年6月14日閉鎖。<br><b>保守点検記録：最終入線 23:48</b></div>`:''}</div></article>`);
    }
    if(state.foundPhoto) list.push(`<article class="file-card"><div class="file-meta"><b>CAM 12-B / 静止画</b><span>EVIDENCE</span></div><div class="file-content"><p class="file-note">23:47:51。閉鎖後の12番ホーム奥に人影。駅の勤務記録では該当者なし。</p></div></article>`);
    $('#fileList').innerHTML=list.join('');
    $('#fileCount').textContent=String(1+(state.searchedOld?1:0)+(state.foundPhoto?1:0));
    const old13=$('#old13'); if(old13) old13.onclick=()=>{ if(!state.readArchive){ vibration(30); set({readArchive:true,timeFound:true}); } };
  }

  function renderPhoto(){
    $('#cctv').classList.toggle('found',state.foundPhoto);
    $('#photoFinding').classList.toggle('is-hidden',!state.foundPhoto);
    $('#photoFinding').innerHTML=state.foundPhoto?'<strong>異常を記録しました。</strong><br>23:47:51 / 12番ホーム奥。閉鎖後の構内に人影。勤務者一覧と一致なし。':'';
    $('#cctvTime').textContent=state.clockSet?'23:48:00':'23:47:51';
  }

  function renderMap(){
    const p=$('#platforms');
    p.innerHTML=[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<div class="platform">${n}</div>`).join('') + (state.clockSet?'<button id="p13" class="platform thirteen">13 / UNKNOWN</button>':'');
    $('#mapSubtitle').textContent=state.clockSet?'現在地情報に異常':'現行構内図';
    $('#mapState').textContent=state.clockSet?'ERROR':'LIVE';
    $('#mapHint').textContent=state.clockSet?'MAPデータに存在しないホームが割り込んでいる。位置情報：取得不能。':'現在の構内図には12番ホームまでしか存在しない。';
    $('#hiddenStairs').classList.toggle('is-hidden',!state.clockSet);
    $('#enter13').classList.toggle('is-hidden',!state.platform13);
    const p13=$('#p13'); if(p13) p13.onclick=()=>{ vibration([40,60,40]); set({platform13:true}); $('#screen').classList.add('glitch'); setTimeout(()=>$('#screen').classList.remove('glitch'),450); };
  }

  function toastGlitch(){ $('#screen').classList.add('glitch'); setTimeout(()=>$('#screen').classList.remove('glitch'),450); }

  $$('[data-open]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.open)));
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>openView('home')));
  $$('[data-home]').forEach(b=>b.addEventListener('click',()=>openView('home')));

  $$('.query-chips button').forEach(b=>b.addEventListener('click',()=>renderSearch(b.dataset.query)));

  $('#photoHotspot').addEventListener('click',()=>{
    if(!state.foundPhoto){ vibration([20,30,60]); set({foundPhoto:true}); toastGlitch(); }
  });

  $('#clockBtn').addEventListener('click',()=>{ $('#clockSheet').classList.add('is-open'); $('#clockSheet').setAttribute('aria-hidden','false'); });
  $('[data-close-clock]').addEventListener('click',closeClock);
  function closeClock(){ $('#clockSheet').classList.remove('is-open'); $('#clockSheet').setAttribute('aria-hidden','true'); }
  $$('[data-time]').forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.dataset.time==='23:48' && !state.timeFound){ $('#clockHint').textContent='その時刻を示す根拠がまだない。'; vibration(15); return; }
    if(btn.dataset.time==='23:48'){
      closeClock(); set({clockSet:true}); vibration([35,40,35]); toastGlitch(); setTimeout(()=>openView('map'),650);
    } else { closeClock(); if(state.clockSet) set({clockSet:false,platform13:false}); }
  }));

  $('#enter13').addEventListener('click',()=>openView('terminal'));
  $('#pickupClue').addEventListener('click',()=>{ vibration([70,60,110]); set({finished:true}); $('#ending').classList.add('is-open'); });
  $('#endingHome').addEventListener('click',()=>{ $('#ending').classList.remove('is-open'); openView('home'); $('#caseBadge').textContent='CASE 02?'; $('#homeNoticeText').textContent='02:13 / UNKNOWN CALLER'; });

  $('#homeNotice').addEventListener('click',()=>openView(state.brief?'message':'case'));
  $('#startBtn').addEventListener('click',()=>{ state.started=true; save(); $('#intro').classList.remove('is-open'); openView('case'); });

  if(state.started) $('#intro').classList.remove('is-open');
  openView(state.view || 'home');
  render();
})();
