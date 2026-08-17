import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appsDir = path.join(root, 'apps');
const fix = process.argv.includes('--fix');
const textExt = new Set(['.html','.js','.mjs','.cjs','.ts','.tsx','.jsx','.css','.json','.md','.txt','.svg','.yml','.yaml']);

const exact = [
  ['V1グランプリ','一般企画'],['V1GP','一般企画'],['V1の資料','次の資料'],
  ['ソースネクスト','勤務先'],['SOURCENEXT','勤務先'],['SourceNext','勤務先'],
  ['DeCover','取引先A'],['カウスメディア','取引先B'],['Kaibo Audio','取引先C'],['Kaibo Flow','製品A'],
  ['アクテック','取引先D'],['B2J','取引先E'],['ゴルフパートナー','取引先F'],['まんがびと','自社'],
  ['haru.knockinonheavensdoor@gmail.com','example@example.com'],['B0DMSMV3P5','商品ID'],
  ['月商300万円','月次目標'],['月商6,000万円','大きな月商'],['月商6000万円','大きな月商'],['年商30億','大きな年商'],
  ['年商約1,600万円','年間売上'],['時間単価2万円','目標時間単価'],['CPA1万円','目標CPA'],
  ['FBA100個','FBA在庫'],['在庫2,000個','在庫'],['月400個','月間販売目標'],['広告予算20万円','広告予算'],
  ['次女','家族'],['思春期外来','専門外来'],['週2遅刻','遅刻がある'],
];
const regex = [
  {label:'email', re:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, to:'example@example.com'},
  {label:'private-doc-url', re:/https?:\/\/(?:docs|drive)\.google\.com\/[^\s"'<>`)]+/gi, to:'https://example.com/'},
  {label:'private-work-url', re:/https?:\/\/(?:[^\s"'<>`)]*\.)?(?:notion\.so|slack\.com|asana\.com|atlassian\.net)\/[^\s"'<>`)]+/gi, to:'https://example.com/'},
];
const forbidden = [
  /V1グランプリ/i,/\bV1GP\b/i,/V1の資料/i,/ソースネクスト/i,/\bSOURCENEXT\b/i,/\bSourceNext\b/i,
  /\bDeCover\b/i,/カウスメディア/i,/Kaibo Audio/i,/Kaibo Flow/i,/アクテック/i,/\bB2J\b/i,/ゴルフパートナー/i,
  /haru\.knockinonheavensdoor@gmail\.com/i,/B0DMSMV3P5/i,
  /https?:\/\/(?:docs|drive)\.google\.com\//i,
  /https?:\/\/(?:[^\s"'<>`)]*\.)?(?:notion\.so|slack\.com|asana\.com|atlassian\.net)\//i,
];

function files(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...files(p));
    else if(textExt.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

const changes=[];
const remaining=[];
for(const file of files(appsDir)){
  let text=fs.readFileSync(file,'utf8');
  const original=text;
  const rel=path.relative(root,file).replaceAll('\\','/');
  for(const [from,to] of exact){
    if(text.includes(from)){
      const n=text.split(from).length-1;
      text=text.split(from).join(to);
      changes.push({file:rel,kind:`exact:${from}`,count:n,replacement:to});
    }
  }
  for(const rule of regex){
    let n=0;
    text=text.replace(rule.re,()=>{n++;return rule.to});
    if(n) changes.push({file:rel,kind:rule.label,count:n,replacement:rule.to});
  }
  if(fix && text!==original) fs.writeFileSync(file,text);
  const check=fix?text:original;
  for(const re of forbidden){ if(re.test(check)) remaining.push({file:rel,pattern:String(re)}); }
}

console.log(JSON.stringify({mode:fix?'fix':'check',changes,remaining},null,2));
if(remaining.length){
  console.error(`Sensitive-content audit failed: ${remaining.length} forbidden matches remain in apps/**`);
  process.exit(2);
}
if(!fix && changes.length){
  console.error(`Sensitive-content audit failed: ${changes.length} redactable matches found. Run with --fix.`);
  process.exit(2);
}
console.log(`Sensitive-content audit OK: ${changes.length} replacement groups; 0 forbidden matches remain.`);
