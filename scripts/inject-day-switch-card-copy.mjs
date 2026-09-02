import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const homePath=path.join(root,'.dist','firebase','index.html');
const catalogPath=path.join(root,'.dist','firebase','levelup-catalog.json');
const slug='day-switch';
const copy={
  forWho:'仕事が思うように進まなかった夕方、未完了と自己評価を夜まで引きずりやすい人',
  purpose:'今日の未完了を1つ預け、明日の最初の10分だけを決めて一日を閉じる',
  benefit:'全部を取り返そうとせず、夜は休みへ切り替え、翌朝を小さい一手から始めやすくなる',
};
if(!fs.existsSync(homePath)||!fs.existsSync(catalogPath))throw new Error('LEVEL UP home/catalog not found for day-switch card copy.');
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const replaceValue=(article,label,value)=>{const p=new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);if(!p.test(article))throw new Error(`day-switch card field missing: ${label}`);return article.replace(p,(_a,o,_v,c)=>`${o}${esc(value)}${c}`)};
let home=fs.readFileSync(homePath,'utf8');const token=`data-game="${slug}"`;const at=home.indexOf(token);if(at<0)throw new Error('day-switch card missing from LEVEL UP home.');const start=home.lastIndexOf('<article',at),close=home.indexOf('</article>',at);if(start<0||close<0)throw new Error('day-switch card bounds missing.');const end=close+'</article>'.length;let article=home.slice(start,end);article=replaceValue(article,'こんな人に',copy.forWho);article=replaceValue(article,'なんのため',copy.purpose);article=replaceValue(article,'ベネフィット',copy.benefit);home=home.slice(0,start)+article+home.slice(end);
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));const game=catalog.games.find(x=>x.slug===slug);if(!game)throw new Error('day-switch missing from LEVEL UP catalog.');Object.assign(game,copy);fs.writeFileSync(homePath,home);fs.writeFileSync(catalogPath,`${JSON.stringify(catalog,null,2)}\n`);console.log('[Firebase] day-switch app-specific card copy injected.');
