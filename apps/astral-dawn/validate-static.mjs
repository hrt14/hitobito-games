import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root=path.dirname(new URL(import.meta.url).pathname);
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const fail=msg=>{console.error(`[Astral validation] ${msg}`);process.exit(1)};

let source=read('game-v4.js');
const original=source;
const replaceOnce=(needle,replacement,label)=>{
  const first=source.indexOf(needle),last=source.lastIndexOf(needle);
  if(first<0)fail(`missing instrumentation anchor: ${label}`);
  if(first!==last)fail(`ambiguous instrumentation anchor (${label}) appears more than once`);
  source=source.replace(needle,replacement);
};

replaceOnce(
  "if(i){if(i.type==='npc')talk(i);else shrine();return}",
  "if(i){if(i.type==='npc')talk(i);else if(i.type==='chest'&&window.__ASTRAL?.openChest)window.__ASTRAL.openChest(i);else shrine();return}",
  'interaction dispatch'
);
replaceOnce('function cameraUpdate(dt){','function cameraUpdate(dt){if(window.__ASTRAL?.cameraOverride?.(dt))return;','camera override');
replaceOnce('function damage(n,crit=false){','function damage(n,crit=false){window.__ASTRAL?.impact?.(S.enemyObj,n,crit);','impact hook');

const exposure=`\nwindow.__ASTRAL_CORE={
    THREE,
    get renderer(){return renderer},get scene(){return scene},get camera(){return camera},
    get player(){return player},get companion(){return companion},get world(){return world},
    get S(){return S},parts,enemies,npcs,interactables,colliders,effects,particles,
    groundY,mesh,mat,toast,updateUI,updateQuest,tone
  };\ninit();`;
const re=/\ninit\(\);\s*$/;
if(!re.test(source))fail('missing terminal init() exposure point');
source=source.replace(re,exposure);
if(source===original)fail('instrumentation made no changes');

for(const expected of [
  'window.__ASTRAL_CORE={',
  "i.type==='chest'",
  'window.__ASTRAL?.cameraOverride?.(dt)',
  'window.__ASTRAL?.impact?.(S.enemyObj,n,crit)'
]) if(!source.includes(expected))fail(`instrumented source missing: ${expected}`);

const tmp=path.join(os.tmpdir(),`astral-instrumented-${process.pid}.mjs`);
try{
  fs.writeFileSync(tmp,source);
  const result=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});
  if(result.status!==0)fail(`instrumented runtime syntax error:\n${result.stderr||result.stdout}`);
} finally { try{fs.unlinkSync(tmp)}catch{} }

const index=read('index.html');
const scripts=[...index.matchAll(/<script[^>]+src="\.\/([^"]+\.js)"/g)].map(m=>m[1]);
const required=['game-v5.js','models-v1.js','monsters-v1.js','battle-v2.js','architecture-v1.js','ending-v1.js','performance-v1.js'];
for(const file of required){
  if(!scripts.includes(file))fail(`index missing required runtime layer: ${file}`);
  if(!fs.existsSync(path.join(root,file)))fail(`referenced runtime layer does not exist: ${file}`);
}
if(new Set(scripts).size!==scripts.length)fail('index contains duplicate runtime script references');

const review=read('REVIEW.md');
if(!review.includes('完成扱い: NO'))fail('harsh review must not silently declare completion before visual validation');

console.log('[Astral validation] V5 composition, entrypoint graph and completion gate are consistent.');
