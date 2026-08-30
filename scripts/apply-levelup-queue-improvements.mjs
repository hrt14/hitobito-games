import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.dist', 'firebase', 'apps');

function patchHtml(slug, transform) {
  const file = path.join(out, slug, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`${slug} production page missing`);
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${slug} patch made no change`);
  fs.writeFileSync(file, after);
}

patchHtml('thick-self', (html) => {
  if (html.includes('id="thick-self-layout-refresh-v1"')) return html;
  const css = `<style id="thick-self-layout-refresh-v1">
html[data-thick-theme] .shell{width:min(720px,calc(100% - 24px))!important;margin:0 auto!important;padding-bottom:88px!important}
html[data-thick-theme] .session-top{margin:10px 0 14px!important}
html[data-thick-theme] .scenario-card,html[data-thick-theme] .drill{border-radius:24px!important;box-shadow:none!important;border:1px solid var(--ts-line)!important}
html[data-thick-theme] .scenario-card{padding:20px!important;margin:0 0 12px!important}
html[data-thick-theme] .scenario-card h2{font-size:clamp(22px,5.7vw,31px)!important;line-height:1.28!important;margin-top:8px!important}
html[data-thick-theme] .drill{padding:18px!important}
html[data-thick-theme] .feedback{margin-top:18px!important;padding:16px!important;border-radius:22px!important;background:var(--ts-panel)!important;border:2px solid var(--ts-good)!important;box-shadow:none!important}
html[data-thick-theme] .feedback.bad{border-color:var(--ts-danger)!important;background:var(--ts-panel)!important}
html[data-thick-theme] .feedback-title{font-size:17px!important;line-height:1.35!important;color:var(--ts-good)!important;-webkit-text-fill-color:var(--ts-good)!important;margin-bottom:12px!important}
html[data-thick-theme] .feedback.bad .feedback-title{color:var(--ts-danger)!important;-webkit-text-fill-color:var(--ts-danger)!important}
html[data-thick-theme] .feedback-explain{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
html[data-thick-theme] .feedback-explain>div{padding:12px 13px!important;border-radius:14px!important;background:var(--ts-bg)!important;box-shadow:none!important;border:1px solid var(--ts-line)!important}
html[data-thick-theme] .feedback-explain b{display:block!important;margin-bottom:4px!important;font-size:12px!important;color:var(--ts-muted)!important;-webkit-text-fill-color:var(--ts-muted)!important}
html[data-thick-theme] .feedback-explain p{margin:0!important;font-size:14px!important;line-height:1.65!important}
html[data-thick-theme] .reward-pop{margin:10px 0!important;padding:10px 12px!important;border-radius:14px!important;box-shadow:none!important;background:var(--ts-accent-soft)!important}
html[data-thick-theme] .continue-btn{width:100%!important;min-height:50px!important;border-radius:15px!important}
@media(max-width:560px){html[data-thick-theme] .shell{width:calc(100% - 20px)!important}html[data-thick-theme] .scenario-card{padding:17px!important}html[data-thick-theme] .drill{padding:14px!important}html[data-thick-theme] .feedback{padding:13px!important}.top-actions #scienceBtn{display:none!important}}
</style>`;
  return html.replace('</head>', `${css}\n</head>`);
});
console.log('[Firebase] thick-self layout/readability polish applied.');

patchHtml('bedtime-best-case', (html) => {
  if (html.includes('id="guidedDreamBtn"')) return html;
  const button = `<button class="secondary" id="guidedDreamBtn" type="button" style="width:100%;margin-top:10px">入力なしで、質問からイメージする</button>`;
  html = html.replace('<div class="promise-row"', `${button}\n      <div class="promise-row"`);
  const panel = `<section class="screen" id="guidedDreamScreen">
    <div class="progress-row"><span id="guidedCount">1 / 8</span><div class="progress"><b id="guidedBar"></b></div><span>GUIDED DREAM</span></div>
    <div class="cut-editor" style="margin-top:20px"><p class="cut-kicker">QUESTION</p><h2 id="guidedQuestion"></h2><p class="cut-help" id="guidedHelp"></p><div class="suggestions" id="guidedChoices"></div><button class="back" id="guidedBackBtn" type="button">← ひとつ戻る</button></div>
  </section>
  <section class="screen" id="guidedResultScreen">
    <p class="eyebrow">YOUR IDEAL DAY</p><h2>もう映像はできている。</h2><p class="lead small">答えを文章にしなくていい。選んだ断片を、順番に頭の中でつなげる。</p><div class="storyboard" id="guidedStory"></div><div class="story-actions"><button class="primary" id="guidedReplayBtn" type="button">質問をもう一度見る <b>↻</b></button><button class="secondary" id="guidedHomeBtn" type="button">最初に戻る</button></div>
  </section>`;
  html = html.replace('</main>', `${panel}\n</main>`);
  const script = `<script id="bedtime-guided-dream-v1">
(()=>{const questions=[
['朝、どんな場所で目を覚ましたい？','最初に「場所」を置く。',['今の家が理想的になっている','静かな自然の近く','活気のある街','旅先のような場所']],
['窓の外は、どんな景色？','光・天気・音まで一瞬だけ見る。',['朝日と青空','木や緑が見える','街並みが広がる','海や水辺が見える']],
['起きた直後、誰がいる？','誰かがいる未来でも、一人の未来でもいい。',['一人で静かにいる','家族と過ごしている','大切な人がいる','仲間が近くにいる']],
['午前中、何に時間を使っている？','義務ではなく「自然にやっていること」を見る。',['好きな仕事に集中','ゆっくり考える時間','体を動かしている','人と会って話している']],
['仕事や活動は、どんな状態？','肩書きではなく、その場面を選ぶ。',['大きな仕事が進んでいる','自分のペースで働いている','人に喜ばれている','十分な余白がある']],
['時間とお金には、どんな感覚がある？','数字を決めず、余裕の感覚だけ置く。',['急がなくていい','必要なものを選べる','先の心配が少ない','やりたいことに使える']],
['夕方の体は、どんな感じ？','成功だけでなく体の感覚を入れる。',['まだ軽い','心地よく疲れている','深く呼吸できる','肩の力が抜けている']],
['眠る直前、何を見て「いい一日だった」と思う？','映画の最後の1枚を決める。',['静かな部屋の灯り','大切な人の表情','終えた仕事や作品','明日が楽しみな自分']]
];let i=0,a=[];const $=id=>document.getElementById(id);const screens=[...document.querySelectorAll('.screen')];const show=id=>{screens.forEach(s=>s.classList.toggle('active',s.id===id));scrollTo({top:0,behavior:'auto'})};function render(){const q=questions[i];$('guidedCount').textContent=(i+1)+' / '+questions.length;$('guidedBar').style.width=((i+1)/questions.length*100)+'%';$('guidedQuestion').textContent=q[0];$('guidedHelp').textContent=q[1];$('guidedChoices').innerHTML='';q[2].forEach(x=>{const b=document.createElement('button');b.type='button';b.className='suggestion';b.textContent=x;b.onclick=()=>{a[i]=x;if(i<questions.length-1){i++;render()}else finish()};$('guidedChoices').appendChild(b)});$('guidedBackBtn').style.visibility=i?'visible':'hidden'}function finish(){$('guidedStory').innerHTML=a.map((x,n)=>'<article class="story-card"><span class="num">'+String(n+1).padStart(2,'0')+'</span><small>IMAGE</small><strong>'+x+'</strong></article>').join('');show('guidedResultScreen')}$('guidedDreamBtn').onclick=()=>{i=0;a=[];render();show('guidedDreamScreen')};$('guidedBackBtn').onclick=()=>{if(i){i--;render()}else show('startScreen')};$('guidedReplayBtn').onclick=()=>{i=0;a=[];render();show('guidedDreamScreen')};$('guidedHomeBtn').onclick=()=>show('startScreen');})();
</script>`;
  return html.replace('</body>', `${script}\n</body>`);
});
console.log('[Firebase] bedtime-best-case guided no-input visualization flow applied.');
