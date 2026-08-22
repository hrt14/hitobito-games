(() => {
  'use strict';
  const BOOK_URL = '/books/shigoto-baisoku-kyokasho/book.json';
  const KEY = 'hitobito-audio-progress-v1';
  const state = { book:null, chapter:0, segment:0, segments:[], playing:false, rate:1, voice:null, sleepTimer:null };
  const $ = (id) => document.getElementById(id);

  function showView(name){
    $('home').classList.toggle('active', name==='home');
    $('playerView').classList.toggle('active', name==='player');
    location.hash = name==='player' ? 'listen' : 'home';
    scrollTo({top:0,behavior:'smooth'});
  }

  function chunkText(text, max=115){
    const raw = text.replace(/\r/g,'').split(/(?<=[。！？!?])|\n+/).map(s=>s.trim()).filter(Boolean);
    const out=[];
    for(const piece of raw){
      if(piece.length<=max){ out.push(piece); continue; }
      const parts = piece.split(/(?<=[、，,])/).filter(Boolean);
      let buf='';
      for(const part of parts){
        if((buf+part).length>max && buf){ out.push(buf); buf=''; }
        if(part.length>max){ for(let i=0;i<part.length;i+=max) out.push(part.slice(i,i+max)); }
        else buf+=part;
      }
      if(buf) out.push(buf);
    }
    return out;
  }

  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
      if(Number.isInteger(saved.chapter)) state.chapter=Math.min(Math.max(saved.chapter,0),16);
      if(Number.isInteger(saved.segment)) state.segment=Math.max(saved.segment,0);
      if(saved.rate) state.rate=Number(saved.rate)||1;
    }catch(_e){}
    $('rateSelect').value=String(state.rate);
  }
  function saveProgress(){ localStorage.setItem(KEY, JSON.stringify({chapter:state.chapter,segment:state.segment,rate:state.rate,updatedAt:Date.now()})); }

  function chooseVoice(){
    if (!('speechSynthesis' in window)) { $('voiceButton').textContent = '音声非対応'; return; }
    const voices = window.speechSynthesis.getVoices();
    const ja = voices.filter(v => /^ja([-_]|$)/i.test(v.lang));
    state.voice = ja.find(v=>/premium|enhanced|kyoko|otoya|nanami/i.test(v.name)) || ja[0] || null;
    $('voiceButton').textContent = state.voice ? state.voice.name : '日本語音声';
  }

  function renderChapters(){
    const root=$('chapterList'); root.innerHTML='';
    state.book.chapters.forEach((chapter,i)=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className='chapter'+(i===state.chapter?' active':'');
      btn.innerHTML=`<span class="chapter-no">${String(i+1).padStart(2,'0')}</span><span class="chapter-title"></span><span class="chapter-play">▶</span>`;
      btn.querySelector('.chapter-title').textContent=chapter.title;
      btn.addEventListener('click',()=>{ setChapter(i,0,true); play(); });
      root.appendChild(btn);
    });
  }

  function renderTranscript(){
    const chapter=state.book.chapters[state.chapter];
    const root=$('transcript'); root.innerHTML='';
    const h=document.createElement('h3'); h.textContent=chapter.title; root.appendChild(h);
    chapter.text.split(/\n+/).filter(Boolean).forEach(p=>{ const el=document.createElement('p'); el.textContent=p; root.appendChild(el); });
  }

  function updateUI(){
    if(!state.book) return;
    const ch=state.book.chapters[state.chapter];
    $('chapterName').textContent=ch.title;
    state.segments = chunkText(ch.text);
    if(state.segment>=state.segments.length) state.segment=Math.max(0,state.segments.length-1);
    const chapterRatio = state.segments.length ? state.segment/state.segments.length : 0;
    const overall=(state.chapter+chapterRatio)/state.book.chapters.length;
    const pct=Math.round(overall*100);
    $('progressBar').style.width=pct+'%'; $('progressText').textContent=pct+'%';
    $('segmentText').textContent=`${state.segment+1} / ${Math.max(1,state.segments.length)}`;
    $('playPause').textContent=state.playing?'Ⅱ':'▶';
    document.querySelectorAll('.chapter').forEach((el,i)=>el.classList.toggle('active',i===state.chapter));
    saveProgress();
  }

  function setChapter(index, segment=0, rerender=true){
    stop(false); state.chapter=Math.min(Math.max(index,0),state.book.chapters.length-1); state.segment=Math.max(segment,0);
    state.segments=chunkText(state.book.chapters[state.chapter].text);
    if(rerender){ renderTranscript(); renderChapters(); }
    updateUI();
  }

  function speakCurrent(){
    if(!state.playing) return;
    if(!state.segments.length){ nextChapter(); return; }
    const utterance=new SpeechSynthesisUtterance(state.segments[state.segment]);
    utterance.lang='ja-JP'; utterance.rate=state.rate; utterance.pitch=1;
    if(state.voice) utterance.voice=state.voice;
    utterance.onend=()=>{
      if(!state.playing) return;
      if(state.segment<state.segments.length-1){ state.segment++; updateUI(); speakCurrent(); }
      else if(state.chapter<state.book.chapters.length-1){ state.chapter++; state.segment=0; state.segments=chunkText(state.book.chapters[state.chapter].text); renderTranscript(); renderChapters(); updateUI(); speakCurrent(); }
      else stop(true);
    };
    utterance.onerror=(e)=>{ if(e.error!=='canceled' && e.error!=='interrupted'){ state.playing=false; updateUI(); $('segmentText').textContent='再生できません'; } };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); updateUI();
  }
  function play(){ if(!('speechSynthesis' in window)){ alert('このブラウザは音声読み上げに対応していません。'); return; } chooseVoice(); state.playing=true; updateUI(); speakCurrent(); }
  function stop(resetLabel=false){ if('speechSynthesis' in window) window.speechSynthesis.cancel(); state.playing=false; updateUI(); if(resetLabel) $('segmentText').textContent='読了'; }
  function togglePlay(){ state.playing?stop(false):play(); }
  function prev(){ stop(false); state.segment=Math.max(0,state.segment-1); updateUI(); play(); }
  function next(){ stop(false); if(state.segment<state.segments.length-1) state.segment++; else if(state.chapter<state.book.chapters.length-1){state.chapter++;state.segment=0;renderTranscript();renderChapters();state.segments=chunkText(state.book.chapters[state.chapter].text);} updateUI(); play(); }
  function nextChapter(){ if(state.chapter<state.book.chapters.length-1) setChapter(state.chapter+1,0,true); else stop(true); }

  function setSleep(minutes){
    if(state.sleepTimer) clearTimeout(state.sleepTimer); state.sleepTimer=null;
    if(minutes>0) state.sleepTimer=setTimeout(()=>{ stop(false); $('segmentText').textContent='スリープ停止'; $('sleepSelect').value='0'; },minutes*60*1000);
  }

  async function init(){
    const res=await fetch(BOOK_URL,{cache:'no-store'}); if(!res.ok) throw new Error('book load failed'); state.book=await res.json();
    loadProgress(); state.segments=chunkText(state.book.chapters[state.chapter].text); if(state.segment>=state.segments.length) state.segment=0;
    renderChapters(); renderTranscript(); updateUI(); chooseVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged',chooseVoice);
    $('openBook').addEventListener('click',()=>showView('player')); $('backHome').addEventListener('click',()=>{stop(false);showView('home')});
    $('playPause').addEventListener('click',togglePlay); $('prevSegment').addEventListener('click',prev); $('nextSegment').addEventListener('click',next);
    $('rateSelect').addEventListener('change',(e)=>{state.rate=Number(e.target.value)||1;saveProgress();if(state.playing)play()});
    $('sleepSelect').addEventListener('change',(e)=>setSleep(Number(e.target.value)||0));
    if(location.hash==='#listen') showView('player');
  }
  init().catch(()=>{ document.body.insertAdjacentHTML('beforeend','<div style="padding:20px;color:#ff9c7a">書籍データを読み込めませんでした。</div>'); });
  addEventListener('beforeunload',()=>stop(false));
})();
