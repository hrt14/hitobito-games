import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appsDir = path.join(root, 'apps');
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
  for(const rule of replaceRules){
    let n=0;
    text=text.replace(rule.re,()=>{n++;return rule.to});
    if(n) changes.push({file:rel,kind:rule.label,count:n});
  }
  if(fix && text!==original) fs.writeFileSync(file,text);
  const check=fix?text:original;
  for(const rule of forbidden){ if(rule.re.test(check)) remaining.push({file:rel,kind:rule.label}); }
}

console.log(JSON.stringify({mode:fix?'fix':'check',changes,remaining},null,2));
if(remaining.length){
  console.error(`Sensitive-content audit failed: ${remaining.length} suspicious matches remain in apps/**`);
  process.exit(2);
}
if(!fix && changes.length){
  console.error(`Sensitive-content audit failed: ${changes.length} redactable matches found. Run with --fix.`);
  process.exit(2);
}
console.log(`Sensitive-content audit OK: ${changes.length} replacement groups; 0 suspicious matches remain.`);
