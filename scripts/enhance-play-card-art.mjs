import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve('.dist/cloudflare/index.html');
if (!fs.existsSync(target)) throw new Error(`PLAY index not found: ${target}`);

let html = fs.readFileSync(target, 'utf8');
const MARKER = 'data-play-card-art="v1"';

function artKind(slug, category) {
  if (slug === 'outside-me') return 'door';
  if (slug === 'panda-tower') return 'panda';
  if (/deep-sea|ocean|whale|aqua|submarine/i.test(slug)) return 'ocean';
  if (/everest|mountain|climb|rescue/i.test(slug)) return 'mountain';
  if (/forest|green|nature|chain|food/i.test(slug)) return 'forest';
  if (/cctv|camera|horror|ghost|midnight|haunted|shuden|sankebetsu|yunagiso/i.test(slug)) return 'night';
  if (/tower|defense|planet|sim|shop|parking|restaurant/i.test(slug)) return 'city';
  if (/story|novel|record|title|memory|sound/i.test(slug)) return 'story';
  return category || 'other';
}

function decorateCards(markup) {
  return markup.replace(/<a class="game-card"([^>]*)href="\/apps\/([^/\"]+)\/"([^>]*)>([\s\S]*?)<\/a>/g, (match, before, encodedSlug, after, inner) => {
    let slug = encodedSlug;
    try { slug = decodeURIComponent(encodedSlug); } catch {}
    const category = (before + after).match(/data-category="([^"]+)"/)?.[1] || 'other';
    const kind = artKind(slug, category);
    if (inner.includes('class="play-card-scene"')) return match;
    const scene = '<span class="play-card-scene" aria-hidden="true"><i></i><b></b><em></em></span>';
    const nextInner = inner.replace(/(<span class="cover-number"[\s\S]*?<\/span>)/, `$1${scene}`);
    return `<a class="game-card"${before}href="/apps/${encodedSlug}/"${after} data-art="${kind}" data-slug="${slug}">${nextInner}</a>`;
  });
}

html = decorateCards(html);

const style = String.raw`
<style id="play-card-art-style" ${MARKER}>
  #games .game-card{
    position:relative;
    overflow:hidden;
    border-radius:24px!important;
    border:1px solid rgba(17,17,17,.1)!important;
    box-shadow:0 10px 28px rgba(12,18,28,.08);
    transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease!important;
  }
  #games .game-card:hover{transform:translateY(-5px)!important;box-shadow:0 24px 48px rgba(12,18,28,.16)!important;border-color:rgba(17,17,17,.16)!important}
  #games .cover{position:relative;isolation:isolate;aspect-ratio:1.48/1!important;overflow:hidden!important;background:#172033!important}
  #games .cover:before{content:""!important;position:absolute!important;inset:0!important;width:auto!important;height:auto!important;border:0!important;border-radius:0!important;right:auto!important;top:auto!important;background:radial-gradient(circle at 72% 20%,rgba(255,255,255,.32),transparent 24%),linear-gradient(150deg,var(--c1),var(--c2))!important;opacity:1!important;z-index:-4!important}
  #games .cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.04),transparent 42%,rgba(3,8,17,.22)),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:auto,42px 100%;mix-blend-mode:screen;opacity:.58;z-index:-1;pointer-events:none}
  #games .cover-number{z-index:8!important;left:14px!important;top:13px!important;padding:5px 8px;border-radius:999px;background:rgba(6,10,17,.23);border:1px solid rgba(255,255,255,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-size:9px!important;color:#fff!important;text-shadow:0 1px 8px rgba(0,0,0,.25)!important}
  #games .cover-symbol{z-index:6!important;right:12px!important;bottom:2px!important;font-size:62px!important;opacity:.22!important;filter:drop-shadow(0 10px 22px rgba(0,0,0,.16))}
  #games .cover-orbit{z-index:3!important;left:10px!important;bottom:18px!important;width:46%!important;height:29%!important;border-color:rgba(255,255,255,.28)!important;transform:rotate(-12deg)!important;opacity:.7!important}
  #games .play-card-scene{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
  #games .play-card-scene i,#games .play-card-scene b,#games .play-card-scene em{position:absolute;display:block;font-style:normal}

  /* Eerie doorway — used by 玄関の外に、自分がいる。 */
  #games .game-card[data-art="door"] .cover:before{background:radial-gradient(circle at 74% 28%,rgba(129,220,255,.28),transparent 22%),linear-gradient(125deg,#0a111b 0%,#111c2b 50%,#03070d 100%)!important}
  #games .game-card[data-art="door"] .play-card-scene i{right:11%;top:13%;width:36%;height:78%;border:2px solid rgba(159,221,255,.62);background:linear-gradient(90deg,rgba(83,180,225,.2),rgba(2,7,13,.82) 18%,#10141a 19% 100%);box-shadow:-14px 0 34px rgba(75,186,238,.24),inset 10px 0 18px rgba(88,196,244,.12)}
  #games .game-card[data-art="door"] .play-card-scene i:after{content:"";position:absolute;right:13%;top:52%;width:5px;height:5px;border-radius:50%;background:#d7b36a;box-shadow:0 0 0 2px #2d3339}
  #games .game-card[data-art="door"] .play-card-scene b{right:46%;bottom:12%;width:8%;height:36%;border-radius:46% 46% 18% 18%;background:linear-gradient(#020406,#06090d);filter:drop-shadow(0 0 12px rgba(82,193,238,.25))}
  #games .game-card[data-art="door"] .play-card-scene b:before{content:"";position:absolute;left:50%;top:-18%;width:74%;aspect-ratio:1;border-radius:50%;background:#030609;transform:translateX(-50%)}
  #games .game-card[data-art="door"] .play-card-scene em{left:10%;bottom:11%;width:54%;height:1px;background:rgba(154,216,244,.42);box-shadow:0 -14px 0 rgba(154,216,244,.16),0 -28px 0 rgba(154,216,244,.08);transform:rotate(-7deg)}

  /* Panda tower — cute stacked faces without external assets. */
  #games .game-card[data-art="panda"] .cover:before{background:radial-gradient(circle at 76% 18%,#fff4b4 0 6%,transparent 7%),linear-gradient(#6cc9ff 0 56%,#a7e4c1 57% 76%,#55a970 77% 100%)!important}
  #games .game-card[data-art="panda"] .cover:after{background:radial-gradient(ellipse at 20% 28%,rgba(255,255,255,.82) 0 9%,transparent 10%),radial-gradient(ellipse at 35% 20%,rgba(255,255,255,.72) 0 7%,transparent 8%),linear-gradient(180deg,transparent 70%,rgba(14,95,62,.13))!important;opacity:1}
  #games .game-card[data-art="panda"] .play-card-scene i,#games .game-card[data-art="panda"] .play-card-scene b,#games .game-card[data-art="panda"] .play-card-scene em{right:14%;width:27%;aspect-ratio:1.18/1;border-radius:48% 48% 44% 44%;background:radial-gradient(ellipse at 34% 43%,#1a2025 0 8%,transparent 9%),radial-gradient(ellipse at 66% 43%,#1a2025 0 8%,transparent 9%),radial-gradient(ellipse at 50% 58%,#20262b 0 4%,transparent 5%),#f8f7ef;border:2px solid rgba(35,42,45,.16);box-shadow:-15px -11px 0 -11px #20262b,15px -11px 0 -11px #20262b,0 8px 18px rgba(27,56,43,.14)}
  #games .game-card[data-art="panda"] .play-card-scene i{bottom:7%;transform:scale(1.05)}
  #games .game-card[data-art="panda"] .play-card-scene b{bottom:31%;right:20%;transform:scale(.88) rotate(-4deg)}
  #games .game-card[data-art="panda"] .play-card-scene em{bottom:52%;right:14%;transform:scale(.72) rotate(5deg)}

  /* Forest / nature */
  #games .game-card[data-art="forest"] .cover:before,#games .game-card[data-art="nature"] .cover:before{background:radial-gradient(circle at 76% 12%,rgba(255,247,177,.82),transparent 17%),linear-gradient(145deg,#0d3a2d,#2c7c48 58%,#0d2419)!important}
  #games .game-card[data-art="forest"] .play-card-scene i,#games .game-card[data-art="nature"] .play-card-scene i{right:13%;bottom:10%;width:28%;height:64%;border:3px solid rgba(226,255,196,.5);border-radius:70px 70px 8px 8px;background:linear-gradient(180deg,rgba(188,235,136,.18),rgba(8,42,30,.62));box-shadow:0 0 30px rgba(191,244,138,.22)}
  #games .game-card[data-art="forest"] .play-card-scene b,#games .game-card[data-art="nature"] .play-card-scene b{left:-8%;bottom:-31%;width:76%;height:60%;border-radius:50%;background:#0b2d20;transform:rotate(8deg);box-shadow:120px -28px 0 #14442d,210px -6px 0 #0a2c1e}
  #games .game-card[data-art="forest"] .play-card-scene em,#games .game-card[data-art="nature"] .play-card-scene em{right:6%;top:12%;width:58%;height:1px;background:rgba(249,255,211,.44);transform:rotate(64deg);box-shadow:15px 0 0 rgba(249,255,211,.28),30px 0 0 rgba(249,255,211,.16)}

  /* Ocean / deep sea */
  #games .game-card[data-art="ocean"] .cover:before{background:radial-gradient(circle at 74% 28%,rgba(62,218,255,.44),transparent 18%),linear-gradient(180deg,#113d66,#06203c 48%,#020916)!important}
  #games .game-card[data-art="ocean"] .play-card-scene i{right:10%;top:37%;width:44%;height:16%;border-radius:52% 45% 55% 48%;background:linear-gradient(180deg,#7ccfe0,#205b76);transform:rotate(-8deg);box-shadow:0 12px 25px rgba(0,0,0,.22)}
  #games .game-card[data-art="ocean"] .play-card-scene i:after{content:"";position:absolute;right:-13%;top:19%;width:25%;height:64%;background:#317b94;clip-path:polygon(0 50%,100% 0,78% 50%,100% 100%)}
  #games .game-card[data-art="ocean"] .play-card-scene b{left:10%;bottom:14%;width:72%;height:1px;background:rgba(90,208,238,.35);box-shadow:0 -26px 0 rgba(90,208,238,.12),0 -52px 0 rgba(90,208,238,.08)}
  #games .game-card[data-art="ocean"] .play-card-scene em{right:20%;top:16%;width:7px;height:7px;border-radius:50%;background:#bdf4ff;box-shadow:-36px 24px 0 -2px #8dd9eb,24px 31px 0 -2px #8dd9eb,49px 7px 0 -3px #8dd9eb,-63px 50px 0 -3px #8dd9eb}

  /* Mountain / adventure */
  #games .game-card[data-art="mountain"] .cover:before,#games .game-card[data-art="adventure"] .cover:before{background:radial-gradient(circle at 72% 18%,rgba(255,221,163,.7),transparent 16%),linear-gradient(160deg,#5aa0c4,#36556f 52%,#172536)!important}
  #games .game-card[data-art="mountain"] .play-card-scene i,#games .game-card[data-art="adventure"] .play-card-scene i{left:8%;right:5%;bottom:0;height:71%;background:linear-gradient(150deg,#bfcbd2 0 28%,#4e6675 29% 63%,#263846 64%);clip-path:polygon(0 100%,20% 55%,35% 77%,56% 16%,72% 62%,84% 45%,100% 100%)}
  #games .game-card[data-art="mountain"] .play-card-scene b,#games .game-card[data-art="adventure"] .play-card-scene b{right:22%;bottom:29%;width:6px;height:28%;background:#1b2430;border-radius:6px;transform:rotate(-8deg);box-shadow:0 -6px 0 3px #1b2430}
  #games .game-card[data-art="mountain"] .play-card-scene em,#games .game-card[data-art="adventure"] .play-card-scene em{left:9%;top:19%;width:58%;height:2px;background:rgba(255,255,255,.5);transform:rotate(-16deg);box-shadow:0 18px 0 rgba(255,255,255,.2)}

  /* Night / horror */
  #games .game-card[data-art="night"] .cover:before,#games .game-card[data-art="horror"] .cover:before{background:radial-gradient(circle at 76% 22%,rgba(255,110,117,.28),transparent 17%),linear-gradient(150deg,#351420,#11131d 58%,#07090e)!important}
  #games .game-card[data-art="night"] .play-card-scene i,#games .game-card[data-art="horror"] .play-card-scene i{right:10%;top:16%;width:31%;aspect-ratio:1;border-radius:50%;border:1px solid rgba(255,185,189,.55);box-shadow:0 0 45px rgba(255,99,110,.14),inset 0 0 28px rgba(255,120,128,.1)}
  #games .game-card[data-art="night"] .play-card-scene b,#games .game-card[data-art="horror"] .play-card-scene b{left:13%;bottom:12%;width:65%;height:42%;background:linear-gradient(160deg,transparent 0 22%,#0b0c12 23% 53%,transparent 54%),linear-gradient(20deg,transparent 0 38%,#15101a 39% 58%,transparent 59%);opacity:.9}
  #games .game-card[data-art="night"] .play-card-scene em,#games .game-card[data-art="horror"] .play-card-scene em{left:9%;bottom:18%;width:82%;height:1px;background:rgba(255,151,158,.22);box-shadow:0 -20px 0 rgba(255,151,158,.08)}

  /* City / simulation */
  #games .game-card[data-art="city"] .cover:before,#games .game-card[data-art="sim"] .cover:before{background:radial-gradient(circle at 76% 17%,rgba(255,239,172,.7),transparent 14%),linear-gradient(145deg,#ffb55f,#d96e5d 50%,#49305b)!important}
  #games .game-card[data-art="city"] .play-card-scene i,#games .game-card[data-art="sim"] .play-card-scene i{left:8%;right:8%;bottom:0;height:54%;background:linear-gradient(90deg,#5e3b55 0 12%,transparent 12% 16%,#744761 16% 32%,transparent 32% 38%,#4f3754 38% 56%,transparent 56% 61%,#835168 61% 78%,transparent 78% 83%,#563b58 83%);clip-path:polygon(0 100%,0 34%,12% 34%,12% 12%,28% 12%,28% 43%,42% 43%,42% 0,58% 0,58% 31%,72% 31%,72% 18%,86% 18%,86% 48%,100% 48%,100% 100%)}
  #games .game-card[data-art="city"] .play-card-scene b,#games .game-card[data-art="sim"] .play-card-scene b{right:11%;top:20%;width:21%;aspect-ratio:1;border-radius:50%;background:rgba(255,245,194,.75);box-shadow:0 0 26px rgba(255,239,166,.3)}
  #games .game-card[data-art="city"] .play-card-scene em,#games .game-card[data-art="sim"] .play-card-scene em{left:8%;bottom:20%;width:70%;height:2px;background:rgba(255,242,210,.28);transform:rotate(-7deg);box-shadow:0 -16px 0 rgba(255,242,210,.15)}

  /* Story / abstract fallback */
  #games .game-card[data-art="story"] .cover:before{background:radial-gradient(circle at 76% 24%,rgba(224,199,255,.45),transparent 18%),linear-gradient(145deg,#4d376d,#231b39 56%,#0c0c16)!important}
  #games .game-card[data-art="story"] .play-card-scene i{right:12%;top:17%;width:34%;height:62%;border:1px solid rgba(242,228,255,.42);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.02));transform:rotate(6deg);box-shadow:-16px 10px 0 rgba(207,179,255,.09)}
  #games .game-card[data-art="story"] .play-card-scene b{left:12%;bottom:17%;width:54%;height:1px;background:rgba(239,222,255,.42);box-shadow:0 -18px 0 rgba(239,222,255,.17),0 -36px 0 rgba(239,222,255,.08);transform:rotate(-8deg)}
  #games .game-card[data-art="story"] .play-card-scene em{right:24%;top:20%;width:11%;aspect-ratio:1;border-radius:50%;background:#e5c8ff;box-shadow:0 0 28px rgba(217,185,255,.34)}

  #games .game-card[data-art="other"] .play-card-scene i,#games .game-card[data-art="other"] .play-card-scene b,#games .game-card[data-art="other"] .play-card-scene em{border:1px solid rgba(255,255,255,.38);background:rgba(255,255,255,.08);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
  #games .game-card[data-art="other"] .play-card-scene i{right:11%;top:15%;width:33%;aspect-ratio:1;border-radius:28% 72% 56% 44%;transform:rotate(18deg)}
  #games .game-card[data-art="other"] .play-card-scene b{left:10%;bottom:15%;width:51%;height:30%;border-radius:50%;transform:rotate(-13deg)}
  #games .game-card[data-art="other"] .play-card-scene em{right:32%;bottom:14%;width:13%;aspect-ratio:1;transform:rotate(45deg)}

  #games .card-body{position:relative!important;z-index:10!important;padding:16px 16px 18px!important;background:linear-gradient(180deg,#fff,#fbfbf8)!important}
  #games .game-card h3{font-size:20px!important;line-height:1.12!important;letter-spacing:-.04em!important;margin-bottom:8px!important;color:#121417!important}
  #games .game-card p{font-size:12px!important;line-height:1.58!important;color:#5d625f!important}
  #games .card-meta{font-size:9px!important;letter-spacing:.12em!important;color:#666b68!important;margin-bottom:10px!important}
  #games .go{display:grid!important;place-items:center!important;width:30px!important;height:30px!important;border-radius:10px!important;background:#111!important;color:#fff!important;font-size:16px!important;line-height:1!important}

  @media(max-width:430px){
    #games .cover{aspect-ratio:1.64/1!important}
    #games .game-card{border-radius:25px!important}
    #games .game-card h3{font-size:22px!important}
    #games .game-card p{font-size:14px!important;line-height:1.5!important}
    #games .card-body{padding:16px 17px 19px!important}
  }
</style>`;

if (!html.includes(MARKER)) {
  if (!html.includes('</head>')) throw new Error('PLAY index has no closing head tag.');
  html = html.replace('</head>', `${style}\n</head>`);
}

fs.writeFileSync(target, html);
const count = (html.match(/class="play-card-scene"/g) || []).length;
console.log(`[PLAY] Rich card artwork applied to ${count} game cards.`);
