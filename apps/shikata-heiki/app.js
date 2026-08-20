const $=s=>document.querySelector(s);
const scenarios=[
{tag:'予定外',text:'予定が30分ずれた。',thought:'「予定どおりに進んでほしかった」',xp:3},
{tag:'対人',text:'返信がまだ来ない。',thought:'「普通はもう返ってくるはず」',xp:4},
{tag:'仕事',text:'自分の提案が通らなかった。',thought:'「せっかく考えたのに」',xp:8},
{tag:'結果',text:'期待した数字に届かなかった。',thought:'「もっと上手くいくと思った」',xp:10},
{tag:'予定外',text:'楽しみにしていた予定が中止になった。',thought:'「今日を楽しみにしていたのに」',xp:7},
{tag:'対人',text:'相手の反応が思ったより薄かった。',thought:'「もっと喜んでくれると思った」',xp:6},
{tag:'仕事',text:'急な変更が入って、やり直しになった。',thought:'「今さら変えないでほしい」',xp:9},
{tag:'日常',text:'欲しかったものが売り切れていた。',thought:'「今日買えるつもりだった」',xp:3},
{tag:'対人',text:'こちらの意図がうまく伝わらなかった。',thought:'「ちゃんと分かってほしかった」',xp:7},
{tag:'結果',text:'頑張ったのに、評価は普通だった。',thought:'「もっと報われると思った」',xp:10},
{tag:'日常',text:'電車が遅れている。',thought:'「時間どおり来てほしい」',xp:3},
{tag:'仕事',text:'準備したのに、本番で使われなかった。',thought:'「何のためにやったんだ」',xp:8}
];
const stages=[
{label:'LEVEL 1 · 我慢できる',cue:'嫌でもいい。反応を増やさず、流す。',echo:'「なんで？」'},
{label:'LEVEL 2 · 気にしない',cue:'思い通りじゃない。それだけ。次。',echo:'「まあ、いいか」'},
{label:'LEVEL 3 · 感謝できる',cue:'予定外も、耐性を育てる1回になる。',echo:'「経験値」'},
{label:'LEVEL 4 · 気にならない',cue:'処理しなくていい。起きた。……次。',echo:'……'}
];
let deck=[],index=0,earned=0,currentLevel=0,startX=0,deltaX=0,dragging=false,animating=false;
let totalXp=Number(localStorage.getItem('unplannedToleranceXp')||0);$('#xp').textContent=totalXp;
function levelFromXp(xp){return xp>=240?3:xp>=120?2:xp>=50?1:0}
function shuffle(){return [...scenarios].sort(()=>Math.random()-.5).slice(0,8)}
function show(id){['intro','training','real','result'].forEach(x=>$('#'+x).hidden=x!==id)}
function begin(){deck=shuffle();index=0;earned=0;currentLevel=levelFromXp(totalXp);show('training');render()}
function render(){animating=false;const s=stages[currentLevel],item=deck[index];$('#levelLabel').textContent=s.label;$('#cue').textContent=s.cue;$('#echo').textContent=s.echo;$('#count').textContent=index+1;$('#progress').style.width=((index+1)/deck.length*100)+'%';$('#tag').textContent=item.tag;$('#scenario').textContent=item.text;$('#thought').textContent=item.thought;resetCard()}
function resetCard(){const c=$('#card');c.classList.remove('dragging');c.style.transition='transform .24s ease,opacity .24s ease';c.style.transform='translate3d(0,0,0) rotate(0)';c.style.opacity='1'}
function fly(dir=1){if(animating)return;animating=true;const c=$('#card');const item=deck[index];earned+=item.xp;c.style.transition='transform .28s cubic-bezier(.2,.8,.2,1),opacity .25s';c.style.transform=`translate3d(${dir*125}vw,-6vh,0) rotate(${dir*18}deg)`;c.style.opacity='0';if(navigator.vibrate)navigator.vibrate(12);setTimeout(next,220)}
function next(){index++;if(index>=deck.length)return finish();currentLevel=levelFromXp(totalXp+earned);render()}
function finish(){totalXp+=earned;localStorage.setItem('unplannedToleranceXp',String(totalXp));$('#xp').textContent=totalXp;const lv=levelFromXp(totalXp);$('#earned').textContent=earned;$('#resultTitle').textContent=stages[lv].label.replace(/^LEVEL \d · /,'')+'へ。';$('#resultCopy').textContent=lv===3?'目標は「気にしないようにする」ことではなく、そもそも反応しなくなること。':'思い通りにならなかった回数を、耐性の経験値に変えていく。';$('#path').innerHTML=stages.map((s,i)=>`<div class="${i<=lv?'done':''}">${i+1}<br>${s.label.split('· ')[1]}</div>`).join('');show('result')}
$('#startBtn').onclick=begin;$('#againBtn').onclick=begin;$('#realBtn').onclick=()=>show('real');$('#backBtn').onclick=()=>show('intro');$('#tapFallback').onclick=()=>fly(1);
$('#realStart').onclick=()=>{const text=$('#realText').value.trim();if(!text){$('#realText').focus();return}deck=[{tag:'いま',text,thought:'「こうなってほしかった」',xp:12}];index=0;earned=0;currentLevel=levelFromXp(totalXp);show('training');render()};
const card=$('#card');card.addEventListener('pointerdown',e=>{if(animating)return;dragging=true;startX=e.clientX;deltaX=0;card.setPointerCapture?.(e.pointerId);card.classList.add('dragging')});card.addEventListener('pointermove',e=>{if(!dragging||animating)return;deltaX=e.clientX-startX;card.style.transform=`translate3d(${deltaX}px,0,0) rotate(${deltaX/18}deg)`;card.style.opacity=String(Math.max(.35,1-Math.abs(deltaX)/320))});function release(){if(!dragging||animating)return;dragging=false;card.classList.remove('dragging');Math.abs(deltaX)>72?fly(deltaX>0?1:-1):resetCard()}card.addEventListener('pointerup',release);card.addEventListener('pointercancel',release);card.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')fly(-1);if(e.key==='ArrowRight'||e.key==='Enter')fly(1)});
