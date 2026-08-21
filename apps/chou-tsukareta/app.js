const AXES = ['body', 'brain', 'emotion', 'people', 'wip'];
const AXIS_LABELS = { body: '体', brain: '脳', emotion: '感情', people: '対人', wip: '未完了' };
const STORAGE_KEY = 'levelup-chou-tsukareta-v1';

const questions = [
  {
    eyebrow: 'Q1 / FIRST SIGNAL', title: 'いま一番つらいのは？', sub: '理由ではなく、感覚で近いもの。',
    options: [
      ['▰','体が重い','動くこと自体がしんどい',{body:4}],
      ['≡','頭がいっぱい','考えが止まらない',{brain:4}],
      ['●','気分が重い','嫌さ・落ち込み・モヤモヤ',{emotion:4}],
      ['◎','人に削られた','会話・気遣い・評価で消耗',{people:4}],
      ['↻','やることが残ってる','未完了が頭から離れない',{wip:4}],
      ['?','もう分からない','全部まとめて疲れた',{body:1,brain:1,emotion:1,people:1,wip:1}],
    ]
  },
  {
    eyebrow: 'Q2 / WHEN YOU STOP', title: '止まった瞬間、何が出てくる？', sub: 'ぼーっとしたときに勝手に出るもの。',
    options: [
      ['Z','眠い・横になりたい','身体が休止を求める感じ',{body:3}],
      ['…','考えが次々つながる','頭のタブが閉じない',{brain:3,wip:1}],
      ['↺','嫌な場面を思い出す','感情がその場に残っている',{emotion:3}],
      ['◌','相手の顔や反応','どう思われたかが残る',{people:3,emotion:1}],
      ['□','未返信・未完了・予定','まだ終わっていないもの',{wip:3,brain:1}],
      ['—','何も出ない。ただ空っぽ','考える力もあまり残っていない',{body:2,brain:2}],
    ]
  },
  {
    eyebrow: 'Q3 / REMOVE ONE THING', title: '3分だけ消せるなら？', sub: '「回復」より、まず何をなくしたい？',
    options: [
      ['▾','刺激','音・画面・移動を減らしたい',{body:3}],
      ['×','思考','頭を空にしたい',{brain:3}],
      ['○','この嫌な感じ','感情との距離がほしい',{emotion:3}],
      ['⇥','人との接続','誰にも気を使いたくない',{people:3}],
      ['−','やること','抱えている量を減らしたい',{wip:3}],
    ]
  },
  {
    eyebrow: 'Q4 / WHAT COST MOST', title: '今日、一番削られたのは？', sub: '正確じゃなくていい。近いもの。',
    options: [
      ['↯','移動・睡眠不足・長時間','体力そのもの',{body:3}],
      ['◇','判断・会議・情報量','考える回数',{brain:3}],
      ['≈','失敗・不安・思い通りにならないこと','感情の揺れ',{emotion:3}],
      ['⇄','会話・気遣い・期待','対人処理',{people:3}],
      ['＋','タスク・締切・同時進行','背負っている量',{wip:3}],
    ]
  },
  {
    eyebrow: 'Q5 / WHAT WOULD HELP', title: '今、いちばん欲しいのは？', sub: 'このあと少しマシになるなら。',
    options: [
      ['◒','休んでいい感じ','いったん停止したい',{body:3}],
      ['⌫','頭が静かになる感じ','考えるのを終えたい',{brain:3}],
      ['↗','気分が抜ける感じ','感情を軽くしたい',{emotion:3}],
      ['│','境界線が戻る感じ','相手から自分を離したい',{people:3}],
      ['✓','ひとつ減った感じ','全部を抱えなくていい状態',{wip:3}],
    ]
  }
];

const apps = {
  'meeting-respawn': ['会議後リスポーン','ぐったりした状態から短く切り替える'],
  'boundary': ['境界線','今は入れないものを決める'],
  'nou-keshigomu': ['脳消しゴム','頭に残った仕事を外へ出して終える'],
  'zenbu-yaranai': ['全部やらない。','守る・縮める・逃がす・捨てる'],
  'one-thing': ['ひとつだけ。','WIPを増やさず1個だけ終える'],
  'nukeru': ['ぬける。','嫌な気分との距離を約1分で作る'],
  'mou-owatta': ['もう終わった','終わった出来事の反芻を止める'],
  'kininaranai': ['気にならない。','小さなノイズを拾わず通す'],
  'approval-off': ['他人軸OFF','評価を相手側へ返して自分軸へ戻る'],
  'kanji-warukatta': ['感じ悪かった？','気遣いと嫌われ不安を分ける'],
  'task-separation': ['課題の分離','自分の課題だけに戻る'],
  'extra-load': ['余計な負荷','自分で足している重さを外す'],
  'my-job': ['それ、私の仕事？','全部を自分の仕事として背負わない'],
};

const profiles = {
  body: {
    badge:'01', title:'電池切れ型', lead:'理由を考えるより先に、使えるエネルギーそのものが少ない状態に近そうです。',
    pTitle:'判断を増やさず、まず止める。', pText:'3〜5分だけ「次に何をするか」を決めるのもやめる。座る・横になるなど、刺激と作業を減らしてから、再開するなら1個だけ。',
    primary:'meeting-respawn', secondary:['boundary','zenbu-yaranai']
  },
  brain: {
    badge:'02', title:'脳内タブ過多型', lead:'体力より、考える・判断する・覚えておく処理が積み上がっている可能性が高そうです。',
    pTitle:'頭の中から、いったん外へ。', pText:'未完了を3つまで外に出し、「今やる1つ」以外は閉じる。整理より先に、脳内で保持し続ける量を減らす。',
    primary:'nou-keshigomu', secondary:['zenbu-yaranai','one-thing']
  },
  emotion: {
    badge:'03', title:'感情残留型', lead:'出来事そのものより、嫌さ・不安・悔しさなどの感情がまだ身体と頭に残っている状態に近そうです。',
    pTitle:'解決より先に、距離を作る。', pText:'原因分析を始めず、今の嫌さを0〜10で置いてみる。少し離れてから、必要なら現実の対応を考える。',
    primary:'nukeru', secondary:['mou-owatta','kininaranai']
  },
  people: {
    badge:'04', title:'対人消耗型', lead:'会話・気遣い・相手の反応の読み取りにエネルギーを使いすぎている状態に近そうです。',
    pTitle:'相手の領域を、相手へ返す。', pText:'「相手がどう思うか」と「自分がどう行動するか」を分ける。必要な気遣いを1個だけ残し、それ以上の評価予測は扱わない。',
    primary:'approval-off', secondary:['kanji-warukatta','task-separation']
  },
  wip: {
    badge:'05', title:'未完了圧迫型', lead:'疲れの一部が、実際の作業量より「まだ残っている」を抱え続けることから来ていそうです。',
    pTitle:'全部やる前提を、先に壊す。', pText:'守る・縮める・逃がす・捨てるのどれかを1つ決める。減らしてから、残った1個だけを見る。',
    primary:'zenbu-yaranai', secondary:['extra-load','my-job']
  }
};

let step = 0;
let answers = [];
let scores = freshScores();

const $ = (id) => document.getElementById(id);
const screens = { start:$('startScreen'), question:$('questionScreen'), result:$('resultScreen') };

function freshScores(){ return {body:0,brain:0,emotion:0,people:0,wip:0}; }
function show(name){ Object.values(screens).forEach(s => s.classList.remove('active')); screens[name].classList.add('active'); window.scrollTo({top:0,behavior:'instant'}); }
function addScore(target, delta=1){ scores[target] = (scores[target] || 0) + delta; }
function applyWeights(weights, sign=1){ Object.entries(weights).forEach(([axis, value]) => addScore(axis, value*sign)); }

function renderQuestion(){
  const q = questions[step];
  $('progressText').textContent = `${step+1} / ${questions.length}`;
  $('progressBar').style.width = `${((step+1)/questions.length)*100}%`;
  $('questionEyebrow').textContent = q.eyebrow;
  $('questionTitle').textContent = q.title;
  $('questionSub').textContent = q.sub;
  $('choices').innerHTML = '';
  q.options.forEach(([icon,title,sub,weights], index) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'choice';
    btn.innerHTML = `<span class="icon">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span>`;
    btn.addEventListener('click', () => choose(index, weights));
    $('choices').appendChild(btn);
  });
  $('backBtn').style.visibility = step === 0 ? 'hidden' : 'visible';
}

function choose(index, weights){
  answers[step] = {index, weights};
  applyWeights(weights, 1);
  if (step < questions.length - 1){ step += 1; renderQuestion(); }
  else renderResult();
}

function goBack(){
  if (step === 0) return;
  const current = answers[step-1];
  if (current) applyWeights(current.weights, -1);
  answers.splice(step-1, 1);
  step -= 1;
  renderQuestion();
}

function sortedAxes(){ return AXES.slice().sort((a,b) => scores[b]-scores[a]); }

function makeResultData(){
  const sorted = sortedAxes();
  const primary = sorted[0];
  const secondary = sorted[1];
  const mixed = scores[primary] - scores[secondary] <= 2;
  return {primary, secondary, mixed, scores:{...scores}, profile:profiles[primary]};
}

function renderResult(saved=null){
  const data = saved || makeResultData();
  const {primary,secondary,mixed,profile} = data;
  $('resultBadge').textContent = mixed ? 'MIX' : profile.badge;
  $('resultTitle').textContent = mixed ? `${profile.title}＋${profiles[secondary].title}` : profile.title;
  $('resultLead').textContent = mixed ? `ひとつの原因ではなく、「${AXIS_LABELS[primary]}」と「${AXIS_LABELS[secondary]}」の疲れが重なっていそうです。まず${AXIS_LABELS[primary]}側を軽くすると、他もほどきやすくなります。` : profile.lead;
  $('primaryAxis').textContent = mixed ? `${AXIS_LABELS[primary]} × ${AXIS_LABELS[secondary]}` : AXIS_LABELS[primary];
  $('prescriptionTitle').textContent = profile.pTitle;
  $('prescriptionText').textContent = profile.pText;
  renderMeters(data.scores || scores);
  renderApps(profile);
  if (!saved){
    const payload = {...data, savedAt:Date.now()};
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }catch{}
  }
  show('result');
}

function renderMeters(values){
  const max = Math.max(...AXES.map(a => values[a] || 0),1);
  $('meters').innerHTML = AXES.map(axis => {
    const val = values[axis] || 0;
    const pct = Math.max(4, Math.round((val/max)*100));
    return `<div class="meter-row"><span>${AXIS_LABELS[axis]}</span><div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div><b>${val}</b></div>`;
  }).join('');
}

function renderApps(profile){
  const [title, desc] = apps[profile.primary];
  $('primaryApp').href = `/apps/${profile.primary}/`;
  $('primaryAppTitle').textContent = title;
  $('primaryAppDesc').textContent = desc;
  $('secondaryApps').innerHTML = profile.secondary.map(slug => {
    const [t,d] = apps[slug];
    return `<a class="secondary-app" href="/apps/${slug}/"><strong>${t} ↗</strong><small>${d}</small></a>`;
  }).join('');
}

function reset(){ step=0; answers=[]; scores=freshScores(); renderQuestion(); show('question'); }
function loadSaved(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{return null;} }

$('startBtn').addEventListener('click', reset);
$('backBtn').addEventListener('click', goBack);
$('againBtn').addEventListener('click', reset);
const saved = loadSaved();
if (saved?.profile && saved?.scores){
  $('lastResultBtn').hidden = false;
  $('lastResultBtn').addEventListener('click', () => renderResult(saved));
}
