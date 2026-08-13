(() => {
  const KEY='hitobito_404_simple_v1';
  const fresh={started:false,readRumor:false,search:false,photo:false,map:false,synced:false,entered:false,finished:false,screen:'rumor'};
  let s=load(); let audio=null;
  const $=q=>document.querySelector(q);
  function load(){try{return {...fresh,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...fresh}}}
  function save(){localStorage.setItem(KEY,JSON.stringify(s))}
  function set(p){s={...s,...p};save();render()}
  function doneCount(){return [s.search,s.photo,s.map].filter(Boolean).length}
  function stage(){if(s.finished)return 4;if(s.synced||s.entered)return 4;if(doneCount()===3)return 3;if(s.readRumor)return 2;return 1}
  function beep(freq=220,dur=.08){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.value=.025;o.connect(g).connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.stop(audio.currentTime+dur)}catch{}}
  function buzz(){if(navigator.vibrate)navigator.vibrate([25,35,45])}
  function toast(title,body){$('#toast').innerHTML=`<b>${title}</b><p>${body}</p>`;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2200)}
  function glitch(){const sh=$('.shell');sh.classList.add('glitch');setTimeout(()=>sh.classList.remove('glitch'),430)}
  function renderStages(){document.querySelectorAll('.stage').forEach((el,i)=>{const n=i+1;el.classList.toggle('done',n<stage());el.classList.toggle('current',n===stage())})}
  function render(){
    renderStages();
    document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('open',x.dataset.screen===s.screen));
    $('#count').textContent=`${doneCount()} / 3`;
    $('#taskSearch').className='task '+(s.search?'done':'available');
    $('#taskPhoto').className='task '+(s.photo?'done':s.search?'available':'locked');
    $('#taskMap').className='task '+(s.map?'done':s.photo?'available':'locked');
    $('#taskSearch .state').textContent=s.search?'確認済':'調べる';
    $('#taskPhoto .state').textContent=s.photo?'確認済':s.search?'調べる':'LOCK';
    $('#taskMap .state').textContent=s.map?'確認済':s.photo?'調べる':'LOCK';
    $('#syncBtn').style.display=doneCount()===3&&!s.synced?'flex':'none';
    $('#searchResult').style.display=s.search?'block':'none';
    $('#photoFrame').classList.toggle('found',s.photo);
    $('#photoSuccess').style.display=s.photo?'block':'none';
    $('#mapOld').style.display=s.map?'grid':'none';
    $('#mapSuccess').style.display=s.map?'block':'none';
  }
  function go(name){s.screen=name;save();render();window.scrollTo(0,0)}

  $('#start').onclick=()=>{beep();set({started:true,readRumor:true,screen:'tasks'});toast('調査開始','噂と現実が食い違う点を3つ確認してください。')};
  $('#taskSearch').onclick=()=>{if(!s.search)go('search');else go('search')};
  $('#taskPhoto').onclick=()=>{if(!s.search){toast('まだ調べられません','まず駅の記録を確認してください。');return}go('photo')};
  $('#taskMap').onclick=()=>{if(!s.photo){toast('まだ調べられません','監視画像を先に確認してください。');return}go('map')};
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>go('tasks'));
  $('#doSearch').onclick=()=>{beep(260);buzz();set({search:true});toast('矛盾 1/3','現行記録には13番ホームが存在しません。');setTimeout(()=>go('tasks'),700)};
  $('#photoSpot').onclick=()=>{if(s.photo)return;beep(150,.15);buzz();set({photo:true});glitch();toast('矛盾 2/3','閉鎖後のホームに、勤務記録のない人影。');setTimeout(()=>go('tasks'),900)};
  $('#mapTap').onclick=()=>{if(s.map)return;beep(190);buzz();set({map:true});toast('矛盾 3/3','1996年以前の資料にだけ13番線が残っています。');setTimeout(()=>go('tasks'),800)};
  $('#syncBtn').onclick=()=>{beep(70,.3);buzz();set({synced:true,screen:'sync'});glitch()};
  $('#syncGo').onclick=()=>{beep(55,.4);buzz();set({entered:true,screen:'encounter'});glitch()};
  $('#clue').onclick=()=>{beep(110,.22);buzz();set({finished:true,screen:'ending'})};
  $('#restart').onclick=()=>{localStorage.removeItem(KEY);location.reload()};
  render();
})();