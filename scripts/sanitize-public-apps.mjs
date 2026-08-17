import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fix = process.argv.includes('--fix');
const textExt = new Set(['.html','.js','.mjs','.cjs','.ts','.tsx','.jsx','.css','.json','.md','.txt','.svg','.yml','.yaml']);

const replaceRules = [
  {label:'email', re:/[A-Z0-9._%+-]+@(?!example\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}/gi, to:'example@example.com'},
  {label:'private-doc-url', re:/https?:\/\/(?:docs|drive)\.google\.com\/[^\s"'<>`)]+/gi, to:'https://example.com/'},
  {label:'private-work-url', re:/https?:\/\/(?:[^\s"'<>`)]*\.)?(?:notion\.so|slack\.com|asana\.com|atlassian\.net)\/[^\s"'<>`)]+/gi, to:'https://example.com/'},
];

const forbidden = [
  {label:'email', re:/[A-Z0-9._%+-]+@(?!example\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}/i},
  {label:'private-doc-url', re:/https?:\/\/(?:docs|drive)\.google\.com\//i},
  {label:'private-work-url', re:/https?:\/\/(?:[^\s"'<>`)]*\.)?(?:notion\.so|slack\.com|asana\.com|atlassian\.net)\//i},
  {label:'specific-acronym-example', re:/placeholder=["'][^"']*例[：:]\s*[A-Z0-9][A-Z0-9+._-]{1,11}の[^"']*["']/i},
];

const sourceTargets = [
  'apps',
  'index.html',
  'scripts/playtest-catalog.mjs',
  'scripts/build-host-targets.mjs',
  'scripts/human-test-organized.mjs',
  'scripts/human-test.mjs',
];
const generatedTargets = ['.dist/cloudflare'];

function collect(target){
  const abs=path.join(root,target);
  if(!fs.existsSync(abs)) return [];
  const stat=fs.statSync(abs);
  if(stat.isFile()) return textExt.has(path.extname(abs).toLowerCase())?[abs]:[];
  const out=[];
  for(const ent of fs.readdirSync(abs,{withFileTypes:true})){
    const p=path.join(abs,ent.name);
    if(ent.isDirectory()) out.push(...collect(path.relative(root,p)));
    else if(textExt.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

const sourceFiles=[...new Set(sourceTargets.flatMap(collect))];
const generatedFiles=[...new Set(generatedTargets.flatMap(collect))];
const changes=[];
const remaining=[];

function audit(file, allowFix){
  let text=fs.readFileSync(file,'utf8');
  const original=text;
  const rel=path.relative(root,file).replaceAll('\\','/');
  for(const rule of replaceRules){
    let n=0;
    text=text.replace(rule.re,()=>{n++;return rule.to});
    if(n) changes.push({file:rel,kind:rule.label,count:n,generated:!allowFix});
  }
  if(fix && allowFix && text!==original) fs.writeFileSync(file,text);
  const check=fix&&allowFix?text:original;
  for(const rule of forbidden){ if(rule.re.test(check)) remaining.push({file:rel,kind:rule.label}); }
}

for(const file of sourceFiles) audit(file,true);
for(const file of generatedFiles) audit(file,false);

console.log(JSON.stringify({mode:fix?'fix':'check',sourceFiles:sourceFiles.length,generatedFiles:generatedFiles.length,changes,remaining},null,2));
if(remaining.length){
  console.error(`Sensitive-content audit failed: ${remaining.length} suspicious matches remain in public surfaces.`);
  process.exit(2);
}
if(!fix && changes.length){
  console.error(`Sensitive-content audit failed: ${changes.length} redactable matches found.`);
  process.exit(2);
}
if(generatedFiles.length && changes.some((item)=>item.generated)){
  console.error('Sensitive-content audit failed: generated games/play bundle contains redactable content; fix its source and rebuild.');
  process.exit(2);
}
console.log(`Sensitive-content audit OK: ${sourceFiles.length} source files + ${generatedFiles.length} generated files; 0 suspicious matches remain.`);
