(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const FINAL_FLOOR = 10;
  const MAX_CAPACITY = 8;
  const order = ['old','dog','rich','thief','scientist','alien','doctor','zombie','child','ghost'];

  const palette = {
    cream:'#eadfba', ink:'#1c201b', gold:'#b38d45', red:'#9e3b2d', green:'#4f6b4d', pale:'#d3c49c', white:'#ece5d5', dark:'#1a1f1a', skin:'#c89d78', zombie:'#71805f', alien:'#809686', blue:'#617e84', yellow:'#bd9c45'
  };

  const people = {
    old:{name:'老人',note:'「10階まで、まだ間に合うかな」',kind:'human'},
    dog:{name:'犬',note:'最初から乗る気でしっぽを振っている',kind:'animal'},
    rich:{name:'大金持ち',note:'金の懐中時計を何度も見ている',kind:'human'},
    thief:{name:'泥棒',note:'視線だけが車内を一周した',kind:'danger'},
    scientist:{name:'物忘れの科学者',note:'何を研究していたか思い出せない',kind:'human'},
    alien:{name:'宇宙人',note:'エレベーターの構造を知っている',kind:'weird'},
    doctor:{name:'医者',note:'「具合の悪い方はいませんか？」',kind:'human'},
    zombie:{name:'ゾンビ',note:'乗せていい顔ではない',kind:'danger'},
    child:{name:'子ども',note:'10階に何があるか知りたがっている',kind:'human'},
    ghost:{name:'幽霊',note:'定員には数えなくてよさそうだが……',kind:'weird'}
  };

  function svgWrap(body, view='0 0 120 160'){
    return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#25251f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  }
  const face = (cx,cy,rx,ry,fill,eyes='normal') => {
    const eye = eyes==='alien' ? `<ellipse cx="${cx-14}" cy="${cy}" rx="10" ry="15" fill="#101410"/><ellipse cx="${cx+14}" cy="${cy}" rx="10" ry="15" fill="#101410"/>` : eyes==='dead' ? `<circle cx="${cx-12}" cy="${cy}" r="6" fill="#d8c766"/><circle cx="${cx+12}" cy="${cy}" r="6" fill="#d8c766"/><circle cx="${cx-12}" cy="${cy}" r="2" fill="#151814"/><circle cx="${cx+12}" cy="${cy}" r="2" fill="#151814"/>` : `<circle cx="${cx-12}" cy="${cy}" r="4" fill="#1a1c18"/><circle cx="${cx+12}" cy="${cy}" r="4" fill="#1a1c18"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>${eye}`;
  };
  const art = {
    old:()=>svgWrap(`<path d="M48 39q-16-18 1-24 8 10 12-4 8 11 16 0 6 10 14 8 7 9-3 18" fill="#e7e1ce"/>${face(67,52,27,25,palette.skin)}<circle cx="55" cy="52" r="11" fill="none"/><circle cx="79" cy="52" r="11" fill="none"/><path d="M66 52h2M52 35q15-12 29 0M59 66q8 5 16 0" fill="none"/><path d="M41 86q25-18 52 1l8 49H32z" fill="#d7d4c8"/><path d="M58 84l10 19 10-19" fill="#344238"/><path d="M39 94l-12 35M90 94l8 35" fill="none"/><path d="M23 128v28M18 156h12" fill="none"/><rect x="77" y="91" width="29" height="38" rx="5" fill="#53665c"/><circle cx="91" cy="105" r="6" fill="#9fb095"/><path d="M88 91v-12q0-8 7-8 7 0 7-7" fill="none"/>`),
    dog:()=>svgWrap(`<path d="M33 57L21 27l27 14M85 57l15-30-29 16" fill="#a96e3e"/>${face(61,64,34,32,'#b97743')}<path d="M45 56q7-6 15 0M68 56q8-6 15 0" fill="none"/><ellipse cx="62" cy="72" rx="8" ry="6" fill="#2a2821"/><path d="M54 80q8 10 16 0" fill="none"/><path d="M40 91q22-15 43 0l14 48H25z" fill="#b77d49"/><path d="M35 100q26 14 52 0" fill="none" stroke="#8f3f2f" stroke-width="7"/><circle cx="61" cy="111" r="7" fill="#c8a557"/><path d="M35 137v17M84 137v17" fill="none"/>`),
    rich:()=>svgWrap(`<path d="M36 31h50l-5 17H41z" fill="#1a1d1b"/><path d="M48 11h27l8 20H39z" fill="#242521"/><path d="M42 25h38" stroke="#8c3428" stroke-width="7"/>${face(61,63,29,27,'#c99672')}<path d="M45 61h9M69 61h9M58 72q5 5 10 0" fill="none"/><path d="M38 93q21-17 47 0l13 49H24z" fill="#252821"/><path d="M30 95q31-10 63 0" stroke="#795d3d" stroke-width="9"/><path d="M49 96l12 17 13-17" fill="#8e3028"/><path d="M94 104v49M89 153h10" fill="none" stroke="#a98742" stroke-width="5"/><circle cx="94" cy="103" r="7" fill="#caa24b"/>`),
    thief:()=>svgWrap(`<path d="M29 65q5-44 32-46 29 5 34 46l-13-9H42z" fill="#252925"/>${face(61,67,26,24,'#aa8065')}<path d="M39 61q22-15 44 0l-4 14H43z" fill="#343431"/><circle cx="51" cy="66" r="4" fill="#b73e31"/><circle cx="72" cy="66" r="4" fill="#b73e31"/><path d="M52 78q9 7 19 0" fill="none"/><path d="M31 91q29-17 60 0l12 51H19z" fill="#222723"/><path d="M28 105l29 20M92 105l-30 20" fill="none"/><rect x="80" y="100" width="24" height="29" rx="7" fill="#755239"/>`),
    scientist:()=>svgWrap(`<path d="M47 30q-8-18 8-22 3 10 9 0 7 9 16 2 12 15 2 28" fill="#403a34"/>${face(64,50,26,24,'#c89d78')}<circle cx="54" cy="50" r="10" fill="none"/><circle cx="75" cy="50" r="10" fill="none"/><path d="M64 50h2M56 65q8 4 15 0" fill="none"/><path d="M36 83q28-18 56 0l13 57H21z" fill="#e0dfd4"/><path d="M54 84l10 17 10-17" fill="#58675c"/><rect x="76" y="91" width="23" height="31" rx="3" fill="#8e9a88"/><path d="M46 101l-12 36M83 102l12 35" fill="none"/><path d="M34 137q13 6 22 0" fill="none"/>`),
    alien:()=>svgWrap(`<path d="M61 19q30 2 31 35 0 37-31 46-31-10-31-46 1-33 31-35z" fill="#879b89"/>${face(61,59,28,35,'#879b89','alien')}<path d="M54 82q8 4 15 0" fill="none"/><path d="M41 100q20-12 40 0l9 50H31z" fill="#6f8275"/><path d="M32 105L17 129M88 105l18 20M106 125l8-12M106 125l10 0" fill="none"/><path d="M45 113q15 8 31 0" stroke="#7d5539" stroke-width="5"/>`),
    doctor:()=>svgWrap(`<path d="M39 30q8-20 45 0v12H39z" fill="#4e7b79"/>${face(62,58,27,25,'#c99d7a')}<path d="M38 57q24-8 48 0v13H38z" fill="#d8d5c9"/><circle cx="52" cy="55" r="4" fill="#18201b"/><circle cx="73" cy="55" r="4" fill="#18201b"/><path d="M35 87q28-15 55 0l13 54H22z" fill="#4f7d79"/><path d="M52 87v13q0 13 12 13 12 0 12-13V87" fill="none" stroke="#cad2c8" stroke-width="4"/><circle cx="64" cy="114" r="6" fill="#2c3f3b"/><rect x="78" y="102" width="24" height="28" rx="3" fill="#c8ba91"/><path d="M90 108v16M82 116h16" stroke="#7f372e" stroke-width="3"/>`),
    zombie:()=>svgWrap(`<path d="M41 34q8-28 42-9l-5 17q-22-5-37 7z" fill="#292e27"/>${face(62,63,29,29,palette.zombie,'dead')}<path d="M55 78q8 9 17 0" fill="none"/><path d="M37 91q25-18 54 0l15 54H18z" fill="#4e5546"/><path d="M36 96l15 13-11 18 20 10M86 98l-11 18 16 15" fill="none"/><path d="M26 104L10 133M97 105l16 25" fill="none"/><path d="M8 133l8-5M112 130l-7-8" fill="none"/>`),
    child:()=>svgWrap(`<path d="M38 42q7-28 47-6l8 30H29z" fill="#b79845"/>${face(61,62,25,24,'#d0a37c')}<circle cx="51" cy="60" r="4" fill="#20231e"/><circle cx="72" cy="60" r="4" fill="#20231e"/><path d="M55 74q6 4 12 0" fill="none"/><path d="M32 87q30-14 58 0l11 54H20z" fill="#b99c4b"/><path d="M45 98l-20 28M81 98l22 28" fill="none"/><circle cx="30" cy="121" r="13" fill="#8a633e"/><circle cx="25" cy="111" r="5" fill="#8a633e"/><circle cx="35" cy="111" r="5" fill="#8a633e"/><path d="M26 121h8" fill="none"/>`),
    ghost:()=>svgWrap(`<path d="M31 151q10-14 19 0 9-14 19 0 10-13 20 0V87q0-57-29-61-29 5-29 61z" fill="#d4d5cf" opacity=".85"/>${face(60,62,25,28,'#c9cbc6')}<path d="M47 50q5-28 14-31 13 9 18 36" fill="#333733"/><ellipse cx="51" cy="63" rx="5" ry="7" fill="#2b2f2b"/><ellipse cx="70" cy="63" rx="5" ry="7" fill="#2b2f2b"/><path d="M56 78q5-3 10 0" fill="none"/><path d="M40 93q20 14 40 0" fill="none"/>`),
    recovered:()=>svgWrap(`<path d="M40 29q10-20 43-5l-4 18H39z" fill="#3e493d"/>${face(61,59,27,26,'#a5a67f')}<circle cx="51" cy="58" r="4" fill="#23271f"/><circle cx="72" cy="58" r="4" fill="#23271f"/><path d="M54 73q8 6 16 0" fill="none"/><path d="M35 88q28-15 55 0l13 53H22z" fill="#626d58"/><path d="M39 103q23 13 46 0" fill="none" stroke="#c7c09b" stroke-width="4"/><rect x="77" y="92" width="20" height="13" rx="6" fill="#d0c68e"/>`)
  };

  const state = {floor:1,passengers:[],candidate:null,locked:false,mood:25,danger:12,wonder:8,device:false,started:false,serial:0,seen:new Set()};
  const els = {
    floorNum:$('floorNum'),hallFloorLabel:$('hallFloorLabel'),hallSign:$('hallSign'),candidate:$('candidate'),candidateArt:$('candidateArt'),candidateName:$('candidateName'),candidateNote:$('candidateNote'),doorFrame:$('doorFrame'),hall:$('hall'),passengers:$('passengers'),eventToast:$('eventToast'),controls:$('controls'),capacityNow:$('capacityNow'),moodBar:$('moodBar'),dangerBar:$('dangerBar'),wonderBar:$('wonderBar'),moodValue:$('moodValue'),dangerValue:$('dangerValue'),wonderValue:$('wonderValue'),endingCount:$('endingCount'),intro:$('intro'),endingScreen:$('endingScreen'),leftFeedback:$('leftFeedback'),rightFeedback:$('rightFeedback')
  };

  function has(id){return state.passengers.some(p=>p.id===id)}
  function setStatus(id,status){const p=state.passengers.find(x=>x.id===id);if(p)p.status=status}
  function mod(v){if(v.mood)state.mood=clamp(state.mood+v.mood);if(v.danger)state.danger=clamp(state.danger+v.danger);if(v.wonder)state.wonder=clamp(state.wonder+v.wonder)}
  function clamp(n){return Math.max(0,Math.min(100,n))}
  function key(a,b){return [a,b].sort().join('|')}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  const events = {
    'dog|old':()=>{setStatus('old','元気');mod({mood:22});return '<strong>犬 × 老人</strong>　犬が老人を元気にした。老人の背筋が少し伸びた。'},
    'rich|thief':()=>{setStatus('rich','財布なし');setStatus('thief','財布？');mod({danger:14,mood:-5});return '<strong>大金持ち × 泥棒</strong>　ドアが閉まった。大金持ちの財布が消えた。'},
    'alien|scientist':()=>{state.device=true;setStatus('scientist','思い出した');setStatus('alien','共同研究');mod({wonder:30,mood:8});return '<strong>科学者 × 宇宙人</strong>　二人が部品を交換した。科学者は研究内容を思い出した。'},
    'doctor|zombie':()=>{const z=state.passengers.find(p=>p.id==='zombie');if(z){z.id='recovered';z.name='元ゾンビ';z.status='平熱'}mod({danger:-28,mood:13,wonder:12});return '<strong>医者 × ゾンビ</strong>　39.8度。注射一本。……治った。'},
    'child|ghost':()=>{setStatus('child','会話中');setStatus('ghost','友だち');mod({wonder:18,mood:12,danger:-5});return '<strong>子ども × 幽霊</strong>　子どもが誰もいない場所に話しかけた。幽霊が初めて笑った。'},
    'doctor|old':()=>{setStatus('old','診察済');mod({mood:8,danger:-4});return '<strong>医者 × 老人</strong>　脈を診た。「10階までは大丈夫」'},
    'child|thief':()=>{setStatus('thief','気まずい');mod({danger:-8,mood:5});return '<strong>子ども × 泥棒</strong>　子どもが席を譲った。泥棒が盗んだ財布をそっと戻した。'},
    'alien|ghost':()=>{mod({wonder:20});return '<strong>宇宙人 × 幽霊</strong>　二人とも相手を珍しがっている。'},
    'dog|zombie':()=>{mod({danger:8,mood:-3});return '<strong>犬 × ゾンビ</strong>　犬が低く唸った。ゾンビだけが少し後ろへ下がった。'}
  };

  const endings = [
    {id:'empty',title:'無人の10階',icon:'ghost',test:()=>state.passengers.length===0,text:'十回すべて、誰も乗せなかった。10階の扉の向こうには、あなたのためだけの椅子が一脚あった。'},
    {id:'outbreak',title:'感染エレベーター',icon:'zombie',test:()=>has('zombie')&&state.danger>=45,text:'10階に着いたころ、もう誰も降りようとはしなかった。この箱だけが、地上から切り離された。'},
    {id:'contact',title:'最初の共同研究所',icon:'alien',test:()=>state.device&&has('alien'),text:'10階で未知の装置が起動した。扉の外は屋上ではなく、見たことのない星空につながっていた。'},
    {id:'gentle',title:'やさしい8人',icon:'dog',test:()=>has('old')&&has('dog')&&state.mood>=55&&state.danger<45,text:'席を譲り、話を聞き、少し笑った。10階までの短い時間に、知らない者同士は小さな家族になっていた。'},
    {id:'paranormal',title:'存在しない11階',icon:'ghost',test:()=>has('ghost')&&state.wonder>=45,text:'表示が一瞬だけ「11」になった。誰もボタンを押していない。幽霊だけが、先に扉の方を向いた。'},
    {id:'heist',title:'消えたもの、戻ったもの',icon:'thief',test:()=>has('thief')&&has('rich'),text:'10階で金持ちが財布を確かめた。中身は減っていたが、一枚だけ「ありがとう」と書かれた紙が入っていた。'},
    {id:'full',title:'満員の小さな社会',icon:'child',test:()=>state.passengers.length>=MAX_CAPACITY,text:'定員8人。立つ場所もない。それでも扉が開いた時、誰もすぐには降りなかった。'},
    {id:'society',title:'小さな社会',icon:'old',test:()=>true,text:'たった10回の選択だった。でも、誰を乗せたかで、この箱の空気はまるで違うものになった。'}
  ];

  function getFound(){try{return JSON.parse(localStorage.getItem('lastElevator10Endings')||'[]')}catch{return []}}
  function saveEnding(id){const f=getFound();const isNew=!f.includes(id);if(isNew){f.push(id);localStorage.setItem('lastElevator10Endings',JSON.stringify(f))}return {isNew,found:f}}

  function reset(){Object.assign(state,{floor:1,passengers:[],candidate:null,locked:false,mood:25,danger:12,wonder:8,device:false,started:true,serial:0,seen:new Set()});els.endingScreen.hidden=true;els.controls.classList.remove('locked');updateUI()}
  function chooseCandidate(){const id=order[state.floor-1];state.candidate={id,name:people[id].name,note:people[id].note,kind:people[id].kind,uid:`${id}-${++state.serial}`,status:''};renderCandidate()}
  function renderCandidate(){const p=state.candidate;els.floorNum.textContent=String(state.floor).padStart(2,'0');els.hallFloorLabel.textContent=`${state.floor}F / ${FINAL_FLOOR}F`;els.hallSign.textContent=`${state.floor}F`;els.candidateName.textContent=p.name;els.candidateNote.textContent=p.note;els.candidateArt.innerHTML=art[p.id]();const hues=[44,48,38,28,185,178,153,8,55,230];const h=hues[state.floor-1];els.hall.style.background=`linear-gradient(180deg,hsl(${h} 15% 64%),hsl(${h} 12% 43%) 55%,#3c3c35 56%,#1c1e1b 100%)`;els.candidate.classList.remove('entering');requestAnimationFrame(()=>els.candidate.classList.add('entering'))}
  function renderPassengers(){els.passengers.innerHTML='';els.passengers.classList.toggle('crowded',state.passengers.length>=7);state.passengers.forEach(p=>{const el=document.createElement('div');el.className='passenger';el.innerHTML=`${art[p.id]?art[p.id]():art.old()}${p.status?`<span class="status">${escapeHtml(p.status)}</span>`:''}`;els.passengers.appendChild(el)});els.capacityNow.textContent=state.passengers.length}
  function updateUI(){renderPassengers();for(const [k,v] of [['mood',state.mood],['danger',state.danger],['wonder',state.wonder]]){els[`${k}Bar`].style.width=`${v}%`;els[`${k}Value`].textContent=Math.round(v)}els.endingCount.textContent=`END ${getFound().length}/8`}
  function toast(html,ms=1250){els.eventToast.innerHTML=html;els.eventToast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>els.eventToast.classList.remove('show'),ms)}
  function resolvePair(newP){for(const other of state.passengers){if(other.uid===newP.uid)continue;const k=key(newP.id,other.id);if(events[k]&&!state.seen.has(k)){state.seen.add(k);toast(events[k](),1700);updateUI();return true}}return false}

  function decide(accept){if(state.locked||!state.started)return;state.locked=true;els.controls.classList.add('locked');const fb=accept?els.rightFeedback:els.leftFeedback;fb.classList.add('on');setTimeout(()=>fb.classList.remove('on'),300);let event=false;if(accept){if(state.passengers.length>=MAX_CAPACITY){toast('<strong>定員8名。</strong> この人は乗せられない。',900);mod({mood:-2})}else{state.passengers.push(state.candidate);mod({mood:1,wonder:state.candidate.kind==='weird'?4:0,danger:state.candidate.kind==='danger'?7:0});event=resolvePair(state.candidate)}}else{mod({mood:-1})}updateUI();setTimeout(()=>{els.doorFrame.classList.add('closing');setTimeout(()=>{els.doorFrame.classList.remove('closing');els.doorFrame.classList.add('closed');if(state.floor>=FINAL_FLOOR){setTimeout(showEnding,330);return}state.floor++;chooseCandidate();setTimeout(()=>{els.doorFrame.classList.remove('closed');setTimeout(()=>{state.locked=false;els.controls.classList.remove('locked')},370)},180)},390)},event?720:120)}

  function showEnding(){state.locked=true;const ending=endings.find(e=>e.test());const saved=saveEnding(ending.id);$('endingKicker').textContent=saved.isNew?'10F / NEW ENDING':'10F / ENDING';$('endingKicker').classList.toggle('new-ending',saved.isNew);$('endingIcon').innerHTML=art[ending.icon]();$('endingTitle').textContent=ending.title;$('endingText').textContent=ending.text;$('endingCast').innerHTML=state.passengers.map(p=>`<span>${art[p.id]?art[p.id]():art.old()}</span>`).join('')||'<span>—</span>';$('endingStats').innerHTML=`<span>機嫌 ${Math.round(state.mood)}</span><span>危険 ${Math.round(state.danger)}</span><span>怪異 ${Math.round(state.wonder)}</span><span>${state.passengers.length}/8人</span>`;els.endingCount.textContent=`END ${saved.found.length}/8`;els.endingScreen.hidden=false}
  function openFloor(){els.doorFrame.classList.add('closed');chooseCandidate();updateUI();setTimeout(()=>{els.doorFrame.classList.remove('closed');state.locked=false;els.controls.classList.remove('locked')},220)}
  function start(){els.intro.style.display='none';reset();openFloor()}
  function restart(){reset();openFloor()}

  let sx=0,sy=0,drag=false;const area=$('gameArea');area.addEventListener('pointerdown',e=>{if(state.locked||!state.started)return;sx=e.clientX;sy=e.clientY;drag=true});area.addEventListener('pointerup',e=>{if(!drag)return;drag=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.12)decide(dx>0)});area.addEventListener('pointercancel',()=>drag=false);$('acceptBtn').addEventListener('click',()=>decide(true));$('rejectBtn').addEventListener('click',()=>decide(false));$('startBtn').addEventListener('click',start);$('restartBtn').addEventListener('click',restart);window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();decide(true)}if(e.key==='ArrowLeft'){e.preventDefault();decide(false)}});updateUI();
})();
