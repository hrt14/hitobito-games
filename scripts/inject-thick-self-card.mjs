import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const home=path.join(root,'.dist','firebase','index.html');
const catalogPath=path.join(root,'.dist','firebase','levelup-catalog.json');
const slug='thick-self';
const data={title:'分厚い自分をつくる',kicker:'DAILY 3-MIN RESPONSE TRAINING',skill:'心の厚み / 7つの反応',icon:'層',forWho:'批判・比較・失敗・成功などで心が大きく動いたとき、知識では分かっていても反射的に反応してしまう人',purpose:'余白・受容・距離・曖昧さ・奥行き・軽やかさ・復元を、現実場面の短い反復で同時に鍛える',benefit:'嫌な感情や欲を消さずに持ったまま、即反応せず、選び直し、取り乱しても日常へ戻りやすくする'};
if(!fs.existsSync(home)||!fs.existsSync(catalogPath))process.exit(0);
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const game=catalog.games.find(g=>g.slug===slug);
if(game)Object.assign(game,data);
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
let html=fs.readFileSync(home,'utf8');
const articleRe=new RegExp(`<article class="card[\\s\\S]*?data-game="${slug}"[\\s\\S]*?<\\/article>`);
const article=html.match(articleRe)?.[0];
if(article){
  let next=article
    .replace(/<div class="icon">[\s\S]*?<\/div>/,`<div class="icon">${data.icon}</div>`)
    .replace(/<div class="kicker">[\s\S]*?<\/div>/,`<div class="kicker">${data.kicker}</div>`)
    .replace(/<div class="skill">[\s\S]*?<\/div>/,`<div class="skill">${data.skill}</div>`)
    .replace(/<h2>[\s\S]*?<\/h2>/,`<h2>${data.title}</h2>`);
  next=next.replace(/<div class="card-value"><span class="card-value-label">こんな人に<\/span><span class="card-value-text">[\s\S]*?<\/span><\/div>/,`<div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${data.forWho}</span></div>`)
    .replace(/<div class="card-value"><span class="card-value-label">なんのため<\/span><span class="card-value-text">[\s\S]*?<\/span><\/div>/,`<div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${data.purpose}</span></div>`)
    .replace(/<div class="card-value"><span class="card-value-label">ベネフィット<\/span><span class="card-value-text">[\s\S]*?<\/span><\/div>/,`<div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${data.benefit}</span></div>`);
  html=html.replace(article,next);
  fs.writeFileSync(home,html);
}
console.log('[Firebase] thick-self card copy injected.');
