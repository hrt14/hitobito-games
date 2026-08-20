const $=s=>document.querySelector(s);
const screens=['homeScreen','pickScreen','expectScreen','controlScreen','actionScreen','resultScreen','practiceScreen'];
const presets=[
{label:'予定が崩れた',event:'予定どおりに進まなかった。',expect:'予定どおりに進んでほしかった'},
{label:'相手が期待どおりじゃない',event:'相手の反応が思ったものと違った。',expect:'期待した反応をしてほしかった'},
{label:'結果が出なかった',event:'期待した結果にならなかった。',expect:'もっと良い結果になると思っていた'},
{label:'断られた・通らなかった',event:'自分の希望や提案が通らなかった。',expect:'受け入れてもらいたかった'},
{label:'急に変更された',event:'途中で予定や条件が変わった。',expect:'このまま進んでほしかった'},
{label:'待たされた',event:'思ったより待つことになった。',expect:'もっと早く進んでほしかった'}
];
const practice=[
'電車が5分遅れた。','欲しかったものが売り切れていた。','返信が今日中に来なかった。','会議の予定が急に変わった。','準備した案が採用されなかった。','相手の反応が薄かった。','雨で予定を変えることになった。','思ったより時間がかかった。'
];
let selected=null,startX=0,dx=0,drag=false,animating=false,practiceDeck=[],practiceIndex=0;
let done=Number(localStorage.getItem('shikataHeikiDone')||0);$('#doneCount').textContent=done+'回';
function show(id){screens.forEach(s=>$('#'+s).hidden=s!==id);window.scrollTo(0,0)}
function buildChoices(){const box=$('#choices');box.innerHTML='';presets.forEach(p=>{const b=document.createElement('button');b.className='choice';b.innerHTML=`<b>${p.label}</b><span>→</span>`;b.onclick=()=>choose(p);box.appendChild(b)})}
function choose(p){selected={...p};$('#eventText').textContent=selected.event;$('#factText').textContent=selected.event;$('#expectText').textContent='「'+selected.expect+'」';show('expectScreen');resetExpect()}
function resetExpect(){animating=false;const c=$('#expectCard');c.style.transition='transform .2s ease,opacity .2s';c.style.transform='translateX(0) rotate(0)';c.style.opacity='1'}
function releaseExpectation(dir=1){if(animating)return;animating=true;const c=$('#expectCard');c.style.transition='transform .32s cubic-bezier(.2,.8,.2,1),opacity .25s';c.style.transform=`translateX(${dir*120}vw) rotate(${dir*12}deg)`;c.style.opacity='0';navigator.vibrate?.(10);setTimeout(()=>show('controlScreen'),230)}
function complete(action=''){done++;localStorage.setItem('shikataHeikiDone',String(done));$('#doneCount').textContent=done+'回';$('#resultEvent').textContent=selected?.event||'思い通りにならない出来事';$('#resultAction').textContent=action?`次にやること：${action}`:'変えられない部分は、ここで終わり。';const level=done>=30?4:done>=15?3:done>=5?2:1;const names=['','我慢できる','気にしない','感謝できる','気にならない'];$('#levelupText').textContent=`いまの段階：${names[level]}　｜　練習 ${done}回`;$('#resultTitle').textContent=action?'次に変えられることだけやる。':'これは、ここまで。';$('#resultCopy').textContent=action?'思い通りじゃなかった。でも、全部を取り戻さなくていい。':'変えられないことを、頭の中で何度もやり直さない。';show('resultScreen')}
function startPractice(){practiceDeck=[...practice].sort(()=>Math.random()-.5).slice(0,5);practiceIndex=0;show('practiceScreen');renderPractice()}
function renderPractice(){const finished=practiceIndex>=practiceDeck.length;if(finished){done++;localStorage.setItem('shikataHeikiDone',String(done));$('#doneCount').textContent=done+'回';selected={event:'思い通りにならない練習を5問完了した。'};completePracticeResult();return}$('#practiceNo').textContent=`${practiceIndex+1} / 5`;$('#practiceEvent').textContent=practiceDeck[practiceIndex]}
function completePracticeResult(){const level=done>=30?4:done>=15?3:done>=5?2:1;const names=['','我慢できる','気にしない','感謝できる','気にならない'];$('#resultEvent').textContent='予定外を5回、止まらず通した。';$('#resultAction').textContent='現実でも「思った通りじゃない」で止まり続けない。';$('#levelupText').textContent=`いまの段階：${names[level]}　｜　練習 ${done}回`;$('#resultTitle').textContent='予定外は、起きる。';$('#resultCopy').textContent='問題は「起きたこと」より、そのあと何度も抵抗し続けること。';show('resultScreen')}
$('#nowBtn').onclick=()=>show('pickScreen');$('#practiceBtn').onclick=startPractice;$('#pickBack').onclick=()=>show('homeScreen');$('#customBtn').onclick=()=>{$('#customBox').hidden=false;$('#customText').focus()};$('#customGo').onclick=()=>{const v=$('#customText').value.trim();if(!v)return $('#customText').focus();choose({event:v,expect:'こうなってほしかった'})};$('#expectTap').onclick=()=>releaseExpectation(1);$('#canBtn').onclick=()=>show('actionScreen');$('#cantBtn').onclick=()=>complete('');$('#actionDone').onclick=()=>complete($('#actionText').value.trim());$('#skipAction').onclick=()=>complete('');$('#finishBtn').onclick=()=>show('homeScreen');$('#againBtn').onclick=()=>show('pickScreen');$('#practiceBack').onclick=()=>show('homeScreen');$('#practiceNext').onclick=()=>{practiceIndex++;renderPractice()};
const card=$('#expectCard');card.addEventListener('pointerdown',e=>{if(animating)return;drag=true;startX=e.clientX;dx=0;card.setPointerCapture?.(e.pointerId)});card.addEventListener('pointermove',e=>{if(!drag||animating)return;dx=e.clientX-startX;card.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;card.style.opacity=String(Math.max(.35,1-Math.abs(dx)/300))});function endDrag(){if(!drag)return;drag=false;Math.abs(dx)>70?releaseExpectation(dx>0?1:-1):resetExpect()}card.addEventListener('pointerup',endDrag);card.addEventListener('pointercancel',endDrag);card.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')releaseExpectation(-1);if(e.key==='ArrowRight'||e.key==='Enter')releaseExpectation(1)});
buildChoices();
